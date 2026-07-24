/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import {
  Wallet,
  Building2,
  FileText,
  ScrollText,
  Inbox,
  ArrowUpRight,
  Plus,
  Clock,
  Lightbulb,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  User,
  MapPin,
  Eye,
} from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import { useIdentityVerification } from '../../identity-verification';
import { fetchWalletAccount } from '../../wallet/api/wallet.api';
import { formatVnd } from '../../wallet/utils/format';
import { API_BASE_URL } from '../../../config/api';
import './OwnerOverview.css';

interface OwnerOverviewProps {
  onNavigate?: (page: string) => void;
}

interface DashboardSpace {
  id: number;
  name: string;
  address: string;
  area: string;
  isActive: boolean;
}

interface DashboardListing {
  id: number;
  title?: string;
  location?: string;
  address?: string;
  price?: number;
  status?: string;
  description?: string;
  listingPictures?: any[];
}

interface PendingBooking {
  id: string;
  lesseeId?: string;
  lesseeName?: string;
  lesseeEmail?: string;
  spaceName?: string;
  listingTitle?: string;
  createdAt?: string;
  status?: string;
}

export const OwnerOverview: React.FC<OwnerOverviewProps> = ({ onNavigate }) => {
  const { t, language } = useThemeLanguage();
  const { isVerified } = useIdentityVerification();

  // User info from localStorage
  const userName = localStorage.getItem('portal_user_name') || localStorage.getItem('portal_email')?.split('@')[0] || 'User';

  // Dashboard data states
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [spacesData, setSpacesData] = useState<DashboardSpace[]>([]);
  const [contractsCount, setContractsCount] = useState<number | null>(null);
  const [listingsData, setListingsData] = useState<DashboardListing[]>([]);
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Derived counts
  const spacesCount = spacesData.length;
  const listingsCount = listingsData.length;

  const token = localStorage.getItem('portal_token') || '';
  const currentUserId = localStorage.getItem('current_user_id') || '';

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);

      // Fetch all data in parallel – catch individually so one failure doesn't block others
      const [walletResult, spacesResult, contractsResult, listingsResult, bookingsResult] =
        await Promise.allSettled([
          // 1. Wallet balance
          fetchWalletAccount(token).then((a) => a.balance),

          // 2. My spaces (full array)
          fetch(`${API_BASE_URL}/api/Space/owner`, {
            headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
          }).then(async (r) => {
            if (!r.ok) return [] as DashboardSpace[];
            const d = await r.json();
            return (Array.isArray(d) ? d : d?.data || d?.items || []) as DashboardSpace[];
          }),

          // 3. My contracts count
          fetch(`${API_BASE_URL}/api/PrimaryBookingRequest/user/my-contracts`, {
            headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
          }).then(async (r) => {
            if (!r.ok) return 0;
            const d = await r.json();
            const arr = Array.isArray(d) ? d : d?.data || d?.items || [];
            return arr.length;
          }),

          // 4. My listings (full array)
          fetch(`${API_BASE_URL}/api/Listing/mine`, {
            headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
          }).then(async (r) => {
            if (!r.ok) return [] as DashboardListing[];
            const d = await r.json();
            return (Array.isArray(d) ? d : d?.data || d?.items || []) as DashboardListing[];
          }),

          // 5. Pending booking requests (my lessor pending)
          fetch(`${API_BASE_URL}/api/PrimaryBookingRequest/GetAll?status=Pending`, {
            headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
          }).then(async (r) => {
            if (!r.ok) return [];
            const d = await r.json();
            const arr = Array.isArray(d) ? d : d?.data || d?.items || [];
            return arr
              .filter((req: any) => req.lessorId === currentUserId)
              .slice(0, 5)
              .map((req: any) => ({
                id: req.id || req.Id,
                lesseeId: req.lesseeId,
                lesseeName: req.lesseeName || req.lessee?.profileFullName || '',
                lesseeEmail: req.lesseeEmail || req.lessee?.email || '',
                spaceName: req.spaceName || req.listing?.title || req.space?.name || '',
                listingTitle: req.listingTitle || '',
                createdAt: req.createdAt || req.CreatedAt || '',
                status: req.status || 'Pending',
              }));
          }),
        ]);

      setWalletBalance(walletResult.status === 'fulfilled' ? walletResult.value : 0);
      setSpacesData(spacesResult.status === 'fulfilled' ? spacesResult.value : []);
      setContractsCount(contractsResult.status === 'fulfilled' ? contractsResult.value : 0);
      setListingsData(listingsResult.status === 'fulfilled' ? listingsResult.value : []);
      setPendingBookings(bookingsResult.status === 'fulfilled' ? bookingsResult.value : []);
      setIsLoading(false);
    };

    loadDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const navigate = (page: string) => {
    if (onNavigate) onNavigate(page);
  };

  return (
    <div className="owner-overview animate-in">
      <div className="dashboard-grid">
        {/* ====================== LEFT COLUMN ====================== */}
        <div className="grid-left-col">
          {/* WELCOME HERO */}
          <div className="glass-card welcome-card">
            <span className="label-caps welcome-tag">{t('overview.welcomeTag')}</span>
            <div className="welcome-header">
              <div className="welcome-text">
                <h1>
                  {t('overview.welcome')} <span>{userName}</span>
                </h1>
                <p>{t('overview.welcomeDesc')}</p>
                <div
                  className={`welcome-badge ${isVerified ? 'welcome-badge--verified' : 'welcome-badge--unverified'}`}
                >
                  {isVerified ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                  {isVerified ? t('overview.verified') : t('overview.unverified')}
                </div>
              </div>
              <div className="welcome-date">{dateStr}</div>
            </div>
          </div>

          {/* STATS GRID */}
          <div className="stats-grid">
            {/* Wallet balance */}
            <div className="glass-card stat-card" onClick={() => navigate('wallet')}>
              <div className="stat-card-icon stat-card-icon--wallet">
                <Wallet size={18} />
              </div>
              <span className="label-caps stat-card-label">{t('overview.walletBalance')}</span>
              {isLoading ? (
                <div className="skeleton skeleton-value" />
              ) : (
                <span className="stat-card-value">{formatVnd(walletBalance ?? 0, language)}</span>
              )}
            </div>

            {/* Spaces */}
            <div className="glass-card stat-card" onClick={() => navigate('spaces')}>
              <div className="stat-card-icon stat-card-icon--spaces">
                <Building2 size={18} />
              </div>
              <span className="label-caps stat-card-label">{t('overview.mySpaces')}</span>
              {isLoading ? (
                <div className="skeleton skeleton-value" />
              ) : (
                <span className="stat-card-value">
                  {spacesCount}
                  <span className="stat-card-unit">{t('overview.spacesUnit')}</span>
                </span>
              )}
            </div>

            {/* Contracts */}
            <div className="glass-card stat-card" onClick={() => navigate('contracts')}>
              <div className="stat-card-icon stat-card-icon--contracts">
                <ScrollText size={18} />
              </div>
              <span className="label-caps stat-card-label">{t('overview.myContracts')}</span>
              {isLoading ? (
                <div className="skeleton skeleton-value" />
              ) : (
                <span className="stat-card-value">
                  {contractsCount ?? 0}
                  <span className="stat-card-unit">{t('overview.contractsUnit')}</span>
                </span>
              )}
            </div>

            {/* Listings */}
            <div className="glass-card stat-card" onClick={() => navigate('listings')}>
              <div className="stat-card-icon stat-card-icon--listings">
                <FileText size={18} />
              </div>
              <span className="label-caps stat-card-label">{t('overview.myListings')}</span>
              {isLoading ? (
                <div className="skeleton skeleton-value" />
              ) : (
                <span className="stat-card-value">
                  {listingsCount}
                  <span className="stat-card-unit">{t('overview.listingsUnit')}</span>
                </span>
              )}
            </div>
          </div>

          {/* PENDING BOOKING REQUESTS */}
          <div className="glass-card pending-card">
            <div className="pending-card-header">
              <h2 className="pending-card-title">
                {t('overview.pendingRequests')}
                {pendingBookings.length > 0 && (
                  <span className="pending-count-badge">{pendingBookings.length}</span>
                )}
              </h2>
              {pendingBookings.length > 0 && (
                <button className="btn-ghost" onClick={() => navigate('booking-requests')}>
                  {t('overview.viewAll')}
                  <ArrowUpRight size={14} />
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="pending-list">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-card--inset pending-item">
                    <div className="skeleton" style={{ width: '100%', height: 40, borderRadius: 8 }} />
                  </div>
                ))}
              </div>
            ) : pendingBookings.length === 0 ? (
              <div className="pending-empty">
                <div className="pending-empty-icon">
                  <CheckCircle2 size={22} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary, #fff)' }}>
                  {t('overview.noPendingRequests')}
                </h3>
                <p className="text-secondary" style={{ fontSize: 12, maxWidth: 300 }}>
                  {t('overview.noPendingDesc')}
                </p>
              </div>
            ) : (
              <div className="pending-list">
                {pendingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="glass-card--inset pending-item"
                    onClick={() => navigate('booking-requests')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="pending-item-left">
                      <div className="pending-avatar">
                        {getInitials(booking.lesseeName || booking.lesseeEmail || '')}
                      </div>
                      <div className="pending-meta">
                        <span className="pending-name">
                          {booking.lesseeName || booking.lesseeEmail || 'Unknown'}
                        </span>
                        <span className="pending-space">
                          {t('overview.requestsFor')} {booking.spaceName || booking.listingTitle || '—'}
                        </span>
                      </div>
                    </div>
                    <div className="pending-item-right">
                      <span className="pending-date">{formatDate(booking.createdAt || '')}</span>
                      <span className="pending-status">PENDING</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MY SPACES SUMMARY */}
          <div className="glass-card summary-card">
            <div className="pending-card-header">
              <h2 className="pending-card-title">
                <Building2 size={16} style={{ color: '#6C5CE7' }} />
                {t('overview.mySpaces')}
                {spacesData.length > 0 && (
                  <span className="pending-count-badge" style={{ background: 'rgba(108,92,231,0.15)', color: '#6C5CE7', borderColor: 'rgba(108,92,231,0.25)' }}>
                    {spacesData.length}
                  </span>
                )}
              </h2>
              <button className="btn-ghost" onClick={() => navigate('spaces')}>
                {t('overview.viewAll')}
                <ArrowUpRight size={14} />
              </button>
            </div>

            {isLoading ? (
              <div className="pending-list">
                {[1, 2].map((i) => (
                  <div key={i} className="glass-card--inset pending-item">
                    <div className="skeleton" style={{ width: '100%', height: 40, borderRadius: 8 }} />
                  </div>
                ))}
              </div>
            ) : spacesData.length === 0 ? (
              <div className="pending-empty">
                <div className="pending-empty-icon">
                  <Building2 size={22} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary, #fff)' }}>
                  {language === 'en' ? 'No spaces registered' : 'Chưa có mặt bằng nào'}
                </h3>
                <p className="text-secondary" style={{ fontSize: 12, maxWidth: 300 }}>
                  {language === 'en' ? 'Register your first space to start renting.' : 'Đăng ký mặt bằng đầu tiên để bắt đầu cho thuê.'}
                </p>
              </div>
            ) : (
              <div className="summary-list">
                {spacesData.slice(0, 4).map((space) => (
                  <div key={space.id} className="glass-card--inset summary-item">
                    <div className="summary-item-left">
                      <div className="summary-icon summary-icon--spaces">
                        <Building2 size={14} />
                      </div>
                      <div className="summary-meta">
                        <span className="summary-name">{space.name || (language === 'en' ? 'Unnamed space' : 'Chưa đặt tên')}</span>
                        <span className="summary-sub">
                          <MapPin size={10} />
                          {space.address || (language === 'en' ? 'No address' : 'Chưa có địa chỉ')}
                        </span>
                      </div>
                    </div>
                    <div className="summary-item-right">
                      <span className={`summary-badge ${space.isActive !== false ? 'summary-badge--active' : 'summary-badge--inactive'}`}>
                        {space.isActive !== false ? (language === 'en' ? 'Active' : 'Hoạt động') : (language === 'en' ? 'Inactive' : 'Tạm khóa')}
                      </span>
                      <button className="btn-ghost summary-view-btn" onClick={() => navigate('spaces')}>
                        <Eye size={12} />
                        {language === 'en' ? 'Detail' : 'Chi tiết'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MY LISTINGS SUMMARY */}
          <div className="glass-card summary-card">
            <div className="pending-card-header">
              <h2 className="pending-card-title">
                <FileText size={16} style={{ color: '#E58C3A' }} />
                {t('overview.myListings')}
                {listingsData.length > 0 && (
                  <span className="pending-count-badge" style={{ background: 'rgba(229,140,58,0.15)', color: '#E58C3A', borderColor: 'rgba(229,140,58,0.25)' }}>
                    {listingsData.length}
                  </span>
                )}
              </h2>
              <button className="btn-ghost" onClick={() => navigate('listings')}>
                {t('overview.viewAll')}
                <ArrowUpRight size={14} />
              </button>
            </div>

            {isLoading ? (
              <div className="pending-list">
                {[1, 2].map((i) => (
                  <div key={i} className="glass-card--inset pending-item">
                    <div className="skeleton" style={{ width: '100%', height: 40, borderRadius: 8 }} />
                  </div>
                ))}
              </div>
            ) : listingsData.length === 0 ? (
              <div className="pending-empty">
                <div className="pending-empty-icon">
                  <FileText size={22} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary, #fff)' }}>
                  {language === 'en' ? 'No listings yet' : 'Chưa có tin đăng nào'}
                </h3>
                <p className="text-secondary" style={{ fontSize: 12, maxWidth: 300 }}>
                  {language === 'en' ? 'Create your first listing to attract tenants.' : 'Tạo tin đăng đầu tiên để thu hút khách thuê.'}
                </p>
              </div>
            ) : (
              <div className="summary-list">
                {listingsData.slice(0, 4).map((listing) => {
                  const lid = listing.id || (listing as any).Id;
                  const statusLabel: Record<string, string> = {
                    published: language === 'en' ? 'Published' : 'Đang đăng',
                    pending: language === 'en' ? 'Pending' : 'Chờ duyệt',
                    draft: language === 'en' ? 'Draft' : 'Bản nháp',
                    expired: language === 'en' ? 'Expired' : 'Hết hạn',
                  };
                  const statusClass: Record<string, string> = {
                    published: 'summary-badge--active',
                    pending: 'summary-badge--pending',
                    draft: 'summary-badge--inactive',
                    expired: 'summary-badge--expired',
                  };
                  return (
                    <div key={lid} className="glass-card--inset summary-item">
                      <div className="summary-item-left">
                        <div className="summary-icon summary-icon--listings">
                          <FileText size={14} />
                        </div>
                        <div className="summary-meta">
                          <span className="summary-name">
                            {listing.location || listing.address || listing.title || (language === 'en' ? 'Unnamed listing' : 'Chưa đặt tên')}
                          </span>
                          <span className="summary-sub">
                            {listing.price ? `${listing.price.toLocaleString('vi-VN')}₫/${language === 'en' ? 'hr' : 'giờ'}` : (language === 'en' ? 'Negotiable' : 'Thỏa thuận')}
                          </span>
                        </div>
                      </div>
                      <div className="summary-item-right">
                        <span className={`summary-badge ${statusClass[listing.status || ''] || 'summary-badge--inactive'}`}>
                          {statusLabel[listing.status || ''] || listing.status || '—'}
                        </span>
                        <button className="btn-ghost summary-view-btn" onClick={() => navigate('listings')}>
                          <Eye size={12} />
                          {language === 'en' ? 'Detail' : 'Chi tiết'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ====================== RIGHT COLUMN ====================== */}
        <div className="grid-right-col">
          {/* QUICK ACTIONS */}
          <div className="glass-card quick-actions-card">
            <h3 className="quick-actions-title">{t('overview.quickActions')}</h3>
            <div className="quick-actions-grid">
              <button className="quick-action-btn" onClick={() => navigate('wallet-deposit')}>
                <div className="quick-action-icon quick-action-icon--green">
                  <Plus size={14} />
                </div>
                {t('overview.actionDeposit')}
              </button>
              <button className="quick-action-btn" onClick={() => navigate('spaces')}>
                <div className="quick-action-icon quick-action-icon--purple">
                  <Building2 size={14} />
                </div>
                {t('overview.actionNewSpace')}
              </button>
              <button className="quick-action-btn" onClick={() => navigate('listings')}>
                <div className="quick-action-icon quick-action-icon--orange">
                  <FileText size={14} />
                </div>
                {t('overview.actionNewListing')}
              </button>
              <button className="quick-action-btn" onClick={() => navigate('wallet-history')}>
                <div className="quick-action-icon quick-action-icon--cyan">
                  <Clock size={14} />
                </div>
                {t('overview.actionHistory')}
              </button>
              <button className="quick-action-btn" onClick={() => navigate('contracts')}>
                <div className="quick-action-icon quick-action-icon--blue">
                  <ScrollText size={14} />
                </div>
                {t('overview.actionContracts')}
              </button>
              <button className="quick-action-btn" onClick={() => navigate('booking-requests')}>
                <div className="quick-action-icon quick-action-icon--rose">
                  <Inbox size={14} />
                </div>
                {t('overview.actionBookings')}
              </button>
            </div>
          </div>

          {/* TIPS */}
          <div className="glass-card tips-card">
            <h3 className="tips-title">
              <Lightbulb size={15} style={{ color: '#f59e0b' }} />
              {t('overview.tipsTitle')}
            </h3>
            <div className="tips-list">
              <div className="tip-item">
                <div className="tip-icon">
                  <User size={12} />
                </div>
                <p className="tip-text">{t('overview.tip1')}</p>
              </div>
              <div className="tip-item">
                <div className="tip-icon">
                  <Clock size={12} />
                </div>
                <p className="tip-text">{t('overview.tip2')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
