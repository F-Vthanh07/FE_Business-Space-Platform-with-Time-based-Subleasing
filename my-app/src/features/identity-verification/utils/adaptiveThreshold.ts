const WINDOW_SIZE = 15;
const SAUVOLA_K = 0.34;
const SAUVOLA_R = 128;

function toGrayscale(imageData: ImageData): Float32Array {
  const { data, width, height } = imageData;
  const gray = new Float32Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return gray;
}

/**
 * Integral image (summed-area table) và bình phương của nó, cho phép tính
 * mean/stddev của bất kỳ vùng chữ nhật nào trong O(1) — kỹ thuật chuẩn để
 * làm adaptive thresholding nhanh trên ảnh lớn/video real-time.
 */
function buildIntegralTables(gray: Float32Array, width: number, height: number) {
  const sum = new Float64Array((width + 1) * (height + 1));
  const sumSq = new Float64Array((width + 1) * (height + 1));
  const stride = width + 1;

  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    let rowSumSq = 0;
    for (let x = 0; x < width; x++) {
      const v = gray[y * width + x];
      rowSum += v;
      rowSumSq += v * v;
      const idx = (y + 1) * stride + (x + 1);
      sum[idx] = sum[idx - stride] + rowSum;
      sumSq[idx] = sumSq[idx - stride] + rowSumSq;
    }
  }

  return { sum, sumSq, stride };
}

/**
 * Adaptive (local) thresholding kiểu Sauvola: mỗi pixel được nhị phân hoá
 * dựa trên mean và độ lệch chuẩn của vùng lân cận thay vì một ngưỡng chung
 * cho toàn ảnh — xử lý tốt ánh sáng không đều, bóng đổ, hoạ tiết nền mờ
 * (như hoạ tiết bản đồ trên CCCD) mà global contrast-stretch không xử lý được.
 * Đây là kỹ thuật được các thư viện quét mã vạch/QR công nghiệp (ZXing, ZBar)
 * dùng nội bộ.
 */
export function adaptiveThreshold(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  const gray = toGrayscale(imageData);
  const { sum, sumSq, stride } = buildIntegralTables(gray, width, height);
  const half = Math.floor(WINDOW_SIZE / 2);

  const regionStats = (cx: number, cy: number) => {
    const x0 = Math.max(0, cx - half);
    const y0 = Math.max(0, cy - half);
    const x1 = Math.min(width - 1, cx + half);
    const y1 = Math.min(height - 1, cy + half);
    const count = (x1 - x0 + 1) * (y1 - y0 + 1);

    const s = sum[(y1 + 1) * stride + (x1 + 1)] - sum[y0 * stride + (x1 + 1)] - sum[(y1 + 1) * stride + x0] + sum[y0 * stride + x0];
    const sq = sumSq[(y1 + 1) * stride + (x1 + 1)] - sumSq[y0 * stride + (x1 + 1)] - sumSq[(y1 + 1) * stride + x0] + sumSq[y0 * stride + x0];

    const mean = s / count;
    const variance = Math.max(0, sq / count - mean * mean);
    return { mean, stddev: Math.sqrt(variance) };
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const { mean, stddev } = regionStats(x, y);
      const threshold = mean * (1 + SAUVOLA_K * (stddev / SAUVOLA_R - 1));
      const p = y * width + x;
      const value = gray[p] > threshold ? 255 : 0;
      const idx = p * 4;
      data[idx] = value;
      data[idx + 1] = value;
      data[idx + 2] = value;
    }
  }

  return imageData;
}
