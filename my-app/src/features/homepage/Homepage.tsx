/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/homepage/Homepage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';

// Components dùng chung
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { TopAgentsWidget } from './components/TopAgentsWidget'; // Import ở trên cùng
import { SidebarNav } from '../../components/SidebarNav';

// 3 Component vừa chia nhỏ (Nhớ trỏ đúng đường dẫn thư mục components nhé)
import { HomeSearchBar } from './components/HomeSearchBar';
import { HomeListings } from './components/HomeListings';
import { ScheduleSidebar } from './components/ScheduleSidebar';

// Data cũ của ông (nhớ giữ lại file demoDb chứa pricingTiers)
import { pricingTiers } from './demoDb'; 

import './Homepage.css';

interface HomepageProps {
  onLaunch: () => void;
}

export const Homepage: React.FC<HomepageProps> = ({ onLaunch }) => {
  const { language, t } = useThemeLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  // State cho phần Listing
  const [selectedVenueId, setSelectedVenueId] = useState<string>('FS1');

  // State cho phần How it works
  const [activeRoleTab, setActiveRoleTab] = useState<'owner' | 'renter'>('owner');

  // GSAP Animations (Trượt từ trên xuống)
  useEffect(() => {
    if (!containerRef.current) return;

    // Timeline cho khu vực Header, Search, Listings
    const tl = gsap.timeline();
    tl.fromTo('.home-search-section', { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
    tl.fromTo('.category-tabs-wrapper', { opacity: 0 }, { opacity: 1, duration: 0.3 }, '-=0.2');
    tl.fromTo('.gsap-listing-card', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.2)' }, '-=0.1');
    tl.fromTo('.detail-sidebar', { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.5');

    // Scroll Reveal cho các sections bên dưới (Tính năng, Quy trình, Bảng giá)
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

  const currentPricing = pricingTiers[language] || pricingTiers['en'];

  return (
    <div className="homepage-wrapper" ref={containerRef}>
      <SidebarNav />
      <Header onPostListing={onLaunch} />

      {/* =========================================
          KHU VỰC TÌM KIẾM & DANH SÁCH (ĐÃ CHIA COMPONENT)
          ========================================= */}
      <div id="search-nav">
        <HomeSearchBar />
        <div className="listings-layout">
          <HomeListings
            selectedId={selectedVenueId}
            onCardClick={(id) => setSelectedVenueId(id)}
          />
          <div className="right-sidebar-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <ScheduleSidebar />
            <TopAgentsWidget /> {/* Bảng Môi giới đặt dưới Lịch trình */}
          </div>
        </div>
      </div>

      {/* =========================================
          TRẢ LẠI 3 SECTIONS CŨ CHO ÔNG ĐÂY!
          ========================================= */}

      {/* SECTION 1: FEATURES */}
      <section id="features" className="features-section reveal-on-scroll">
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
              <span className="bento-role-badge">[SO] {t('app.ownerTitle')?.toUpperCase()}</span>
              <span className="bento-role-badge">[PT] {t('app.renterTitle')?.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: HOW IT WORKS */}
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

      {/* SECTION 3: PRICING */}
      <section id="pricing" className="pricing-section reveal-on-scroll">
        <h2 className="section-title">
          {language === 'en' ? 'Transparent Subscription Plans' : 'Bảng Giá Dịch Vụ Minh Bạch'}
        </h2>
        <p className="section-subtitle">
          {language === 'en' ? 'Select a suitable tier to scale your retail locations.' : 'Lựa chọn gói dịch vụ phù hợp để tối ưu hóa địa điểm bán lẻ của bạn.'}
        </p>

        <div className="pricing-grid">
          {currentPricing?.map((tier: any, idx: number) => (
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
                {tier.features.map((feat: string, fidx: number) => (
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