import React, { useEffect, useState } from 'react';
import { FileText, Megaphone, Clock, Inbox } from 'lucide-react';
import { fetchPriorityLevels, fetchBannerPriorityLevels, type PriorityLevel } from '../Listing/priorityLevel.api';
import { useThemeLanguage } from '../../../../context/ThemeLanguageContext';
import './PricingPlansPage.css';

type PackageTab = 'Listing' | 'Banner';

export const PricingPlansPage: React.FC = () => {
  const { language } = useThemeLanguage();
  const isEn = language === 'en';

  const [activeTab, setActiveTab] = useState<PackageTab>('Listing');
  const [listingPackages, setListingPackages] = useState<PriorityLevel[]>([]);
  const [bannerPackages, setBannerPackages] = useState<PriorityLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchPriorityLevels(), fetchBannerPriorityLevels()])
      .then(([listing, banner]) => {
        if (cancelled) return;
        setListingPackages(listing);
        setBannerPackages(banner);
      })
      .catch(() => {
        if (!cancelled) setError(isEn ? 'Failed to load packages. Please try again.' : 'Không thể tải danh sách gói. Vui lòng thử lại.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activePackages = activeTab === 'Listing' ? listingPackages : bannerPackages;

  const formatDuration = (pkg: PriorityLevel) => {
    const days = activeTab === 'Listing' ? pkg.durationInDays : (pkg.durationForBanner ?? pkg.durationInDays);
    if (!days) return isEn ? 'No fixed duration' : 'Không giới hạn thời hạn';
    return isEn ? `${days} days` : `${days} ngày`;
  };

  return (
    <div className="pricing-page">
      <div className="pricing-page-header">
        <div>
          <h1 className="pricing-page-title">{isEn ? 'Listing Packages' : 'Các gói bài đăng'}</h1>
          <p className="pricing-page-subtitle">
            {isEn
              ? 'Compare all available packages for listings and promotional banners.'
              : 'So sánh tất cả các gói dành cho bài đăng và banner quảng cáo.'}
          </p>
        </div>
      </div>

      <div className="pricing-tabs">
        <button
          className={`pricing-tab ${activeTab === 'Listing' ? 'pricing-tab--active' : ''}`}
          onClick={() => setActiveTab('Listing')}
        >
          <FileText size={14} />
          {isEn ? 'Listing Packages' : 'Gói bài đăng'}
          <span className="pricing-tab-count">{listingPackages.length}</span>
        </button>
        <button
          className={`pricing-tab ${activeTab === 'Banner' ? 'pricing-tab--active' : ''}`}
          onClick={() => setActiveTab('Banner')}
        >
          <Megaphone size={14} />
          {isEn ? 'Banner Packages' : 'Gói banner'}
          <span className="pricing-tab-count">{bannerPackages.length}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="pricing-empty-state">
          <p className="pricing-empty-state-desc">{isEn ? 'Loading packages...' : 'Đang tải danh sách gói...'}</p>
        </div>
      ) : error ? (
        <div className="pricing-empty-state">
          <p className="pricing-empty-state-error">{error}</p>
        </div>
      ) : activePackages.length === 0 ? (
        <div className="pricing-empty-state">
          <div className="pricing-empty-state-icon">
            <Inbox size={22} />
          </div>
          <h3 className="pricing-empty-state-title">
            {isEn ? 'No packages available' : 'Chưa có gói nào khả dụng'}
          </h3>
          <p className="pricing-empty-state-desc">
            {isEn ? 'Please check back later.' : 'Vui lòng quay lại sau.'}
          </p>
        </div>
      ) : (
        <div className="pricing-grid">
          {activePackages.map((pkg) => {
            const durationDays = activeTab === 'Listing' ? pkg.durationInDays : (pkg.durationForBanner ?? pkg.durationInDays);
            let tabLabel: string;
            if (activeTab === 'Listing') tabLabel = isEn ? 'Listing' : 'Gói bài đăng';
            else tabLabel = isEn ? 'Banner' : 'Gói banner';

            return (
              <div key={pkg.id} className="pricing-card">
                <div className="pricing-card-head">
                  <span className="pricing-badge">
                    {activeTab === 'Listing' ? <FileText size={11} /> : <Megaphone size={11} />}
                    {tabLabel}
                  </span>
                  {!pkg.isActive && (
                    <span className="pricing-badge pricing-badge--inactive">{isEn ? 'Inactive' : 'Ngừng hoạt động'}</span>
                  )}
                </div>

                <h3 className="pricing-card-name">{pkg.name}</h3>

                {pkg.description && (
                  <p className="pricing-card-desc">{pkg.description}</p>
                )}

                <div className="pricing-card-price">
                  {pkg.price.toLocaleString('vi-VN')} <span className="pricing-card-price-unit">VNĐ</span>
                </div>

                {durationDays ? (
                  <div className="pricing-card-meta">
                    <Clock size={12} />
                    {formatDuration(pkg)}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
