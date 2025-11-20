/**
 * Image Compression Utilities
 * Multi-mode compression for on-chain image storage
 * 
 * Modes:
 * - RGB: Full color (3 bytes/pixel)
 * - Grayscale: 256 shades (1 byte/pixel) 
 * - Monochrome: B&W with dithering (1 bit/pixel)
 * - Indexed: Palette-based (1 byte/pixel + palette)
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const CompressionMode = {
    RGB: 0,
    GRAYSCALE: 1,
    MONOCHROME: 2,
    INDEXED: 3,
    RLE: 4,           // Run-Length Encoding (best for logos/solid areas)
    RGB565: 5         // 16-bit color (best for photos with reduced palette)
};

export const MAX_IMAGE_SIZE = 16384;  // 16KB blockchain limit

// ============================================================================
// MODE CAPABILITIES
// ============================================================================

export function getModeCapacity(mode) {
    switch(mode) {
        case CompressionMode.RGB:
            return {
                bytesPerPixel: 3,
                maxPixels: Math.floor(MAX_IMAGE_SIZE / 3),  // 5,461
                maxSquare: 73,
                maxDimension: 128,
                description: "Full Color RGB"
            };
        case CompressionMode.GRAYSCALE:
            return {
                bytesPerPixel: 1,
                maxPixels: MAX_IMAGE_SIZE,  // 16,384
                maxSquare: 128,
                maxDimension: 128,
                description: "256 Shades of Gray"
            };
        case CompressionMode.MONOCHROME:
            return {
                bytesPerPixel: 0.125,  // 1 bit
                maxPixels: MAX_IMAGE_SIZE * 8,  // 131,072
                maxSquare: 362,
                maxDimension: 512,
                description: "Black & White (Dithered)"
            };
        case CompressionMode.INDEXED:
            return {
                bytesPerPixel: 1,
                maxPixels: MAX_IMAGE_SIZE - 768,  // 15,616 (256-color palette overhead)
                maxSquare: 124,
                maxDimension: 128,
                paletteSize: 256,
                description: "256 Colors (Palette)"
            };
        case CompressionMode.RLE:
            return {
                bytesPerPixel: 'variable',
                maxPixels: 999999,  // Variable! Can be HUGE for solid colors
                maxSquare: 512,
                maxDimension: 512,
                description: "Run-Length Encoding (Logos)"
            };
        case CompressionMode.RGB565:
            return {
                bytesPerPixel: 2,
                maxPixels: Math.floor(MAX_IMAGE_SIZE / 2),  // 8,192
                maxSquare: 90,
                maxDimension: 128,
                description: "16-bit Color (65K colors)"
            };
    }
}

// ============================================================================
// RGB MODE (Mode 0)
// ============================================================================

export function compressRGB(imageData, width, height) {
    const pixels = width * height;
    const data = new Uint8Array(pixels * 3);
    
    let writeIndex = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
        data[writeIndex++] = imageData.data[i];     // R
        data[writeIndex++] = imageData.data[i + 1]; // G
        data[writeIndex++] = imageData.data[i + 2]; // B
    }
    
    return data;
}

export function decompressRGB(data, width, height) {
    const pixels = width * height;
    const imageData = new ImageData(width, height);
    
    for (let i = 0; i < pixels; i++) {
        const srcIndex = i * 3;
        const dstIndex = i * 4;
        imageData.data[dstIndex] = data[srcIndex];     // R
        imageData.data[dstIndex + 1] = data[srcIndex + 1]; // G
        imageData.data[dstIndex + 2] = data[srcIndex + 2]; // B
        imageData.data[dstIndex + 3] = 255;            // A
    }
    
    return imageData;
}

// ============================================================================
// GRAYSCALE MODE (Mode 1)
// ============================================================================

export function compressGrayscale(imageData, width, height) {
    const pixels = width * height;
    const data = new Uint8Array(pixels);
    
    for (let i = 0; i < pixels; i++) {
        const srcIndex = i * 4;
        // Luminance formula (ITU-R BT.601)
        const gray = Math.floor(
            0.299 * imageData.data[srcIndex] +
            0.587 * imageData.data[srcIndex + 1] +
            0.114 * imageData.data[srcIndex + 2]
        );
        data[i] = gray;
    }
    
    return data;
}

export function decompressGrayscale(data, width, height) {
    const pixels = width * height;
    const imageData = new ImageData(width, height);
    
    for (let i = 0; i < pixels; i++) {
        const gray = data[i];
        const dstIndex = i * 4;
        imageData.data[dstIndex] = gray;     // R
        imageData.data[dstIndex + 1] = gray; // G
        imageData.data[dstIndex + 2] = gray; // B
        imageData.data[dstIndex + 3] = 255;  // A
    }
    
    return imageData;
}

// ============================================================================
// MONOCHROME MODE (Mode 2) - With Floyd-Steinberg Dithering
// ============================================================================

export function compressMonochrome(imageData, width, height) {
    const pixels = width * height;
    
    // First convert to grayscale and apply Floyd-Steinberg dithering
    const grayscale = new Float32Array(pixels);
    
    for (let i = 0; i < pixels; i++) {
        const srcIndex = i * 4;
        grayscale[i] = 
            0.299 * imageData.data[srcIndex] +
            0.587 * imageData.data[srcIndex + 1] +
            0.114 * imageData.data[srcIndex + 2];
    }
    
    // Floyd-Steinberg dithering
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = y * width + x;
            const oldPixel = grayscale[i];
            const newPixel = oldPixel < 128 ? 0 : 255;
            grayscale[i] = newPixel;
            
            const error = oldPixel - newPixel;
            
            // Distribute error to neighbors
            if (x + 1 < width) {
                grayscale[i + 1] += error * 7 / 16;
            }
            if (y + 1 < height) {
                if (x > 0) {
                    grayscale[i + width - 1] += error * 3 / 16;
                }
                grayscale[i + width] += error * 5 / 16;
                if (x + 1 < width) {
                    grayscale[i + width + 1] += error * 1 / 16;
                }
            }
        }
    }
    
    // Pack bits (8 pixels per byte)
    const byteCount = Math.ceil(pixels / 8);
    const data = new Uint8Array(byteCount);
    
    for (let i = 0; i < pixels; i++) {
        const byteIndex = Math.floor(i / 8);
        const bitIndex = 7 - (i % 8);  // MSB first
        
        if (grayscale[i] > 127) {
            data[byteIndex] |= (1 << bitIndex);
        }
    }
    
    return data;
}

export function decompressMonochrome(data, width, height) {
    const pixels = width * height;
    const imageData = new ImageData(width, height);
    
    for (let i = 0; i < pixels; i++) {
        const byteIndex = Math.floor(i / 8);
        const bitIndex = 7 - (i % 8);
        
        const bit = (data[byteIndex] >> bitIndex) & 1;
        const value = bit ? 255 : 0;
        
        const dstIndex = i * 4;
        imageData.data[dstIndex] = value;     // R
        imageData.data[dstIndex + 1] = value; // G
        imageData.data[dstIndex + 2] = value; // B
        imageData.data[dstIndex + 3] = 255;   // A
    }
    
    return imageData;
}

// ============================================================================
// INDEXED MODE (Mode 3) - Median Cut Color Quantization
// ============================================================================

class ColorBox {
    constructor(colors) {
        this.colors = colors;
        this.updateRange();
    }
    
    updateRange() {
        let minR = 255, maxR = 0;
        let minG = 255, maxG = 0;
        let minB = 255, maxB = 0;
        
        for (const c of this.colors) {
            minR = Math.min(minR, c[0]);
            maxR = Math.max(maxR, c[0]);
            minG = Math.min(minG, c[1]);
            maxG = Math.max(maxG, c[1]);
            minB = Math.min(minB, c[2]);
            maxB = Math.max(maxB, c[2]);
        }
        
        this.rangeR = maxR - minR;
        this.rangeG = maxG - minG;
        this.rangeB = maxB - minB;
    }
    
    get longestAxis() {
        if (this.rangeR >= this.rangeG && this.rangeR >= this.rangeB) return 0;
        if (this.rangeG >= this.rangeB) return 1;
        return 2;
    }
    
    split() {
        const axis = this.longestAxis;
        this.colors.sort((a, b) => a[axis] - b[axis]);
        
        const mid = Math.floor(this.colors.length / 2);
        return [
            new ColorBox(this.colors.slice(0, mid)),
            new ColorBox(this.colors.slice(mid))
        ];
    }
    
    getAverageColor() {
        let r = 0, g = 0, b = 0;
        for (const c of this.colors) {
            r += c[0];
            g += c[1];
            b += c[2];
        }
        const n = this.colors.length;
        return [Math.round(r/n), Math.round(g/n), Math.round(b/n)];
    }
}

export function compressIndexed(imageData, width, height, paletteSize = 256) {
    const pixels = width * height;
    
    // Extract unique colors
    const colorSet = new Map();
    for (let i = 0; i < pixels; i++) {
        const idx = i * 4;
        const r = imageData.data[idx];
        const g = imageData.data[idx + 1];
        const b = imageData.data[idx + 2];
        const key = (r << 16) | (g << 8) | b;
        colorSet.set(key, [r, g, b]);
    }
    
    const uniqueColors = Array.from(colorSet.values());
    
    let palette;
    
    if (uniqueColors.length <= paletteSize) {
        // Already fits in palette
        palette = uniqueColors;
        // Pad to requested size
        while (palette.length < paletteSize) {
            palette.push([0, 0, 0]);
        }
    } else {
        // Use median cut quantization
        let boxes = [new ColorBox(uniqueColors)];
        
        while (boxes.length < paletteSize) {
            // Find box with largest range
            let maxRange = -1;
            let maxBox = null;
            let maxIndex = -1;
            
            for (let i = 0; i < boxes.length; i++) {
                const box = boxes[i];
                const range = Math.max(box.rangeR, box.rangeG, box.rangeB);
                if (range > maxRange && box.colors.length > 1) {
                    maxRange = range;
                    maxBox = box;
                    maxIndex = i;
                }
            }
            
            if (!maxBox) break;
            
            // Split the box
            const [box1, box2] = maxBox.split();
            boxes.splice(maxIndex, 1, box1, box2);
        }
        
        // Generate palette from boxes
        palette = boxes.map(box => box.getAverageColor());
    }
    
    // Build color lookup for fast mapping
    const colorToIndex = new Map();
    palette.forEach((color, index) => {
        const key = (color[0] << 16) | (color[1] << 8) | color[2];
        colorToIndex.set(key, index);
    });
    
    // Create indexed data
    const indices = new Uint8Array(pixels);
    
    for (let i = 0; i < pixels; i++) {
        const idx = i * 4;
        const r = imageData.data[idx];
        const g = imageData.data[idx + 1];
        const b = imageData.data[idx + 2];
        
        // Find closest palette color
        let bestIndex = 0;
        let bestDist = Infinity;
        
        for (let p = 0; p < palette.length; p++) {
            const dr = r - palette[p][0];
            const dg = g - palette[p][1];
            const db = b - palette[p][2];
            const dist = dr*dr + dg*dg + db*db;
            
            if (dist < bestDist) {
                bestDist = dist;
                bestIndex = p;
            }
        }
        
        indices[i] = bestIndex;
    }
    
    // Combine palette and indices
    const paletteBytes = paletteSize * 3;
    const data = new Uint8Array(paletteBytes + pixels);
    
    // Write palette
    for (let i = 0; i < paletteSize; i++) {
        data[i * 3] = palette[i][0];
        data[i * 3 + 1] = palette[i][1];
        data[i * 3 + 2] = palette[i][2];
    }
    
    // Write indices
    data.set(indices, paletteBytes);
    
    return data;
}

export function decompressIndexed(data, width, height, paletteSize) {
    const pixels = width * height;
    const imageData = new ImageData(width, height);
    
    // Extract palette
    const palette = [];
    for (let i = 0; i < paletteSize; i++) {
        palette.push([
            data[i * 3],
            data[i * 3 + 1],
            data[i * 3 + 2]
        ]);
    }
    
    // Decompress pixels
    const indexOffset = paletteSize * 3;
    for (let i = 0; i < pixels; i++) {
        const paletteIndex = data[indexOffset + i];
        const color = palette[paletteIndex] || [0, 0, 0];
        
        const dstIndex = i * 4;
        imageData.data[dstIndex] = color[0];     // R
        imageData.data[dstIndex + 1] = color[1]; // G
        imageData.data[dstIndex + 2] = color[2]; // B
        imageData.data[dstIndex + 3] = 255;      // A
    }
    
    return imageData;
}

// ============================================================================
// RLE MODE (Mode 4) - Run-Length Encoding
// ============================================================================

export function compressRLE(imageData, width, height) {
    const pixels = width * height;
    const compressed = [];
    
    // Format: [count_low, count_high, R, G, B, ...]
    // Supports runs up to 65535 pixels
    
    let currentR = imageData.data[0];
    let currentG = imageData.data[1];
    let currentB = imageData.data[2];
    let runLength = 1;
    
    for (let i = 1; i < pixels; i++) {
        const idx = i * 4;
        const r = imageData.data[idx];
        const g = imageData.data[idx + 1];
        const b = imageData.data[idx + 2];
        
        // Check if same color
        if (r === currentR && g === currentG && b === currentB && runLength < 65535) {
            runLength++;
        } else {
            // Write run
            compressed.push(runLength & 0xFF);         // Low byte
            compressed.push((runLength >> 8) & 0xFF);  // High byte
            compressed.push(currentR);
            compressed.push(currentG);
            compressed.push(currentB);
            
            // Start new run
            currentR = r;
            currentG = g;
            currentB = b;
            runLength = 1;
        }
    }
    
    // Write final run
    compressed.push(runLength & 0xFF);
    compressed.push((runLength >> 8) & 0xFF);
    compressed.push(currentR);
    compressed.push(currentG);
    compressed.push(currentB);
    
    return new Uint8Array(compressed);
}

export function decompressRLE(data, width, height) {
    const pixels = width * height;
    const imageData = new ImageData(width, height);
    
    let writeIndex = 0;
    let readIndex = 0;
    
    while (readIndex < data.length && writeIndex < pixels * 4) {
        // Read run length (16-bit little-endian)
        const countLow = data[readIndex++];
        const countHigh = data[readIndex++];
        const count = countLow | (countHigh << 8);
        
        // Read color
        const r = data[readIndex++];
        const g = data[readIndex++];
        const b = data[readIndex++];
        
        // Write pixels
        for (let i = 0; i < count && writeIndex < pixels * 4; i++) {
            imageData.data[writeIndex++] = r;
            imageData.data[writeIndex++] = g;
            imageData.data[writeIndex++] = b;
            imageData.data[writeIndex++] = 255; // A
        }
    }
    
    return imageData;
}

// ============================================================================
// RGB565 MODE (Mode 5) - 16-bit Color
// ============================================================================

export function compressRGB565(imageData, width, height) {
    const pixels = width * height;
    const data = new Uint8Array(pixels * 2); // 2 bytes per pixel
    
    for (let i = 0; i < pixels; i++) {
        const srcIndex = i * 4;
        const dstIndex = i * 2;
        
        // Extract RGB (8-bit each)
        const r = imageData.data[srcIndex];
        const g = imageData.data[srcIndex + 1];
        const b = imageData.data[srcIndex + 2];
        
        // Convert to RGB565 (5-6-5 bits)
        const r5 = (r >> 3) & 0x1F;  // 5 bits
        const g6 = (g >> 2) & 0x3F;  // 6 bits
        const b5 = (b >> 3) & 0x1F;  // 5 bits
        
        // Pack into 16 bits: RRRRRGGG GGGBBBBB
        const rgb565 = (r5 << 11) | (g6 << 5) | b5;
        
        // Store as little-endian
        data[dstIndex] = rgb565 & 0xFF;         // Low byte
        data[dstIndex + 1] = (rgb565 >> 8) & 0xFF; // High byte
    }
    
    return data;
}

export function decompressRGB565(data, width, height) {
    const pixels = width * height;
    const imageData = new ImageData(width, height);
    
    for (let i = 0; i < pixels; i++) {
        const srcIndex = i * 2;
        const dstIndex = i * 4;
        
        // Read 16-bit value (little-endian)
        const rgb565 = data[srcIndex] | (data[srcIndex + 1] << 8);
        
        // Extract RGB565
        const r5 = (rgb565 >> 11) & 0x1F;
        const g6 = (rgb565 >> 5) & 0x3F;
        const b5 = rgb565 & 0x1F;
        
        // Convert to 8-bit (scale up)
        const r = (r5 << 3) | (r5 >> 2);  // 5→8 bits
        const g = (g6 << 2) | (g6 >> 4);  // 6→8 bits
        const b = (b5 << 3) | (b5 >> 2);  // 5→8 bits
        
        imageData.data[dstIndex] = r;
        imageData.data[dstIndex + 1] = g;
        imageData.data[dstIndex + 2] = b;
        imageData.data[dstIndex + 3] = 255;
    }
    
    return imageData;
}

// ============================================================================
// SMART COMPRESSION - Auto-select best mode
// ============================================================================

export function analyzeImage(imageData, width, height) {
    const pixels = width * height;
    const colorSet = new Set();
    let hasColor = false;
    let isMonochrome = true;
    let rleRuns = 0;
    let currentColor = null;
    
    for (let i = 0; i < pixels; i++) {
        const idx = i * 4;
        const r = imageData.data[idx];
        const g = imageData.data[idx + 1];
        const b = imageData.data[idx + 2];
        
        // Check if grayscale
        if (r !== g || g !== b) {
            hasColor = true;
        }
        
        // Check if pure B&W
        if ((r !== 0 && r !== 255) || r !== g || g !== b) {
            isMonochrome = false;
        }
        
        // Count unique colors
        const key = (r << 16) | (g << 8) | b;
        colorSet.add(key);
        
        // Count RLE runs (for compression estimation)
        if (currentColor === null || currentColor !== key) {
            rleRuns++;
            currentColor = key;
        }
    }
    
    // Calculate potential RLE compression
    const rleSize = rleRuns * 5; // 5 bytes per run (count + RGB)
    const rgbSize = pixels * 3;
    const rleRatio = rgbSize / rleSize;
    
    return {
        hasColor,
        isMonochrome,
        uniqueColors: colorSet.size,
        pixels,
        rleRuns,
        rleCompressionRatio: rleRatio
    };
}

export function suggestMode(imageData, width, height) {
    const analysis = analyzeImage(imageData, width, height);
    
    // Check RLE first (best for logos/solid areas)
    if (analysis.rleCompressionRatio > 10) {
        return {
            mode: CompressionMode.RLE,
            reason: `${analysis.rleCompressionRatio.toFixed(1)}× compression with RLE (${analysis.rleRuns} runs)`,
            compressionRatio: analysis.rleCompressionRatio
        };
    }
    
    if (analysis.isMonochrome) {
        return {
            mode: CompressionMode.MONOCHROME,
            reason: "Pure black & white detected",
            compressionRatio: 24
        };
    }
    
    // RLE beats grayscale if >3× compression
    if (analysis.rleCompressionRatio > 3 && analysis.rleRuns < 1000) {
        return {
            mode: CompressionMode.RLE,
            reason: `${analysis.rleCompressionRatio.toFixed(1)}× compression (better than grayscale)`,
            compressionRatio: analysis.rleCompressionRatio
        };
    }
    
    if (!analysis.hasColor) {
        return {
            mode: CompressionMode.GRAYSCALE,
            reason: "Grayscale image detected",
            compressionRatio: 3
        };
    }
    
    if (analysis.uniqueColors <= 256) {
        return {
            mode: CompressionMode.INDEXED,
            reason: `Only ${analysis.uniqueColors} colors (fits palette)`,
            compressionRatio: 3
        };
    }
    
    // For photos, suggest RGB565 if acceptable quality loss
    if (analysis.uniqueColors > 5000) {
        return {
            mode: CompressionMode.RGB565,
            reason: "Photo detected - RGB565 gives 1.5× compression with 65K colors",
            compressionRatio: 1.5
        };
    }
    
    return {
        mode: CompressionMode.RGB,
        reason: "Full color image with many unique colors",
        compressionRatio: 1
    };
}

// ============================================================================
// UNIFIED COMPRESSION/DECOMPRESSION
// ============================================================================

export function compress(imageData, width, height, mode) {
    let data;
    let paletteSize = 0;
    
    switch(mode) {
        case CompressionMode.RGB:
            data = compressRGB(imageData, width, height);
            break;
        case CompressionMode.GRAYSCALE:
            data = compressGrayscale(imageData, width, height);
            break;
        case CompressionMode.MONOCHROME:
            data = compressMonochrome(imageData, width, height);
            break;
        case CompressionMode.INDEXED:
            paletteSize = 256;
            data = compressIndexed(imageData, width, height, paletteSize);
            break;
        case CompressionMode.RLE:
            data = compressRLE(imageData, width, height);
            break;
        case CompressionMode.RGB565:
            data = compressRGB565(imageData, width, height);
            break;
        default:
            throw new Error(`Unknown compression mode: ${mode}`);
    }
    
    return { data, paletteSize };
}

export function decompress(data, width, height, mode, paletteSize = 0) {
    switch(mode) {
        case CompressionMode.RGB:
            return decompressRGB(data, width, height);
        case CompressionMode.GRAYSCALE:
            return decompressGrayscale(data, width, height);
        case CompressionMode.MONOCHROME:
            return decompressMonochrome(data, width, height);
        case CompressionMode.INDEXED:
            return decompressIndexed(data, width, height, paletteSize);
        case CompressionMode.RLE:
            return decompressRLE(data, width, height);
        case CompressionMode.RGB565:
            return decompressRGB565(data, width, height);
        default:
            throw new Error(`Unknown compression mode: ${mode}`);
    }
}

export function calculateDimensions(originalWidth, originalHeight, mode) {
    const capacity = getModeCapacity(mode);
    const aspectRatio = originalWidth / originalHeight;
    
    let width = originalWidth;
    let height = originalHeight;
    
    // Scale to fit max dimension
    if (width > capacity.maxDimension || height > capacity.maxDimension) {
        if (aspectRatio > 1) {
            width = capacity.maxDimension;
            height = Math.floor(capacity.maxDimension / aspectRatio);
        } else {
            height = capacity.maxDimension;
            width = Math.floor(capacity.maxDimension * aspectRatio);
        }
    }
    
    // Scale to fit max pixels
    const pixels = width * height;
    if (pixels > capacity.maxPixels) {
        const scale = Math.sqrt(capacity.maxPixels / pixels);
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
    }
    
    // Ensure minimum size
    width = Math.max(1, width);
    height = Math.max(1, height);
    
    return { width, height };
}

