import { expect } from 'chai';

import { None, Try } from '../main';
import { compareValues } from './helper';

describe('main/Try.ts', () => {
  it('(isEmpty) should check if its empty', () => {
    compareValues([
      [Try(() => window['unknown'].trim()).isFailure, true],
      [Try(() => 5).isSuccess, true],
    ]);
  });

  it('(get) should get the item', () => {
    compareValues([[Try(() => 5).get(), 5]]);
  });

  it('(get) should throw an Error there is a failure', () => {
    const a: Try<number> = Try(() => {
      throw new Error('failed');
    });
    expect(() => a.get()).to.throw('failed');
  });

  it('(getOrElse) should get or else', () => {
    const a = {};
    compareValues([
      [Try<number>(() => a['getTotal']() + 5).getOrElse(100), 100],
    ]);
  });

  it('(toOption) should convert to Option', () => {
    compareValues([
      [
        Try(() => {
          throw new Error('failed');
        }).toOption(),
        None,
      ],
      [
        Try(() => 100)
          .toOption()
          .get(),
        100,
      ],
    ]);
  });
});
