// src/features/homepage/Homepage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { Footer } from '../../components/Footer';
import { SidebarNav } from '../../components/SidebarNav';
import { mockVenues, pricingTiers } from './demoDb';
import './Homepage.css';
import { Header } from '../../components/Header';

interface HomepageProps {
  onLaunch: () => void;
}

export const Homepage: React.FC<HomepageProps> = ({ onLaunch }) => {
  const { language, t } = useThemeLanguage();
  const [activeRoleTab, setActiveRoleTab] = useState<'owner' | 'renter'>('owner');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Selected Venue & Slot Simulation State
  const [selectedVenueId, setSelectedVenueId] = useState<string>('d1-fashion');
  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  const [simulateConflict, setSimulateConflict] = useState<boolean>(false);
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for scroll-reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-on-scroll--revealed');
          }
        });
      },
      { threshold: 0.1 }
    );

    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const labels = {
    searchPlaceholder: { 
      en: 'Search location (District 1, Thao Dien), category (cafe, fashion) or space name...', 
      vi: 'Tìm quận (Quận 1, Thảo Điền), lĩnh vực (cafe, thời trang) hoặc tên mặt bằng...' 
    },
    resultsTitle: { en: 'Matching Commercial Retail Hubs', vi: 'Danh sách mặt bằng phù hợp' },
    noResults: { 
      en: 'No retail spaces match your search. Try resetting!', 
      vi: 'Không tìm thấy mặt bằng phù hợp. Hãy đặt lại bộ lọc!' 
    },
    resetBtn: { en: 'Reset Search', vi: 'Đặt lại tìm kiếm' },
    selectedLabel: { en: 'Selected Venue:', vi: 'Mặt bằng đang chọn:' },
    viewSlotsTitle: { en: 'Hourly Sharing Schedule (Click a slot below)', vi: 'Lịch trình phân bổ theo giờ (Chọn slot dưới đây)' },
    simulateLabel: { en: 'Simulate AI Conflict Check:', vi: 'Mô phỏng kiểm duyệt xung đột AI:' },
    priceLabel: { en: 'Proposed Price:', vi: 'Mức giá đề xuất:' },
    descLabel: { en: 'Slot Operational Details:', vi: 'Chi tiết hoạt động của slot:' },
    rentBtn: { en: 'Rent This Slot Now', vi: 'Thuê slot này ngay' },
    activeStatus: { en: 'Slot Currently Active', vi: 'Slot đang trong phiên hoạt động' },
    collAlert: { en: 'COLLISION DETECTED & BLOCKED', vi: 'PHÁT HIỆN & NGĂN CHẶN XUNG ĐỘT' },
    collDesc: { 
      en: 'AI Conflict Checker blocked this booking to protect primary tenant contract schedules.',
      vi: 'Hệ thống AI tự động khóa slot để bảo vệ lịch trình kiểm kho đã lên của khách thuê chính.'
    }
  };

  const getLabel = (key: keyof typeof labels) => {
    return labels[key][language] || labels[key]['en'];
  };

  // Combined location & category search function
  const filteredVenues = mockVenues.filter((venue) => {
    const query = searchQuery.toLowerCase().trim();
    
    // Category Filter
    const categoryMatch = activeCategory === 'all' || venue.category === activeCategory;
    
    if (!query) return categoryMatch;

    const nameSearchMatch = 
      venue.nameEn.toLowerCase().includes(query) ||
      venue.nameVi.toLowerCase().includes(query);
      
    const locationSearchMatch = 
      venue.locationEn.toLowerCase().includes(query) ||
      venue.locationVi.toLowerCase().includes(query);

    const categorySearchMatch = 
      venue.category.toLowerCase().includes(query) ||
      (query.includes('cafe') && venue.category === 'cafe') ||
      (query.includes('cà phê') && venue.category === 'cafe') ||
      (query.includes('fashion') && venue.category === 'fashion') ||
      (query.includes('thời trang') && venue.category === 'fashion') ||
      (query.includes('art') && venue.category === 'art') ||
      (query.includes('nghệ thuật') && venue.category === 'art') ||
      (query.includes('workshop') && venue.category === 'art') ||
      (query.includes('tech') && venue.category === 'tech') ||
      (query.includes('công nghệ') && venue.category === 'tech');

    return categoryMatch && (nameSearchMatch || locationSearchMatch || categorySearchMatch);
  });

  useEffect(() => {
    // Check chắc chắn mảng có phần tử
    if (filteredVenues && filteredVenues.length > 0) {
      const isSelectedStillVisible = filteredVenues.some(v => v.id === selectedVenueId);
      
      if (!isSelectedStillVisible) {
        // Dùng thẳng index [0].id và ép bọc qua hàm String() 
        const fallbackId = String(filteredVenues[0].id);
        
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedVenueId(fallbackId);
        setSelectedSlot(1);
      }
    }
  }, [searchQuery, activeCategory, filteredVenues, selectedVenueId]);

  const activeVenue = mockVenues.find(v => v.id === selectedVenueId) || mockVenues[0];

  const slotsListToDisplay = activeVenue.slots.map((slot, index) => {
    if (index === 2 && simulateConflict) {
      return {
        ...slot,
        status: 'conflict' as const,
        badgeEn: 'Conflict',
        badgeVi: 'Xung đột'
      };
    }
    return slot;
  });

  const activeSlotData = slotsListToDisplay[selectedSlot] || slotsListToDisplay[0];

  const handleCardClick = (id: string) => {
    setSelectedVenueId(id);
    setSelectedSlot(1); 
  };

  const currentPricing = pricingTiers[language] || pricingTiers['en'];

  return (
    <div className="homepage-wrapper" ref={wrapperRef}>
      
      <SidebarNav />

      {/* HEADER NAVBAR */}
      <Header onPostListing={onLaunch} />

      <div id="search-nav">
        {/* SEARCH BAR */}
        <div className="search-topbar">
          <input
            type="text"
            placeholder={getLabel('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select className="search-dropdown">
            <option>{language === 'en' ? 'For Rent' : 'Cho thuê'}</option>
            <option>{language === 'en' ? 'For Sale' : 'Mua bán'}</option>
          </select>
          <button className="btn-ghost" style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #2A3A4A', color: '#fff' }}>
            {language === 'en' ? 'Filters' : 'Bộ lọc'}
          </button>
          <button className="search-btn-main">
            {language === 'en' ? 'Search' : 'Tìm kiếm'}
          </button>
        </div>

        {/* CATEGORY TABS */}
        <div className="category-tabs">
          {[
            { id: 'all', labelEn: 'All', labelVi: 'Tất cả' },
            { id: 'shophouse', labelEn: 'Shophouse', labelVi: 'Shophouse' },
            { id: 'office', labelEn: 'Office', labelVi: 'Văn phòng' },
            { id: 'warehouse', labelEn: 'Warehouse', labelVi: 'Nhà xưởng' },
            { id: 'kiosk', labelEn: 'Kiosk', labelVi: 'Kiot' },
            { id: 'frontage', labelEn: 'Frontage', labelVi: 'Mặt tiền' },
          ].map(tab => (
            <div 
              key={tab.id} 
              className={`category-tab ${activeCategory === tab.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(tab.id)}
            >
              {language === 'en' ? tab.labelEn : tab.labelVi}
            </div>
          ))}
        </div>
      </div>

      {/* MAIN BODY: LISTINGS & DETAILS */}
      <div className="listings-layout">
        
        {/* LEFT COLUMN: LISTINGS */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>
              {language === 'en' 
                ? `${filteredVenues.length} spaces in HCMC` 
                : `${filteredVenues.length} mặt bằng tại TP.HCM`}
            </h2>
            <div style={{ fontSize: '13px', color: '#6B7280' }}>
              {language === 'en' ? 'Sort by: Newest | Price Asc | Price Desc' : 'Sắp xếp: Mới nhất | Giá tăng | Giá giảm'}
            </div>
          </div>

          {filteredVenues.map((hub) => (
            <div
              key={hub.id}
              className={`listing-row-card ${selectedVenueId === hub.id ? 'selected' : ''}`}
              onClick={() => handleCardClick(hub.id)}
            >
              <div className="listing-thumbnail">
                {hub.icon}
                <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '9px', padding: '2px 4px', borderRadius: '4px' }}>
                   {language === 'en' ? 'Rent' : 'Thuê'}
                </span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px', color: '#111827', marginBottom: '4px' }}>
                    {language === 'en' ? hub.nameEn : hub.nameVi}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
                    {language === 'en' ? hub.locationEn : hub.locationVi}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '11px', background: '#F3F4F6', color: '#4B5563', padding: '2px 6px', borderRadius: '4px' }}>{hub.area}</span>
                    <span style={{ fontSize: '11px', background: '#F3F4F6', color: '#4B5563', padding: '2px 6px', borderRadius: '4px' }}>{language === 'en' ? hub.typeEn : hub.typeVi}</span>
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: '#00875A', textAlign: 'right' }}>
                  {language === 'en' ? hub.priceEn : hub.priceVi}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT COLUMN: DETAILS SIDEBAR */}
        {filteredVenues.length > 0 && (
          <div className="detail-sidebar">
            <div className="showcase-card" style={{ background: '#fff', border: '0.5px solid #E0E8EC', borderRadius: '10px', padding: '24px' }}>
              <div className="showcase-header">
                <div>
                  <span className="showcase-badge-active">
                    {getLabel('selectedLabel')} {language === 'en' ? activeVenue.nameEn : activeVenue.nameVi}
                  </span>
                  <h3 className="showcase-title" style={{ marginTop: 12, color: '#111827' }}>
                    {getLabel('viewSlotsTitle')}
                  </h3>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>
                    {getLabel('simulateLabel')}
                  </span>
                  <input
                    type="checkbox"
                    checked={simulateConflict}
                    onChange={(e) => {
                      setSimulateConflict(e.target.checked);
                      if (e.target.checked) setSelectedSlot(2);
                    }}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#00D4A0' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="showcase-calendar-mock">
                  <div className="showcase-slots-list">
                    {slotsListToDisplay.map((slot, index) => (
                      <div 
                        key={index}
                        className={`showcase-slot-row ${selectedSlot === index ? 'showcase-slot-row--selected' : ''}`}
                        onClick={() => setSelectedSlot(index)}
                        style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}
                      >
                        <div>
                          <div className="showcase-slot-time" style={{ color: '#111827' }}>{slot.time}</div>
                          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                            {language === 'en' ? slot.nameEn : slot.nameVi}
                          </div>
                        </div>
                        <div className="showcase-slot-info">
                          <span className={`showcase-slot-badge slot-badge-${slot.status}`}>
                            {language === 'en' ? slot.badgeEn : slot.badgeVi}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="showcase-console" style={{ background: '#F3F4F6', border: 'none', color: '#111827' }}>
                  <div>
                    <div className="console-stat-box">
                      <span className="console-stat-title" style={{ color: '#6B7280' }}>{getLabel('priceLabel')}</span>
                      <div className="console-stat-value" style={{ color: '#00875A' }}>
                        {language === 'en' ? activeSlotData.priceEn : activeSlotData.priceVi}
                      </div>
                    </div>

                    <div className="console-stat-box">
                      <span className="console-stat-title" style={{ color: '#6B7280' }}>{getLabel('descLabel')}</span>
                      <p className="console-desc" style={{ color: '#4B5563' }}>
                        {language === 'en' ? activeSlotData.descEn : activeSlotData.descVi}
                      </p>
                    </div>
                  </div>

                  <div>
                    {activeSlotData.status === 'conflict' ? (
                      <div className="console-conflict-alert">
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{getLabel('collAlert')}</div>
                        <div style={{ fontWeight: 400 }}>{getLabel('collDesc')}</div>
                      </div>
                    ) : activeSlotData.status === 'available' ? (
                      <button className="search-btn-main" style={{ width: '100%', justifyContent: 'center' }} onClick={onLaunch}>
                        {getLabel('rentBtn')}
                      </button>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '12px', borderRadius: 6, background: '#E5E7EB', fontSize: 13, color: '#4B5563' }}>
                        {getLabel('activeStatus')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KEEP EXISTING SECTIONS */}
      <section id="features" className="features-section reveal-on-scroll">
         {/* ... Existing Features Code ... */}
         <span className="section-tag">{t('home.navFeatures')}</span>
        <h2 className="section-title">{t('home.featTitle')}</h2>
        <p className="section-subtitle">{t('home.featSub')}</p>

        <div className="features-bento-grid">
          <div className="feature-card feature-card--large stagger-item">
            <div className="feature-card-content">
              <div className="feature-card-number">01</div>
              <h3 className="feature-card-title">{t('home.feat1Title')}</h3>
              <p className="feature-card-desc">{t('home.feat1Desc')}</p>
            </div>
            <div className="feature-bento-visual-slots">
              <div className="bento-slot-bar booked">08:00 - 12:00 [FS]</div>
              <div className="bento-slot-bar available">13:00 - 17:00 [AVAILABLE]</div>
              <div className="bento-slot-bar booked">18:00 - 22:00 [TC]</div>
            </div>
          </div>

          <div className="feature-card feature-card--accent stagger-item">
            <div className="feature-card-content">
              <div className="feature-card-number">02</div>
              <h3 className="feature-card-title">{t('home.feat2Title')}</h3>
              <p className="feature-card-desc">{t('home.feat2Desc')}</p>
            </div>
            <div className="feature-bento-visual-terminal">
              <div className="terminal-header">
                <span className="terminal-dot"></span>
                <span className="terminal-dot"></span>
                <span className="terminal-dot"></span>
              </div>
              <div className="terminal-body">
                <span>$ etherspace-ai check --schedule</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>&gt; MATCHING CONFLICT CODES...</span>
                <span style={{ color: 'var(--color-positive)' }}>&gt; [OK] NO SHIFT INTERSECTION DETECTED</span>
              </div>
            </div>
          </div>

          <div className="feature-card feature-card--dark stagger-item">
            <div className="feature-card-content">
              <div className="feature-card-number">03</div>
              <h3 className="feature-card-title">{t('home.feat3Title')}</h3>
              <p className="feature-card-desc">{t('home.feat3Desc')}</p>
            </div>
          </div>

          <div className="feature-card feature-card--split stagger-item">
            <div className="feature-card-content">
              <div className="feature-card-number">04</div>
              <h3 className="feature-card-title">{t('home.feat4Title')}</h3>
              <p className="feature-card-desc">{t('home.feat4Desc')}</p>
            </div>
            <div className="feature-bento-roles">
              <span className="bento-role-badge">[SO] {t('app.ownerTitle').toUpperCase()}</span>
              <span className="bento-role-badge">[PT] {t('app.renterTitle').toUpperCase()}</span>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="how-it-works-section reveal-on-scroll">
         {/* ... Existing How It Works Code ... */}
         <h2 className="section-title">{t('home.howTitle')}</h2>

        <div className="role-tabs">
          <button 
            className={`role-tab-btn ${activeRoleTab === 'owner' ? 'role-tab-btn--active' : ''}`}
            onClick={() => setActiveRoleTab('owner')}
          >
            {t('home.howOwner').toUpperCase()}
          </button>
          <button 
            className={`role-tab-btn ${activeRoleTab === 'renter' ? 'role-tab-btn--active' : ''}`}
            onClick={() => setActiveRoleTab('renter')}
          >
            {t('home.howRenter').toUpperCase()}
          </button>
        </div>

        <div className="timeline-container">
          <div className="timeline-connector" />

          {activeRoleTab === 'owner' ? (
            <>
              <div className="timeline-step">
                <div className="step-node">1</div>
                <div className="step-info-card">
                  <h4 className="step-title">{t('home.step1OwnerTitle')}</h4>
                  <p className="step-desc">{t('home.step1OwnerDesc')}</p>
                </div>
              </div>

              <div className="timeline-step">
                <div className="step-node">2</div>
                <div className="step-info-card">
                  <h4 className="step-title">{t('home.step2OwnerTitle')}</h4>
                  <p className="step-desc">{t('home.step2OwnerDesc')}</p>
                </div>
              </div>

              <div className="timeline-step">
                <div className="step-node">3</div>
                <div className="step-info-card">
                  <h4 className="step-title">{t('home.step3OwnerTitle')}</h4>
                  <p className="step-desc">{t('home.step3OwnerDesc')}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="timeline-step">
                <div className="step-node">1</div>
                <div className="step-info-card">
                  <h4 className="step-title">{t('home.step1RenterTitle')}</h4>
                  <p className="step-desc">{t('home.step1RenterDesc')}</p>
                </div>
              </div>

              <div className="timeline-step">
                <div className="step-node">2</div>
                <div className="step-info-card">
                  <h4 className="step-title">{t('home.step2RenterTitle')}</h4>
                  <p className="step-desc">{t('home.step2RenterDesc')}</p>
                </div>
              </div>

              <div className="timeline-step">
                <div className="step-node">3</div>
                <div className="step-info-card">
                  <h4 className="step-title">{t('home.step3RenterTitle')}</h4>
                  <p className="step-desc">{t('home.step3RenterDesc')}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section id="pricing" className="pricing-section reveal-on-scroll">
         {/* ... Existing Pricing Code ... */}
         <h2 className="section-title">
          {language === 'en' ? 'Transparent Subscription Plans' : 'Bảng Giá Dịch Vụ Minh Bạch'}
        </h2>
        <p className="section-subtitle">
          {language === 'en' ? 'Select a suitable tier to scale your retail locations.' : 'Lựa chọn gói dịch vụ phù hợp để tối ưu hóa địa điểm bán lẻ của bạn.'}
        </p>

        <div className="pricing-grid">
          {currentPricing.map((tier, idx) => (
            <div key={idx} className={`pricing-card ${tier.popular ? 'pricing-card--popular' : ''}`}>
              <div>
                <h3 className="pricing-card-title">{tier.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 8 }}>{tier.desc}</p>
              </div>

              <div>
                <span className="pricing-card-price">{tier.price}</span>
                {tier.period && <span className="pricing-price-period"> {tier.period}</span>}
              </div>

              <ul className="pricing-features-list">
                {tier.features.map((feat, fidx) => (
                  <li key={fidx} className="pricing-feature-item">
                    <span className="pricing-feature-check">+</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <button 
                className={`pricing-btn ${tier.popular ? 'pricing-btn-primary' : 'pricing-btn-secondary'}`}
                onClick={onLaunch}
              >
                {tier.btn}
              </button>
            </div>
          ))}
        </div>
      </section>

      <Footer />
      
    </div>
  );
};