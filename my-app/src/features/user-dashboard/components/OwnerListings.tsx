/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  Plus, Search, Eye, Edit3, Trash2, MoreHorizontal,
  Building2, MapPin, Clock, CheckCircle2, XCircle, Star,
} from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import { ListingForm } from './ListingForm';
import './OwnerListings.css';

const statusConfig: Record<string, { className: string, icon: React.ReactNode }> = {
  published: { className: 'badge--positive', icon: <CheckCircle2 size={11} /> },
  pending: { className: 'badge--warning', icon: <Clock size={11} /> },
  draft: { className: 'badge--neutral', icon: <Edit3 size={11} /> },
  expired: { className: 'badge--negative', icon: <XCircle size={11} /> },
};

export const OwnerListings: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [listings, setListings] = useState<any[]>([]); // Data lấy từ API
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // States quản lý Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingListing, setEditingListing] = useState<any | null>(null);

  const { t, language } = useThemeLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return t('listings.published') || 'Đang đăng';
      case 'pending': return t('listings.pending') || 'Chờ duyệt';
      case 'draft': return t('listings.draft') || 'Bản nháp';
      case 'expired': return t('listings.expired') || 'Hết hạn';
      default: return 'Không rõ';
    }
  };

  // --- API GET ALL LISTINGS ---
