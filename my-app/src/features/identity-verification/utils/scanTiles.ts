export interface TileRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Sinh danh sách vùng crop (tile) để quét theo lưới, ưu tiên góc trên-phải
 * trước tiên vì CCCD gắn chip Việt Nam luôn đặt QR ở góc đó. Mỗi tile được
 * crop từ ảnh gốc (không downscale toàn ảnh) nên giữ được độ chi tiết của
 * QR dù nó chỉ chiếm một phần nhỏ diện tích ảnh.
 */
export function buildScanTiles(sourceWidth: number, sourceHeight: number): TileRegion[] {
  const tileW = Math.round(sourceWidth * 0.45);
  const tileH = Math.round(sourceHeight * 0.45);

  const topRight: TileRegion = { x: sourceWidth - tileW, y: 0, width: tileW, height: tileH };
  const topLeft: TileRegion = { x: 0, y: 0, width: tileW, height: tileH };
  const bottomRight: TileRegion = { x: sourceWidth - tileW, y: sourceHeight - tileH, width: tileW, height: tileH };
  const bottomLeft: TileRegion = { x: 0, y: sourceHeight - tileH, width: tileW, height: tileH };
  const full: TileRegion = { x: 0, y: 0, width: sourceWidth, height: sourceHeight };

  return [topRight, topLeft, bottomRight, bottomLeft, full];
}

export function cropToCanvas(
  source: CanvasImageSource,
  region: TileRegion,
  upscaleTo?: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const scale = upscaleTo ? Math.max(1, upscaleTo / Math.min(region.width, region.height)) : 1;
  canvas.width = Math.round(region.width * scale);
  canvas.height = Math.round(region.height * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không thể xử lý ảnh.');

  ctx.drawImage(
    source,
    region.x,
    region.y,
    region.width,
    region.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas;
}

export function getCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không thể xử lý ảnh.');
  return ctx;
}
