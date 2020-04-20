import {
  Either,
  Left,
  Maybe,
  None,
  Right,
  evalIteration,
  asyncEvalIteration,
  Option,
} from '../main';
import { compareValues } from './helper';
import { expect } from 'chai';

// The `o` in the name at the end of the property name stands for optional.
interface ITestObj {
  s: string;
  n: number;
  b: boolean;
  so?: string;
  no?: number;
  bo?: boolean;
  bo2?: boolean;
  a?: number[];
}

interface IType {
  name?: string;
}

interface IRoom {
  type?: IType;
}

const getProvider = (host: string): Either<Error, string> => {
  return Maybe(`Provider: ${host}`).toRight(new Error('no_provider'));
};

describe('Either', () => {
  it('(isLeft/isRight) should check for types', () => {
    const a: Either<string, number> = Right(5);
    const b: Either<string, number> = Left('string');
    compareValues([
      [a.isRight, true, 'a should be Right(5)'],
      [a.isLeft, false, 'a should not be a Left'],
      [b.isRight, false, "b should be Left('string')"],
      [b.isLeft, true, 'b should not be a Right'],
    ]);
  });

  it('(fold) should apply a callback based on the value', () => {
    const possiblyFailingOperation = (
      fail: boolean,
    ): Either<string, number> => {
      return fail ? Left('error') : Right(1);
    };

    const fail = possiblyFailingOperation(true);
    const success = possiblyFailingOperation(false);
    const onFail = (a: string): string => `fail with ${a}`;
    const onSuccess = (b: number): string => `success with ${b}`;

    compareValues([
      [fail.fold(onFail, onSuccess), 'fail with error'],
      [success.fold(onFail, onSuccess), 'success with 1'],
    ]);
  });

  it('(swap) should give an instance of the opposite', () => {
    const left: Either<string, number> = Left('left');
    const right: Either<number, string> = left.swap(); // Result: Right("left")

    compareValues([
      [left.isLeft, true, 'left should be Left'],
      [right.isRight, true, 'right should be Right'],
      [right.value, 'left', 'right should hold the value "left"'],
    ]);
  });

  it('(mapIfLeft) should map left values', () => {
    const left: Either<string, number> = Left('left');
    const mapped: Either<string, number> = left.mapIfLeft(
      (x) => `${x}: mapped`,
    );
    compareValues([
      [left.isLeft, true, 'left should be Left'],
      [mapped.isLeft, true, 'right should be Right'],
      [mapped.value, 'left: mapped', 'should have acted on the left value'],
    ]);
  });

  it('(map) should map the value', () => {
    const obj: ITestObj = {
      s: 'value',
      n: 5,
      b: true,
    };
    const roomA: IRoom = {};
    const roomB: IRoom = { type: {} };
    const roomC: IRoom = { type: { name: 'roomC' } };
    compareValues([
      [
        Left(obj.so)
          .map((x) => `string: ${x}`)
          .toOption(),
        None,
      ],
      [Right(obj.s).map((x) => `string: ${x}`).value, 'string: value'],
      [
        Left<number, number>(obj.no)
          .map((x) => x + 2)
          .toOption(),
        None,
      ],
      [Right(obj.n).map((x) => x + 2).value, 7],
      [
        Left(obj.bo)
          .map((x) => (x ? 100 : 10))
          .toOption(),
        None,
      ],
      [Right(obj.b).map((x) => (x ? 100 : 10)).value, 100],
      [
        Maybe(obj.a)
          .toRight(new Error('empty'))
          .map((x) => x.length + 1)
          .toOption(),
        None,
      ],
      [Right(obj.b).map((x) => x).value, true],
      [
        Maybe(roomA.type)
          .toRight(() => new Error('no type'))
          .map((x) => Maybe(x.name))
          .map((x) => x.map((_) => _.trim()).getOrElse(''))
          .getOrElse('none'),
        'none',
      ],
      [
        Maybe(roomB.type)
          .toRight(() => new Error('no type'))
          .map((x) => Maybe(x.name))
          .map((x) => x.map((_) => _.trim()).getOrElse('almost got it'))
          .getOrElse('none'),
        'almost got it',
      ],
      [
        Maybe(roomC.type)
          .toRight(() => new Error('no type'))
          .map((x) => Maybe(x.name))
          .map((x) => x.map((_) => _.trim()).getOrElse('almost got it'))
          .getOrElse('none'),
        'roomC',
      ],
    ]);
  });

  it('(iteration-1) should stop at Left values', async () => {
    const hostOpt = None;
    const tokenOpt = Maybe('token');

    const r1 = evalIteration(() => {
      for (const host of hostOpt.toRight(new Error('host_not_set')))
        for (const token of tokenOpt.toRight(new Error('token_not_set')))
          for (const provider of getProvider(host))
            return { host, token, provider };
    });

    expect(r1.isLeft).to.eq(true, 'should be left');
    expect(r1.value instanceof Error).to.eq(true, 'should be Error');
    expect((r1.value as Error).message).to.eq('host_not_set');
  });

  it('(iteration-2) should stop at Left values', async () => {
    const hostOpt = Maybe('host');
    const tokenOpt = None;

    const r2 = evalIteration(() => {
      for (const host of hostOpt.toRight(new Error('host_not_set')))
        for (const token of tokenOpt.toRight(new Error('token_not_set')))
          for (const provider of getProvider(host))
            return { host, token, provider };
    });

    expect(r2.isLeft).to.eq(true, 'should be left');
    expect(r2.value instanceof Error).to.eq(true, 'should be Error');
    expect((r2.value as Error).message).to.eq('token_not_set');
  });

  it('(iteration-3) should flow', async () => {
    const hostOpt = Maybe('host');
    const tokenOpt = Maybe('token');

    const r3 = evalIteration(() => {
      for (const host of hostOpt.toRight(new Error('host_not_set')))
        for (const token of tokenOpt.toRight(new Error('token_not_set')))
          for (const provider of getProvider(host))
            return { host, token, provider };
    });

    expect(r3.isRight).to.eq(true, 'should be right');
    expect(r3.value).to.deep.eq({
      host: 'host',
      token: 'token',
      provider: 'Provider: host',
    });
  });

  it('(async-iteration) should stop at Left values', async () => {
    const getHost = async (): Promise<Option<string>> => {
      return None;
    };
    const getToken = async (): Promise<Either<Error, string>> => {
      return Maybe('token').toRight(new Error('token_not_set'));
    };

    const r4 = await asyncEvalIteration(async () => {
      for (const host of (await getHost()).toRight(new Error('host_not_set')))
        for (const token of await getToken())
          for (const provider of getProvider(host))
            return { host, token, provider };
    });

    expect(r4.isLeft).to.eq(true, 'should be left');
    expect(r4.value instanceof Error).to.eq(true, 'should be Error');
    expect((r4.value as Error).message).to.eq('host_not_set');
  });

  it('(async-iteration) should throw unknown error', async () => {
    const getHost = async (): Promise<Option<string>> => {
      return Maybe('host');
    };
    const getToken = async (): Promise<Either<Error, string>> => {
      throw Error('this can happen');
    };

    const result = await asyncEvalIteration(async () => {
      for (const host of (await getHost()).toRight(new Error('host_not_set')))
        for (const token of await getToken())
          for (const provider of getProvider(host))
            return { host, token, provider };
    });
    expect(result.isLeft).to.eq(true, 'should be left');
    expect(result.value instanceof Error).to.eq(true, 'should be Error');
    expect((result.value as Error).message).to.eq('this can happen');
  });
});
