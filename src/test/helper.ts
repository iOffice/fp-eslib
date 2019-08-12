import { assert } from 'chai';

function compareValues(
  tests: ([unknown, unknown] | [unknown, unknown, string])[],
): void {
  tests.forEach(item => {
    assert.deepEqual(item[0], item[1], item[2]);
  });
}

function contrastValues(tests: [unknown, unknown][]): void {
  tests.forEach(([a, b]) => {
    assert.notDeepEqual(a, b);
  });
}

function expectException(tests: [Function, string][]): void {
  tests.forEach(([a, b]) => {
    // Check for an exact match of the exception message
    // Need to escape special characters that may occur in a message like 'rgb(1,1,1,1)'
    assert.throws(
      a,
      Error,
      new RegExp(`^${b.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`),
    );
  });
}

export { compareValues, contrastValues, expectException };