// --- API LẤY BÀI ĐĂNG CỦA RIÊNG MÌNH ---
  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('portal_token');
      const ownerId = localStorage.getItem('current_user_id') || '01KVJGBEXR0X7A2PN520FJTVZT';

      // BƯỚC 1: Lấy danh sách Mặt bằng (Space) của chính ông này
      const spaceRes = await fetch(`https://localhost:7069/api/Space/GetAll?OwnerId=${encodeURIComponent(ownerId)}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
      });
      
      let mySpaceIds: any[] = [];
      if (spaceRes.ok) {
        const spaceData = await spaceRes.json();
        const safeSpaces = Array.isArray(spaceData) ? spaceData : (spaceData?.data || spaceData?.items || []);
        // Gom toàn bộ ID mặt bằng của ông chủ này lại thành 1 mảng [1, 2, 5...]
        mySpaceIds = safeSpaces.map((s: any) => s.id || s.Id);
      }

      // BƯỚC 2: Lấy tất cả bài đăng
      const res = await fetch('https://localhost:7069/api/Listing/GetAll', {
        headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
      });
      
      if (res.ok) {
        const data = await res.json();
        const safeData = Array.isArray(data) ? data : (data?.data || data?.items || []);
        
        // BƯỚC 3: LỌC - Chỉ giữ lại những Bài đăng có spaceId trùng với Mặt bằng của mình
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const myListings = safeData.filter((l: any) => {
          const currentSpaceId = l.spaceId || l.SpaceId;
          return mySpaceIds.includes(currentSpaceId) || l.ownerId === ownerId || l.createdBy === ownerId;
        });

        setListings(myListings); 
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
  }, []);

  // ÁO GIÁP 2: Chống null khi tìm kiếm
  const filtered = listings.filter((l) => {
    const safeName = l?.name || '';
    const safeLocation = l?.location || l?.address || ''; // BE có thể dùng location hoặc address
    
    const matchSearch = safeName.toLowerCase().includes(search.toLowerCase()) || 
                        safeLocation.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || l?.status === filterStatus;
    return matchSearch && matchStatus;
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
  }, [filtered.length, filterStatus]);

  // --- HÀM XỬ LÝ SỰ KIỆN ---
  const handleOpenNew = () => {
    setEditingListing(null);
    setIsFormOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenEdit = (listing: any) => {
    // ÁO GIÁP 3: Vá lại data trước khi ném cho thằng Form để nó không bị sập
    const safeListingForEdit = {
      ...listing,
      slots: listing?.slots || [] // Ép slots thành mảng rỗng nếu BE không có
    };
    setEditingListing(safeListingForEdit);
    setIsFormOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDelete = async (listingItem: any) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài đăng này?')) {
      try {
        // CỨU CÁNH VỤ XÓA SAI: Check xem BE trả về chữ "id" hay "Id"
        const targetId = listingItem.id || listingItem.Id; 

        if (!targetId) {
          alert('Lỗi FE: Không tìm thấy ID của bài đăng này!');
          return;
        }

        const token = localStorage.getItem('portal_token');
        const res = await fetch(`https://localhost:7069/api/Listing/Delete/${targetId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
        });
        
        if (res.ok) {
          setListings(prev => prev.filter(l => (l.id || l.Id) !== targetId));
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
    fetchListings(); // Load lại data từ DB sau khi thêm/sửa thành công
  };

  return (
    <div className="owner-listings animate-in" ref={containerRef}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('listings.rentalListings') || 'Danh sách cho thuê'}</h1>
          <p className="page-subtitle text-secondary">{t('listings.listingsSubtitle') || 'Quản lý các bài đăng hiển thị trên hệ thống'}</p>
        </div>
        <button className="btn-primary" onClick={handleOpenNew}>
          <Plus size={16} />
          {t('listings.createNewListing') || 'Tạo bài đăng mới'}
        </button>
      </div>

      {/* Summary Strip */}
      <div className="listings-summary">
        {[
          { label: t('listings.totalListings') || 'Tổng số bài', value: listings.length, color: '#fff' },
          { label: t('listings.published') || 'Đang đăng', value: listings.filter(l => l.status === 'published').length, color: 'var(--color-positive)' },
          { label: t('listings.pending') || 'Chờ duyệt', value: listings.filter(l => l.status === 'pending').length, color: 'var(--color-gold)' },
          { label: t('listings.draft') || 'Bản nháp', value: listings.filter(l => l.status === 'draft').length, color: 'var(--color-text-secondary)' },
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
            placeholder={t('listings.searchListingPlaceholder') || 'Tìm kiếm tên, địa điểm...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="listings-filters">
          {['all', 'published', 'pending', 'draft', 'expired'].map((f) => (
            <button
              key={f}
              className={`filter-tab ${filterStatus === f ? 'filter-tab--active' : ''}`}
              onClick={() => setFilterStatus(f)}
            >
              {f === 'all' ? (t('listings.all') || 'Tất cả') : getStatusLabel(f)}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      <div className="listings-grid">
        {isLoading && listings.length === 0 && <p className="text-secondary" style={{ padding: '20px' }}>Đang tải dữ liệu...</p>}
        {filtered.map((listing, index) => {
          // Lấy ID ra, nếu không có ID thì lấy index làm key tạm
          const currentId = listing.id || listing.Id;

          return (
            <div key={currentId || index} className="glass-card listing-card">
              
              <div className="listing-card-top">
                <div className="listing-type-tag">
                  <Building2 size={13} />
                  {listing.type || 'Mặt bằng'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`badge ${statusConfig[listing.status]?.className || 'badge--neutral'}`}>
                    {statusConfig[listing.status]?.icon || <Clock size={11} />}
                    {getStatusLabel(listing.status)}
                  </span>
                  <button className="btn-icon" style={{ width: 28, height: 28 }}>
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              </div>

              <div className="listing-visual">
                <Building2 size={32} style={{ color: 'rgba(0, 212, 160, 0.4)' }} />
                <div className="listing-area-badge">{listing.area || 'N/A'}</div>
                {listing.subleasing && (
                  <div className="sublease-badge">{t('listings.subleaseBadge') || 'Cho thuê lại'}</div>
                )}
              </div>

              <div className="listing-card-body">
                <h3 className="listing-name">{listing.name || 'Bài đăng chưa có tên'}</h3>
                <p className="listing-location">
                  <MapPin size={12} />
                  {listing.location || listing.address || 'Chưa cập nhật địa chỉ'}
                </p>

                <div className="listing-price-row">
                  <span className="listing-price">{listing.price ? `${listing.price.toLocaleString('vi-VN')}₫` : 'Thỏa thuận'}</span>
                  <span className="text-secondary" style={{ fontSize: 12 }}>/giờ</span>
                </div>

                <div className="listing-meta">
                  <div className="listing-meta-item">
                    <Eye size={12} className="text-secondary" />
                    <span>{t('listings.views', { count: listing.views || 0 }) || `${listing.views || 0} Lượt xem`}</span>
                  </div>
                  <div className="listing-meta-item">
                    <Building2 size={12} className="text-secondary" />
                    <span>{t('listings.inquiries', { count: listing.inquiries || 0 }) || `${listing.inquiries || 0} Yêu cầu`}</span>
                  </div>
                  {listing.rating > 0 && (
                    <div className="listing-meta-item">
                      <Star size={12} style={{ color: '#D9A05B' }} />
                      <span style={{ color: '#D9A05B', fontWeight: 600 }}>{listing.rating}</span>
                    </div>
                  )}
                </div>

                <p className="listing-date text-secondary">
                  {t('listings.postedOn', { date: listing.postedDate || 'gần đây' }) || `Đăng ngày ${listing.postedDate || 'gần đây'}`}
                </p>
              </div>

              <div className="listing-card-actions">
                <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
                  <Eye size={14} /> {language === 'en' ? 'View' : 'Xem'}
                </button>
                {/* Nút sửa */}
                <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleOpenEdit(listing)}>
                  <Edit3 size={14} /> {t('spaces.edit') || 'Sửa'}
                </button>
                {/* Nút xóa truyền nguyên cục listing vào để phân tích */}
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
        />
      )}
    </div>
  );
};