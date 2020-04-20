import { Server } from 'karma';
import * as semver from 'semver';
import * as Mocha from 'mocha';
import * as colors from 'colors';
import { ensureDir } from 'fs-extra';

import {
  CIBuilder,
  runBuilder,
  StepResult,
  IReleaseInfo,
  CI,
  Exception,
  util,
} from '@ioffice/ci-builder';

import { PATHS } from './Paths';
import {
  asyncEvalIteration,
  Either,
  Maybe,
  Right,
  TryAsync,
} from '@ioffice/fp';

class Builder extends CIBuilder {
  readonly releaseBranchMerged = /^Merge pull request #(\d+) from (.*)\/release(.*)/;

  async isRelease(branch: string, commitMsg: string): Promise<boolean> {
    const isMasterBranch = ['master', 'refs/heads/master'].includes(branch);
    // Only running the release build in node 10
    const isNode10 = (await this.buildUtil.getNodeVersion())
      .map((ver) => ver.major === 10)
      .getOrElse(false);

    return (
      isNode10 && isMasterBranch && !!commitMsg.match(this.releaseBranchMerged)
    );
  }

  async isReleasePullRequest(pullRequestBranch: string): Promise<boolean> {
    return pullRequestBranch === 'release';
  }

  async test(): Promise<StepResult> {
    this.io.openBlock('node_testing', 'running node tests');
    const nodeTesting = new Promise<void>((fulfill, reject) => {
      const mocha = new Mocha();
      if (this.env.ci === CI.TRAVIS) {
        mocha.useColors(true);
      }
      mocha.addFile('build_node/test/index.node.js');
      mocha.run((failures) => {
        if (failures > 0) {
          const verb = failures === 1 ? 'is' : 'are';
          const amount = failures === 1 ? '' : 's';
          reject(`There ${verb} ${failures} test${amount} failing`);
        } else {
          this.io.log('Node testing passed');
          fulfill();
        }
      });
    });
    await nodeTesting;
    this.io.closeBlock('node_testing');

    if (!process.env['SKIP_KARMA']) {
      this.io.openBlock('browser_testing', 'running browser tests');
      const browserTesting = new Promise<void>((fulfill, reject) => {
        const configFile = `${PATHS.buildNode}/tools/karma.conf.js`;
        const server = new Server({ configFile }, (exitCode) => {
          if (exitCode === 0) {
            this.io.log('Browser testing passed');
            fulfill();
          } else {
            reject('karma failed');
          }
        });
        server.start();
      });
      await browserTesting;
      this.io.closeBlock('browser_testing');
    }
    return this.io.success(0);
  }

  beforeVerifyPullRequest(): Promise<StepResult> {
    return this.io.success(0);
  }

  verifyNonRelease(): Promise<StepResult> {
    return this.buildUtil.verifyUntouchedPackageVersion();
  }

  verifyRelease(): Promise<StepResult> {
    return this.buildUtil.verifyNewPackageVersion();
  }

  afterVerifyPullRequest(): Promise<StepResult> {
    return this.io.success(0);
  }

  async beforePublish(): Promise<StepResult> {
    const ensurePromise = Promise.all(
      ['node', 'fesm5', 'types'].map((_) => ensureDir(_)),
    );

    return (
      await asyncEvalIteration<Exception, 0>(async () => {
        let _;
        for (_ of (await TryAsync(() => ensurePromise)).toEither())
          for (_ of util.move('build_node/main/', './node'))
            for (_ of util.move('build_browser/main/', './fesm5'))
              for (_ of util.move('declarations/main/', './types')) return 0;
      })
    ).mapIfLeft((err) => new Exception('failed to move files', err));
  }

  async getPublishInfo(): Promise<Either<Exception, [string, string]>> {
    const version = this.env.packageVersion;
    if (this.env.isPreRelease) {
      const majorEither = Maybe(semver.parse(version))
        .map((x) => x.major)
        .toRight(new Exception(`Unable to parse version: ${version}`));
      return asyncEvalIteration(async () => {
        for (const major of majorEither)
          for (const commit of await this.git.getCurrentCommit())
            return [`${major}.0.0-SNAPSHOT.${commit}`, 'snapshot'];
      });
    }
    return Right([version, 'latest']);
  }

  /**
   * Publish to npm.
   */
  async publish(): Promise<StepResult> {
    const name = this.env.packageName;
    return asyncEvalIteration(async () => {
      let _;
      for (const [version, tag] of await this.getPublishInfo())
        for (_ of await this.yarn.publish(version, tag))
          for (_ of await this.io.success(
            0,
            [
              '\nRun:',
              colors.green(`  yarn add ${name}@${tag} -E -D`),
              `  to install ${name}@${colors.blue(version)}\n`,
            ].join('\n'),
          ))
            return 0;
    });
  }

  /**
   * Notify github that we have published a new version.
   */
  afterPublish(): Promise<StepResult> {
    return this.github.createRelease();
  }

  /**
   * Update the package version, the change log and the readme file.
   *
   * @param param The release information.
   */
  async releaseSetup(param: IReleaseInfo): Promise<StepResult> {
    const { currentVersion: ver, newVersion: newVer } = param;
    return asyncEvalIteration(async () => {
      let _;
      for (_ of await util.changePackageVersion(newVer))
        for (_ of await this.buildUtil.updateChangeLog(newVer))
          for (_ of await this.buildUtil.replaceVersionsInREADME(ver, newVer))
            return 0;
    });
  }
}

async function main(): Promise<void> {
  const { code } = await runBuilder(Builder);

  process.on('exit', () => {
    process.exit(code);
  });
}

main();
