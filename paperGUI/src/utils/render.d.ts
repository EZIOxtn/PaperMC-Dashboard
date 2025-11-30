/**
 * Renders the front face of a Minecraft skin from a URL.
 * * @param skinSource - URL to the skin PNG.
 * @param scale - Scaling factor.
 * @param overlay - Whether to render the overlay (hat layer).
 * @returns A Promise that resolves to a Data URL (Base64 string) of the rendered face.
 */
export declare function renderFaceJS(
  skinSource: string, 
  scale?: number, 
  overlay?: boolean
): Promise<string>;