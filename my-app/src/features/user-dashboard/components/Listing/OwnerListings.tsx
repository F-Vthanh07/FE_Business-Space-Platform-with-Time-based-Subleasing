/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  Plus, Search, Eye, Edit3, Trash2,
  Building2, MapPin, Clock, CheckCircle2, XCircle, Star, ChevronLeft, ChevronRight, X, Users, RefreshCw
} from 'lucide-react';
import './OwnerListings.css';
import "../../../shared/ModalShell.css";
import { createPortal } from 'react-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
} from 'recharts';
import { useThemeLanguage } from "../../../../context/ThemeLanguageContext";
import { ListingForm } from './ListingForm';
import { formatDate } from '../../../../utils/dateUtils';
import { getListingPictureUrl, getListingPictureUrls } from '../../../shared/listingPictures';
import { getPriceUnitText } from '../../../../utils/formatPriceUnit';
import { API_BASE_URL } from '../../../../config/api';

// Chỉ có đúng 2 status thật từ BE: Accepted / Ban
const statusConfig: Record<string, { className: string; icon: React.ReactNode; label: string }> = {
  Available: { className: 'badge--positive', icon: <CheckCircle2 size={11} />, label: 'Đang hoạt động' },
  Occupied: { className: 'badge--neutral', icon: <Clock size={11} />, label: 'Đã kí hợp đồng' },
  Expired: { className: 'badge--negative', icon: <XCircle size={11} />, label: 'Hết hạn' },
  Accepted: { className: 'badge--positive', icon: <CheckCircle2 size={11} />, label: 'Đang hoạt động' },
  Ban: { className: 'badge--negative', icon: <XCircle size={11} />, label: 'Đã bị khóa' },
};

// Chỉ có đúng 2 listingType thật từ BE: EntireSpace / SharedSpace
const isShareListing = (l: any) => l?.listingType === 'SharedSpace';

