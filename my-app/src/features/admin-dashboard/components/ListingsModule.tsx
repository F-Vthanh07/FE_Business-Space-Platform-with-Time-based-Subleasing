import React, { useState, useEffect } from 'react';
import { Check, X, MapPin, Clock, Eye, Building2, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AdminListingItem, BusinessCategory } from '../types';
import { ListingDetailModal } from './ListingDetailModal';
import { getPictureUrl } from '../utils/listingPicture';

interface ListingsModuleProps {
  listings: AdminListingItem[];
  handleApproveListing: (listingId: number) => void;
  handleRejectListing: (listingId: number, reason: string) => void;
  isLoading: boolean;
  language: 'en' | 'vi';
  categories: BusinessCategory[];
}

const statusConfig: Record<string, { className: string; label: { en: string; vi: string } }> = {
  pending: { className: 'badge--warning', label: { en: 'Pending', vi: 'Chờ duyệt' } },
  accepted: { className: 'badge--positive', label: { en: 'Accepted', vi: 'Đã duyệt' } },
  canceled: { className: 'badge--negative', label: { en: 'Canceled', vi: 'Từ chối' } },
};

const isShareListing = (l: AdminListingItem) => l?.listingType === 'SharedSpace';

const ITEMS_PER_PAGE = 8; // 2 hàng x 4 cột

