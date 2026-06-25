import React from 'react';
import { Users, Building, FileText, DollarSign, Activity } from 'lucide-react';
import type { SystemStat } from '../types';

interface OverviewModuleProps {
  stats: SystemStat;
  language: 'en' | 'vi';
}

export const OverviewModule: React.FC<OverviewModuleProps> = ({ stats, language }) => {
  return (
    <div className="admin-module animate-fade-in">
      <header className="module-header">
        <h1>{language === 'en' ? 'System Overview' : 'Tổng quan Hệ thống'}</h1>
        <p>{language === 'en' ? 'Live analytics and nodes monitoring' : 'Thông số hoạt động và phân tích trực tiếp'}</p>
      </header>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper blue"><Users size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'ACTIVE USERS' : 'NGƯỜI DÙNG HOẠT ĐỘNG'}</span>
            <h2 className="stat-value">{stats.totalUsers}</h2>
          </div>
        </div>

        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper green"><Building size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'VERIFIED SPACES' : 'MẶT BẰNG ĐÃ XÁC MINH'}</span>
            <h2 className="stat-value">{stats.totalSpaces}</h2>
          </div>
        </div>

        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper orange"><FileText size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'PUBLISHED LISTINGS' : 'TIN ĐĂNG CHO THUÊ'}</span>
            <h2 className="stat-value">{stats.totalListings}</h2>
          </div>
        </div>

        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper purple"><DollarSign size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'ESTIMATED VOLUME' : 'TỔNG DOANH THU'}</span>
            <h2 className="stat-value">{(stats.totalRevenue).toLocaleString('vi-VN')} đ</h2>
          </div>
        </div>
      </div>

      {/* Activity Block */}
      <div className="admin-activity-section glass-card">
        <div className="section-title-row">
          <Activity size={18} className="text-neon-green" />
          <h3>{language === 'en' ? 'Realtime Node Analytics' : 'Biểu đồ hoạt động hệ thống'}</h3>
        </div>
        <div className="simulated-chart">
          <div className="chart-bar-container">
            <div className="chart-bar" style={{ height: '70%' }}><span className="bar-label">May</span></div>
            <div className="chart-bar" style={{ height: '85%' }}><span className="bar-label">Jun</span></div>
            <div className="chart-bar" style={{ height: '60%' }}><span className="bar-label">Jul</span></div>
            <div className="chart-bar" style={{ height: '90%' }}><span className="bar-label">Aug</span></div>
            <div className="chart-bar active" style={{ height: '95%' }}><span className="bar-label">Current</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
