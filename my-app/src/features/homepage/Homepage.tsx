/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/features/homepage/Homepage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { API_BASE_URL } from '../../config/api';
import { MapComponent } from './components/MapComponent';

// Components dùng chung
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

import { HomeListings } from './components/HomeListings';
import heroImage from '../../assets/hero.png';

import './Homepage.css';

interface HomepageProps {
  onLaunch: () => void;
}

interface HomepageBanner {
  id: number | string;
  title: string;
  description: string;
  imageUrl: string;
  listingId?: number | null;
}

const unwrapApiList = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.result)) return value.result;
  if (Array.isArray(value?.value)) return value.value;
  if (Array.isArray(value?.Value)) return value.Value;
  return [];
};

const getPictureUrl = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return (
    value.url ||
    value.pictureUrl ||
    value.imageUrl ||
    value.fileUrl ||
    value.path ||
    value.secureUrl ||
    ''
  );
};

const getBannerImageUrl = (banner: any): string => {
  const directUrl = getPictureUrl(banner);
  if (directUrl) return directUrl;
  const collections = [
    banner.bannerPictures,
    banner.pictures,
    banner.images,
    banner.bannerPicture,
    banner.picture,
  ];
  for (const collection of collections) {
    if (Array.isArray(collection) && collection.length > 0) {
      const url = getPictureUrl(collection[0]);
      if (url) return url;
    }
    const url = getPictureUrl(collection);
    if (url) return url;
  }
  return '';
};

export const Homepage: React.FC<HomepageProps> = ({ onLaunch: _onLaunch }) => {
  const { t } = useThemeLanguage();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [banners, setBanners] = useState<HomepageBanner[]>([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  // State bật/tắt Map
  const [isMapMode, setIsMapMode] = useState(false);

  // State cho phần Listing
  const [selectedVenueId, setSelectedVenueId] = useState<string>('FS1');

  // State cho phần How it works
  const [activeRoleTab, setActiveRoleTab] = useState<'owner' | 'renter'>('owner');

  useEffect(() => {
    let isMounted = true;

    const fetchBanners = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/Banner/GetAll`, {
          headers: { accept: '*/*' },
        });
        if (!res.ok) throw new Error('Failed to fetch banners');
        const data = await res.json();
        const mapped = unwrapApiList(data)
          .map((item: any, index: number) => ({
            id: item.id ?? item.bannerId ?? index,
            title: item.title ?? item.name ?? '',
            description: item.description ?? '',
            imageUrl: getBannerImageUrl(item) || heroImage,
            listingId: item.listingId ?? item.ListingId ?? item.listing?.id ?? null,
          }))
          .filter((item: HomepageBanner) => item.title || item.description || item.imageUrl);

        if (isMounted) {
          setBanners(mapped);
          setActiveBannerIndex(0);
        }
      } catch (err) {
        console.warn('Cannot load homepage banners.', err);
      }
    };

    fetchBanners();

    return () => {
      isMounted = false;
    };
  }, []);

  const goToBanner = (direction: -1 | 1) => {
    setActiveBannerIndex((current) => {
      if (banners.length === 0) return 0;
      return (current + direction + banners.length) % banners.length;
    });
  };

  // GSAP Animations — chạy lần đầu load trang
  useEffect(() => {
    if (!containerRef.current) return;

    // BỌC TOÀN BỘ VÀO gsap.context() ĐỂ CHỐNG RÒ RỈ BỘ NHỚ
    let ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.fromTo(
        '.home-search-wrapper',
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
      );
      tl.fromTo(
        '.gsap-listing-card',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.2)' },
        '-=0.2'
      );
      tl.fromTo(
        '.right-sidebar-column',
        { x: 30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
        '-=0.5'
      );
    }, containerRef); // Gắn context vào container

    // Scroll Reveal cho các sections bên dưới
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
      ctx.revert(); // <--- DỌN RÁC GSAP KHI UNMOUNT (Quan trọng nhất)
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // GSAP Animation khi toggle Map/List
  // GSAP Animation khi toggle Map/List
  useEffect(() => {
    let ctx = gsap.context(() => {
      if (isMapMode) {
        gsap.fromTo(
          '.map-view-container',
          { x: 50, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
        );
      } else {
        gsap.fromTo(
          '.right-sidebar-content',
          { opacity: 0, scale: 0.98 },
          { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }
        );
      }
    }, containerRef);

    return () => ctx.revert(); // Dọn dẹp
  }, [isMapMode]);

  return (
    <div className="homepage-wrapper" ref={containerRef}>
      <Header />

      {banners.length > 0 && (
        <section className="home-banner-carousel" aria-label="Featured banners">
          <div
            className="home-banner-track"
            style={{ transform: `translateX(-${activeBannerIndex * 100}%)` }}
          >
            {banners.map((banner) => (
              <article
                className="home-banner-slide"
                key={banner.id}
                onClick={() => {
                  if (banner.listingId) navigate(`/listing/${banner.listingId}`);
                }}
                style={{ cursor: banner.listingId ? 'pointer' : 'default' }}
              >
                <img src={banner.imageUrl} alt="" />
                <div className="home-banner-shade" />
                <div className="home-banner-content">
                  <h1>{banner.title}</h1>
                  {banner.description && <p>{banner.description}</p>}
                </div>
              </article>
            ))}
          </div>

          {banners.length > 1 && (
            <>
              <button
                type="button"
                className="home-banner-nav home-banner-nav--prev"
                onClick={() => goToBanner(-1)}
                aria-label="Previous banner"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                className="home-banner-nav home-banner-nav--next"
                onClick={() => goToBanner(1)}
                aria-label="Next banner"
              >
                <ChevronRight size={22} />
              </button>
              <div className="home-banner-dots">
                {banners.map((banner, index) => (
                  <button
                    key={banner.id}
                    type="button"
                    className={index === activeBannerIndex ? 'active' : ''}
                    onClick={() => setActiveBannerIndex(index)}
                    aria-label={`Go to banner ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* =========================================
          KHU VỰC TÌM KIẾM & DANH SÁCH
          ========================================= */}
      <div id="search-nav">
        {/* GRID LAYOUT CHIA ĐÔI MÀN HÌNH */}
        <div className={`listings-layout ${isMapMode ? 'map-active' : ''}`}>

          {/* CỘT TRÁI: Danh sách listing (thu lại khi bật map) */}
          <HomeListings
            selectedId={selectedVenueId}
            onCardClick={(id) => setSelectedVenueId(id)}
            isMapMode={isMapMode}
            onToggleMap={() => setIsMapMode((prev) => !prev)}
          />

          {/* CỘT PHẢI: Bản đồ (khi bật map) */}
          {isMapMode && (
            <div className="right-sidebar-column">
              <div className="map-view-container">
                <MapComponent />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* =========================================
          SECTION 2: HOW IT WORKS
          ========================================= */}
      <section id="how-it-works" className="how-it-works-section reveal-on-scroll">
        <h2 className="section-title">{t('home.howTitle')}</h2>

        <div className="role-tabs">
          <button
            className={`role-tab-btn ${activeRoleTab === 'owner' ? 'role-tab-btn--active' : ''}`}
            onClick={() => setActiveRoleTab('owner')}
          >
            {t('home.howOwner')?.toUpperCase()}
          </button>
          <button
            className={`role-tab-btn ${activeRoleTab === 'renter' ? 'role-tab-btn--active' : ''}`}
            onClick={() => setActiveRoleTab('renter')}
          >
            {t('home.howRenter')?.toUpperCase()}
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

      <Footer />
    </div>
  );
};
