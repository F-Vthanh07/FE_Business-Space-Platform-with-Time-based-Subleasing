/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/features/homepage/Homepage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { MapComponent } from './components/MapComponent';

// Components dùng chung
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { SidebarNav } from '../../components/SidebarNav';

// 3 Component vừa chia nhỏ
import { HomeSearchBar } from './components/HomeSearchBar';
import { HomeListings } from './components/HomeListings';
import { ScheduleSidebar } from './components/ScheduleSidebar';

import './Homepage.css';

interface HomepageProps {
  onLaunch: () => void;
}

export const Homepage: React.FC<HomepageProps> = ({ onLaunch: _onLaunch }) => {
  const { t } = useThemeLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  // State bật/tắt Map
  const [isMapMode, setIsMapMode] = useState(false);

  // State cho phần Listing
  const [selectedVenueId, setSelectedVenueId] = useState<string>('FS1');

  // State cho phần How it works
  const [activeRoleTab, setActiveRoleTab] = useState<'owner' | 'renter'>('owner');

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
      <SidebarNav />
      <Header />

      {/* =========================================
          KHU VỰC TÌM KIẾM & DANH SÁCH
          ========================================= */}
      <div id="search-nav">
        <HomeSearchBar
          isMapMode={isMapMode}
          onToggleMap={() => setIsMapMode((prev) => !prev)}
        />

        {/* GRID LAYOUT CHIA ĐÔI MÀN HÌNH */}
        <div className={`listings-layout ${isMapMode ? 'map-active' : ''}`}>

          {/* CỘT TRÁI: Danh sách listing (thu lại khi bật map) */}
          <HomeListings
            selectedId={selectedVenueId}
            onCardClick={(id) => setSelectedVenueId(id)}
          />

          {/* CỘT PHẢI: Sidebar hoặc Bản đồ */}
          <div className="right-sidebar-column">
            {isMapMode ? (
              <div className="map-view-container">
                <MapComponent />
              </div>
            ) : (
              <div className="right-sidebar-content">
                <ScheduleSidebar />
              </div>
            )}
          </div>

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