const ListingCoverImage: React.FC<{ src: string }> = ({ src }) => {
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

export const ListingsModule: React.FC<ListingsModuleProps> = ({
  listings,
  handleApproveListing,
  handleRejectListing,
  isLoading,
  language,
  categories,
}) => {
  const [selectedListing, setSelectedListing] = useState<AdminListingItem | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(listings.length / ITEMS_PER_PAGE));
  const pagedListings = listings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [listings.length]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return language === 'en' ? 'Unknown' : 'Không rõ';
    return d.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN');
  };

  return (
    <div className="admin-module animate-fade-in">
      <header className="module-header">
        <h1>{language === 'en' ? 'Listings Verification' : 'Phê duyệt Tin đăng'}</h1>
        <p>{language === 'en' ? 'Review lease and time-sharing offers before publishing' : 'Kiểm tra và duyệt các gói tin đăng cho thuê trước khi công khai lên sàn giao dịch'}</p>
      </header>

      {/* Listings Grid */}
      <div className="listings-grid">
        {listings.length === 0 ? (
          <div className="empty-approval glass-card">
            <Check size={36} className="text-neon-green" />
            <h3>{language === 'en' ? 'No listings found' : 'Không tìm thấy bài đăng nào'}</h3>
            <p>{language === 'en' ? 'New listings will appear here' : 'Bài đăng mới sẽ xuất hiện tại đây'}</p>
          </div>
        ) : (
          pagedListings.map(lt => {
            const cleanStatus = (lt.status || 'Pending').toLowerCase();
            const isPending = cleanStatus === 'pending';
            const coverUrl = lt.listingPictures && lt.listingPictures.length > 0 ? getPictureUrl(lt.listingPictures[0]) : null;
            const status = statusConfig[cleanStatus] || statusConfig.pending;
            const categoryName = lt.shareSpaceDetailShareSpaceCategories && lt.shareSpaceDetailShareSpaceCategories.length > 0
              ? categories.find(c => c.id === lt.shareSpaceDetailShareSpaceCategories![0].bussinessCategoryId)?.name
              : undefined;

            return (
              <div key={lt.id} className="glass-card listing-card">
                <div className="listing-card-top">
                  <div className="listing-type-tag">
                    {isShareListing(lt) ? <Users size={13} /> : <Building2 size={13} />}
                    {isShareListing(lt) ? (language === 'en' ? 'Shared' : 'Chia sẻ') : (language === 'en' ? 'Long-term' : 'Dài hạn')}
                  </div>
                  <span className={`badge ${status.className}`}>
                    {status.label[language]}
                  </span>
                </div>

                <div className="listing-visual">
                  {coverUrl ? (
                    <ListingCoverImage src={coverUrl} />
                  ) : (
                    <Building2 size={32} style={{ color: 'var(--color-positive)', opacity: 0.4 }} />
                  )}
                </div>

                <div className="listing-card-body">
                  <p className="listing-location">
                    <MapPin size={12} />
                    {lt.spaceAddress || (language === 'en' ? 'Not updated' : 'Chưa cập nhật')}
                  </p>

                  <p className="listing-name" style={{ fontWeight: 400, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    {lt.description && lt.description.length > 90
                      ? `${lt.description.substring(0, 90)}...`
                      : lt.description || (language === 'en' ? 'Rental Listing' : 'Bài đăng cho thuê')}
                  </p>

                  <div className="listing-price-row">
                    <span className="listing-price">
                      {lt.price ? `${lt.price.toLocaleString('vi-VN')}₫` : (language === 'en' ? 'Negotiable' : 'Thỏa thuận')}
                    </span>
                    <span className="text-secondary" style={{ fontSize: 12 }}>/{language === 'en' ? 'hour' : 'giờ'}</span>
                  </div>

                  <div className="listing-meta">
                    <div className="listing-meta-item">
                      <Clock size={12} className="text-secondary" />
                      <span>{formatDate(lt.createdAt)}</span>
                    </div>
                    {lt.shareSpaceDetailMaxSubRenter !== undefined && (
                      <div className="listing-meta-item">
                        <Users size={12} className="text-secondary" />
                        <span>{language === 'en' ? 'Max' : 'Tối đa'} {lt.shareSpaceDetailMaxSubRenter}</span>
                      </div>
                    )}
                    {categoryName && (
                      <div className="listing-meta-item">
                        <span>{categoryName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="listing-card-actions">
                  <button
                    className="btn-ghost"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setSelectedListing(lt)}
                  >
                    <Eye size={14} /> {language === 'en' ? 'View' : 'Xem'}
                  </button>

                  {isPending && (
                    <>
                      <button
                        className="btn-icon"
                        style={{ color: 'var(--color-positive)' }}
                        disabled={isLoading}
                        title={language === 'en' ? 'Approve' : 'Duyệt'}
                        onClick={() => handleApproveListing(lt.id)}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        style={{ color: 'var(--color-negative)' }}
                        disabled={isLoading}
                        title={language === 'en' ? 'Reject' : 'Từ chối'}
                        onClick={() => {
                          setRejectingId(lt.id);
                          setCancelReason('');
                        }}
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {listings.length > 0 && totalPages > 1 && (
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

      {/* Details Modal Overlay */}
      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          language={language}
          categories={categories}
        />
      )}

      {/* Rejection Reason Modal */}
      {rejectingId !== null && (
        <div className="listing-detail-backdrop">
          <div className="listing-form-modal glass-card" style={{ maxWidth: '400px', width: '90%' }}>
            <div className="listing-form-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                {language === 'en' ? 'Reason for Rejection' : 'Lý do từ chối bài đăng'}
              </h3>
              <button
                className="close-btn"
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                onClick={() => setRejectingId(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                {language === 'en'
                  ? 'Please provide a clear reason for rejecting this listing. This will be sent to the space poster.'
                  : 'Vui lòng cung cấp lý do từ chối rõ ràng. Lý do này sẽ được gửi đến người đăng tin.'}
              </p>
              <textarea
                className="slot-input-text"
                style={{
                  width: '100%',
                  height: '100px',
                  padding: '10px',
                  borderRadius: '6px',
                  resize: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
                placeholder={language === 'en' ? 'Enter rejection reason...' : 'Nhập lý do từ chối...'}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => setRejectingId(null)}
              >
                {language === 'en' ? 'Cancel' : 'Hủy bỏ'}
              </button>
              <button
                className="btn-reject"
                style={{ padding: '8px 16px', fontSize: '13px', flex: 'none' }}
                disabled={!cancelReason.trim()}
                onClick={() => {
                  if (cancelReason.trim()) {
                    handleRejectListing(rejectingId, cancelReason);
                    setRejectingId(null);
                  }
                }}
              >
                {language === 'en' ? 'Confirm' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
