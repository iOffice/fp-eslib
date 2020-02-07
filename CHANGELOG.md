# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) and this project
adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

As per semantic versioning

> Major version zero (0.y.z) is for initial development. Anything may change at any time.
> The public API should not be considered stable.


## [Unreleased]

## [0.1.0] - February 07, 2020
- Deprecated `pipeEither` and `asyncPipeEither`.
- Added `mapIfLeft` method to `Either`.
- Added `evalIteration` and `asyncEvalIteration` to be used in conjunction with the `Either`
  iterator.


## [0.0.1] - August 12, 2019
- Migrated the fp tools used in the [`ci-builder`](https://github.com/iOffice/ci-builder-eslib).


[Unreleased]: https://github.com/iOffice/fp-eslib/compare/0.1.0...HEAD
[0.1.0]: https://github.com/iOffice/fp-eslib/compare/0.0.1...0.1.0
[0.0.1]: https://github.com/iOffice/fp-eslib/compare/7270ffed28016080f8bdecef9d29e059a6c3598a...0.0.1
