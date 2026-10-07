#!/usr/bin/env -S deno run --allow-read
/**
 * Fail if something in the tree is referenced by nothing.
 *
 *  1. Legacy JS: every file under static/js/legacy must be reachable by import
 *     from the islands (static/js/islands/*.js) or the module-import test.
 *  2. Legacy CSS: every file under static/css/legacy must be @imported from main.css.
 *  3. ABIs: every contracts/build/abis/*.json must be named by legacy JS or agent.json.
 *  4. Markdown links in README.md, docs/, contracts/, scripts/ must resolve.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (f) => path.relative(ROOT, f);
const problems = [];

function walk(dir, acc = []) {
    if (!fs.existsSync(dir)) return acc;
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) walk(full, acc);
        else acc.push(full);
    }
    return acc;
}

// 1. JS reachability
const importRe = /(?:import\s[^'"]*?from\s*|import\s*\(\s*|export\s[^'"]*?from\s*|import\s*)['"]([^'"]+)['"]/g;
const seen = new Set();
const queue = [
    ...walk(path.join(ROOT, 'static', 'js', 'islands')),
    path.join(ROOT, 'tests', 'test-module-imports.js'),
].filter((f) => f.endsWith('.js'));
while (queue.length) {
    const f = queue.pop();
    if (seen.has(f) || !fs.existsSync(f)) continue;
    seen.add(f);
    const text = fs.readFileSync(f, 'utf8');
    for (const m of text.matchAll(importRe)) {
        const spec = m[1].split('?')[0];
        if (!spec.startsWith('.') && !spec.startsWith('/')) continue;
        const target = spec.startsWith('/') ? path.join(ROOT, 'static', spec) : path.resolve(path.dirname(f), spec);
        queue.push(target);
    }
}
for (const f of walk(path.join(ROOT, 'static', 'js', 'legacy')).filter((f) => f.endsWith('.js'))) {
    if (!seen.has(f)) problems.push(`unreachable legacy module: ${rel(f)}`);
}

// 2. CSS
const mainCss = fs.readFileSync(path.join(ROOT, 'static', 'css', 'legacy', 'main.css'), 'utf8');
for (const f of walk(path.join(ROOT, 'static', 'css', 'legacy')).filter((f) => f.endsWith('.css'))) {
    const name = path.basename(f);
    if (name !== 'main.css' && !mainCss.includes(`'${name}'`)) problems.push(`legacy stylesheet not imported by main.css: ${rel(f)}`);
}

// 3. ABIs
const legacyText = walk(path.join(ROOT, 'static', 'js', 'legacy')).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(f, 'utf8')).join('\n')
    + fs.readFileSync(path.join(ROOT, 'static', '.well-known', 'agent.json'), 'utf8');
for (const f of walk(path.join(ROOT, 'contracts', 'build', 'abis')).filter((f) => f.endsWith('.json'))) {
    if (!legacyText.includes(path.basename(f))) problems.push(`ABI fetched by nothing: ${rel(f)}`);
}

// 4. Markdown links
const mdFiles = [path.join(ROOT, 'README.md'), ...['docs', 'contracts', 'scripts', 'test'].flatMap((d) => walk(path.join(ROOT, d)))].filter((f) => f.endsWith('.md'));
const linkRe = /\[[^\]]*\]\(([^)\s#]+)(?:#[^)]*)?\)/g;
for (const f of mdFiles) {
    const text = fs.readFileSync(f, 'utf8');
    for (const m of text.matchAll(linkRe)) {
        const t = m[1];
        if (/^[a-z]+:/.test(t) || t.startsWith('/')) continue;
        const target = path.resolve(path.dirname(f), t);
        if (!fs.existsSync(target)) problems.push(`broken link in ${rel(f)}: ${t}`);
    }
}

if (problems.length) {
    console.error(problems.join('\n'));
    console.error(`\n${problems.length} orphan(s)`);
    process.exit(1);
}
console.log(`orphans: none (${seen.size} modules reachable, ${mdFiles.length} markdown files checked)`);
