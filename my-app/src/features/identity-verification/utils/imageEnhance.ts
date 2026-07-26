import { getCanvasContext } from './scanTiles';

/**
 * Box blur 3x3 trên kênh xám dùng làm bước khử nhiễu hạt (grain) trước khi
 * threshold — nhiễu hạt tạo ra các đốm sáng/tối lẻ tẻ khiến Sauvola threshold
 * tính sai mean/stddev cục bộ. Làm mịn nhẹ trước giúp threshold ổn định hơn
 * mà không xoá mất biên QR (module QR luôn lớn hơn nhiều so với 1 pixel sau
 * khi đã upscale lên ~900px).
 */
function boxBlur(data: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const idx = (ny * width + nx) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          count += 1;
        }
      }
      const idx = (y * width + x) * 4;
      out[idx] = r / count;
      out[idx + 1] = g / count;
      out[idx + 2] = b / count;
      out[idx + 3] = data[idx + 3];
    }
  }
  return out;
}

/** Khử nhiễu hạt bằng box blur 3x3, giữ nguyên ImageData gốc. */
export function denoise(imageData: ImageData): ImageData {
  const blurred = boxBlur(imageData.data, imageData.width, imageData.height, 1);
  const out = new ImageData(imageData.width, imageData.height);
  out.data.set(blurred);
  return out;
}

/**
 * Unsharp mask: ảnh_kết_quả = ảnh_gốc + amount * (ảnh_gốc - ảnh_làm_mờ).
 * Đây là kỹ thuật làm nét chuẩn — khôi phục lại cạnh sắc nét của module QR
 * bị mất do out-of-focus/rung tay khi chụp, mà không khuếch đại nhiễu nền
 * nhiều như high-pass filter thuần. radius quyết định "ảnh làm mờ tham chiếu"
 * rộng bao nhiêu — cần lớn hơn hoặc bằng độ mờ thực tế của ảnh gốc để bắt
 * được đúng dải tần số đã mất; radius=1 (3x3) chỉ đủ cho mờ nhẹ, radius=2-3
 * (5x5-7x7) cần cho ảnh mờ nặng do out-of-focus.
 */
export function sharpen(imageData: ImageData, amount = 1.6, radius = 2): ImageData {
  const { data, width, height } = imageData;
  const blurred = boxBlur(data, width, height, radius);
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    out[i] = data[i] + amount * (data[i] - blurred[i]);
    out[i + 1] = data[i + 1] + amount * (data[i + 1] - blurred[i + 1]);
    out[i + 2] = data[i + 2] + amount * (data[i + 2] - blurred[i + 2]);
    out[i + 3] = data[i + 3];
  }
  const result = new ImageData(width, height);
  result.data.set(out);
  return result;
}

/**
 * Xoay canvas quanh tâm một góc (độ), nền căn trắng để không tạo viền đen
 * làm ZXing nhầm là module QR. Dùng để bù nghiêng khi người dùng chụp CCCD
 * lệch góc — ZXing tự xử lý được nghiêng nhẹ nhưng không ổn định quá ~20°.
 */
export function rotateCanvas(source: HTMLCanvasElement, degrees: number): HTMLCanvasElement {
  const rad = (degrees * Math.PI) / 180;
  const w = source.width;
  const h = source.height;
  const newW = Math.ceil(Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad)));
  const newH = Math.ceil(Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad)));

  const out = document.createElement('canvas');
  out.width = newW;
  out.height = newH;
  const ctx = getCanvasContext(out);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, newW, newH);
  ctx.translate(newW / 2, newH / 2);
  ctx.rotate(rad);
  ctx.drawImage(source, -w / 2, -h / 2);
  return out;
}

/** Góc bù nghiêng thử lần lượt khi decode thẳng đều thất bại. */
export const ROTATION_FALLBACK_DEGREES = [-30, -15, 15, 30];
