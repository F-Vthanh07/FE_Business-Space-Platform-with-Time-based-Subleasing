/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  Plus, Search, Eye, Edit3, Trash2, MoreHorizontal,
  Building2, MapPin, Clock, CheckCircle2, XCircle, Star, ChevronLeft, ChevronRight, X, Users
} from 'lucide-react';
import './OwnerListings.css';
import "../../../shared/ModalShell.css";
import { createPortal } from 'react-dom';
import { useThemeLanguage } from "../../../../context/ThemeLanguageContext";
import { ListingForm } from './ListingForm';

// Chỉ có đúng 2 status thật từ BE: Accepted / Ban
const statusConfig: Record<string, { className: string; icon: React.ReactNode; label: string }> = {
  Accepted: { className: 'badge--positive', icon: <CheckCircle2 size={11} />, label: 'Đang hoạt động' },
  Ban: { className: 'badge--negative', icon: <XCircle size={11} />, label: 'Đã bị khóa' },
};

// Chỉ có đúng 2 listingType thật từ BE: EntireSpace / SharedSpace
const isShareListing = (l: any) => l?.listingType === 'SharedSpace';

export const OwnerListings: React.FC = () => {
  const [listings, setListings] = useState<any[]>([]); // Data lấy từ API
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'EntireSpace' | 'SharedSpace'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // States quản lý Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<any | null>(null);

  const [viewingListing, setViewingListing] = useState<any | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { t, language } = useThemeLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  const getStatusLabel = (status: string) => statusConfig[status]?.label || 'Không rõ';

  const formatDate = (dateStr: any) => {
    if (!dateStr) return 'Không rõ';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Không rõ';
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // --- API LẤY BÀI ĐĂNG CỦA RIÊNG MÌNH ---
  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('portal_token');
      const ownerId = localStorage.getItem('current_user_id') || '01KVJGBEXR0X7A2PN520FJTVZT';

      // BƯỚC 1: Lấy danh sách Mặt bằng (Space) của chính ông này
      const spaceRes = await fetch(`https://flexi-space-capstone-project.onrender.com/api/Space/GetAll?OwnerId=${encodeURIComponent(ownerId)}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
      });

      let mySpaces: any[] = [];
      let mySpaceIds: any[] = [];
      if (spaceRes.ok) {
        const spaceData = await spaceRes.json();
        mySpaces = Array.isArray(spaceData) ? spaceData : (spaceData?.data || spaceData?.items || []);
        mySpaceIds = mySpaces.map((s: any) => s.id || s.Id);
      }

      // BƯỚC 2: Lấy tất cả bài đăng
      const res = await fetch('https://flexi-space-capstone-project.onrender.com/api/Listing/GetAll', {
        headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
      });

      if (res.ok) {
        const data = await res.json();
        const safeData = Array.isArray(data) ? data : (data?.data || data?.items || []);

        // BƯỚC 3: LỌC & GHÉP DATA MẶT BẰNG
        const myListings = safeData.filter((l: any) => {
          const currentSpaceId = l.spaceId || l.SpaceId;
          return mySpaceIds.includes(currentSpaceId) || l.ownerId === ownerId || l.createdBy === ownerId || l.creatorId === ownerId;
        }).map((l: any) => {
          // BƯỚC 4: Tìm mặt bằng gốc của bài đăng này
          const currentSpaceId = l.spaceId || l.SpaceId;
          const parentSpace = mySpaces.find(s => (s.id || s.Id) === currentSpaceId);

          return {
            ...l,
            // Móc địa chỉ từ Mặt bằng sang Bài đăng nếu bài đăng không có sẵn
            address: l.location || l.address || l.spaceAddress || parentSpace?.address || parentSpace?.location || '',
            area: l.area || parentSpace?.area || ''
          };
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

  // Tìm kiếm theo địa chỉ (đã được bốc từ Space sang)
  const filtered = listings.filter((l) => {
  const safeLocation = l?.location || l?.address || '';
  const safeName = l?.name || '';
  const matchSearch =
    safeLocation.toLowerCase().includes(search.toLowerCase()) ||
    safeName.toLowerCase().includes(search.toLowerCase());
  const matchStatus = filterStatus === 'all' || l?.status === filterStatus;
  const matchType = filterType === 'all' || l?.listingType === filterType;
  return matchSearch && matchStatus && matchType;
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
    setIsFormOpen(true);
  };

  const handleOpenEdit = (listing: any) => {
    const safeListingForEdit = {
      ...listing,
      slots: listing?.slots || []
    };
    setEditingListing(safeListingForEdit);
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
        const res = await fetch(`https://flexi-space-capstone-project.onrender.com/api/Listing/Delete/${targetId}`, {
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
    fetchListings();
  };

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
        {[
          { label: t('listings.totalListings') || 'Tổng số bài', value: listings.length, color: 'var(--color-accent)' },
          { label: 'Đang hoạt động', value: listings.filter(l => l.status === 'Accepted').length, color: 'var(--color-positive)' },
          { label: 'Đã bị khóa', value: listings.filter(l => l.status === 'Ban').length, color: 'var(--color-negative)' },
          { label: 'Chia sẻ mặt bằng', value: listings.filter(l => l.listingType === 'SharedSpace').length, color: 'var(--color-text-secondary)' },
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
            placeholder={t('listings.searchListingPlaceholder') || 'Tìm kiếm bài đăng, địa điểm...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="listings-filters">
          {['all', 'Accepted', 'Ban'].map((f) => (
            <button
              key={f}
              className={`filter-tab ${filterStatus === f ? 'filter-tab--active' : ''}`}
              onClick={() => setFilterStatus(f)}
            >
              {f === 'all' ? (t('listings.all') || 'Tất cả') : getStatusLabel(f)}
            </button>
          ))}
        </div>
        <div className="listings-filters">
          {(['all', 'EntireSpace', 'SharedSpace'] as const).map((f) => (
            <button
              key={f}
              className={`filter-tab ${filterType === f ? 'filter-tab--active' : ''}`}
              onClick={() => setFilterType(f)}
            >
              {f === 'all' ? 'Tất cả loại' : f === 'EntireSpace' ? 'Dài hạn' : 'Chia sẻ'}
            </button>
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
                <div className="listing-type-tag" style={isShareListing(listing) ? { background: 'rgba(0,180,160,0.15)', color: 'var(--color-positive)' } : undefined}>
                  {isShareListing(listing) ? <Users size={13} /> : <Building2 size={13} />}
                  {isShareListing(listing) ? 'Chia sẻ' : 'Dài hạn'}
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

              <div className="listing-visual" style={{ overflow: 'hidden' }}>
                {listing.listingPictures && listing.listingPictures.length > 0 ? (
                  <img
                    src={typeof listing.listingPictures[0] === 'string'
                      ? listing.listingPictures[0]
                      : (listing.listingPictures[0].imageUrl || listing.listingPictures[0].url)}
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

                <div className="listing-area-badge">{listing.area || 'N/A'}</div>
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
            <div className="modal-header" style={{ padding: '16px 20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Chi tiết bài đăng</h2>
              <button type="button" className="btn-icon" onClick={() => setViewingListing(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              {viewingListing.listingPictures && viewingListing.listingPictures.length > 0 ? (
                <div style={{ position: 'relative', width: '100%', height: '400px', backgroundColor: '#111' }}>
                  <img
                    src={typeof viewingListing.listingPictures[currentImageIndex] === 'string'
                      ? viewingListing.listingPictures[currentImageIndex]
                      : (viewingListing.listingPictures[currentImageIndex].imageUrl || viewingListing.listingPictures[currentImageIndex].url)}
                    alt="gallery"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />

                  {viewingListing.listingPictures.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : viewingListing.listingPictures.length - 1)}
                        style={{ position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
                      >
                        <ChevronLeft size={20} color="#000" />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex(prev => prev < viewingListing.listingPictures.length - 1 ? prev + 1 : 0)}
                        style={{ position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
                      >
                        <ChevronRight size={20} color="#000" />
                      </button>
                      <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}>
                        {currentImageIndex + 1} / {viewingListing.listingPictures.length}
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
                  </div>
                </div>

                <div className="glass-card--inset" style={{ padding: '16px', borderRadius: 'var(--radius-lg)' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--color-text-primary)' }}>Mô tả chi tiết</h4>
                  <p style={{ margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap', color: 'var(--color-text-secondary)' }}>{viewingListing.description || 'Chưa có mô tả'}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  <div><strong style={{ color: 'var(--color-text-primary)' }}>Bắt đầu:</strong> {formatDate(viewingListing.allowedStartTime)}</div>
                  <div><strong style={{ color: 'var(--color-text-primary)' }}>Kết thúc:</strong> {formatDate(viewingListing.allowedEndTime)}</div>
                  <div><strong style={{ color: 'var(--color-text-primary)' }}>Đăng lúc:</strong> {formatDate(viewingListing.createdAt)}</div>
                  {isShareListing(viewingListing) && (
                    <div><strong style={{ color: 'var(--color-text-primary)' }}>Số người thuê chung tối đa:</strong> {viewingListing.shareSpaceDetailMaxSubRenter ?? 'N/A'}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};