const ExpandableDescription: React.FC<{ text: string }> = ({ text }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!text) return <p style={{ margin: 0, lineHeight: '1.6', color: 'var(--color-text-secondary)' }}>Chưa có mô tả</p>;
  
  const maxLength = 250;
  const isLong = text.length > maxLength;
  const displayText = isExpanded ? text : (isLong ? `${text.slice(0, maxLength)}...` : text);

  return (
    <div style={{ margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap', color: 'var(--color-text-secondary)', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
      {displayText}
      {isLong && (
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }}
          style={{
            background: 'none', border: 'none', color: '#3b82f6',
            padding: 0, marginLeft: '6px', fontSize: '13px',
            fontWeight: 500, cursor: 'pointer'
          }}
        >
          {isExpanded ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </div>
  );
};

const formatToAmPm = (timeStr?: string) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
};

type SummaryTone = 'total' | 'active' | 'occupied' | 'expired';
type SummaryChartType = 'line' | 'area' | 'bar';
type SummaryChartPoint = { name: string; value: number; isFuture?: boolean };

interface SummaryItem {
  label: string;
  value: number;
  color: string;
  hint: string;
  trend?: string;
  tone: SummaryTone;
  chartType: SummaryChartType;
  points: SummaryChartPoint[];
}

type ListingOverview = Record<string, any> | null;

const getNumericMetric = (item: any, keys: string[]) => {
  for (const key of keys) {
    const value = Number(item?.[key]);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return 0;
};

const makeEmptySeries = (length: number) => Array.from({ length }, () => 0);

const buildDailyCreatedSeries = (items: any[], days = 7) => {
  const series = makeEmptySeries(days);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  items.forEach((item) => {
    const created = new Date(item.createdAt || item.CreatedAt || 0);
    if (Number.isNaN(created.getTime())) return;
    created.setHours(0, 0, 0, 0);
    const index = Math.floor((created.getTime() - start.getTime()) / 86400000);
    if (index >= 0 && index < days) series[index] += 1;
  });

  return series;
};

const buildActiveInteractionSeries = (items: any[], days = 7) => {
  const total = items.reduce((sum, item) => {
    return sum + getNumericMetric(item, ['views', 'viewCount', 'totalViews', 'inquiries', 'bookingRequestCount', 'bookingRequests']);
  }, 0);
  if (total === 0) return makeEmptySeries(days);

  return Array.from({ length: days }, (_, index) => {
    const wave = 0.7 + Math.sin((index + 1) * 1.4) * 0.25 + (index / days) * 0.3;
    return Math.max(1, Math.round((total / days) * wave));
  });
};

const buildOccupiedMonthlySeries = (items: any[], months = 6) => {
  const series = makeEmptySeries(months);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  items.forEach((item) => {
    const signed = new Date(item.contractSignedAt || item.contractDate || item.updatedAt || item.createdAt || 0);
    if (Number.isNaN(signed.getTime())) return;
    const index = (signed.getFullYear() - start.getFullYear()) * 12 + signed.getMonth() - start.getMonth();
    if (index >= 0 && index < months) series[index] += 1;
  });

  return series;
};

const buildExpiredSeries = (items: any[], pastDays = 4, futureDays = 3) => {
  const totalDays = pastDays + futureDays + 1;
  const series = makeEmptySeries(totalDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - pastDays);

  items.forEach((item) => {
    const raw = item.allowedEndTime || item.AllowedEndTime || item.expiredAt || item.updatedAt;
    const end = new Date(raw || 0);
    if (Number.isNaN(end.getTime())) return;
    end.setHours(0, 0, 0, 0);
    const index = Math.floor((end.getTime() - start.getTime()) / 86400000);
    if (index >= 0 && index < totalDays) series[index] += 1;
  });

  return { series, futureFromIndex: pastDays + 1 };
};

const toChartPoints = (points: number[], futureFromIndex?: number): SummaryChartPoint[] => {
  return points.map((value, index) => ({
    name: String(index + 1),
    value,
    isFuture: futureFromIndex !== undefined && index >= futureFromIndex,
  }));
};

const unwrapOverview = (overview: ListingOverview): Record<string, any> => {
  if (!overview) return {};
  if (overview.data && typeof overview.data === 'object') return overview.data;
  if (overview.result && typeof overview.result === 'object') return overview.result;
  return overview;
};

const readOverviewNumber = (source: Record<string, any>, keys: string[], fallback: number) => {
  for (const key of keys) {
    const value = Number(source?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
};

const readOverviewValue = (source: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) return source[key];
  }
  return undefined;
};

const normalizeOverviewPoints = (value: any, fallback: SummaryChartPoint[], futureFromIndex?: number): SummaryChartPoint[] => {
  if (!Array.isArray(value)) return fallback;

  const points = value
    .map((item, index) => {
      if (typeof item === 'number') {
        return {
          name: String(index + 1),
          value: item,
          isFuture: futureFromIndex !== undefined && index >= futureFromIndex,
        };
      }

      const pointValue = Number(
        item?.value ??
        item?.count ??
        item?.total ??
        item?.views ??
        item?.viewCount ??
        item?.bookingRequests ??
        item?.bookingRequestCount ??
        item?.contracts ??
        0
      );

      return {
        name: String(item?.name ?? item?.label ?? item?.date ?? item?.day ?? item?.week ?? item?.month ?? index + 1),
        value: Number.isFinite(pointValue) ? pointValue : 0,
        isFuture: Boolean(item?.isFuture ?? item?.future ?? (futureFromIndex !== undefined && index >= futureFromIndex)),
      };
    })
    .filter((point) => Number.isFinite(point.value));

  return points.length > 0 ? points : fallback;
};

const SUMMARY_CHART_COLORS: Record<SummaryTone, string> = {
  total: '#64748b',
  active: '#16a34a',
  occupied: '#8b5cf6',
  expired: '#ef4444',
};

const SummaryMiniChart: React.FC<{ points: SummaryChartPoint[]; type: SummaryChartType; tone: SummaryTone }> = ({ points, type, tone }) => {
  const color = SUMMARY_CHART_COLORS[tone];
  return (
    <div className={`summary-chart summary-chart--${tone}`} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart data={points} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {points.map((point, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={color}
                  fillOpacity={point.isFuture ? 0.32 : 0.72}
                  stroke={point.isFuture ? color : 'none'}
                  strokeDasharray={point.isFuture ? '3 3' : undefined}
                />
              ))}
            </Bar>
          </BarChart>
        ) : type === 'area' ? (
          <AreaChart data={points} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={3} fill={color} fillOpacity={0.18} dot={false} activeDot={false} />
          </AreaChart>
        ) : (
          <LineChart data={points} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
            <Line type="linear" dataKey="value" stroke={color} strokeWidth={3} dot={false} activeDot={false} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export const OwnerListings: React.FC = () => {
  const [listings, setListings] = useState<any[]>([]); // Data lấy từ API
  const [listingOverview, setListingOverview] = useState<ListingOverview>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'EntireSpace' | 'SharedSpace'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // States quản lý Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<any | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'renew'>('create');

  const [viewingListing, setViewingListing] = useState<any | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { t, language } = useThemeLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  const buildCurrentUserListingUrl = () => {
    const params = new URLSearchParams();
    if (filterStatus !== 'all') params.set('status', filterStatus);
    if (filterType !== 'all') params.set('listingType', filterType);

    return `${API_BASE_URL}/api/Listing/GetAllByCurrentUser${params.toString() ? `?${params.toString()}` : ''}`;
  };

  const getStatusLabel = (status: string) => statusConfig[status]?.label || 'Không rõ';

  const fetchListingOverview = async () => {
    try {
      const token = localStorage.getItem('portal_token');
      if (!token) {
        setListingOverview(null);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/Dashboard/listing-overview`, {
        headers: { Authorization: `Bearer ${token}`, accept: '*/*' }
      });

      if (!res.ok) {
        throw new Error(`Dashboard overview failed: ${res.status}`);
      }

      const data = await res.json();
      setListingOverview(data);
    } catch (err) {
      console.warn('Không thể tải dữ liệu tổng quan bài đăng:', err);
      setListingOverview(null);
    }
  };



  // --- API LẤY BÀI ĐĂNG CỦA RIÊNG MÌNH ---
  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('portal_token');

      const res = await fetch(buildCurrentUserListingUrl(), {
        headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
      });

      if (res.ok) {
        const data = await res.json();
        const safeData = Array.isArray(data) ? data : (data?.data || data?.items || []);

        setListings(safeData);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách bài đăng:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchListings();
  }, [filterStatus, filterType]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchListingOverview();
  }, []);

  // Tìm kiếm theo địa chỉ (đã được bốc từ Space sang)
  const filtered = listings.filter((l) => {
  const safeLocation = l?.location || l?.address || '';
  const safeName = l?.name || '';
  const matchSearch =
    safeLocation.toLowerCase().includes(search.toLowerCase()) ||
    safeName.toLowerCase().includes(search.toLowerCase());
  return matchSearch;
  });

  // Hiệu ứng GSAP mượt mà
  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.listing-card');
      if (cards.length > 0) {
        gsap.fromTo(cards,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out' }
        );
      }
    }, containerRef);
    return () => ctx.revert();
  }, [filtered.length, filterStatus, filterType]);

  // --- HÀM XỬ LÝ SỰ KIỆN ---
  const handleOpenNew = () => {
    setEditingListing(null);
    setFormMode('create');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (listing: any) => {
    const safeListingForEdit = {
      ...listing,
      slots: listing?.slots || []
    };
    setEditingListing(safeListingForEdit);
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const handleOpenRenew = (listing: any) => {
    const safeListingForRenew = {
      ...listing,
      slots: listing?.slots || []
    };
    setEditingListing(safeListingForRenew);
    setFormMode('renew');
    setIsFormOpen(true);
  };

  const handleDelete = async (listingItem: any) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài đăng này?')) {
      try {
        const targetId = listingItem.id || listingItem.Id;

        if (!targetId) {
          alert('Lỗi FE: Không tìm thấy ID của bài đăng này!');
          return;
        }
        
        const token = localStorage.getItem('portal_token');
        const res = await fetch(`https://flexi-space-capstone-project.onrender.com/api/Listing/SoftDelete/${targetId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
        });

        if (res.ok) {
          setListings(prev => prev.filter(l => (l.id || l.Id) !== targetId));
          fetchListingOverview();
        } else {
          alert('Không thể xóa bài đăng. Vui lòng kiểm tra lại link API Xóa của Backend!');
        }
      } catch (err) {
        console.error("Lỗi khi xóa bài đăng:", err);
        alert("Lỗi kết nối máy chủ.");
      }
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchListings();
    fetchListingOverview();
  };

  const availableListings = listings.filter(l => l.status === 'Available');
  const occupiedListings = listings.filter(l => l.status === 'Occupied');
  const expiredListings = listings.filter(l => l.status === 'Expired');
  const totalCreatedSeries = buildDailyCreatedSeries(listings);
  const activeInteractionSeries = buildActiveInteractionSeries(availableListings);
  const occupiedSeries = buildOccupiedMonthlySeries(occupiedListings);
  const expiredTrend = buildExpiredSeries(expiredListings);
  const createdThisWeek = totalCreatedSeries.reduce((sum, value) => sum + value, 0);
  const overview = unwrapOverview(listingOverview);
  const overviewTotalPoints = normalizeOverviewPoints(
    readOverviewValue(overview, ['totalChart', 'totalListingsChart', 'listingGrowth', 'newListingsByDay', 'createdSeries', 'createdListings']),
    toChartPoints(totalCreatedSeries)
  );
  const overviewActivePoints = normalizeOverviewPoints(
    readOverviewValue(overview, ['activeChart', 'availableChart', 'activeInteractions', 'availableInteractions', 'viewsByDay', 'availableViews']),
    toChartPoints(activeInteractionSeries)
  );
  const overviewOccupiedPoints = normalizeOverviewPoints(
    readOverviewValue(overview, ['occupiedChart', 'contractsByMonth', 'occupiedByMonth', 'signedContractsByMonth']),
    toChartPoints(occupiedSeries)
  );
  const overviewExpiredPoints = normalizeOverviewPoints(
    readOverviewValue(overview, ['expiredChart', 'expiredTrend', 'expiredByDay', 'expiringTrend', 'expiredAndExpiring']),
    toChartPoints(expiredTrend.series, expiredTrend.futureFromIndex),
    expiredTrend.futureFromIndex
  );
  const overviewCreatedThisWeek = readOverviewNumber(
    overview,
    ['createdThisWeek', 'newThisWeek', 'weeklyCreated', 'listingCreatedThisWeek'],
    createdThisWeek
  );
  const overviewActiveInteractions = readOverviewNumber(
    overview,
    ['activeInteractionsTotal', 'availableInteractionsTotal', 'totalViewsLast7Days', 'viewsLast7Days', 'bookingRequestsLast7Days'],
    overviewActivePoints.reduce((sum, point) => sum + point.value, 0)
  );
  const overviewOccupiedThisMonth = readOverviewNumber(
    overview,
    ['occupiedThisMonth', 'contractsThisMonth', 'signedContractsThisMonth'],
    overviewOccupiedPoints[overviewOccupiedPoints.length - 1]?.value || 0
  );
  const overviewExpiringSoon = readOverviewNumber(
    overview,
    ['expiringSoon', 'willExpireSoon', 'futureExpiredCount', 'upcomingExpiredCount'],
    overviewExpiredPoints.filter(point => point.isFuture).reduce((sum, point) => sum + point.value, 0)
  );

  const summaryItems: SummaryItem[] = [
    {
      label: t('listings.totalListings') || 'Tổng bài đăng',
      value: readOverviewNumber(overview, ['totalListings', 'totalListing', 'totalCount', 'total'], listings.length),
      color: 'var(--color-accent)',
      hint: 'Bài đăng mới theo ngày',
      trend: `↑ +${overviewCreatedThisWeek} bài tuần này`,
      tone: 'total',
      chartType: 'line',
      points: overviewTotalPoints,
    },
    {
      label: 'Đang hoạt động',
      value: readOverviewNumber(overview, ['availableListings', 'availableCount', 'activeListings', 'activeCount'], availableListings.length),
      color: 'var(--color-positive)',
      hint: 'Lượt xem / tương tác 7 ngày',
      trend: `${overviewActiveInteractions} tương tác`,
      tone: 'active',
      chartType: 'area',
      points: overviewActivePoints,
    },
    {
      label: 'Đã kí hợp đồng',
      value: readOverviewNumber(overview, ['occupiedListings', 'occupiedCount', 'signedListings', 'contractedCount'], occupiedListings.length),
      color: '#8b5cf6',
      hint: 'Hợp đồng đã chốt theo tháng',
      trend: `${overviewOccupiedThisMonth} hợp đồng tháng này`,
      tone: 'occupied',
      chartType: 'bar',
      points: overviewOccupiedPoints,
    },
    {
      label: 'Đã hết hạn',
      value: readOverviewNumber(overview, ['expiredListings', 'expiredCount', 'expired'], expiredListings.length),
      color: 'var(--color-negative)',
      hint: 'Xu hướng hết hạn gần đây',
      trend: `${overviewExpiringSoon} sắp hết hạn`,
      tone: 'expired',
      chartType: 'bar',
      points: overviewExpiredPoints,
    },
  ];

  return (
    <div className="owner-listings animate-in" ref={containerRef}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('listings.rentalListings') || 'Bài đăng cho thuê mặt bằng'}</h1>
          <p className="page-subtitle text-secondary">{t('listings.listingsSubtitle') || 'Quản lý tất cả các bài đăng cho thuê mặt bằng của bạn'}</p>
        </div>
        <button className="btn-primary" onClick={handleOpenNew}>
          <Plus size={16} />
          {t('listings.createNewListing') || 'Tạo bài đăng mới'}
        </button>
      </div>

      {/* Summary Strip */}
      <div className="listings-summary">
        {summaryItems.map((s, i) => (
          <div key={i} className={`glass-card listings-summary-item listings-summary-item--${s.tone}`}>
            <div className="summary-metric-row">
              <div>
                <span className="listings-summary-value" style={{ color: s.color }}>{s.value}</span>
                <span className="label-caps">{s.label}</span>
              </div>
              <SummaryMiniChart points={s.points} type={s.chartType} tone={s.tone} />
            </div>
            <div className="summary-meta-row">
              <span>{s.hint}</span>
              {s.trend && <strong>{s.trend}</strong>}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="listings-controls glass-card">
        <div className="listings-search">
          <Search size={15} style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            placeholder={t('listings.searchListingPlaceholder') || 'Tìm kiếm bài đăng, địa điểm...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="listings-filters">
          {['all', 'Available', 'Occupied', 'Expired'].map((f) => (
            <button
              key={f}
              className={`filter-tab ${filterStatus === f ? 'filter-tab--active' : ''}`}
              onClick={() => setFilterStatus(f)}
            >
              {f === 'all' ? (t('listings.all') || 'Tất cả') : getStatusLabel(f)}
            </button>
          ))}
        </div>
        <div className="listings-filters listings-filters--types">
          {([
            { value: 'EntireSpace' as const, label: 'Dài hạn' },
            { value: 'SharedSpace' as const, label: 'Chia sẻ' },
          ]).map((type) => (
            <label key={type.value} className={`listing-type-choice ${filterType === type.value ? 'listing-type-choice--active' : ''}`}>
              <input
                type="checkbox"
                checked={filterType === type.value}
                onChange={() => setFilterType(filterType === type.value ? 'all' : type.value)}
              />
              <span>{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      <div className="listings-grid">
        {isLoading && listings.length === 0 && <p className="text-secondary" style={{ padding: '20px' }}>Đang tải dữ liệu...</p>}
        {!isLoading && filtered.length === 0 && <p className="text-secondary" style={{ padding: '20px' }}>Không có bài đăng nào phù hợp.</p>}
        {filtered.map((listing, index) => {
          const currentId = listing.id || listing.Id;

          return (
            <div key={currentId || index} className="glass-card listing-card">

              <div className="listing-card-top">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div className="listing-type-tag" style={isShareListing(listing) ? { background: 'rgba(0,180,160,0.15)', color: 'var(--color-positive)' } : undefined}>
                    {isShareListing(listing) ? <Users size={13} /> : <Building2 size={13} />}
                    {isShareListing(listing) ? 'Chia sẻ' : 'Dài hạn'}
                  </div>
                  {listing.isSpacePart && (
                    <div className="listing-type-tag" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>
                      Chia nhỏ
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`badge ${statusConfig[listing.status]?.className || 'badge--neutral'}`}>
                    {statusConfig[listing.status]?.icon || <Clock size={11} />}
                    {getStatusLabel(listing.status)}
                  </span>
                </div>
              </div>

              <div className="listing-visual" style={{ overflow: 'hidden' }}>
                {getListingPictureUrl(listing.listingPictures?.[0]) ? (
                  <img
                    src={getListingPictureUrl(listing.listingPictures?.[0]) || ''}
                    alt="cover"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement?.classList.add('fallback-icon');
                    }}
                  />
                ) : (
                  <Building2 className="fallback-icon" size={32} style={{ color: 'rgba(0, 212, 160, 0.4)' }} />
                )}

                {Number(listing.area) > 0 && (
                  <div className="listing-area-badge">{listing.area} m²</div>
                )}
                {listing.subleasing && (
                  <div className="sublease-badge">{t('listings.subleaseBadge') || 'Cho thuê lại'}</div>
                )}
              </div>

              <div className="listing-card-body">
                {listing.name && (
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {listing.name}
                  </h4>
                )}
                <p className="listing-location">
                  <MapPin size={12} />
                  {listing.location || listing.address || 'Chưa cập nhật địa chỉ'}
                </p>

                <div className="listing-price-row">
                  <span className="listing-price">{listing.price ? `${listing.price.toLocaleString('vi-VN')}₫` : 'Thỏa thuận'}</span>
                  <span className="text-secondary" style={{ fontSize: 12 }}>/{getPriceUnitText(listing.priceUnit)}</span>
                </div>

                {listing.rating > 0 && (
                  <div className="listing-meta">
                    <div className="listing-meta-item">
                      <Star size={12} style={{ color: '#D9A05B' }} />
                      <span style={{ color: '#D9A05B', fontWeight: 600 }}>{listing.rating}</span>
                    </div>
                  </div>
                )}

                <p className="listing-date text-secondary">
                  Đăng ngày {formatDate(listing.createdAt)}
                </p>
              </div>

              <div className="listing-card-actions">
                <button
                  className="btn-ghost"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => {
                    setViewingListing(listing);
                    setCurrentImageIndex(0);
                  }}
                >
                  <Eye size={14} /> {language === 'en' ? 'View' : 'Xem'}
                </button>
                {listing.status === 'Expired' && (
                  <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleOpenRenew(listing)}>
                    <RefreshCw size={14} /> Gia hạn
                  </button>
                )}
                <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleOpenEdit(listing)}>
                  <Edit3 size={14} /> {t('spaces.edit') || 'Sửa'}
                </button>
                <button className="btn-icon" style={{ color: 'var(--color-negative)' }} title={t('spaces.delete') || 'Xóa'} onClick={() => handleDelete(listing)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isFormOpen && (
        <ListingForm
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSuccess}
          initialData={editingListing}
          mode={formMode}
        />
      )}

      {/* ========================================== */}
      {/* POP-UP XEM CHI TIẾT BÀI ĐĂNG (FACEBOOK STYLE) */}
      {/* ========================================== */}
      {viewingListing && createPortal(
        <div className="modal-backdrop" onClick={() => setViewingListing(null)}>
          <div
            className="modal-shell modal-shell--wide"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '700px', width: '95%', padding: 0, overflow: 'hidden' }}
          >
            <div className="modal-header" style={{ padding: '16px 20px', margin: 0, top: 0 }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Chi tiết bài đăng</h2>
              <button type="button" className="btn-icon" onClick={() => setViewingListing(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              {getListingPictureUrls(viewingListing.listingPictures).length > 0 ? (
                <div style={{ position: 'relative', width: '100%', height: '400px', backgroundColor: '#111' }}>
                  <img
                    src={getListingPictureUrls(viewingListing.listingPictures)[currentImageIndex]}
                    alt="gallery"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />

                  {getListingPictureUrls(viewingListing.listingPictures).length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : getListingPictureUrls(viewingListing.listingPictures).length - 1)}
                        style={{ position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
                      >
                        <ChevronLeft size={20} color="#000" />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex(prev => prev < getListingPictureUrls(viewingListing.listingPictures).length - 1 ? prev + 1 : 0)}
                        style={{ position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
                      >
                        <ChevronRight size={20} color="#000" />
                      </button>
                      <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}>
                        {currentImageIndex + 1} / {getListingPictureUrls(viewingListing.listingPictures).length}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="glass-card--inset" style={{ width: '100%', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', borderRadius: 0 }}>
                  <Building2 size={40} style={{ opacity: 0.5, marginRight: 10 }} /> Không có hình ảnh
                </div>
              )}

              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '22px', color: 'var(--color-accent)' }}>
                      {viewingListing.price ? `${viewingListing.price.toLocaleString('vi-VN')} ₫ / giờ` : 'Thỏa thuận'}
                    </h3>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)' }}>
                      <MapPin size={16} /> {viewingListing.location || viewingListing.address || 'Chưa cập nhật địa chỉ'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span className={`badge ${statusConfig[viewingListing.status]?.className || 'badge--neutral'}`}>
                      {getStatusLabel(viewingListing.status)}
                    </span>
                    <span className="badge badge--neutral">
                      {isShareListing(viewingListing) ? 'Chia sẻ mặt bằng' : 'Cho thuê dài hạn'}
                    </span>
                    {viewingListing.isSpacePart && (
                      <span className="badge" style={{ background: '#fef9c3', color: '#854d0e', border: '1px solid #fef08a' }}>
                        Không gian chia nhỏ
                      </span>
                    )}
                  </div>
                </div>

                <div className="glass-card--inset" style={{ padding: '16px', borderRadius: 'var(--radius-lg)' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--color-text-primary)' }}>Mô tả chi tiết</h4>
                  <ExpandableDescription text={viewingListing.description} />
                </div>

                <div className="glass-card--inset" style={{ padding: '16px', borderRadius: 'var(--radius-lg)' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--color-text-primary)' }}>Thông tin mặt bằng</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    <div><strong style={{ color: 'var(--color-text-primary)' }}>Mặt bằng:</strong> {viewingListing.spaceName || 'Chưa cập nhật'}</div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong style={{ color: 'var(--color-text-primary)' }}>Địa chỉ:</strong>{' '}
                      {[viewingListing.location || viewingListing.address, viewingListing.spaceCity].filter(Boolean).join(', ') || 'Chưa cập nhật địa chỉ'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  <div><strong style={{ color: 'var(--color-text-primary)' }}>Thời gian hiệu lực từ:</strong> {formatDate(viewingListing.allowedStartTime)}</div>
                  <div><strong style={{ color: 'var(--color-text-primary)' }}>Đến:</strong> {formatDate(viewingListing.allowedEndTime)}</div>
                  <div><strong style={{ color: 'var(--color-text-primary)' }}>Ngày đăng cho thuê:</strong> {formatDate(viewingListing.createdAt)}</div>
                  {isShareListing(viewingListing) && (
                    <div><strong style={{ color: 'var(--color-text-primary)' }}>Số người thuê chung tối đa:</strong> {viewingListing.shareSpaceDetailMaxSubRenter ?? 'N/A'}</div>
                  )}
                </div>

                {isShareListing(viewingListing) && (
                  <div className="glass-card--inset" style={{ padding: '16px', borderRadius: 'var(--radius-lg)' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--color-text-primary)' }}>Khung giờ Chia sẻ</h4>
                    {viewingListing.shareSpaceDetailAvailabilitiesTimes?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {viewingListing.shareSpaceDetailAvailabilitiesTimes.map((slot: any, i: number) => (
                          <div
                            key={i}
                            style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              flexWrap: 'wrap', gap: '6px', padding: '10px 12px',
                              background: 'var(--color-bg-hover)', borderRadius: 'var(--radius-md)', fontSize: '13px'
                            }}
                          >
                            <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                              {slot.daysOfWeek?.length > 0 ? slot.daysOfWeek.join(', ') : (slot.specificdate ? formatDate(slot.specificdate) : 'Không rõ')}
                            </span>
                            <span style={{ color: 'var(--color-text-secondary)' }}>
                              {formatToAmPm(slot.startTime)} - {formatToAmPm(slot.endTime)}
                            </span>
                            <span style={{ color: 'var(--color-text-secondary)' }}>
                              {formatDate(slot.validFrom)} → {formatDate(slot.validTo)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '13px' }}>Chưa có khung giờ Chia sẻ nào.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
