// Tabs for the scenarios, and the per-cell "verify on Sepolia" button: one
// eth_call to LadderRunner.run(scenario, form, n) through the public RPC,
// compared with the raw word committed in ladder.json. No wallet, no ethers.
const RPC = 'https://ethereum-sepolia-rpc.publicnode.com';
const RUNNER = '0x3FD3461EE53F9C6f2322CbB3fF97A3EdA522d4a4';
const SELECTOR = '0x986cc444'; // run(uint8,uint8,uint32)

const tabs = document.querySelectorAll('#scenario-tabs a');
const sections = document.querySelectorAll('section.scenario');
function show(id) {
    if (!document.getElementById(id)) return;
    sections.forEach((s) => { s.hidden = s.id !== id; });
    tabs.forEach((t) => t.classList.toggle('on', t.dataset.tab === id));
}
window.addEventListener('hashchange', () => show(location.hash.slice(1)));
if (location.hash) show(location.hash.slice(1));

function word(n) { return BigInt(n).toString(16).padStart(64, '0'); }
function toSigned(hex) {
    let x = BigInt('0x' + hex);
    if (x >= 1n << 255n) x -= 1n << 256n;
    return x;
}

async function call(scenario, form, n) {
    const data = SELECTOR + word(scenario) + word(form) + word(n);
    const res = await fetch(RPC, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: RUNNER, data }, 'latest'] }),
    });
    const j = await res.json();
    if (j.error) throw new Error(j.error.message);
    const out = j.result.slice(2);
    if (out.length < 256) throw new Error('short return data');
    return {
        ok: BigInt('0x' + out.slice(0, 64)) === 1n,
        raw: toSigned(out.slice(64, 128)),
        reason: '0x' + out.slice(128, 136),
        gas: BigInt('0x' + out.slice(192, 256)),
    };
}

document.addEventListener('click', async (e) => {
    const b = e.target.closest('button.verify');
    if (!b || b.disabled) return;
    b.disabled = true;
    const was = b.textContent;
    b.textContent = 'calling…';
    try {
        const r = await call(b.dataset.scenario, b.dataset.form, b.dataset.n);
        let match;
        if (b.dataset.raw) match = r.ok && r.raw === BigInt(b.dataset.raw);
        else match = !r.ok && r.reason === b.dataset.reason;
        b.textContent = match ? `live: match (${r.gas} gas/step)` : 'live: MISMATCH';
        b.classList.add(match ? 'match' : 'mismatch');
        if (!match) console.warn('ladder mismatch', b.dataset, r);
    } catch (err) {
        b.textContent = `live: ${err.message}`;
        b.classList.add('mismatch');
        b.disabled = false;
    }
});
