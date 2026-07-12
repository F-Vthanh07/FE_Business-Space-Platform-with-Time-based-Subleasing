import { useCallback, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { parseCccdQr } from '../utils/parseCccdQr';
import { buildScanTiles, cropToCanvas } from '../utils/scanTiles';
import type { CccdQrData, CccdScanState } from '../types';

const NO_QR_FOUND_MESSAGE = 'Không tìm thấy mã QR trong ảnh, vui lòng thử ảnh rõ nét hơn.';
const CAMERA_DENIED_MESSAGE = 'Quyền camera bị từ chối. Vui lòng chuyển sang tải ảnh lên.';
const CAMERA_UNAVAILABLE_MESSAGE = 'Không thể mở camera. Vui lòng chuyển sang tải ảnh lên.';
const TILE_UPSCALE_TARGET = 900;
const WEBCAM_SCAN_INTERVAL_MS = 200;

const qrCodeReader = new BrowserQRCodeReader();

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Không thể tải ảnh.'));
    img.src = url;
  });
}

function tryDecodeTiles(
  source: CanvasImageSource,
  width: number,
  height: number,
  maxTiles?: number
): string | null {
  const tiles = buildScanTiles(width, height);
  const tilesToTry = maxTiles ? tiles.slice(0, maxTiles) : tiles;
  for (const tile of tilesToTry) {
    const canvas = cropToCanvas(source, tile, TILE_UPSCALE_TARGET);
    try {
      const result = qrCodeReader.decodeFromCanvas(canvas);
      return result.getText();
    } catch {
      // thử tile tiếp theo
    }
  }
  return null;
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
    setState('requesting-camera');
    setError(null);
    setData(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      webcamStreamRef.current = stream;
      videoEl.srcObject = stream;
      await videoEl.play();
      setState('scanning');

      let tick = 0;
      webcamTimerRef.current = setInterval(() => {
        if (videoEl.videoWidth === 0 || videoEl.videoHeight === 0) return;
        tick += 1;
        // Ưu tiên tile góc trên-phải (đa số các lần quét) để giữ tốc độ cao;
        // mỗi vài tick thử thêm các tile còn lại để không bỏ sót vị trí khác.
        const maxTiles = tick % 4 === 0 ? undefined : 1;
        const text = tryDecodeTiles(videoEl, videoEl.videoWidth, videoEl.videoHeight, maxTiles);
        if (text) {
          const succeeded = applyParseResult(text);
          if (succeeded) {
            stopWebcamScan();
          }
        }
      }, WEBCAM_SCAN_INTERVAL_MS);
    } catch (err) {
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
