import React, { useMemo } from 'react';
import { Users, Building, FileText, Wallet, AlertTriangle, Zap, Tag, TrendingUp, ChevronRight, BarChart3 } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import type { AdminListingItem, UserAccount, AdminSpaceItem, AdminWalletAccount, PriorityLevel, BusinessCategory, ListingReportItem, AdminDashboardStats } from '../types';
import { RefreshButton } from './RefreshButton';

interface OverviewModuleProps {
  users: UserAccount[];
  listings: AdminListingItem[];
  spaces: AdminSpaceItem[];
  wallets: AdminWalletAccount[];
  priorityLevels: PriorityLevel[];
  categories: BusinessCategory[];
  reports: ListingReportItem[];
  stats: AdminDashboardStats | null;
  language: 'en' | 'vi';
  onNavigateToListingReports: () => void;
  onNavigateToUsers: () => void;
  onNavigateToSpaces: () => void;
  onNavigateToListings: () => void;
  onNavigateToWallets: () => void;
  onNavigateToPriorityLevels: () => void;
  onNavigateToCategories: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const CHART_COLORS = {
  listing: '#4A72FF',
  aiImage: '#8B5CF6',
};

export const OverviewModule: React.FC<OverviewModuleProps> = ({
  users,
  listings,
  spaces,
  wallets,
  priorityLevels,
  categories,
  reports,
  stats,
  language,
  onNavigateToListingReports,
  onNavigateToUsers,
  onNavigateToSpaces,
  onNavigateToListings,
  onNavigateToWallets,
  onNavigateToPriorityLevels,
  onNavigateToCategories,
  onRefresh,
  isRefreshing,
}) => {
  const walletsSum = useMemo(() => wallets.reduce((sum, w) => sum + (w.balance || 0), 0), [wallets]);
  const totalWalletBalance = stats?.totalWalletBalance ?? walletsSum;

  const pendingListingsCount = useMemo(
    () => listings.filter(l => (l.status || 'Pending').toLowerCase() === 'pending').length,
    [listings]
  );

  const unresolvedReportsCount = useMemo(
    () => reports.filter(r => !r.isBanned).length,
    [reports]
  );

  const activePriorityCount = useMemo(() => priorityLevels.filter(p => p.isActive).length, [priorityLevels]);
  const activeCategoryCount = useMemo(() => categories.filter(c => c.isActive).length, [categories]);

  const spendingChartData = useMemo(() => {
    if (!stats) return [];
    return [
      { key: 'listing', name: language === 'en' ? 'Listings' : 'Đăng tin', value: stats.totalListingSpent, color: CHART_COLORS.listing },
      { key: 'aiImage', name: language === 'en' ? 'AI Images' : 'Ảnh AI', value: stats.totalAiImageSpent, color: CHART_COLORS.aiImage },
    ].filter(d => d.value > 0);
  }, [stats, language]);

  const monthlyListingsChartData = useMemo(() => {
    const MONTHS_TO_SHOW = 6;
    const now = new Date();
    const buckets: { key: string; name: string; count: number }[] = [];
    for (let i = MONTHS_TO_SHOW - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const name = language === 'en'
        ? d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        : `Th${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`;
      buckets.push({ key, name, count: 0 });
    }
    const bucketIndex = new Map(buckets.map((b, idx) => [b.key, idx]));

    listings.forEach(l => {
      if (!l.createdAt) return;
      const d = new Date(l.createdAt);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const idx = bucketIndex.get(key);
      if (idx !== undefined) buckets[idx].count++;
    });

    return buckets;
  }, [listings, language]);

  const formatMoney = (n: number) => `${n.toLocaleString('vi-VN')}đ`;

  const hasAlerts = pendingListingsCount > 0 || unresolvedReportsCount > 0;

  return (
    <div className="admin-module animate-fade-in">
      <header className="module-header">
        <div>
          <h1>{language === 'en' ? 'System Overview' : 'Tổng quan Hệ thống'}</h1>
          <p>{language === 'en' ? 'Live analytics and system monitoring' : 'Thông số hoạt động và phân tích trực tiếp'}</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <button
          type="button"
          className="admin-stat-card glass-card"
          onClick={onNavigateToUsers}
          style={{ cursor: 'pointer', textAlign: 'left', border: 'none', width: '100%' }}
        >
          <div className="stat-icon-wrapper blue"><Users size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'TOTAL USERS' : 'TỔNG NGƯỜI DÙNG'}</span>
            <h2 className="stat-value">{users.length}</h2>
          </div>
        </button>

        <button
          type="button"
          className="admin-stat-card glass-card"
          onClick={onNavigateToSpaces}
          style={{ cursor: 'pointer', textAlign: 'left', border: 'none', width: '100%' }}
        >
          <div className="stat-icon-wrapper green"><Building size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'REGISTERED SPACES' : 'MẶT BẰNG ĐÃ ĐĂNG KÝ'}</span>
            <h2 className="stat-value">{spaces.length}</h2>
          </div>
        </button>

