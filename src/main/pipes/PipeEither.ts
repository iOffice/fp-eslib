import { Either } from '../Either';

type Step<V, E, T> = (values: V) => Either<E, T>;

function pipeEither<L extends Error, R1>(f1: Step<[], L, R1>): Either<L, R1>;

function pipeEither<L extends Error, R1, R2>(
  f1: Step<[], L, R1>,
  f2: Step<[R1], L, R2>,
): Either<L, R2>;

function pipeEither<L extends Error, R1, R2, R3>(
  f1: Step<[], L, R1>,
  f2: Step<[R1], L, R2>,
  f3: Step<[R1, R2], L, R3>,
): Either<L, R3>;

function pipeEither<L extends Error, R1, R2, R3, R4>(
  f1: Step<[], L, R1>,
  f2: Step<[R1], L, R2>,
  f3: Step<[R1, R2], L, R3>,
  f4: Step<[R1, R2, R3], L, R4>,
): Either<L, R4>;

function pipeEither<L extends Error, R1, R2, R3, R4, R5>(
  f1: Step<[], L, R1>,
  f2: Step<[R1], L, R2>,
  f3: Step<[R1, R2], L, R3>,
  f4: Step<[R1, R2, R3], L, R4>,
  f5: Step<[R1, R2, R3, R4], L, R5>,
): Either<L, R5>;

function pipeEither<L extends Error, R1, R2, R3, R4, R5, R6>(
  f1: Step<[], L, R1>,
  f2: Step<[R1], L, R2>,
  f3: Step<[R1, R2], L, R3>,
  f4: Step<[R1, R2, R3], L, R4>,
  f5: Step<[R1, R2, R3, R4], L, R5>,
  f6: Step<[R1, R2, R3, R4, R5], L, R6>,
): Either<L, R6>;

/**
 * @deprecated Use the an either instance as an iterator with
 * `evalIteration`
 *
 * ```
 * const result = evalIteration(() => {
 *   for (const val1 of eitherInstance1)
 *    for (const val2 of eitherInstance2)
 *      return [ val1, val2 ];
 * })
 *
 * // result is either [val1, val2] or a Left value.
 * ```
 */
function pipeEither<V, E, T>(...items: Step<V, E, T>[]): Either<E, T> {
  let index = 0;
  let current: Either<E, T>;
  const values: unknown[] = [];
  let foundError = false;

  do {
    const entry = items[index];
    current = entry((values as unknown) as V);

    if (current.isLeft) {
      foundError = true;
    } else {
      values.push(current.value);
    }
    index += 1;
  } while (!foundError && index < items.length);
  return current;
}

export { pipeEither };
