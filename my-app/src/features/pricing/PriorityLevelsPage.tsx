/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Zap, Megaphone, ShieldCheck,
  ArrowRight, Layers, HelpCircle, Loader2
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { fetchPriorityLevels, fetchBannerPriorityLevels, type PriorityLevel } from '../user-dashboard/components/Listing/priorityLevel.api';
import './PriorityLevelsPage.css';

export const PriorityLevelsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'listing' | 'banner'>('all');
  const [listingLevels, setListingLevels] = useState<PriorityLevel[]>([]);
  const [bannerLevels, setBannerLevels] = useState<PriorityLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isLoggedIn = !!localStorage.getItem('portal_token');

  useEffect(() => {
    const loadLevels = async () => {
      setIsLoading(true);
      try {
        const [listings, banners] = await Promise.all([
          fetchPriorityLevels(),
          fetchBannerPriorityLevels(),
        ]);
        setListingLevels(listings);
        setBannerLevels(banners);
      } catch (err) {
        console.error('Lỗi khi tải gói dịch vụ:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadLevels();
  }, []);

  const handleActionClick = () => {
    if (isLoggedIn) {
      navigate('/user/listings');
    } else {
      navigate('/login');
    }
  };

  const filteredListingLevels = activeTab === 'banner' ? [] : listingLevels;
  const filteredBannerLevels = activeTab === 'listing' ? [] : bannerLevels;

  return (
    <div className="pricing-page-wrapper">
      <Header />

      <main style={{ flex: 1 }}>
        {/* HERO SECTION */}
        <section className="pricing-hero">
          <div className="pricing-hero-badge">
            <Sparkles size={14} /> Gói Bài Đăng & Banner Quảng Cáo
          </div>
          <h1 className="pricing-hero-title">
            Bảng Giá Gói Bài Đăng & Dịch Vụ
          </h1>
          <p className="pricing-hero-subtitle">
            Tối ưu hóa khả năng tiếp cận khách hàng tiềm năng cho mặt bằng của bạn với các gói hiển thị ưu tiên và banner quảng cáo nổi bật trên FlexiSpace.
          </p>

          {/* TAB FILTERS */}
          <div className="pricing-tabs-container">
            <button
              className={`pricing-tab-btn ${activeTab === 'all' ? 'pricing-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <Layers size={16} /> Tất Cả Gói
            </button>
            <button
              className={`pricing-tab-btn ${activeTab === 'listing' ? 'pricing-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('listing')}
            >
              <Zap size={16} /> Gói Bài Đăng
            </button>
            <button
              className={`pricing-tab-btn ${activeTab === 'banner' ? 'pricing-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('banner')}
            >
              <Megaphone size={16} /> Gói Banner Quảng Cáo
            </button>
          </div>
        </section>

        {/* PRICING GRID */}
        <div className="pricing-grid-container">
          {isLoading ? (
            <div className="pricing-loading-state">
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: '#00d4a0' }} />
              <p>Đang tải thông tin các gói dịch vụ...</p>
            </div>
          ) : (filteredListingLevels.length === 0 && filteredBannerLevels.length === 0) ? (
            <div className="pricing-empty-state">
              <p>Hiện chưa có thông tin gói dịch vụ khả dụng.</p>
            </div>
          ) : (
            <div className="pricing-grid">
              {/* LISTING PACKAGES */}
              {filteredListingLevels.map((pkg) => (
                <div 
                  key={`listing-${pkg.id}`} 
                  className="pricing-card"
                >
                  <div>
                    <div className="pricing-card-header">
                      <span className="pricing-card-type-tag pricing-card-type-tag--listing">
                        <Zap size={12} /> Gói Bài Đăng
                      </span>
                      <h3 className="pricing-card-name">{pkg.name}</h3>
                      {pkg.description && (
                        <p className="pricing-card-desc">
                          {pkg.description}
                        </p>
                      )}
                    </div>

                    <div className="pricing-card-price-box">
                      <div>
                        <span className="pricing-card-price">
                          {pkg.price > 0 ? pkg.price.toLocaleString('vi-VN') : 'Miễn phí'}
                        </span>
                        {pkg.price > 0 && <span className="pricing-card-price-unit">VNĐ</span>}
                      </div>
                      {pkg.durationInDays !== null && pkg.durationInDays !== undefined && (
                        <div className="pricing-card-duration">
                          <ShieldCheck size={14} className="pricing-card-duration-icon--listing" />
                          <span>Thời hạn hiển thị: <strong>{pkg.durationInDays} ngày</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    className="pricing-card-cta pricing-card-cta--primary"
                    onClick={handleActionClick}
                  >
                    <span>Đăng Tin Ngay</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              ))}

              {/* BANNER PACKAGES */}
              {filteredBannerLevels.map((pkg) => (
                <div 
                  key={`banner-${pkg.id}`} 
                  className="pricing-card pricing-card--banner"
                >
                  <div>
                    <div className="pricing-card-header">
                      <span className="pricing-card-type-tag pricing-card-type-tag--banner">
                        <Megaphone size={12} /> Gói Banner Quảng Cáo
                      </span>
                      <h3 className="pricing-card-name">{pkg.name}</h3>
                      {pkg.description && (
                        <p className="pricing-card-desc">
                          {pkg.description}
                        </p>
                      )}
                    </div>

                    <div className="pricing-card-price-box">
                      <div>
                        <span className="pricing-card-price pricing-card-price--banner">
                          {pkg.price.toLocaleString('vi-VN')}
                        </span>
                        <span className="pricing-card-price-unit">VNĐ</span>
                      </div>
                      {pkg.durationInDays !== null && pkg.durationInDays !== undefined && (
                        <div className="pricing-card-duration">
                          <ShieldCheck size={14} className="pricing-card-duration-icon--banner" />
                          <span>Thời gian chạy banner: <strong>{pkg.durationInDays} ngày</strong></span>
                        </div>
                      )}
                      {pkg.durationForBanner !== null && pkg.durationForBanner !== undefined && (
                        <div className="pricing-card-duration" style={{ marginTop: 4 }}>
                          <Megaphone size={14} className="pricing-card-duration-icon--banner" />
                          <span>Giới hạn vị trí tối đa: <strong>{pkg.durationForBanner} vị trí</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    className="pricing-card-cta pricing-card-cta--banner"
                    onClick={handleActionClick}
                  >
                    <span>Tạo Banner Ngay</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FAQ SECTION */}
        <section className="pricing-faq-section">
          <h2 className="pricing-faq-title">Câu Hỏi Thường Gặp</h2>
          <div className="pricing-faq-grid">
            <div className="pricing-faq-item">
              <div className="pricing-faq-question">
                <HelpCircle size={18} /> Tôi thanh toán gói dịch vụ bằng cách nào?
              </div>
              <div className="pricing-faq-answer">
                Hệ thống khấu trừ trực tiếp số tiền từ Ví FlexiSpace của bạn khi bấm đăng tin hoặc tạo banner. Bạn có thể nạp tiền vào ví thông qua cổng thanh toán trực tuyến PayOS (Mã QR ngân hàng, ATM).
              </div>
            </div>

            <div className="pricing-faq-item">
              <div className="pricing-faq-question">
                <HelpCircle size={18} /> Gói banner quảng cáo có bị giới hạn số lượng không?
              </div>
              <div className="pricing-faq-answer">
                Có, để đảm bảo tính nổi bật và hiệu quả cho từng banner, hệ thống giới hạn tối đa vị trí banner chạy đồng thời trên trang chủ. Bạn có thể kiểm tra trực tiếp trạng thái còn chỗ khi tạo bài đăng.
              </div>
            </div>

            <div className="pricing-faq-item">
              <div className="pricing-faq-question">
                <HelpCircle size={18} /> Sau khi hết hạn bài đăng thì tôi có thể gia hạn được không?
              </div>
              <div className="pricing-faq-answer">
                Có, bạn có thể dễ dàng quản lý và gia hạn các bài đăng sắp hết hạn hoặc đã hết hạn ngay tại bảng điều khiển trang danh sách bài đăng.
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
