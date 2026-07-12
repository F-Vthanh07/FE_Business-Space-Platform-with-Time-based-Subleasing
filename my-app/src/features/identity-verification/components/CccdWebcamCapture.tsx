import React, { useEffect, useRef } from 'react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
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
      </div>
      {statusLabel && <p className="label-caps cccd-webcam-status">{statusLabel}</p>}
      <p className="text-secondary cccd-webcam-hint">
        {isEn
          ? 'Hold your ID card steady in front of the camera. The QR code will be detected automatically.'
          : 'Giữ CCCD ổn định trước camera. Mã QR sẽ được nhận diện tự động.'}
      </p>
    </div>
  );
};
