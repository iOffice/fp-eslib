import * as Promise from 'bluebird';
import { assert, expect } from 'chai';
import * as sinon from 'sinon';

import { Maybe, None, Option, Some } from '../main';
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

describe('Option', () => {
  it('(isEmpty) should check if its empty', () => {
    compareValues([
      [Maybe(3).isEmpty, false],
      [Maybe('3').isEmpty, false],
      [Maybe(false).isEmpty, false],
      [Maybe(undefined).isEmpty, true],
      [Maybe(null).isEmpty, true],
      [Maybe(undefined), None],
      [Maybe(null), None],
    ]);
  });

  it('(get) should get the item', () => {
    // prettier-ignore
    compareValues([
      [Maybe(3).get(), 3],
      [Maybe('3').get(), '3'],
    ]);
  });

  it('(get) should throw an Error when Option is None', () => {
    const obj: ITestObj = {
      s: 'nonempty',
      n: 1,
      b: false,
    };
    expect(() => Maybe(undefined).get()).to.throw('None.get');
    expect(() => Maybe(null).get()).to.throw('None.get');
    expect(() => Maybe(obj.no).get()).to.throw('None.get');
  });

  it('(getOrElse) should get or else', () => {
    const obj: ITestObj = {
      s: 'nonempty',
      n: 1,
      b: false,
    };
    compareValues([
      [Maybe(obj.s).getOrElse('invalid'), 'nonempty'],
      [Maybe(obj.n).getOrElse(5), 1],
      [Maybe(obj.b).getOrElse(true), false],
      [Maybe(obj.so).getOrElse(''), ''],
      [Maybe(obj.no).getOrElse(5), 5],
      [Maybe(obj.bo).getOrElse(true), true],
      [Maybe(obj.a).getOrElse([0, 1]), [0, 1]],
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

    // prettier-ignore
    compareValues([
      [Maybe(obj.so).map(x => `string: ${x}`), None],
      [Maybe(obj.s).map(x => `string: ${x}`).get(), 'string: value'],
      [Maybe(obj.no).map(x => x + 2), None],
      [Maybe(obj.n).map(x => x + 2).get(), 7],
      [Maybe(obj.bo).map(x => x ? 100 : 10), None],
      [Maybe(obj.b).map(x => x ? 100 : 10).get(), 100],
      [Maybe(obj.a).map(x => x.length + 1), None],
      [Maybe(obj.b).map(x => x).get(), true],
      [
        Maybe(roomA.type)
          .map(x => x.name)
          .map(x => x.trim())
          .getOrElse('none')
        ,
        'none',
      ],
      [
        Maybe(roomB.type)
          .map(x => x.name)
          .map(x => x.trim())
          .getOrElse('none')
        ,
        'none',
      ],
      [
        Maybe(roomC.type)
          .map(x => x.name)
          .map(x => x.trim())
          .getOrElse('none')
        ,
        'roomC',
      ],
    ]);
  });

  it('(forEach) should execute a function if non-empty', () => {
    const obj: ITestObj = {
      s: 'string',
      n: 0,
      b: false,
    };
    const callback = [sinon.spy(), sinon.spy()];
    Maybe(obj.s).forEach(callback[0]);
    Maybe(obj.so).forEach(callback[1]);

    assert.isTrue(callback[0].called, 'obj.s should be defined');
    assert.isFalse(callback[1].called, 'obj.sn is optional and not defined');
  });

  it('(flatMap) should map the value to an optional', () => {
    const obj: ITestObj = {
      s: 'value',
      n: 5,
      b: true,
    };

    // prettier-ignore
    compareValues([
      [Maybe(obj.so).flatMap(x => Maybe(`string: ${x}`)), None],
      [Maybe(obj.s).flatMap(x => Maybe(`string: ${x}`)).get(), 'string: value'],
      [Maybe(obj.no).flatMap(x => Maybe(x + 2)), None],
      [Maybe(obj.n).flatMap(x => Maybe(x + 2)).get(), 7],
      [Maybe(obj.bo).flatMap(x => Maybe(x)), None],
      [Maybe(obj.b).flatMap(x => Maybe(x)).get(), true],
    ]);
  });

  it('(filter) should impose a condition on the optional', () => {
    const obj: ITestObj = {
      s: 'value',
      n: 1,
      b: false,
    };

    // prettier-ignore
    compareValues([
      [Maybe(obj.s).filter(x => x === 'valid'), None],
      [Maybe(obj.s).filter(x => x === 'value').get(), 'value'],
      [Maybe(obj.so).filter(x => x === 'valid'), None],
      [Maybe(obj.so).filter(x => x === 'value'), None],
      [Maybe(obj.n).filter(x => x > 3), None],
      [Maybe(obj.no).filter(x => x > 3), None],
    ]);
  });

  it('(filterNot) should impose a condition on the optional', () => {
    const obj: ITestObj = {
      s: 'value',
      n: 1,
      b: false,
    };

    // prettier-ignore
    compareValues([
      [Maybe(obj.s).filterNot(x => x === 'valid').get(), 'value'],
      [Maybe(obj.s).filterNot(x => x === 'value'), None],
      [Maybe(obj.so).filterNot(x => x === 'valid'), None],
      [Maybe(obj.so).filterNot(x => x === 'value'), None],
      [Maybe(obj.n).filterNot(x => x > 3).get(), 1],
      [Maybe(obj.no).filterNot(x => x > 3), None],
    ]);
  });

  it('(or) should go to the next option', () => {
    const obj: ITestObj = {
      s: 'nonempty',
      n: 0,
      b: false,
    };

    // prettier-ignore
    compareValues([
      [Maybe(obj.s).or('invalid').get(), 'nonempty'],
      [Maybe(obj.n).or(5).get(), 0],
      [Maybe(obj.b).or(true).get(), false],
      [Maybe(obj.so).or('alt').get(), 'alt'],
      [Maybe(obj.no).or(5).get(), 5],
      [Maybe(obj.bo).or(true).get(), true],
      [Maybe(obj.bo).or(obj.bo2).getOrElse(true), true],
      [Maybe(obj.bo).or(obj.bo2).or(obj.b).getOrElse(true), false],
    ]);
  });

  it('(orElse) should go to the next option', () => {
    const obj: ITestObj = {
      s: 'nonempty',
      n: 0,
      b: false,
    };

    // prettier-ignore
    compareValues([
      [Maybe(obj.s).orElse(Maybe('invalid')).get(), 'nonempty'],
      [Maybe(obj.n).orElse(Maybe(5)).get(), 0],
      [Maybe(obj.b).orElse(Maybe(true)).get(), false],
      [Maybe(obj.so).orElse(Maybe('alt')).get(), 'alt'],
      [Maybe(obj.no).orElse(Maybe(5)).get(), 5],
      [Maybe(obj.bo).orElse(Maybe(true)).get(), true],
    ]);
  });

  it('(orNull) should go to the next option', () => {
    const obj: ITestObj = {
      s: 'nonempty',
      n: 0,
      b: false,
    };
    compareValues([
      [Maybe(obj.s).orNull(), 'nonempty'],
      [Maybe(obj.n).orNull(), 0],
      [Maybe(obj.b).orNull(), false],
      [Maybe(obj.so).orNull(), null],
      [Maybe(obj.no).orNull(), null],
      [Maybe(obj.bo).orNull(), null],
    ]);
  });

  it('(orUndefined) should go to the next option', () => {
    const obj: ITestObj = {
      s: 'nonempty',
      n: 0,
      b: false,
    };
    compareValues([
      [Maybe(obj.s).orUndefined(), 'nonempty'],
      [Maybe(obj.n).orUndefined(), 0],
      [Maybe(obj.b).orUndefined(), false],
      [Maybe(obj.so).orUndefined(), undefined],
      [Maybe(obj.no).orUndefined(), undefined],
      [Maybe(obj.bo).orUndefined(), undefined],
    ]);
  });

  it('(later:promise) should handle rejected promises', done => {
    const x = new Promise<number[]>((_resolve, reject) => {
      reject(new Error('rejection_test'));
    });

    Maybe(x).later<number[]>(res => {
      try {
        assert.deepEqual(res.getOrElse([5]), [5]);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('(later:promise) should handle resolved promises', done => {
    type objType = { id: number; name: string };
    const x = new Promise<objType[]>(resolve => {
      resolve([]);
    });

    Maybe(x).later<objType[]>(res => {
      const validArray = res
        .filter(v => v.length > 0)
        .getOrElse([{ id: 0, name: 'No Data' }]);
      const name = validArray[0].name;
      try {
        assert.equal(name, 'No Data');
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('(toRight) should return an Either', () => {
    const a: Option<number> = Some(100);
    const resultToRight = a.toRight<string>('oops');
    const resultToLeft = a.toLeft<boolean>(true);
    compareValues([
      [resultToRight.isRight, true],
      [resultToLeft.isLeft, true],
      [resultToRight.value, 100],
      [resultToLeft.value, 100],
    ]);
  });

  it('(playground)', () => {
    const obj: ITestObj = {
      s: '',
      n: 100,
      b: false,
    };

    // prettier-ignore
    compareValues([
      [Maybe(5).filter(v => v > 5).or(6).map(v => v - 3).get(), 3],
      [Maybe(obj.n).filter(v => v > 5).or(6).map(v => v - 3).get(), 97],
      [Maybe(obj.no).filter(v => v > 5).or(6).map(v => v - 3).get(), 3],
      [Maybe<null | string>(null).or('hi').map(v => v + '!!!').get(), 'hi!!!'],
      [Maybe({ a: 1 }['b']).getOrElse(2), 2],
      [Maybe(5).flatMap(v => Maybe(v + 2)).get(), 7],
      [Maybe(null).getOrElse(null), null],
      [Maybe(null as number | null).getOrElse(5), 5],
    ]);
  });
});
