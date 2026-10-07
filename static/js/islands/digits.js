// Pure: split a decimal string into the prefix that agrees with the truth and the rest.
// `digits` is the count of correct leading significant digits, as ladder.json records it.
// Mirrors the `cell` Tera component in templates/components.html, which renders the
// same split statically; this copy is what the tests exercise and what verify.js uses.
export function highlightDivergence(value, digits) {
    let pre = 0;
    while (pre < value.length && (value[pre] === '-' || value[pre] === '0' || value[pre] === '.')) pre++;
    if (pre >= value.length) return { matched: value, rest: '' };
    const intlen = value.slice(pre).split('.')[0].length;
    const k = digits <= intlen ? pre + digits : pre + digits + 1;
    if (k >= value.length) return { matched: value, rest: '' };
    return { matched: value.slice(0, k), rest: value.slice(k) };
}

// Decode a raw library word into a decimal string with `places` fractional digits.
export function decodeRaw(raw, scale, places = 40) {
    let x = BigInt(raw);
    const neg = x < 0n;
    if (neg) x = -x;
    const s = BigInt(scale);
    const ip = x / s;
    let fp = ((x % s) * 10n ** BigInt(places)) / s;
    let frac = fp.toString().padStart(places, '0').replace(/0+$/, '');
    return (neg ? '-' : '') + ip.toString() + (frac ? '.' + frac : '');
}
