import assert from 'node:assert/strict';
import { highlightDivergence, decodeRaw } from '../static/js/islands/digits.js';

const cases = [
    ['10002.7397260273972602739726027397260273831', 38, '10002.739726027397260273972602739726027', '3831'],
    ['-0.00123456', 3, '-0.00123', '456'],
    ['154769.3406914411', 15, '154769.340691441', '1'],
    ['12345', 60, '12345', ''],
    ['12345.678', 2, '12', '345.678'],
    ['0.5', 1, '0.5', ''],
];
for (const [v, d, m, r] of cases) {
    assert.deepEqual(highlightDivergence(v, d), { matched: m, rest: r }, `${v} / ${d}`);
}
assert.equal(decodeRaw('3403755949666702274259673128036673260340000', 2n ** 128n, 10), '10002.7397260273');
assert.equal(decodeRaw('1500000000000000000', 10n ** 18n), '1.5');
assert.equal(decodeRaw('-18446744073709551616', 2n ** 64n), '-1');
console.log('digits: ok');
