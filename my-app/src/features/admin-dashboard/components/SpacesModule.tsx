import React, { useEffect, useMemo, useState } from 'react';
import { Search, Building2, MapPin, Eye, X, User, Ruler, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AdminSpaceItem, UserAccount, AdminListingItem } from '../types';
import { getPictureUrl } from '../utils/listingPicture';
import { RefreshButton } from './RefreshButton';

interface SpacesModuleProps {
  spaces: AdminSpaceItem[];
  users: UserAccount[];
  listings: AdminListingItem[];
  language: 'en' | 'vi';
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const ITEMS_PER_PAGE = 8; // 2 hàng x 4 cột

const SpaceCoverImage: React.FC<{ src: string }> = ({ src }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError) {
    return <Building2 size={32} style={{ color: 'var(--color-positive)', opacity: 0.4 }} />;
  }

  return (
    <img
      src={src}
      alt="cover"
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      onError={() => setHasError(true)}
    />
  );
};



export const SpacesModule: React.FC<SpacesModuleProps> = ({ spaces, users, listings, language, onRefresh, isRefreshing }) => {
  const [search, setSearch] = useState('');
  const [selectedSpace, setSelectedSpace] = useState<AdminSpaceItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredSpaces = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return spaces;
    return spaces.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.address || '').toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q)
    );
  }, [spaces, search]);

  const totalPages = Math.max(1, Math.ceil(filteredSpaces.length / ITEMS_PER_PAGE));
  const pagedSpaces = filteredSpaces.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredSpaces.length]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  const findOwner = (ownerId: string) => users.find(u => u.id === ownerId);

  const findSpaceCoverUrl = (spaceId: number): string | null => {
    const listing = listings.find(l => l.spaceId === spaceId && l.listingPictures && l.listingPictures.length > 0);
    if (!listing) return null;
    return getPictureUrl(listing.listingPictures[0]);
  };

  return (
    <div className="admin-module animate-fade-in">
      <header className="module-header">
        <div>
          <h1>{language === 'en' ? 'Space Management' : 'Quản lý Mặt bằng'}</h1>
          <p>{language === 'en' ? 'All registered physical spaces across the platform' : 'Toàn bộ mặt bằng đã đăng ký trên hệ thống'}</p>
        </div>
        <RefreshButton onRefresh={onRefresh} isRefreshing={isRefreshing} language={language} />
      </header>

      {/* Summary Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper blue"><Building2 size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'TOTAL SPACES' : 'TỔNG SỐ MẶT BẰNG'}</span>
            <h2 className="stat-value">{spaces.length}</h2>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="admin-listings-controls glass-card">
        <div className="listings-search">
          <Search size={15} style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            placeholder={language === 'en' ? 'Search by name, address, city...' : 'Tìm theo tên, địa chỉ, thành phố...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Spaces Grid */}
      <div className="listings-grid">
        {filteredSpaces.length === 0 ? (
          <div className="empty-approval glass-card">
            <Building2 size={36} className="text-neon-green" />
            <h3>{language === 'en' ? 'No spaces found' : 'Không tìm thấy mặt bằng nào'}</h3>
            <p>{language === 'en' ? 'Registered spaces will appear here' : 'Mặt bằng đã đăng ký sẽ xuất hiện tại đây'}</p>
          </div>
        ) : (
          pagedSpaces.map(s => {
            const owner = findOwner(s.ownerId);
            const coverUrl = findSpaceCoverUrl(s.id);
            return (
              <div key={s.id} className="glass-card listing-card">
                <div className="listing-card-top">
                  <div className="listing-type-tag">
                    <Building2 size={13} />
                    {language === 'en' ? 'Space' : 'Mặt bằng'}
                  </div>
                </div>

                <div className="listing-visual">
                  {coverUrl ? (
                    <SpaceCoverImage src={coverUrl} />
                  ) : (
                    <Building2 size={32} style={{ color: 'var(--color-positive)', opacity: 0.4 }} />
                  )}
                </div>

                <div className="listing-card-body">
                  <p className="listing-location">
                    <MapPin size={12} />
                    {s.address || (language === 'en' ? 'Not updated' : 'Chưa cập nhật')}
                  </p>

                  <p className="listing-name" style={{ fontWeight: 700, fontSize: 14 }}>
                    {s.name || (language === 'en' ? 'Unnamed space' : 'Mặt bằng chưa đặt tên')}
                  </p>

                  <div className="listing-meta">
                    <div className="listing-meta-item">
                      <Ruler size={12} className="text-secondary" />
                      <span>{s.area?.toLocaleString('vi-VN') ?? '—'} m²</span>
                    </div>
                    <div className="listing-meta-item">
                      <span>{s.city || '—'}</span>
                    </div>
                    <div className="listing-meta-item">
                      <User size={12} className="text-secondary" />
                      <span>{owner?.profileFullName || owner?.name || owner?.email || (language === 'en' ? 'Unknown owner' : 'Chưa rõ chủ sở hữu')}</span>
                    </div>
                  </div>
                </div>

                <div className="listing-card-actions">
                  <button
                    className="btn-ghost"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setSelectedSpace(s)}
                  >
                    <Eye size={14} /> {language === 'en' ? 'View' : 'Xem'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {filteredSpaces.length > 0 && totalPages > 1 && (
        <div className="admin-pagination">
          <button
            className="btn-icon"
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
            title={language === 'en' ? 'Previous' : 'Trang trước'}
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`admin-pagination-page ${page === currentPage ? 'admin-pagination-page--active' : ''}`}
              onClick={() => goToPage(page)}
            >
              {page}
            </button>
          ))}

          <button
            className="btn-icon"
            disabled={currentPage === totalPages}
            onClick={() => goToPage(currentPage + 1)}
            title={language === 'en' ? 'Next' : 'Trang sau'}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedSpace && (() => {
        const owner = findOwner(selectedSpace.ownerId);
        const coverUrl = findSpaceCoverUrl(selectedSpace.id);
        return (
          <div className="listing-detail-backdrop">
            <div className="listing-detail-modal glass-card">
              <div className="listing-detail-header">
                <div className="title-area">
                  <h2 className="title-text">
                    {language === 'en' ? 'Space Details' : 'Thông tin Chi tiết Mặt bằng'}
                  </h2>
                  <p className="subtitle-text">{selectedSpace.name || (language === 'en' ? 'Unnamed space' : 'Chưa đặt tên')}</p>
                </div>
                <button className="btn-icon close-btn" onClick={() => setSelectedSpace(null)} title={language === 'en' ? 'Close' : 'Đóng'}>
                  <X size={18} />
                </button>
              </div>

              <div className="listing-detail-body">
                <div className="detail-left-col">
                  {coverUrl && (
                    <div className="detail-media-gallery">
                      <div className="main-image-wrap">
                        <SpaceCoverImage src={coverUrl} />
                      </div>
                    </div>
                  )}

                  <div className="detail-desc-card glass-card--inset">
                    <h3>{language === 'en' ? 'Basic Information' : 'Thông tin cơ bản'}</h3>
                    <p className="desc-content">
                      <strong>{selectedSpace.name || (language === 'en' ? 'Unnamed space' : 'Chưa đặt tên')}</strong>
                    </p>
                    <p className="desc-content">{selectedSpace.address}, {selectedSpace.city}</p>
                    <p className="desc-content">{language === 'en' ? 'Area' : 'Diện tích'}: {selectedSpace.area?.toLocaleString('vi-VN')} m²</p>
                  </div>

                  <div className="detail-category-card glass-card--inset">
                    <h3>{language === 'en' ? 'Owner Information' : 'Thông tin Chủ mặt bằng'}</h3>
                    {owner ? (
                      <>
                        <p className="desc-content"><strong>{language === 'en' ? 'Name:' : 'Tên:'}</strong> {owner.profileFullName || owner.name}</p>
                        <p className="desc-content"><strong>Email:</strong> {owner.email}</p>
                        <p className="desc-content"><strong>{language === 'en' ? 'Phone:' : 'SĐT:'}</strong> {owner.phoneNumber || '—'}</p>
                      </>
                    ) : (
                      <p className="desc-content text-secondary">
                        {language === 'en' ? 'Owner information not available.' : 'Không tìm thấy thông tin chủ sở hữu.'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="detail-right-col">
                  {selectedSpace.amenities && selectedSpace.amenities.length > 0 && (
                    <div className="detail-section">
                      <h3 className="section-title">{language === 'en' ? 'Amenities' : 'Tiện ích'}</h3>
                      <div className="amenities-detailed-list">
                        {selectedSpace.amenities.map((a, idx) => (
                          <div key={idx} className="amenity-detailed-row included">
                            <div className="amenity-name-part">
                              <span className="check-dot">✓</span>
                              <span>{a.name}{a.quantity ? ` (x${a.quantity})` : ''}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="listing-detail-footer" style={{ justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => setSelectedSpace(null)}>
                  {language === 'en' ? 'Close Panel' : 'Đóng cửa sổ'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
