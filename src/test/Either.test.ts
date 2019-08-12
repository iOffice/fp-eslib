import { Either, Left, Maybe, None, Right } from '../main';
import { compareValues } from './helper';

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
          .map(x => `string: ${x}`)
          .toOption(),
        None,
      ],
      [Right(obj.s).map(x => `string: ${x}`).value, 'string: value'],
      [
        Left<number, number>(obj.no)
          .map(x => x + 2)
          .toOption(),
        None,
      ],
      [Right(obj.n).map(x => x + 2).value, 7],
      [
        Left(obj.bo)
          .map(x => (x ? 100 : 10))
          .toOption(),
        None,
      ],
      [Right(obj.b).map(x => (x ? 100 : 10)).value, 100],
      [
        Maybe(obj.a)
          .toRight(new Error('empty'))
          .map(x => x.length + 1)
          .toOption(),
        None,
      ],
      [Right(obj.b).map(x => x).value, true],
      [
        Maybe(roomA.type)
          .toRight(() => new Error('no type'))
          .map(x => Maybe(x.name))
          .map(x => x.map(_ => _.trim()).getOrElse(''))
          .getOrElse('none'),
        'none',
      ],
      [
        Maybe(roomB.type)
          .toRight(() => new Error('no type'))
          .map(x => Maybe(x.name))
          .map(x => x.map(_ => _.trim()).getOrElse('almost got it'))
          .getOrElse('none'),
        'almost got it',
      ],
      [
        Maybe(roomC.type)
          .toRight(() => new Error('no type'))
          .map(x => Maybe(x.name))
          .map(x => x.map(_ => _.trim()).getOrElse('almost got it'))
          .getOrElse('none'),
        'roomC',
      ],
    ]);
  });
});