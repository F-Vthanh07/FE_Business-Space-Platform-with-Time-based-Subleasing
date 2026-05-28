import React, { useState } from 'react';
import {
  TrendingUp,
  Lock,
  Zap,
  RefreshCw,
  ArrowUpRight,
  BarChart3,
  Star,
  ExternalLink,
} from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import './OwnerOverview.css';

export const OwnerOverview: React.FC = () => {
  const [activeMarketTab, setActiveMarketTab] = useState<'24h' | '7d'>('24h');
  const { t, language } = useThemeLanguage();

  // Dữ liệu mô phỏng giống ảnh mẫu
  const liveFlowBars = [
    { height: '35%' },
    { height: '55%' },
    { height: '40%' },
    { height: '80%' },
    { height: '65%' },
    { height: '45%' },
    { height: '50%' },
    { height: '70%' },
  ];

  return (
    <div className="owner-overview animate-in">
      <div className="dashboard-grid">
        
        {/* CỘT TRÁI - GỒM THẺ HERO VÀ THẺ MARKET SENTIMENT */}
        <div className="grid-left-col">
          
          {/* THẺ HERO: Portfolio Architecture */}
          <div className="glass-card hero-card">
            <span className="label-caps label-hero">{t('overview.portfolioArchitecture')}</span>
            <h1 className="hero-title">{t('overview.tactileAtmosphere')}</h1>
            <p className="hero-desc text-secondary">
              {t('overview.tactileDesc')}
            </p>
            
            {/* Hai thẻ con dập chìm bên dưới Hero */}
            <div className="hero-inset-cards">
              
              {/* Card 1: TOTAL ESTIMATED REVENUE */}
              <div className="glass-card--inset inset-stat-card">
                <span className="label-caps inset-card-label">{t('overview.totalLiquidity')}</span>
                <h2 className="inset-card-value">
                  {language === 'en' ? '185.4M VND' : '185,4tr ₫'}
                </h2>
                <div className="inset-card-change text-positive">
                  <TrendingUp size={12} />
                  <span>+12.4%</span>
                </div>
              </div>
              
              {/* Card 2: ACTIVE SPACES */}
              <div className="glass-card--inset inset-stat-card">
                <span className="label-caps inset-card-label">{t('overview.activeStakes')}</span>
                <h2 className="inset-card-value">
                  3 <span className="value-unit">{language === 'en' ? 'Spaces' : 'Mặt bằng'}</span>
                </h2>
                <div className="inset-card-change text-muted">
                  <RefreshCw size={11} className="spin-slow" />
                  <span>{t('overview.processing')}</span>
                </div>
              </div>
              
            </div>
          </div>
          
          {/* THẺ MARKET SENTIMENT */}
          <div className="glass-card market-card">
            <div className="market-card-header">
              <h2 className="market-title">{t('overview.marketSentiment')}</h2>
              
              {/* Tab selector dập chìm */}
              <div className="glass-card--inset tab-selector-inset">
                <button 
                  className={`tab-btn-inset ${activeMarketTab === '24h' ? 'tab-btn-inset--active' : ''}`}
                  onClick={() => setActiveMarketTab('24h')}
                >
                  24H
                </button>
                <button 
                  className={`tab-btn-inset ${activeMarketTab === '7d' ? 'tab-btn-inset--active' : ''}`}
                  onClick={() => setActiveMarketTab('7d')}
                >
                  7D
                </button>
              </div>
            </div>
            
            {/* Danh sách 3 hàng dập chìm */}
            <div className="market-list">
              
              {/* Space 1 Row */}
              <div className="glass-card--inset market-row">
                <div className="market-row-left">
                  <div className="coin-icon icon-btc" style={{ background: '#E58C3A' }}>
                    <span>L</span>
                  </div>
                  <div className="coin-meta">
                    <span className="coin-name">{language === 'en' ? 'Le Loi Dist 1' : 'Lê Lợi Q1'}</span>
                    <span className="coin-symbol">{language === 'en' ? '45 m² / Retail' : '45 m² / Cửa hàng'}</span>
                  </div>
                </div>
                <div className="market-row-right">
                  <span className="coin-price">{language === 'en' ? '25.0M VND' : '25.0tr ₫'}</span>
                  <span className="coin-change text-positive">{language === 'en' ? '92% occupancy' : '92% lấp đầy'}</span>
                </div>
              </div>
              
              {/* Space 2 Row */}
              <div className="glass-card--inset market-row">
                <div className="market-row-left">
                  <div className="coin-icon icon-eth" style={{ background: '#6C5CE7' }}>
                    <span>P</span>
                  </div>
                  <div className="coin-meta">
                    <span className="coin-name">{language === 'en' ? 'Phan Dinh Phung Shop' : 'Shop Phan Đình Phùng'}</span>
                    <span className="coin-symbol">{language === 'en' ? '30 m² / Cafe' : '30 m² / Cà phê'}</span>
                  </div>
                </div>
                <div className="market-row-right">
                  <span className="coin-price">{language === 'en' ? '15.5M VND' : '15.5tr ₫'}</span>
                  <span className="coin-change text-positive">{language === 'en' ? '80% occupancy' : '80% lấp đầy'}</span>
                </div>
              </div>
              
              {/* Space 3 Row */}
              <div className="glass-card--inset market-row">
                <div className="market-row-left">
                  <div className="coin-icon icon-sol" style={{ background: '#10AC84' }}>
                    <span>Q</span>
                  </div>
                  <div className="coin-meta">
                    <span className="coin-name">{language === 'en' ? 'Quang Trung GV' : 'Quang Trung GV'}</span>
                    <span className="coin-symbol">{language === 'en' ? '18 m² / Kiosk' : '18 m² / Ki-ốt'}</span>
                  </div>
                </div>
                <div className="market-row-right">
                  <span className="coin-price">{language === 'en' ? '7.2M VND' : '7.2tr ₫'}</span>
                  <span className="coin-change text-negative">{language === 'en' ? '65% occupancy' : '65% lấp đầy'}</span>
                </div>
              </div>
              
            </div>
          </div>
          
        </div>
        
        {/* CỘT PHẢI - BIỂU ĐỒ, THẺ CON, INSIGHTS VÀ UPGRADE */}
        <div className="grid-right-col">
          
          {/* BIỂU ĐỒ LIVE FLOW */}
          <div className="glass-card live-flow-card">
            <div className="live-flow-header">
              <BarChart3 size={15} className="text-secondary" />
              <span className="label-caps">{t('overview.liveFlow')}</span>
            </div>
            
            <div className="live-flow-chart-wrap">
              {liveFlowBars.map((bar, i) => (
                <div key={i} className="chart-bar-container">
                  <div className="chart-bar" style={{ height: bar.height }} />
                </div>
              ))}
            </div>
          </div>
          
          {/* HAI THẺ VUÔNG NHỎ (VAULT & GAS FEE) */}
          <div className="square-cards-row">
            
            {/* Card 1: VAULT */}
            <div className="glass-card square-card">
              <Lock size={14} className="text-secondary square-card-icon" />
              <div className="square-card-content">
                <span className="label-caps square-card-label">{t('overview.vault')}</span>
                <span className="square-card-value">
                  3 {language === 'en' ? 'Active' : 'Hoạt động'}
                </span>
              </div>
            </div>
            
            {/* Card 2: GAS FEE */}
            <div className="glass-card square-card">
              <Zap size={14} className="text-secondary square-card-icon" />
              <div className="square-card-content">
                <span className="label-caps square-card-label">{t('overview.gasFee')}</span>
                <span className="square-card-value">10%</span>
              </div>
            </div>
            
          </div>
          
          {/* THẺ MANAGE TEAM */}
          <div className="glass-card team-card">
            <div className="team-avatars">
              <div className="team-avatar-img avatar-1">A</div>
              <div className="team-avatar-img avatar-2">B</div>
              <div className="team-avatar-img avatar-3">C</div>
            </div>
            <button className="team-link-btn">
              {t('overview.manageTeam')} <ArrowUpRight size={12} style={{ marginLeft: 2 }} />
            </button>
          </div>
          
          {/* THẺ ALPHA INSIGHTS */}
          <div className="glass-card insights-card">
            <div className="insights-wave-bg" />
            <div className="insights-content">
              <h3 className="insights-title">{t('overview.alphaInsights')}</h3>
              <p className="insights-desc text-secondary">
                {t('overview.alphaInsightsDesc')}
              </p>
              <a href="#read" className="insights-link">
                <span>{t('overview.readReport')}</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
          
          {/* THẺ UPGRADE TO ELITE */}
          <div className="glass-card upgrade-card">
            <div className="upgrade-icon-wrap">
              <Star size={16} className="star-glow" />
            </div>
            <h3 className="upgrade-title">{t('overview.upgradeToElite')}</h3>
            <p className="upgrade-subtitle">{t('overview.unlockAdvancedNodes')}</p>
          </div>
          
        </div>
        
      </div>
    </div>
  );
};
