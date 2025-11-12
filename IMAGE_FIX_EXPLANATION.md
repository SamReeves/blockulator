# 🖼️ Image Scrambling Issue - Root Cause & Fix

## The Problem

Images uploaded to the blockchain were displaying as scrambled vertical stripes instead of the correct image.

![Scrambled Image Example](Untitled.png)

## Root Cause Analysis

### Issue #1: JavaScript Array vs Uint8Array (UPLOAD BUG)

**Location:** `js/uploads-app.js` line 267-276

**The Bug:**
```javascript
const pixelData = [];  // ❌ Plain JavaScript array

for (let i = 0; i < imageData.data.length; i += 4) {
    pixelData.push(imageData.data[i]);     // R
    pixelData.push(imageData.data[i + 1]); // G
    pixelData.push(imageData.data[i + 2]); // B
}

const pixelBytes = window.ethers.utils.hexlify(pixelData);  // ❌ Wrong!
```

**Why This Failed:**
- `ethers.utils.hexlify()` expects a `Uint8Array` or `Buffer`, not a plain JavaScript array
- When given a plain array, it may:
  - Interpret the array structure itself as data
  - Add extra encoding/padding
  - Corrupt the byte sequence
- Result: Data gets uploaded to blockchain in wrong format

**The Fix:**
```javascript
const pixelData = new Uint8Array(canvas.width * canvas.height * 3);  // ✅ Proper typed array
let writeIndex = 0;

for (let i = 0; i < imageData.data.length; i += 4) {
    pixelData[writeIndex++] = imageData.data[i];     // R
    pixelData[writeIndex++] = imageData.data[i + 1]; // G
    pixelData[writeIndex++] = imageData.data[i + 2]; // B
}

const pixelBytes = window.ethers.utils.hexlify(pixelData);  // ✅ Correct!
```

### Issue #2: Incorrect ABI Offset Skip (DISPLAY BUG)

**Location:** `js/uploads-app.js` lines 452-460

**The Bug:**
```javascript
if (bytes.length > expectedBytes) {
    dataStartIndex = 64;  // ❌ Skipping 64 bytes when we shouldn't
}
```

**Why This Failed:**
- When calling `contract.content_data()` through ethers.js **with a proper ABI**, the library automatically decodes the return value
- The 64-byte ABI encoding header (32 bytes offset + 32 bytes length) is **already removed** by ethers.js
- The conditional check `bytes.length > expectedBytes` could trigger incorrectly
- Result: We skip the first 64 bytes of actual pixel data, shifting everything

**The Fix:**
```javascript
// Ethers.js automatically handles ABI decoding when using the ABI
// The returned bytes should be the raw pixel data without encoding prefix
const expectedBytes = w * h * 3;

// No offset needed - start from byte 0
let byteIndex = 0;
```

## Visual Explanation

### What Was Happening:

```
Expected Structure (64x64 RGB):
[R1 G1 B1] [R2 G2 B2] [R3 G3 B3] ... [R4096 G4096 B4096]
   px1        px2        px3             px4096

What Was Uploaded (with Array bug):
[XX XX XX] [R1 G1 B1] [R2 G2 B2] ... (shifted/corrupted)
   junk       px1        px2

What Was Read (with offset bug):
Start reading at byte 64 instead of 0
Skip first 21 pixels worth of data!
[R22 G22 B22] [R23 G23 B23] ... (wrong data)
```

Result: Vertical stripes because each row starts at the wrong pixel offset.

## Testing Your Fix

### For Existing Images (Already Uploaded with Bug):
1. **They're permanently corrupted** - the wrong data is on-chain
2. Use `debug-image.html` to view them with different offsets
3. You may need to re-upload them

### For New Images:
1. Upload a new test image
2. Check browser console for debug logs:
   ```
   📤 Uploading 64x64 image
      Pixel data: 12288 bytes
      First 16 bytes: [r, g, b, r, g, b, ...]
      Hex length: 24578  (should be 2 + 12288*2 = 24578)
   ```
3. Verify the image displays correctly after upload

## Prevention

### Type Safety Checklist:
- ✅ Always use `Uint8Array` for binary data
- ✅ Never use plain JavaScript arrays for byte data
- ✅ Trust ethers.js ABI decoding (don't manually skip bytes)
- ✅ Add debug logging for upload/download

### Debug Tools:
1. **debug-image.html** - Analyze contract data and try different rendering methods
2. **Browser console** - Check upload logs
3. **Etherscan** - Verify contract storage

## Files Modified:
- `js/uploads-app.js` - Fixed upload (Uint8Array) and display (no offset)
- Added `debug-image.html` - Debug tool for analyzing image contracts

## Summary

**Two bugs, two fixes:**
1. **Upload Bug**: Use `Uint8Array` instead of plain array for proper encoding
2. **Display Bug**: Remove incorrect 64-byte offset (ethers.js handles ABI)

The scrambled vertical stripes were caused by reading pixel data from the wrong starting position, which was caused by uploading data in the wrong format in the first place.

---

**Next Steps:**
1. Test uploading a new image
2. Verify it displays correctly
3. Old images are permanently corrupted (re-upload if needed)

