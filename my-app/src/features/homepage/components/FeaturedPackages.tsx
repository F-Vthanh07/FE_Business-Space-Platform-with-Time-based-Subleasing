import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, ArrowRight } from 'lucide-react';
import { fetchPriorityLevels, type PriorityLevel } from '../../user-dashboard/components/Listing/priorityLevel.api';
import './FeaturedPackages.css';

const MAX_FEATURED = 3;

export const FeaturedPackages: React.FC = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<PriorityLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPriorityLevels()
      .then((data) => {
        if (!cancelled) setPackages(data.slice(0, MAX_FEATURED));
      })
      .catch(() => {
        if (!cancelled) setPackages([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (!isLoading && packages.length === 0) return null;

  return (
    <section className="packages-section reveal-on-scroll">
      <div className="packages-container">
        <div className="packages-header">
          <div>
            <h2 className="packages-title">Các Gói Bài Đăng Nổi Bật</h2>
            <p className="packages-subtitle">
              Chọn gói phù hợp để bài đăng của bạn tiếp cận nhiều khách hàng hơn.
            </p>
          </div>
          <button className="packages-viewall-btn" onClick={() => navigate('/user/pricing-plans')}>
            Xem tất cả các gói <ArrowRight size={14} />
          </button>
        </div>

        <div className="packages-grid">
          {isLoading
            ? Array.from({ length: MAX_FEATURED }).map((_, i) => (
                <div key={i} className="package-card package-card--skeleton" />
              ))
            : packages.map((pkg) => (
                <div key={pkg.id} className="package-card">
                  <span className="package-badge">
                    <FileText size={11} />
                    Gói bài đăng
                  </span>
                  <h3 className="package-name">{pkg.name}</h3>
                  {pkg.description && <p className="package-desc">{pkg.description}</p>}
                  <div className="package-price">
                    {pkg.price.toLocaleString('vi-VN')} <span className="package-price-unit">VNĐ</span>
                  </div>
                  {pkg.durationInDays ? (
                    <div className="package-meta">
                      <Clock size={12} />
                      {pkg.durationInDays} ngày
                    </div>
                  ) : null}
                </div>
              ))}
        </div>
      </div>
    </section>
  );
};
