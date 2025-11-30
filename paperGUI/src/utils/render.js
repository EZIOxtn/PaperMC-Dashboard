/**
 * Renders the front face of a Minecraft skin from a URL.
 *
 * @param {string} skinSource - URL to the skin PNG.
 * @param {number} [scale=8] - Scaling factor (e.g., 8 means 8x8 pixels become 64x64).
 * @param {boolean} [overlay=true] - Whether to render the overlay (hat layer).
 * @returns {Promise<string>} A Promise that resolves to a Data URL (Base64 string) of the rendered face.
 */
async function renderFaceJS(skinSource, scale = 8, overlay = true) {
    // 1. Load skin from URL (similar to requests)
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Necessary for fetching images from other domains

    // Wait for the image to load
    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = skinSource;
    });

    const skinCanvas = document.createElement('canvas');
    skinCanvas.width = img.width;
    skinCanvas.height = img.height;
    const skinCtx = skinCanvas.getContext('2d');
    skinCtx.drawImage(img, 0, 0);

    // Minecraft head texture coordinates
    const HEAD_X = 8;
    const HEAD_Y = 8;
    const LAYER_WIDTH = 8;
    const LAYER_HEIGHT = 8;

    // Output dimensions after scaling
    const finalWidth = LAYER_WIDTH * scale;
    const finalHeight = LAYER_HEIGHT * scale;

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = finalWidth;
    finalCanvas.height = finalHeight;
    const finalCtx = finalCanvas.getContext('2d');
    
    // Set interpolation mode to 'nearest' for pixelated scaling (Image.NEAREST in PIL)
    finalCtx.imageSmoothingEnabled = false; 

    // 2. Extract and Scale Head Front (8,8)-(16,16)
    // drawImage(sourceImage, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
    // sx, sy, sWidth, sHeight: Source (skin) crop area
    // dx, dy, dWidth, dHeight: Destination (final canvas) draw area
    finalCtx.drawImage(
        img,
        HEAD_X, HEAD_Y, LAYER_WIDTH, LAYER_HEIGHT, // Source: Head base
        0, 0, finalWidth, finalHeight              // Destination: Full scaled canvas
    );

    // 3. Extract and Scale Overlay (Hat) (40,8)-(48,16)
    if (overlay) {
        const OVERLAY_X = 40;
        const OVERLAY_Y = 8;

        finalCtx.drawImage(
            img,
            OVERLAY_X, OVERLAY_Y, LAYER_WIDTH, LAYER_HEIGHT, // Source: Hat overlay
            0, 0, finalWidth, finalHeight                    // Destination: Full scaled canvas
        );
    }

    // 4. Return result as Data URL (used in JSX component)
    return finalCanvas.toDataURL('image/png');
}