import React, { useEffect, useRef } from 'react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import { WEBCAM_ROI } from '../hooks/useCccdScanner';
import type { CccdScanState } from '../types';
import './CccdWebcamCapture.css';

interface CccdWebcamCaptureProps {
  scanState: CccdScanState;
  onStart: (videoEl: HTMLVideoElement) => void;
  onStop: () => void;
}

export const CccdWebcamCapture: React.FC<CccdWebcamCaptureProps> = ({ scanState, onStart, onStop }) => {
  const { language } = useThemeLanguage();
  const isEn = language === 'en';
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      onStart(videoRef.current);
    }
    return () => {
      onStop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusLabel = (() => {
    switch (scanState) {
      case 'requesting-camera':
        return isEn ? '[OPENING CAMERA...]' : '[ĐANG MỞ CAMERA...]';
      case 'scanning':
        return isEn ? '[SCANNING...]' : '[ĐANG QUÉT...]';
      case 'error':
        return isEn ? '[CAMERA UNAVAILABLE]' : '[QUYỀN CAMERA BỊ TỪ CHỐI]';
      default:
        return '';
    }
  })();

  return (
    <div className="cccd-webcam-capture">
      <div className="cccd-webcam-video-wrap">
        <video ref={videoRef} className="cccd-webcam-video" muted playsInline />
        <div
          className="cccd-webcam-roi"
          style={{
            left: `${WEBCAM_ROI.xRatio * 100}%`,
            top: `${WEBCAM_ROI.yRatio * 100}%`,
            width: `${WEBCAM_ROI.widthRatio * 100}%`,
            height: `${WEBCAM_ROI.heightRatio * 100}%`,
          }}
        />
      </div>
      {statusLabel && <p className="label-caps cccd-webcam-status">{statusLabel}</p>}
      <p className="text-secondary cccd-webcam-hint">
        {isEn
          ? 'Align the QR code inside the frame. It will be detected automatically.'
          : 'Đưa mã QR vào giữa khung. Hệ thống sẽ tự động nhận diện.'}
      </p>
      <ul className="cccd-webcam-tips text-secondary">
        <li>
          {isEn
            ? 'Hold the card straight-on and steady — avoid tilting or blur.'
            : 'Giữ CCCD thẳng góc và ổn định, tránh bị xéo hoặc rung mờ.'}
        </li>
        <li>
          {isEn
            ? 'Use good, even lighting with no glare on the card surface.'
            : 'Chụp ở nơi đủ sáng, tránh ánh sáng chói làm lóa mặt thẻ.'}
        </li>
      </ul>
    </div>
  );
};
