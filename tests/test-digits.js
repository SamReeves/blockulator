import assert from 'node:assert/strict';
import { agree, splitByAgree, decodeRaw, encodeRun, decodeRun } from '../static/js/islands/digits.js';

// agree: the same cases as scripts/ladder/ladder.py --selftest
const cases = [
    ['10002.7397260273972602739726027397260273831', '10002.7397260273972602739726027397260273973', 39],
    ['-0.00123456', '-0.00123999', 3],
    ['0.99999999', '1.00000001', 0],
    ['1.5', '1.5', 2],
    ['154769.3406914411', '154769.3406914411', 16],
    ['123', '1230', 0],
    ['0.5', '-0.5', 0],
    ['1.49999999999999999999999999999999999997649', '1.5', 1],
];
for (const [v, t, want] of cases) assert.equal(agree(v, t), want, `${v} vs ${t}`);

assert.deepEqual(splitByAgree('10002.7397', 6), { matched: '10002.7', rest: '397' });
assert.deepEqual(splitByAgree('-0.00123456', 3), { matched: '-0.00123', rest: '456' });
assert.deepEqual(splitByAgree('1.5', 0), { matched: '', rest: '1.5' });

assert.equal(decodeRaw('3403755949666702274259673128036673260340000', 2n ** 128n, 10), '10002.7397260273');
assert.equal(decodeRaw('1500000000000000000', 10n ** 18n), '1.5');
assert.equal(decodeRaw('-18446744073709551616', 2n ** 64n), '-1');

// encodeRun: selector, three static words, the array offset (0x80), then length and elements
const data = encodeRun('0x281dbbfe', 0, 0, 365, [1n, -1n]);
assert.equal(data.length, 2 + 8 + 64 * 7);
assert.equal(data.slice(10, 74), '0'.repeat(64));
assert.equal(data.slice(138, 202), '0'.repeat(61) + '16d');
assert.equal(data.slice(202, 266), '0'.repeat(62) + '80');
assert.equal(data.slice(266, 330), '0'.repeat(63) + '2');
assert.equal(data.slice(394, 458), 'f'.repeat(64));

const ret = '0x' + '0'.repeat(63) + '1' + 'f'.repeat(64) + '35278d12' + '0'.repeat(56) + '0'.repeat(63) + 'a' + '0'.repeat(62) + '64';
const r = decodeRun(ret);
assert.equal(r.ok, true); assert.equal(r.raw, -1n); assert.equal(r.reason, '0x35278d12'); assert.equal(r.gasPerStep, 10n); assert.equal(r.gasTotal, 100n);
console.log('digits: ok');
