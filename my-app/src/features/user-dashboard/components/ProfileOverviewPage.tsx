import React from 'react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import { CccdVerificationSection } from '../../identity-verification';
import './ProfileOverviewPage.css';

export const ProfileOverviewPage: React.FC = () => {
  const { language } = useThemeLanguage();
  const isEn = language === 'en';

  return (
    <div className="renter-page-wrap">
      <div className="page-header animate-in">
        <div>
          <h1 className="page-title">{isEn ? 'Profile' : 'Hồ sơ cá nhân'}</h1>
          <p className="page-subtitle text-secondary">
            {isEn ? 'Manage your account and identity verification' : 'Quản lý tài khoản và xác thực định danh'}
          </p>
        </div>
      </div>

      <CccdVerificationSection />
    </div>
  );
};
