#!/usr/bin/env node
/**
 * Fail if application CSS/JS contains literal hex or rgb()/rgba() outside
 * the allowlisted token bridge and palette modules.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');

const SKIP = new Set([
    path.join(REPO_ROOT, 'css', 'tokens.css'),
    path.join(REPO_ROOT, 'js', 'theme', 'sdr-palette.js'),
]);

const reHex = /#[0-9a-fA-F]{3,8}\b/;
const reRgb = /\brgb\s*\(/;
const reRgba = /\brgba\s*\(/;

function walkDir(dir, acc = []) {
    if (!fs.existsSync(dir)) return acc;
    for (const name of fs.readdirSync(dir)) {
        if (name === 'node_modules' || name === 'dist' || name === '.git' || name === 'vendor') continue;
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        if (st.isDirectory()) walkDir(full, acc);
        else acc.push(full);
    }
    return acc;
}

function stripLineComments(line) {
    return line.replace(/\/\/.*$/, '');
}

function checkFile(file) {
    if (SKIP.has(file)) return [];
    const rel = path.relative(REPO_ROOT, file);
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    const hits = [];
    lines.forEach((raw, idx) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(raw)) return;
        const line = stripLineComments(raw);
        if (reHex.test(line) || reRgb.test(line) || reRgba.test(line)) {
            hits.push(`${rel}:${idx + 1}: ${raw.trim()}`);
        }
    });
    return hits;
}

const targets = [
    ...walkDir(path.join(REPO_ROOT, 'js')).filter((f) => f.endsWith('.js')),
    ...walkDir(path.join(REPO_ROOT, 'css')).filter((f) => f.endsWith('.css')),
];

const all = targets.flatMap(checkFile);

if (all.length) {
    console.error('SDR color guard: hex/rgb/rgba found outside allowlisted token files:\n');
    console.error(all.join('\n'));
    process.exit(1);
}

console.log('SDR color guard: OK');
