import { useCallback, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { parseCccdQr } from '../utils/parseCccdQr';
import { buildScanTiles, cropToCanvas, getCanvasContext } from '../utils/scanTiles';
import { adaptiveThreshold } from '../utils/adaptiveThreshold';
import type { CccdQrData, CccdScanState } from '../types';

const NO_QR_FOUND_MESSAGE = 'Không tìm thấy mã QR trong ảnh, vui lòng thử ảnh rõ nét hơn.';
const CAMERA_DENIED_MESSAGE = 'Quyền camera bị từ chối. Vui lòng chuyển sang tải ảnh lên.';
const CAMERA_UNAVAILABLE_MESSAGE = 'Không thể mở camera. Vui lòng chuyển sang tải ảnh lên.';
const TILE_UPSCALE_TARGET = 900;
const ROI_UPSCALE_TARGET = 700;
const WEBCAM_SCAN_INTERVAL_MS = 150;

const qrCodeReader = new BrowserQRCodeReader();

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Không thể tải ảnh.'));
    img.src = url;
  });
}

function decodeCanvas(canvas: HTMLCanvasElement): string | null {
  try {
    return qrCodeReader.decodeFromCanvas(canvas).getText();
  } catch {
    return null;
  }
}

function decodeCanvasWithThreshold(canvas: HTMLCanvasElement, allowThreshold: boolean): string | null {
  const direct = decodeCanvas(canvas);
  if (direct || !allowThreshold) return direct;

  const ctx = getCanvasContext(canvas);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  ctx.putImageData(adaptiveThreshold(imageData), 0, 0);
  return decodeCanvas(canvas);
}

function tryDecodeTiles(source: CanvasImageSource, width: number, height: number): string | null {
  const tiles = buildScanTiles(width, height);
  for (const tile of tiles) {
    const canvas = cropToCanvas(source, tile, TILE_UPSCALE_TARGET);
    const text = decodeCanvasWithThreshold(canvas, true);
    if (text) return text;
  }
  return null;
}

export interface RoiRegion {
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
}

/** Vùng khung ROI gợi ý ở giữa khung hình webcam (tỉ lệ 0-1 so với video). */
export const WEBCAM_ROI: RoiRegion = { xRatio: 0.22, yRatio: 0.22, widthRatio: 0.56, heightRatio: 0.56 };

function decodeRoi(videoEl: HTMLVideoElement, roi: RoiRegion, allowThreshold: boolean): string | null {
  const region = {
    x: Math.round(videoEl.videoWidth * roi.xRatio),
    y: Math.round(videoEl.videoHeight * roi.yRatio),
    width: Math.round(videoEl.videoWidth * roi.widthRatio),
    height: Math.round(videoEl.videoHeight * roi.heightRatio),
  };
  const canvas = cropToCanvas(videoEl, region, ROI_UPSCALE_TARGET);
  return decodeCanvasWithThreshold(canvas, allowThreshold);
}

interface UseCccdScannerReturn {
  state: CccdScanState;
  data: CccdQrData | null;
  error: string | null;
  scanFile: (file: File) => Promise<void>;
  startWebcamScan: (videoEl: HTMLVideoElement) => Promise<void>;
  stopWebcamScan: () => void;
  reset: () => void;
}

export function useCccdScanner(): UseCccdScannerReturn {
  const [state, setState] = useState<CccdScanState>('idle');
  const [data, setData] = useState<CccdQrData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const webcamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const webcamSessionRef = useRef(0);

  const applyParseResult = useCallback((rawText: string) => {
    // eslint-disable-next-line no-console
    console.log('[CCCD] Raw QR text:', rawText);
    const result = parseCccdQr(rawText);
    if (result.success) {
      setData(result.data);
      setState('success');
      return true;
    }
    // eslint-disable-next-line no-console
    console.log('[CCCD] Parse error:', result.error);
    setError(result.error.message);
    setState('error');
    return false;
  }, []);

  const scanFile = useCallback(async (file: File) => {
    setState('scanning');
    setError(null);
    setData(null);
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await loadImage(objectUrl);
      const text = tryDecodeTiles(img, img.naturalWidth, img.naturalHeight);
      if (text) {
        applyParseResult(text);
      } else {
        setError(NO_QR_FOUND_MESSAGE);
        setState('error');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('[CCCD] scanFile failed:', err);
      setError(NO_QR_FOUND_MESSAGE);
      setState('error');
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }, [applyParseResult]);

  const stopWebcamScan = useCallback(() => {
    // Vô hiệu hoá bất kỳ lần startWebcamScan nào đang chờ getUserMedia resolve,
    // để nó không ghi đè state/stream sau khi phiên này đã bị dừng (quan trọng
    // với React StrictMode: effect mount -> cleanup -> mount lại rất nhanh
    // trong dev, có thể khiến lệnh getUserMedia cũ resolve muộn sau khi đã stop).
    webcamSessionRef.current += 1;

    if (webcamTimerRef.current !== null) {
      clearInterval(webcamTimerRef.current);
      webcamTimerRef.current = null;
    }
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
    }
  }, []);

  const startWebcamScan = useCallback(async (videoEl: HTMLVideoElement) => {
    const session = ++webcamSessionRef.current;
    setState('requesting-camera');
    setError(null);
    setData(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (session !== webcamSessionRef.current) {
        // Phiên này đã bị stop/thay thế trong lúc chờ quyền camera — bỏ stream vừa xin.
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      webcamStreamRef.current = stream;
      videoEl.srcObject = stream;
      await videoEl.play();

      if (session !== webcamSessionRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      setState('scanning');

      // Chỉ decode đúng vùng khung ROI hiển thị cho người dùng — nhanh hơn hẳn
      // so với quét nhiều tile trên toàn bộ khung hình, vì người dùng đã tự
      // canh QR vào khung nên không cần dò các vị trí khác. adaptiveThreshold
      // khá tốn (~35ms) nên chỉ bật mỗi 2 tick khi decode trực tiếp thất bại,
      // tránh dồn chi phí vào mọi tick và làm giật vòng lặp quét.
      let tick = 0;
      webcamTimerRef.current = setInterval(() => {
        if (videoEl.videoWidth === 0 || videoEl.videoHeight === 0) return;
        tick += 1;
        const allowThreshold = tick % 2 === 0;
        const text = decodeRoi(videoEl, WEBCAM_ROI, allowThreshold);
        if (text) {
          const succeeded = applyParseResult(text);
          if (succeeded) {
            stopWebcamScan();
          }
        }
      }, WEBCAM_SCAN_INTERVAL_MS);
    } catch (err) {
      if (session !== webcamSessionRef.current) return;
      const name = err instanceof Error ? err.name : '';
      setError(name === 'NotAllowedError' ? CAMERA_DENIED_MESSAGE : CAMERA_UNAVAILABLE_MESSAGE);
      setState('error');
      stopWebcamScan();
    }
  }, [applyParseResult, stopWebcamScan]);

  const reset = useCallback(() => {
    stopWebcamScan();
    setState('idle');
    setData(null);
    setError(null);
  }, [stopWebcamScan]);

  return { state, data, error, scanFile, startWebcamScan, stopWebcamScan, reset };
}
