import React, { useEffect, useRef, useState } from 'react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import type { CccdScanState } from '../types';
import './CccdUploadInput.css';

interface CccdUploadInputProps {
  scanState: CccdScanState;
  onScan: (file: File) => void;
}

export const CccdUploadInput: React.FC<CccdUploadInputProps> = ({ scanState, onScan }) => {
  const { language } = useThemeLanguage();
  const isEn = language === 'en';
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setSelectedFile(file);
  };

  const isScanning = scanState === 'scanning';

  return (
    <div className="cccd-upload-input">
      <label className="cccd-upload-dropzone">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="cccd-upload-hidden-input"
        />
        {previewUrl ? (
          <img src={previewUrl} alt="CCCD preview" className="cccd-upload-preview" />
        ) : (
          <div className="cccd-upload-placeholder">
            <span className="label-caps">{isEn ? 'CHOOSE IMAGE' : 'CHỌN ẢNH'}</span>
            <p className="text-secondary">
              {isEn ? 'Upload the front side of your ID card' : 'Tải lên mặt trước CCCD của bạn'}
            </p>
          </div>
        )}
      </label>

      <button
        type="button"
        className="btn-primary cccd-upload-scan-btn"
        disabled={!selectedFile || isScanning}
        onClick={() => selectedFile && onScan(selectedFile)}
      >
        {isScanning ? (isEn ? 'SCANNING...' : 'ĐANG QUÉT...') : isEn ? 'SCAN QR CODE' : 'QUÉT MÃ QR'}
      </button>
    </div>
  );
};
