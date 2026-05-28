import React, { useState } from 'react';
import {
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  MoreHorizontal,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Star,
} from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import './OwnerListings.css';

interface Listing {
  id: number;
  name: string;
  location: string;
  price: string;
  period: string;
  area: string;
  type: string;
  status: 'published' | 'pending' | 'draft' | 'expired';
  views: number;
  inquiries: number;
  rating: number;
  subleasing: boolean;
  postedDate: string;
}

const listings: Listing[] = [
  { id: 1, name: 'Mặt bằng kinh doanh Lê Lợi', location: 'Quận 1, TP.HCM', price: '12.500.000₫', period: '/tháng', area: '45 m²', type: 'Cửa hàng bán lẻ', status: 'published', views: 342, inquiries: 18, rating: 4.8, subleasing: true, postedDate: '15/03/2025' },
  { id: 2, name: 'Shop Mini Phan Đình Phùng', location: 'Bình Thạnh, TP.HCM', price: '8.200.000₫', period: '/tháng', area: '30 m²', type: 'Quán cà phê', status: 'published', views: 215, inquiries: 11, rating: 4.5, subleasing: false, postedDate: '01/01/2025' },
  { id: 3, name: 'Kiosk Quang Trung', location: 'Gò Vấp, TP.HCM', price: '3.800.000₫', period: '/tháng', area: '18 m²', type: 'Ki-ốt', status: 'pending', views: 89, inquiries: 3, rating: 0, subleasing: true, postedDate: '20/05/2025' },
  { id: 4, name: 'Không gian kinh doanh Nguyễn Trãi', location: 'Quận 5, TP.HCM', price: '15.000.000₫', period: '/tháng', area: '60 m²', type: 'Cửa hàng bán lẻ', status: 'draft', views: 0, inquiries: 0, rating: 0, subleasing: true, postedDate: '25/05/2025' },
  { id: 5, name: 'Mặt bằng Đinh Tiên Hoàng', location: 'Bình Thạnh, TP.HCM', price: '6.500.000₫', period: '/tháng', area: '25 m²', type: 'Văn phòng nhỏ', status: 'expired', views: 178, inquiries: 9, rating: 4.2, subleasing: false, postedDate: '10/01/2025' },
];

const statusConfig = {
  published: { className: 'badge--positive', icon: <CheckCircle2 size={11} /> },
  pending: { className: 'badge--warning', icon: <Clock size={11} /> },
  draft: { className: 'badge--neutral', icon: <Edit3 size={11} /> },
  expired: { className: 'badge--negative', icon: <XCircle size={11} /> },
};

type FilterStatus = 'all' | Listing['status'];

export const OwnerListings: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const { t, language } = useThemeLanguage();

  const getStatusLabel = (status: Listing['status']) => {
    switch (status) {
      case 'published': return t('listings.published');
      case 'pending': return t('listings.pending');
      case 'draft': return t('listings.draft');
      case 'expired': return t('listings.expired');
    }
  };

  const filtered = listings.filter((l) => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.location.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="owner-listings animate-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('listings.rentalListings')}</h1>
          <p className="page-subtitle text-secondary">{t('listings.listingsSubtitle')}</p>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          {t('listings.createNewListing')}
        </button>
      </div>

      {/* Summary Strip */}
      <div className="listings-summary">
        {[
          { label: t('listings.totalListings'), value: listings.length, color: '#fff' },
          { label: t('listings.published'), value: listings.filter(l => l.status === 'published').length, color: 'var(--color-positive)' },
          { label: t('listings.pending'), value: listings.filter(l => l.status === 'pending').length, color: 'var(--color-gold)' },
          { label: t('listings.draft'), value: listings.filter(l => l.status === 'draft').length, color: 'var(--color-text-secondary)' },
        ].map((s, i) => (
          <div key={i} className="glass-card listings-summary-item">
            <span className="listings-summary-value" style={{ color: s.color }}>{s.value}</span>
            <span className="label-caps">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="listings-controls glass-card">
        <div className="listings-search">
          <Search size={15} style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            placeholder={t('listings.searchListingPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="listings-filters">
          {(['all', 'published', 'pending', 'draft', 'expired'] as FilterStatus[]).map((f) => (
            <button
              key={f}
              className={`filter-tab ${filterStatus === f ? 'filter-tab--active' : ''}`}
              onClick={() => setFilterStatus(f)}
            >
              {f === 'all' ? t('listings.all') : getStatusLabel(f)}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      <div className="listings-grid">
        {filtered.map((listing, i) => (
          <div key={listing.id} className={`glass-card listing-card animate-in delay-${Math.min(i + 1, 6)}`}>
            {/* Card Top */}
            <div className="listing-card-top">
              <div className="listing-type-tag">
                <Building2 size={13} />
                {listing.type}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`badge ${statusConfig[listing.status].className}`}>
                  {statusConfig[listing.status].icon}
                  {getStatusLabel(listing.status)}
                </span>
                <button className="btn-icon" style={{ width: 28, height: 28 }}>
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>

            {/* Space Visual */}
            <div className="listing-visual">
              <Building2 size={32} style={{ color: 'rgba(74, 114, 255, 0.5)' }} />
              <div className="listing-area-badge">{listing.area}</div>
              {listing.subleasing && (
                <div className="sublease-badge">{t('listings.subleaseBadge')}</div>
              )}
            </div>

            {/* Card Body */}
            <div className="listing-card-body">
              <h3 className="listing-name">{listing.name}</h3>
              <p className="listing-location">
                <MapPin size={12} />
                {listing.location}
              </p>

              <div className="listing-price-row">
                <span className="listing-price">{listing.price}</span>
                <span className="text-secondary" style={{ fontSize: 12 }}>{listing.period}</span>
              </div>

              <div className="listing-meta">
                <div className="listing-meta-item">
                  <Eye size={12} className="text-secondary" />
                  <span>{t('listings.views', { count: listing.views })}</span>
                </div>
                <div className="listing-meta-item">
                  <Building2 size={12} className="text-secondary" />
                  <span>{t('listings.inquiries', { count: listing.inquiries })}</span>
                </div>
                {listing.rating > 0 && (
                  <div className="listing-meta-item">
                    <Star size={12} style={{ color: '#D9A05B' }} />
                    <span style={{ color: '#D9A05B', fontWeight: 600 }}>{listing.rating}</span>
                  </div>
                )}
              </div>

              <p className="listing-date text-secondary">{t('listings.postedOn', { date: listing.postedDate })}</p>
            </div>

            {/* Card Actions */}
            <div className="listing-card-actions">
              <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
                <Eye size={14} /> {language === 'en' ? 'View' : 'Xem'}
              </button>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
                <Edit3 size={14} /> {t('spaces.edit')}
              </button>
              <button className="btn-icon" style={{ color: 'var(--color-negative)' }} title={t('spaces.delete')}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
