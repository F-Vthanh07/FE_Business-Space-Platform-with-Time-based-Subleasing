import React, { useState, useEffect, useRef } from 'react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import './Homepage.css';

interface HomepageProps {
  onLaunch: () => void;
}

interface MockSlot {
  time: string;
  nameEn: string;
  nameVi: string;
  status: 'booked' | 'available' | 'conflict';
  descEn: string;
  descVi: string;
  priceEn: string;
  priceVi: string;
  badgeEn: string;
  badgeVi: string;
}

interface MockVenue {
  id: string;
  nameEn: string;
  nameVi: string;
  locationEn: string;
  locationVi: string;
  typeEn: string;
  typeVi: string;
  category: 'fashion' | 'cafe' | 'art' | 'tech';
  area: string;
  occupancy: string;
  priceEn: string;
  priceVi: string;
  icon: string; // Will store typographic abbreviations e.g. FS, AR, TC
  morningShiftEn: string;
  morningShiftVi: string;
  eveningShiftEn: string;
  eveningShiftVi: string;
  slots: MockSlot[];
}

export const Homepage: React.FC<HomepageProps> = ({ onLaunch }) => {
  const { language, setLanguage, theme, toggleTheme, t } = useThemeLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState<'owner' | 'renter'>('owner');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected Venue & Slot Simulation State
  const [selectedVenueId, setSelectedVenueId] = useState<string>('d1-fashion');
  const [selectedSlot, setSelectedSlot] = useState<number>(1); // Default to available slot (usually index 1)
  const [simulateConflict, setSimulateConflict] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Monitor scroll for header styling
  useEffect(() => {
    const handleScroll = () => {
      if (wrapperRef.current) {
        if (wrapperRef.current.scrollTop > 50) {
          setScrolled(true);
        } else {
          setScrolled(false);
        }
      }
    };

    const container = wrapperRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Local translations for Search Console and Interactive UI
  const labels = {
    searchPlaceholder: { 
      en: 'Search location (District 1, Thao Dien), category (cafe, fashion) or space name...', 
      vi: 'Tìm quận (Quận 1, Thảo Điền), lĩnh vực (cafe, thời trang) hoặc tên mặt bằng...' 
    },
    resultsTitle: { en: 'Matching Commercial Retail Hubs', vi: 'Danh sách mặt bằng phù hợp' },
    noResults: { en: 'No retail spaces match your search. Try resetting!', vi: 'Không tìm thấy mặt bằng phù hợp. Hãy đặt lại bộ lọc!' },
    resetBtn: { en: 'Reset Search', vi: 'Đặt lại tìm kiếm' },
    selectedLabel: { en: 'Selected Venue:', vi: 'Mặt bằng đang chọn:' },
    viewSlotsTitle: { en: 'Hourly Sharing Schedule (Click a slot below)', vi: 'Lịch trình phân bổ theo giờ (Chọn slot dưới đây)' },
    simulateLabel: { en: 'Simulate AI Conflict Check:', vi: 'Mô phỏng kiểm duyệt xung đột AI:' },
    priceLabel: { en: 'Proposed Price:', vi: 'Mức giá đề xuất:' },
    descLabel: { en: 'Slot Operational Details:', vi: 'Chi tiết hoạt động của slot:' },
    rentBtn: { en: 'Rent This Slot Now', vi: 'Thuê slot này ngay' },
    activeStatus: { en: 'Slot Currently Active', vi: 'Slot đang trong phiên hoạt động' },
    secOccupancy: { en: 'Occupancy Rate', vi: 'Tỷ lệ lấp đầy' },
    secArea: { en: 'Area Size', vi: 'Diện tích' },
    distTitle: { en: 'Subleasing Time Allocations', vi: 'Phân bổ thời gian cho thuê lại' },
    collAlert: { en: 'COLLISION DETECTED & BLOCKED', vi: 'PHÁT HIỆN & NGĂN CHẶN XUNG ĐỘT' },
    collDesc: { 
      en: 'AI Conflict Checker blocked this booking to protect primary tenant contract schedules.',
      vi: 'Hệ thống AI tự động khóa slot để bảo vệ lịch trình kiểm kho đã lên của khách thuê chính.'
    }
  };

  const getLabel = (key: keyof typeof labels) => {
    return labels[key][language] || labels[key]['en'];
  };

  // Static mock retail spaces with typographic abbreviations replacing emojis
  const mockVenues: MockVenue[] = [
    {
      id: 'd1-fashion',
      nameEn: 'District 1 Retail Hub',
      nameVi: 'Không Gian Thời Trang Quận 1',
      locationEn: 'Dong Khoi St, District 1, HCMC',
      locationVi: 'Đường Đồng Khởi, Quận 1, TP.HCM',
      typeEn: 'Concept Store & Showroom',
      typeVi: 'Cửa hàng ý tưởng & Trưng bày',
      category: 'fashion',
      area: '65 sqm',
      occupancy: '92%',
      priceEn: '450k/hr',
      priceVi: '450k/giờ',
      icon: 'FS', // Fashion Studio
      morningShiftEn: 'Morning Cafe Slot (08:00-12:00)',
      morningShiftVi: 'Cà phê sáng Pop-up (08:00-12:00)',
      eveningShiftEn: 'Fashion Boutique Slot (13:00-21:00)',
      eveningShiftVi: 'Cửa hàng Thời trang (13:00-21:00)',
      slots: [
        {
          time: '08:00 - 12:00',
          nameEn: 'Morning Specialty Cafe Pop-up',
          nameVi: 'Quầy Cà Phê Đặc Sản Sáng',
          status: 'booked',
          descEn: 'Operated by Sunrise Coffee. High morning foot-traffic and takeaway coffee cup revenues.',
          descVi: 'Đang vận hành bởi Sunrise Coffee. Lượng khách mua mang đi buổi sáng đông đúc và mang lại doanh thu cao.',
          priceEn: '350,000 VND / hr',
          priceVi: '350.000 đ / giờ',
          badgeEn: 'Booked',
          badgeVi: 'Đã thuê'
        },
        {
          time: '13:00 - 17:00',
          nameEn: 'Afternoon Accessories pop-up',
          nameVi: 'Khung Giờ Trưng Bày Phụ Kiện Chiều',
          status: 'available',
          descEn: 'Vacant afternoon slot! Ideal for designer leathergoods, fashion items, and pop-up boutiques.',
          descVi: 'Khung giờ trống! Lý tưởng cho trưng bày túi xách thiết kế, phụ kiện thời trang, hoặc quần áo cao cấp.',
          priceEn: '400,000 VND / hr',
          priceVi: '400.000 đ / giờ',
          badgeEn: 'Available',
          badgeVi: 'Còn trống'
        },
        {
          time: '18:00 - 22:00',
          nameEn: 'Evening Designer Showcase',
          nameVi: 'Studio Trình Diễn Thời Trang Tối',
          status: 'booked',
          descEn: 'Occupied by Noir Threads. Prime evening shopping window with aesthetic product lighting.',
          descVi: 'Được đặt bởi nhãn hàng Noir Threads. Khung giờ mua sắm vàng buổi tối với đèn trang trí bắt mắt.',
          priceEn: '550,000 VND / hr',
          priceVi: '550.000 đ / giờ',
          badgeEn: 'Booked',
          badgeVi: 'Đã thuê'
        }
      ]
    },
    {
      id: 'thaodien-art',
      nameEn: 'Thao Dien Creative Box',
      nameVi: 'Hộp Sáng Tạo Thảo Điền',
      locationEn: 'Nguyen Van Huong St, Thao Dien, District 2, HCMC',
      locationVi: 'Đường Nguyễn Văn Hưởng, Thảo Điền, Quận 2, TP.HCM',
      typeEn: 'Art Gallery & Workshop Hub',
      typeVi: 'Triển lãm & Không gian Workshop',
      category: 'art',
      area: '45 sqm',
      occupancy: '85%',
      priceEn: '380k/hr',
      priceVi: '380k/giờ',
      icon: 'AR', // Art Room
      morningShiftEn: 'Florist Design Shift (09:00-13:00)',
      morningShiftVi: 'Cắm hoa nghệ thuật (09:00-13:00)',
      eveningShiftEn: 'Oil Painting Workshop (14:00-22:00)',
      eveningShiftVi: 'Lớp học Vẽ tranh dầu (14:00-22:00)',
      slots: [
        {
          time: '08:00 - 12:00',
          nameEn: 'Morning Florist Design Studio',
          nameVi: 'Studio Sáng Tạo Hoa Tươi Sáng',
          status: 'booked',
          descEn: 'Operated by Bloom Flowers. Beautiful light morning atmosphere for custom bouquet designs.',
          descVi: 'Đang hoạt động bởi Bloom Flowers. Không khí sáng sớm ngập tràn ánh nắng tự nhiên thích hợp gói hoa.',
          priceEn: '320,000 VND / hr',
          priceVi: '320.000 đ / giờ',
          badgeEn: 'Booked',
          badgeVi: 'Đã thuê'
        },
        {
          time: '13:00 - 17:00',
          nameEn: 'Afternoon Oil Painting Workshop',
          nameVi: 'Lớp Học Vẽ Tranh Sơn Dầu Chiều',
          status: 'booked',
          descEn: 'Hosted by Creative Guild. Interactive group workshops focusing on visual painting.',
          descVi: 'Tổ chức bởi Câu lạc bộ Mỹ thuật. Buổi workshop nhóm hướng dẫn vẽ tranh nghệ thuật.',
          priceEn: '380,000 VND / hr',
          priceVi: '380.000 đ / giờ',
          badgeEn: 'Booked',
          badgeVi: 'Đã thuê'
        },
        {
          time: '18:00 - 22:00',
          nameEn: 'Evening Acoustic / Poetry slot',
          nameVi: 'Khung Giờ Đêm Nhạc Acoustic / Đọc Thơ',
          status: 'available',
          descEn: 'Vacant evening slot! Perfect for local acoustic acts, poetry gatherings, or small private workshops.',
          descVi: 'Khung giờ trống buổi tối! Phù hợp cho biểu diễn ca nhạc acoustic nhỏ, các buổi ngâm thơ, họp mặt câu lạc bộ.',
          priceEn: '450,000 VND / hr',
          priceVi: '450.000 đ / giờ',
          badgeEn: 'Available',
          badgeVi: 'Còn trống'
        }
      ]
    },
    {
      id: 'leloi-showroom',
      nameEn: 'Le Loi Smart Showroom',
      nameVi: 'Showroom Cao Cấp Lê Lợi',
      locationEn: 'Le Loi Blvd, District 1, HCMC',
      locationVi: 'Đại lộ Lê Lợi, Quận 1, TP.HCM',
      typeEn: 'Interactive Product Lounge',
      typeVi: 'Showroom Công nghệ & Trải nghiệm',
      category: 'tech',
      area: '80 sqm',
      occupancy: '95%',
      priceEn: '600k/hr',
      priceVi: '600k/giờ',
      icon: 'TC', // Tech Center
      morningShiftEn: 'Gadget Showcase Shift (08:00-13:00)',
      morningShiftVi: 'Trưng bày Công nghệ (08:00-13:00)',
      eveningShiftEn: 'Networking Product Launch (14:00-21:00)',
      eveningShiftVi: 'Sự kiện Giao lưu & Ra mắt (14:00-21:00)',
      slots: [
        {
          time: '08:00 - 12:00',
          nameEn: 'Morning Smart Gadgets Expo',
          nameVi: 'Khung Giờ Trải Nghiệm Thiết Bị Số Sáng',
          status: 'available',
          descEn: 'Vacant morning slot! Configured for visual technology setups, phone launchers, or VR experiences.',
          descVi: 'Khung giờ trống buổi sáng! Đã bố trí tủ kính trưng bày và máy chiếu công nghệ cao, lý tưởng cho pop-up VR.',
          priceEn: '500,000 VND / hr',
          priceVi: '500.000 đ / giờ',
          badgeEn: 'Available',
          badgeVi: 'Còn trống'
        },
        {
          time: '13:00 - 17:00',
          nameEn: 'Afternoon Accessories Hub',
          nameVi: 'Quầy Trưng Bày Phụ Kiện Thông Minh',
          status: 'booked',
          descEn: 'Operated by AlphaTech. Showcasing premium mechanical keyboards and computer peripherals.',
          descVi: 'Đang vận hành bởi AlphaTech. Nơi giới thiệu bàn phím cơ cao cấp và thiết bị công nghệ hỗ trợ làm việc.',
          priceEn: '580,000 VND / hr',
          priceVi: '580.000 đ / giờ',
          badgeEn: 'Booked',
          badgeVi: 'Đã thuê'
        },
        {
          time: '18:00 - 22:00',
          nameEn: 'Evening Founders Networking',
          nameVi: 'Buổi Giao Lưu Doanh Nghiệp Khởi Nghiệp Tối',
          status: 'booked',
          descEn: 'Hosted by Startup Hub. High-profile panel discussions and technical networking.',
          descVi: 'Tổ chức bởi Startup Hub. Các buổi tọa đàm công nghệ và chia sẻ kinh nghiệm khởi nghiệp.',
          priceEn: '700,000 VND / hr',
          priceVi: '700.000 đ / giờ',
          badgeEn: 'Booked',
          badgeVi: 'Đã thuê'
        }
      ]
    }
  ];

  // Combined location & category search function
  const filteredVenues = mockVenues.filter((venue) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const nameMatch = 
      venue.nameEn.toLowerCase().includes(query) ||
      venue.nameVi.toLowerCase().includes(query);
      
    const locationMatch = 
      venue.locationEn.toLowerCase().includes(query) ||
      venue.locationVi.toLowerCase().includes(query);

    const categoryMatch = 
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

    return nameMatch || locationMatch || categoryMatch;
  });

  // Automatically select the first visible venue if the selected one is filtered out
  useEffect(() => {
    if (filteredVenues.length > 0) {
      const isSelectedStillVisible = filteredVenues.some(v => v.id === selectedVenueId);
      if (!isSelectedStillVisible) {
        setSelectedVenueId(filteredVenues[0].id);
        setSelectedSlot(1); // Reset selected slot to middle default
      }
    }
  }, [searchQuery, filteredVenues, selectedVenueId]);

  // Find currently selected venue object
  const activeVenue = mockVenues.find(v => v.id === selectedVenueId) || mockVenues[0];

  // Adjust active slots depending on simulation of conflict
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

  const handleResetSearch = () => {
    setSearchQuery('');
    setSelectedVenueId('d1-fashion');
    setSelectedSlot(1);
    setSimulateConflict(false);
  };

  const handleCardClick = (id: string) => {
    setSelectedVenueId(id);
    setSelectedSlot(1); // Set to default middle slot
  };

  const currentPricing = pricingTiers[language] || pricingTiers['en'];

  return (
    <div className="homepage-wrapper" ref={wrapperRef}>
      {/* Ambient background meshes */}
      <div className="homepage-ambient-glow">
        <div className="glow-bubble glow-bubble-1" />
        <div className="glow-bubble glow-bubble-2" />
        <div className="glow-bubble glow-bubble-3" />
      </div>

      {/* HEADER NAVBAR (TYPOGRAPHIC CONTROLS) */}
      <header className={`homepage-header ${scrolled ? 'homepage-header--scrolled' : ''}`}>
        <div className="logo-container" onClick={() => scrollToSection('hero')}>
          <div className="logo-symbol">E</div>
          <span className="logo-text">EtherSpace</span>
        </div>

        <nav className="homepage-nav">
          <span className="nav-link" onClick={() => scrollToSection('hero')}>{language === 'en' ? 'SEARCH' : 'TÌM KIẾM'}</span>
          <span className="nav-link" onClick={() => scrollToSection('features')}>{t('home.navFeatures').toUpperCase()}</span>
          <span className="nav-link" onClick={() => scrollToSection('how-it-works')}>{t('home.navHowItWorks').toUpperCase()}</span>
          <span className="nav-link" onClick={() => scrollToSection('pricing')}>{t('home.navPricing').toUpperCase()}</span>
        </nav>

        <div className="header-actions">
          {/* Language Switcher (Typographic Text Toggle) */}
          <button 
            className="btn-ghost" 
            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
            style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.8px' }}
          >
            {language.toUpperCase()}
          </button>

          {/* Theme Toggle (Typographic Text Toggle) */}
          <button 
            className="btn-ghost" 
            onClick={toggleTheme}
            style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.8px' }}
          >
            {theme.toUpperCase()}
          </button>

          {/* Launch App CTA */}
          <button className="header-cta-btn" onClick={onLaunch}>
            {t('home.navLaunch')}
          </button>
        </div>
      </header>

      {/* ==========================================
          SPLIT HERO SECTION WITH INTEGRATED SEARCH/LIST (TYPOGRAPHIC)
          ========================================== */}
      <section id="hero" className="hero-section-split">
        {/* Left Column: Introductions */}
        <div className="hero-info-column">
          <span className="hero-tag">{t('home.heroTag')}</span>
          <h1 className="hero-title-main" style={{ fontSize: '46px', maxWidth: '500px', lineHeight: 1.2 }}>
            {language === 'en' ? 'Spatial Time-Sharing Finder' : 'Tìm Kiếm Mặt Bằng Kinh Doanh'}
          </h1>
          <h2 className="hero-title-sub" style={{ fontSize: '38px', marginBottom: 20 }}>
            {language === 'en' ? 'Hourly Subleasing' : 'Cho Thuê Lại Theo Giờ'}
          </h2>
          <p className="hero-desc" style={{ fontSize: '15px', maxWidth: '480px', marginBottom: 32, lineHeight: 1.6 }}>
            {language === 'en' 
              ? 'EtherSpace bridges vacant hours of retail stores with ambitious brands. Search location hotspots, explore layouts, and rent secure micro-slots instantly.' 
              : 'EtherSpace kết nối các khung giờ trống của cửa hàng với các nhãn hàng triển vọng. Tìm vị trí đắc địa, xem cách phân bổ lịch trình và thuê lại slot rảnh tức thì.'}
          </p>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="hero-btn-primary" onClick={onLaunch} style={{ padding: '12px 28px', fontSize: 14 }}>
              {t('home.heroBtnDemo')}
            </button>
            <button className="hero-btn-secondary" onClick={() => scrollToSection('features')} style={{ padding: '12px 28px', fontSize: 14 }}>
              {language === 'en' ? 'LEARN MORE' : 'TÌM HIỂU THÊM'}
            </button>
          </div>
        </div>

        {/* Right Column: Search Console & Compact Listings */}
        <div className="hero-search-panel glass-card reveal-on-scroll">
          {/* Unified Search Input (No icon inside input) */}
          <div className="unified-search-input-wrapper">
            <input
              type="text"
              className="unified-search-input"
              style={{ paddingLeft: 16 }}
              placeholder={getLabel('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Results List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: 0.8 }}>
              {getLabel('resultsTitle')} ({filteredVenues.length})
            </span>

            <div className="results-compact-list">
              {filteredVenues.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>
                    {getLabel('noResults')}
                  </p>
                  <button className="btn-ghost" onClick={handleResetSearch} style={{ padding: '6px 12px', fontSize: 11 }}>
                    {getLabel('resetBtn')}
                  </button>
                </div>
              ) : (
                filteredVenues.map((hub) => (
                  <div
                    key={hub.id}
                    className={`compact-venue-card ${selectedVenueId === hub.id ? 'compact-venue-card--selected' : ''}`}
                    onClick={() => handleCardClick(hub.id)}
                  >
                    {/* Typographic 2-letter uppercase codes replacing Emojis */}
                    <div className="compact-venue-icon" style={{ fontWeight: 800, fontSize: 11, color: 'var(--color-accent)', letterSpacing: 0.5 }}>
                      {hub.icon}
                    </div>
                    <div className="compact-venue-info">
                      <div className="compact-venue-name">
                        {language === 'en' ? hub.nameEn : hub.nameVi}
                      </div>
                      <div className="compact-venue-meta">
                        <span>{hub.area}</span>
                        <span>/</span>
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {language === 'en' ? hub.locationEn.split(',')[0].toUpperCase() : hub.locationVi.split(',')[0].toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="compact-venue-right">
                      <div className="compact-venue-price">
                        {language === 'en' ? hub.priceEn : hub.priceVi}
                      </div>
                      <span className="compact-venue-badge">
                        {hub.occupancy}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          INTERACTIVE SHIFT SCHEDULE SHOWCASE (FULL WIDTH BELOW - TYPOGRAPHIC)
          ========================================== */}
      {filteredVenues.length > 0 && (
        <section className="reveal-on-scroll" style={{ padding: '20px 24px 80px 24px', maxWidth: '1000px', margin: '0 auto' }}>
          <div className="showcase-card glass-card" style={{ border: '1px solid var(--color-border)' }}>
            <div className="showcase-header">
              <div>
                <span className="showcase-badge-active">
                  {getLabel('selectedLabel')} {language === 'en' ? activeVenue.nameEn : activeVenue.nameVi}
                </span>
                <h3 className="showcase-title" style={{ marginTop: 8 }}>
                  {getLabel('viewSlotsTitle')}
                </h3>
              </div>
              
              {/* Conflict simulator toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: 0.5 }}>
                  {getLabel('simulateLabel')}
                </span>
                <input
                  type="checkbox"
                  id="simulate-conflict-toggle-hero"
                  checked={simulateConflict}
                  onChange={(e) => {
                    setSimulateConflict(e.target.checked);
                    if (e.target.checked) setSelectedSlot(2); // Auto select evening
                  }}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
              </div>
            </div>

            <div className="showcase-grid-layout">
              {/* Daily Micro-slots Grid */}
              <div className="showcase-calendar-mock">
                <div className="showcase-slots-list">
                  {slotsListToDisplay.map((slot, index) => (
                    <div 
                      key={index}
                      className={`showcase-slot-row ${selectedSlot === index ? 'showcase-slot-row--selected' : ''}`}
                      onClick={() => setSelectedSlot(index)}
                    >
                      <div>
                        <div className="showcase-slot-time">{slot.time}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                          {language === 'en' ? slot.nameEn : slot.nameVi}
                        </div>
                      </div>
                      <div className="showcase-slot-info">
                        {/* Brackets [] representation for slot badges */}
                        <span 
                          className={`showcase-slot-badge slot-badge-${slot.status}`} 
                          style={{ background: 'transparent', padding: 0, fontWeight: 700, fontSize: 11, letterSpacing: 0.5 }}
                        >
                          {language === 'en' ? `[${slot.badgeEn.toUpperCase()}]` : `[${slot.badgeVi.toUpperCase()}]`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Console Details Panel */}
              <div className="showcase-console">
                <div>
                  <div className="console-stat-box">
                    <span className="console-stat-title">
                      {getLabel('priceLabel')}
                    </span>
                    <div className="console-stat-value text-accent">
                      {language === 'en' ? activeSlotData.priceEn : activeSlotData.priceVi}
                    </div>
                  </div>

                  <div className="console-stat-box">
                    <span className="console-stat-title">
                      {getLabel('descLabel')}
                    </span>
                    <p className="console-desc">
                      {language === 'en' ? activeSlotData.descEn : activeSlotData.descVi}
                    </p>
                  </div>
                </div>

                <div>
                  {activeSlotData.status === 'conflict' ? (
                    <div className="console-conflict-alert">
                      <div style={{ fontWeight: 800, marginBottom: 4, letterSpacing: 0.5 }}>
                        {getLabel('collAlert')}
                      </div>
                      <div>
                        {getLabel('collDesc')}
                      </div>
                    </div>
                  ) : activeSlotData.status === 'available' ? (
                    <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onLaunch}>
                      {getLabel('rentBtn')}
                    </button>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {getLabel('activeStatus')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* STATS TICKER */}
      <section className="stats-ticker-grid reveal-on-scroll">
        <div className="ticker-card glass-card">
          <div className="ticker-value">94%</div>
          <div className="ticker-label">{t('home.statOccupancy')}</div>
        </div>
        <div className="ticker-card glass-card">
          <div className="ticker-value">12,450+</div>
          <div className="ticker-label">{t('home.statSlots')}</div>
        </div>
        <div className="ticker-card glass-card">
          <div className="ticker-value">120+</div>
          <div className="ticker-label">{t('home.statSpaces')}</div>
        </div>
      </section>

      {/* FEATURES SECTION (BENTO GRID SYSTEM) */}
      <section id="features" className="features-section reveal-on-scroll">
        <h2 className="section-title">{t('home.featTitle')}</h2>
        <p className="section-subtitle">{t('home.featSub')}</p>
 
        <div className="features-bento-grid">
          <div className="feature-card feature-card--large glass-card stagger-item">
            <div className="feature-card-content">
              <div className="feature-card-number">01</div>
              <h3 className="feature-card-title">{t('home.feat1Title')}</h3>
              <p className="feature-card-desc">{t('home.feat1Desc')}</p>
            </div>
            {/* Visual calendar representation */}
            <div className="feature-bento-visual-slots">
              <div className="bento-slot-bar booked">08:00 - 12:00 [FS]</div>
              <div className="bento-slot-bar available">13:00 - 17:00 [AVAILABLE]</div>
              <div className="bento-slot-bar booked">18:00 - 22:00 [TC]</div>
            </div>
          </div>
 
          <div className="feature-card feature-card--accent glass-card stagger-item">
            <div className="feature-card-content">
              <div className="feature-card-number">02</div>
              <h3 className="feature-card-title">{t('home.feat2Title')}</h3>
              <p className="feature-card-desc">{t('home.feat2Desc')}</p>
            </div>
            {/* Visual terminal representation */}
            <div className="feature-bento-visual-terminal">
              <div className="terminal-header">
                <span className="terminal-dot"></span>
                <span className="terminal-dot"></span>
                <span className="terminal-dot"></span>
              </div>
              <div className="terminal-body">
                <span>$ etherspace-ai check --schedule</span>
                <span className="text-secondary">&gt; MATCHING CONFLICT CODES...</span>
                <span className="text-positive">&gt; [OK] NO SHIFT INTERSECTION DETECTED</span>
              </div>
            </div>
          </div>
 
          <div className="feature-card feature-card--dark glass-card stagger-item">
            <div className="feature-card-content">
              <div className="feature-card-number">03</div>
              <h3 className="feature-card-title">{t('home.feat3Title')}</h3>
              <p className="feature-card-desc">{t('home.feat3Desc')}</p>
            </div>
          </div>
 
          <div className="feature-card feature-card--split glass-card stagger-item">
            <div className="feature-card-content">
              <div className="feature-card-number">04</div>
              <h3 className="feature-card-title">{t('home.feat4Title')}</h3>
              <p className="feature-card-desc">{t('home.feat4Desc')}</p>
            </div>
            {/* Visual role badges */}
            <div className="feature-bento-roles">
              <span className="bento-role-badge">[SO] {t('app.ownerTitle').toUpperCase()}</span>
              <span className="bento-role-badge">[PT] {t('app.renterTitle').toUpperCase()}</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION (TIMELINE) */}
      <section id="how-it-works" className="how-it-works-section reveal-on-scroll">
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

        {/* Timeline representation */}
        <div className="timeline-container">
          <div className="timeline-connector" />

          {activeRoleTab === 'owner' ? (
            <>
              <div className="timeline-step">
                <div className="step-node">1</div>
                <div className="step-info-card glass-card">
                  <h4 className="step-title">{t('home.step1OwnerTitle')}</h4>
                  <p className="step-desc">{t('home.step1OwnerDesc')}</p>
                </div>
              </div>

              <div className="timeline-step">
                <div className="step-node">2</div>
                <div className="step-info-card glass-card">
                  <h4 className="step-title">{t('home.step2OwnerTitle')}</h4>
                  <p className="step-desc">{t('home.step2OwnerDesc')}</p>
                </div>
              </div>

              <div className="timeline-step">
                <div className="step-node">3</div>
                <div className="step-info-card glass-card">
                  <h4 className="step-title">{t('home.step3OwnerTitle')}</h4>
                  <p className="step-desc">{t('home.step3OwnerDesc')}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="timeline-step">
                <div className="step-node">1</div>
                <div className="step-info-card glass-card">
                  <h4 className="step-title">{t('home.step1RenterTitle')}</h4>
                  <p className="step-desc">{t('home.step1RenterDesc')}</p>
                </div>
              </div>

              <div className="timeline-step">
                <div className="step-node">2</div>
                <div className="step-info-card glass-card">
                  <h4 className="step-title">{t('home.step2RenterTitle')}</h4>
                  <p className="step-desc">{t('home.step2RenterDesc')}</p>
                </div>
              </div>

              <div className="timeline-step">
                <div className="step-node">3</div>
                <div className="step-info-card glass-card">
                  <h4 className="step-title">{t('home.step3RenterTitle')}</h4>
                  <p className="step-desc">{t('home.step3RenterDesc')}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* PRICING SECTION (TYPOGRAPHIC BULLET POINTS) */}
      <section id="pricing" className="pricing-section reveal-on-scroll">
        <h2 className="section-title">
          {language === 'en' ? 'Transparent Subscription Plans' : 'Bảng Giá Dịch Vụ Minh Bạch'}
        </h2>
        <p className="section-subtitle">
          {language === 'en' ? 'Select a suitable tier to scale your retail locations.' : 'Lựa chọn gói dịch vụ phù hợp để tối ưu hóa địa điểm bán lẻ của bạn.'}
        </p>

        <div className="pricing-grid">
          {currentPricing.map((tier, idx) => (
            <div key={idx} className={`pricing-card glass-card ${tier.popular ? 'pricing-card--popular' : ''}`}>
              <div>
                <h3 className="pricing-card-title">{tier.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>{tier.desc}</p>
              </div>

              <div>
                <span className="pricing-card-price">{tier.price}</span>
                {tier.period && <span className="pricing-price-period"> {tier.period}</span>}
              </div>

              <ul className="pricing-features-list">
                {tier.features.map((feat, fidx) => (
                  <li key={fidx} className="pricing-feature-item" style={{ gap: 8 }}>
                    <span style={{ color: 'var(--color-positive)', fontWeight: 700 }}>+</span>
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

      {/* FOOTER */}
      <footer className="homepage-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo-container">
              <div className="logo-symbol">E</div>
              <span className="logo-text">EtherSpace</span>
            </div>
            <p className="footer-desc">{t('home.footerText')}</p>
          </div>

          <div className="footer-links-grid">
            <div className="footer-column">
              <span className="footer-column-title">{language === 'en' ? 'Platform' : 'Nền tảng'}</span>
              <span className="footer-link" onClick={() => scrollToSection('hero')}>{language === 'en' ? 'SEARCH' : 'TÌM KIẾM'}</span>
              <span className="footer-link" onClick={() => scrollToSection('features')}>{t('home.navFeatures').toUpperCase()}</span>
              <span className="footer-link" onClick={() => scrollToSection('how-it-works')}>{t('home.navHowItWorks').toUpperCase()}</span>
            </div>

            <div className="footer-column">
              <span className="footer-column-title">{language === 'en' ? 'Security' : 'Bảo mật'}</span>
              <span className="footer-link">AI GUARD™</span>
              <span className="footer-link">ESCROW WALLET</span>
              <span className="footer-link">SMART CONTRACTS</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} EtherSpace. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 16 }}>
            <span>Network: EtherMainnet v1.0.4</span>
            <span>Latency: 12ms</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Static pricing plans data helper
const pricingTiers = {
  en: [
    {
      name: 'Starter',
      price: 'Free',
      period: 'for trial',
      desc: 'Ideal for trying out the hourly subleasing model.',
      features: [
        'Register up to 1 physical space',
        'Basic hourly calendar scheduler',
        'Manual sub-tenant validation',
        'Standard platform transaction fee (5%)'
      ],
      btn: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Professional',
      price: '1,200,000 VND',
      period: '/ month',
      desc: 'Perfect for primary tenants actively optimizing store hours.',
      features: [
        'Unlimited registered spaces',
        'AI Conflict check & calendar auto-review',
        'Digital contract & automated VAT billing',
        'Reduced platform transaction fee (2.5%)',
        'Priority customer support 24/7'
      ],
      btn: 'Go Pro Now',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom Pricing',
      period: '',
      desc: 'For commercial developers and large-scale coworking chains.',
      features: [
        'Bulk asset API registration',
        'Custom white-label sublease widgets',
        'Escrow custom configurations',
        'Dedicated account manager',
        '0% platform transaction fee options'
      ],
      btn: 'Contact Sales',
      popular: false
    }
  ],
  vi: [
    {
      name: 'Cơ Bản',
      price: 'Miễn Phí',
      period: 'trải nghiệm',
      desc: 'Dành cho việc thử nghiệm mô hình chia sẻ theo giờ.',
      features: [
        'Đăng ký tối đa 1 mặt bằng vật lý',
        'Lịch chia slot theo giờ cơ bản',
        'Kiểm duyệt người thuê thủ công',
        'Phí giao dịch tiêu chuẩn (5%)'
      ],
      btn: 'Bắt Đầu Trải Nghiệm',
      popular: false
    },
    {
      name: 'Chuyên Nghiệp',
      price: '1.200.000 đ',
      period: '/ tháng',
      desc: 'Phù hợp nhất cho Khách thuê chính tối ưu hóa giờ mở cửa.',
      features: [
        'Không giới hạn số lượng mặt bằng',
        'Hệ thống AI tự động rà soát lịch chống xung đột',
        'Hợp đồng số hóa & hóa đơn VAT tự động',
        'Giảm phí giao dịch nền tảng (còn 2.5%)',
        'Hỗ trợ kỹ thuật ưu tiên 24/7'
      ],
      btn: 'Nâng Cấp Pro Ngay',
      popular: true
    },
    {
      name: 'Doanh Nghiệp',
      price: 'Liên Hệ',
      period: '',
      desc: 'Dành cho các chủ đầu tư tòa nhà hoặc chuỗi không gian lớn.',
      features: [
        'Đăng ký hàng loạt mặt bằng qua API',
        'Giao diện Widget cho thuê riêng (White-label)',
        'Tùy chỉnh luồng ví ký quỹ giao dịch',
        'Quản lý tài khoản chuyên trách riêng',
        'Hỗ trợ mức phí giao dịch nền tảng 0%'
      ],
      btn: 'Liên Hệ Đội Ngũ',
      popular: false
    }
  ]
};