        <button
          type="button"
          className="admin-stat-card glass-card"
          onClick={onNavigateToListings}
          style={{ cursor: 'pointer', textAlign: 'left', border: 'none', width: '100%' }}
        >
          <div className="stat-icon-wrapper orange"><FileText size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'TOTAL LISTINGS' : 'TỔNG TIN ĐĂNG'}</span>
            <h2 className="stat-value">{listings.length}</h2>
          </div>
        </button>

        <button
          type="button"
          className="admin-stat-card glass-card"
          onClick={onNavigateToWallets}
          style={{ cursor: 'pointer', textAlign: 'left', border: 'none', width: '100%' }}
        >
          <div className="stat-icon-wrapper purple"><Wallet size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'TOTAL WALLET BALANCE' : 'TỔNG SỐ DƯ VÍ HỆ THỐNG'}</span>
            <h2 className="stat-value">{formatMoney(totalWalletBalance)}</h2>
          </div>
        </button>
      </div>

      {/* Alerts requiring action */}
      {hasAlerts && (
        <div className="admin-activity-section glass-card" style={{ marginBottom: '24px' }}>
          <div className="section-title-row">
            <AlertTriangle size={18} className="text-negative" />
            <h3>{language === 'en' ? 'Needs Attention' : 'Cần xử lý'}</h3>
          </div>
          <div className="admin-stats-grid" style={{ marginTop: '12px', marginBottom: 0 }}>
            {pendingListingsCount > 0 && (
              <button
                type="button"
                className="admin-stat-card glass-card--inset"
                onClick={onNavigateToListings}
                style={{ cursor: 'pointer', textAlign: 'left', border: 'none', width: '100%' }}
              >
                <div className="stat-icon-wrapper orange"><FileText size={18} /></div>
                <div className="stat-data" style={{ flex: 1 }}>
                  <span className="stat-label">{language === 'en' ? 'PENDING LISTINGS' : 'TIN ĐĂNG CHỜ DUYỆT'}</span>
                  <h2 className="stat-value">{pendingListingsCount}</h2>
                </div>
                <ChevronRight size={18} className="text-secondary" />
              </button>
            )}
            {unresolvedReportsCount > 0 && (
              <button
                type="button"
                className="admin-stat-card glass-card--inset"
                onClick={onNavigateToListingReports}
                style={{ cursor: 'pointer', textAlign: 'left', border: 'none', width: '100%' }}
              >
                <div className="stat-icon-wrapper orange"><AlertTriangle size={18} /></div>
                <div className="stat-data" style={{ flex: 1 }}>
                  <span className="stat-label">{language === 'en' ? 'REPORTED LISTINGS AWAITING REVIEW' : 'TIN ĐĂNG BỊ BÁO CÁO CHỜ XỬ LÝ'}</span>
                  <h2 className="stat-value">{unresolvedReportsCount}</h2>
                </div>
                <ChevronRight size={18} className="text-secondary" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="admin-charts-grid">
        {/* Spending breakdown pie */}
        <div className="admin-chart-card glass-card">
          <div className="section-title-row">
            <TrendingUp size={18} className="text-neon-green" />
            <h3>{language === 'en' ? 'Platform Spending' : 'Chi tiêu trên nền tảng'}</h3>
          </div>
          {!stats || spendingChartData.length === 0 ? (
            <p className="text-secondary" style={{ padding: '24px 0', textAlign: 'center' }}>
              {language === 'en' ? 'No spending data available yet.' : 'Chưa có dữ liệu chi tiêu.'}
            </p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={spendingChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {spendingChartData.map(entry => (
                      <Cell key={entry.key} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatMoney(Number(value))}
                    contentStyle={{ background: 'rgba(20,24,32,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={32} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-secondary" style={{ textAlign: 'center', fontSize: 13, marginTop: 12 }}>
                {language === 'en' ? 'Total spent: ' : 'Tổng chi tiêu: '}
                <strong className="text-neon-green">{formatMoney(stats.totalSpent)}</strong>
              </p>
            </>
          )}
        </div>

        {/* Monthly new listings bar chart */}
        <div className="admin-chart-card glass-card">
          <div className="section-title-row">
            <BarChart3 size={18} className="text-neon-green" />
            <h3>{language === 'en' ? 'New Listings by Month' : 'Tổng tin đăng theo tháng'}</h3>
          </div>
          {listings.length === 0 ? (
            <p className="text-secondary" style={{ padding: '24px 0', textAlign: 'center' }}>
              {language === 'en' ? 'No listings data available yet.' : 'Chưa có dữ liệu tin đăng.'}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyListingsChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{ background: 'rgba(20,24,32,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value) => [value, language === 'en' ? 'Listings' : 'Tin đăng']}
                />
                <Bar dataKey="count" fill={CHART_COLORS.listing} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Priority packages & categories summary */}
      <div className="admin-stats-grid" style={{ marginTop: '24px', marginBottom: 0 }}>
        <button
          type="button"
          className="admin-stat-card glass-card"
          onClick={onNavigateToPriorityLevels}
          style={{ cursor: 'pointer', textAlign: 'left', border: 'none', width: '100%' }}
        >
          <div className="stat-icon-wrapper blue"><Zap size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'ACTIVE PRIORITY PACKAGES' : 'GÓI ƯU TIÊN ĐANG HOẠT ĐỘNG'}</span>
            <h2 className="stat-value">{activePriorityCount} / {priorityLevels.length}</h2>
          </div>
        </button>

        <button
          type="button"
          className="admin-stat-card glass-card"
          onClick={onNavigateToCategories}
          style={{ cursor: 'pointer', textAlign: 'left', border: 'none', width: '100%' }}
        >
          <div className="stat-icon-wrapper green"><Tag size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'ACTIVE CATEGORIES' : 'NGÀNH NGHỀ ĐANG HOẠT ĐỘNG'}</span>
            <h2 className="stat-value">{activeCategoryCount} / {categories.length}</h2>
          </div>
        </button>
      </div>

      {/* Refresh action */}
      <div className="admin-overview-footer-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
        <RefreshButton onRefresh={onRefresh} isRefreshing={isRefreshing} language={language} />
      </div>
    </div>
  );
};
