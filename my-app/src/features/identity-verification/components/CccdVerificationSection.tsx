import React, { useState } from 'react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import { useCccdScanner } from '../hooks/useCccdScanner';
import { CccdUploadInput } from './CccdUploadInput';
import { CccdWebcamCapture } from './CccdWebcamCapture';
import type { CccdInputSource, CccdVerificationStatus } from '../types';
import './CccdVerificationSection.css';

const statusLabel = (status: CccdVerificationStatus, isEn: boolean): string => {
  switch (status) {
    case 'verified':
      return isEn ? '[VERIFIED]' : '[ĐÃ XÁC THỰC]';
    case 'pending':
      return isEn ? '[PENDING]' : '[ĐANG CHỜ XÁC THỰC]';
    default:
      return isEn ? '[UNVERIFIED]' : '[CHƯA XÁC THỰC]';
  }
};

export const CccdVerificationSection: React.FC = () => {
  const { language } = useThemeLanguage();
  const isEn = language === 'en';
  const scanner = useCccdScanner();
  const [source, setSource] = useState<CccdInputSource>('upload');
  const [verificationStatus, setVerificationStatus] = useState<CccdVerificationStatus>('unverified');

  const handleSelectSource = (next: CccdInputSource) => {
    if (next === source) return;
    scanner.reset();
    setSource(next);
  };

  const handleConfirm = () => {
    if (!scanner.data) return;
    // TODO: nối API xác thực định danh khi BE cung cấp endpoint
    console.log(scanner.data);
    setVerificationStatus('pending');
  };

  const fieldRows: Array<[string, string]> = scanner.data
    ? [
        [isEn ? 'ID Number' : 'Số CCCD', scanner.data.idNumber],
        [isEn ? 'Full Name' : 'Họ và tên', scanner.data.fullName],
        [isEn ? 'Date of Birth' : 'Ngày sinh', scanner.data.dateOfBirthIso],
        [isEn ? 'Gender' : 'Giới tính', scanner.data.gender],
        [isEn ? 'Permanent Address' : 'Nơi thường trú', scanner.data.permanentAddress],
        [isEn ? 'Issue Date' : 'Ngày cấp', scanner.data.issueDateIso],
      ]
    : [];

  return (
    <div className="glass-card cccd-verification-section">
      <div className="cccd-verification-header">
        <div>
          <h3 className="form-section-title">{isEn ? 'Identity Verification' : 'Xác thực định danh'}</h3>
          <p className="text-secondary">
            {isEn
              ? 'Scan the QR code on your ID card to auto-fill your identity information.'
              : 'Quét mã QR trên CCCD để tự động điền thông tin định danh của bạn.'}
          </p>
        </div>
        <span className="label-caps cccd-verification-status">{statusLabel(verificationStatus, isEn)}</span>
      </div>

      {scanner.state !== 'success' && (
        <>
          <div className="cccd-source-toggle">
            <button
              type="button"
              className={`cccd-source-toggle-btn ${source === 'upload' ? 'cccd-source-toggle-btn--active' : ''}`}
              onClick={() => handleSelectSource('upload')}
            >
              {isEn ? 'UPLOAD IMAGE' : 'UPLOAD ẢNH'}
            </button>
            <button
              type="button"
              className={`cccd-source-toggle-btn ${source === 'webcam' ? 'cccd-source-toggle-btn--active' : ''}`}
              onClick={() => handleSelectSource('webcam')}
            >
              {isEn ? 'USE CAMERA' : 'CHỤP ẢNH'}
            </button>
          </div>

          {source === 'upload' ? (
            <CccdUploadInput scanState={scanner.state} onScan={scanner.scanFile} />
          ) : (
            <CccdWebcamCapture
              scanState={scanner.state}
              onStart={scanner.startWebcamScan}
              onStop={scanner.stopWebcamScan}
            />
          )}

          {scanner.state === 'error' && scanner.error && (
            <p className="cccd-verification-error">{scanner.error}</p>
          )}
        </>
      )}

      {scanner.state === 'success' && scanner.data && (
        <div className="cccd-review">
          <table className="cccd-review-table">
            <tbody>
              {fieldRows.map(([label, value]) => (
                <tr key={label}>
                  <td className="text-secondary">{label}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="cccd-review-actions">
            <button type="button" className="btn-primary" onClick={handleConfirm}>
              {isEn ? 'CONFIRM INFORMATION' : 'XÁC NHẬN THÔNG TIN'}
            </button>
            <button type="button" className="cccd-review-rescan-btn" onClick={scanner.reset}>
              {isEn ? 'SCAN AGAIN' : 'QUÉT LẠI'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
