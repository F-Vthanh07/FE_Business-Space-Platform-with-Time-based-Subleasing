import React, { useState } from 'react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import { useCccdScanner } from '../hooks/useCccdScanner';
import { CccdUploadInput } from './CccdUploadInput';
import { CccdWebcamCapture } from './CccdWebcamCapture';
import { useIdentityVerification } from '../hooks/useIdentityVerification';
import { verifyIdentity } from '../api/identityVerification.api';
import type { CccdInputSource, CccdQrData } from '../types';
import './CccdVerificationSection.css';

const statusLabel = (isVerified: boolean, isEn: boolean): string => {
  if (isVerified) return isEn ? '[VERIFIED]' : '[ĐÃ XÁC THỰC]';
  return isEn ? '[UNVERIFIED]' : '[CHƯA XÁC THỰC]';
};

interface CccdVerificationSectionProps {
  onConfirm?: (data: CccdQrData) => void;
}

export const CccdVerificationSection: React.FC<CccdVerificationSectionProps> = ({ onConfirm }) => {
  const { language } = useThemeLanguage();
  const isEn = language === 'en';
  const scanner = useCccdScanner();
  const [source, setSource] = useState<CccdInputSource>('upload');
  const { isVerified, refetch } = useIdentityVerification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSelectSource = (next: CccdInputSource) => {
    if (next === source) return;
    scanner.reset();
    setSource(next);
  };

  const handleConfirm = async () => {
    if (!scanner.data) return;
    setSubmitError('');
    setIsSubmitting(true);
    try {
      const userId = localStorage.getItem('current_user_id') || '';
      const token = localStorage.getItem('portal_token') || '';
      await verifyIdentity(userId, scanner.data, token);
      await refetch();
      onConfirm?.(scanner.data);
    } catch (err) {
      const fallbackMessage = isEn ? 'Verification failed. Please try again.' : 'Xác thực thất bại. Vui lòng thử lại.';
      setSubmitError(err instanceof Error ? err.message : fallbackMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmBtnLabel = isSubmitting
    ? (isEn ? 'VERIFYING...' : 'ĐANG XÁC THỰC...')
    : (isEn ? 'CONFIRM INFORMATION' : 'XÁC NHẬN THÔNG TIN');

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
        <span
          className={`label-caps cccd-verification-status ${isVerified ? 'cccd-verification-status--verified' : ''}`}
        >
          {statusLabel(isVerified, isEn)}
        </span>
      </div>

      {isVerified ? (
        <p className="text-secondary" style={{ padding: '8px 0' }}>
          {isEn
            ? 'Your identity has already been verified.'
            : 'Định danh của bạn đã được xác thực.'}
        </p>
      ) : (
        <>
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
        </>
      )}

      {!isVerified && scanner.state === 'success' && scanner.data && (
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
          {submitError && <p className="cccd-verification-error">{submitError}</p>}
          <div className="cccd-review-actions">
            <button type="button" className="btn-primary" onClick={handleConfirm} disabled={isSubmitting}>
              {confirmBtnLabel}
            </button>
            <button type="button" className="cccd-review-rescan-btn" onClick={scanner.reset} disabled={isSubmitting}>
              {isEn ? 'SCAN AGAIN' : 'QUÉT LẠI'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
