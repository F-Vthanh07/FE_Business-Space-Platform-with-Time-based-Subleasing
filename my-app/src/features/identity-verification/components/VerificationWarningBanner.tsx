import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import './VerificationWarningBanner.css';

interface VerificationWarningBannerProps {
  onVerifyClick?: () => void;
}

export const VerificationWarningBanner: React.FC<VerificationWarningBannerProps> = ({ onVerifyClick }) => {
  const { language } = useThemeLanguage();
  const isEn = language === 'en';

  return (
    <div className="warning-banner">
      <AlertTriangle size={16} className="warning-banner-icon" />
      <span className="warning-banner-text">
        {isEn
          ? "You haven't verified your identity yet. Verification is required to sign a contract."
          : 'Bạn chưa xác thực định danh. Cần xác thực để ký kết hợp đồng.'}
      </span>
      {onVerifyClick && (
        <button type="button" className="warning-banner-action" onClick={onVerifyClick}>
          {isEn ? 'Verify now' : 'Xác thực ngay'}
        </button>
      )}
    </div>
  );
};
