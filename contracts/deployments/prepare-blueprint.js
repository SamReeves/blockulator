#!/usr/bin/env node
/**
 * Prepare blueprint bytecode with EIP-5202 preamble wrapped in initcode
 * 
 * Blueprint format: 0xFE71 + <2-byte length> + <runtime bytecode>
 * But we need to deploy INITCODE that returns this blueprint data
 * 
 * Initcode format:
 * PUSH<n> <data_length> PUSH1 0x00 CODECOPY PUSH<n> <data_length> PUSH1 0x00 RETURN <blueprint_data>
 */

const fs = require('fs');
const path = require('path');

// Read runtime bytecode
let runtimeBytecode = fs.readFileSync(
    path.join(__dirname, '../build/bytecode/image_content_v3_runtime.bin'),
    'utf8'
).trim();

// Remove 0x prefix if present
if (runtimeBytecode.startsWith('0x')) {
    runtimeBytecode = runtimeBytecode.slice(2);
}

// Calculate runtime length in bytes
const runtimeLength = runtimeBytecode.length / 2;

// Convert length to 2-byte big-endian hex
const lengthHex = runtimeLength.toString(16).padStart(4, '0');

// Create blueprint data: 0xFE71 + length + runtime
const blueprintData = 'FE71' + lengthHex + runtimeBytecode;
const blueprintLength = blueprintData.length / 2;

// Create initcode that returns the blueprint data
// Format: PUSH2 <len> PUSH1 0x0C DUP2 PUSH1 0x0C PUSH1 0x00 CODECOPY PUSH1 0x00 RETURN <data>
// Simplified: 61<len>600C8038600C6000396000F3<data>
const lengthBytes = blueprintLength.toString(16).padStart(4, '0');
const initcode = '0x61' + lengthBytes + '600C8038600C6000396000F3' + blueprintData;

// Write to file
fs.writeFileSync(
    path.join(__dirname, '../build/bytecode/image_content_v3_blueprint.bin'),
    initcode
);

console.log(`✅ Blueprint prepared:`);
console.log(`   Runtime size: ${runtimeLength} bytes`);
console.log(`   Blueprint data size: ${blueprintLength} bytes (with EIP-5202 preamble)`);
console.log(`   Initcode size: ${(initcode.length - 2) / 2} bytes`);
console.log(`   Preamble: 0xFE71${lengthHex}`);

