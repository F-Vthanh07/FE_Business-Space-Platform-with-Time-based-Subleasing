import React, { useState } from 'react';
import { Check, X, MapPin, DollarSign, Clock, User as UserIcon, Users, Eye } from 'lucide-react';
import type { AdminListingItem, BusinessCategory } from '../types';
import { ListingDetailModal } from './ListingDetailModal';

interface ListingsModuleProps {
  listings: AdminListingItem[];
  listingsFilter: 'all' | 'pending' | 'accepted' | 'canceled';
  setListingsFilter: (filter: 'all' | 'pending' | 'accepted' | 'canceled') => void;
  handleApproveListing: (listingId: number) => void;
  handleRejectListing: (listingId: number, reason: string) => void;
  isLoading: boolean;
  language: 'en' | 'vi';
  categories: BusinessCategory[];
}

export const ListingsModule: React.FC<ListingsModuleProps> = ({
  listings,
  listingsFilter,
  setListingsFilter,
  handleApproveListing,
  handleRejectListing,
  isLoading,
  language,
  categories,
}) => {
  const [selectedListing, setSelectedListing] = useState<AdminListingItem | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  const filteredListings = listings.filter(lt => {
    if (listingsFilter === 'all') return true;
    return lt.status?.toLowerCase() === listingsFilter;
  });

  const formatAvailability = (availabilities: any[]) => {
    if (!availabilities || availabilities.length === 0) return language === 'en' ? 'Not specified' : 'Chưa xác định';
    const avail = availabilities[0];
    const days = avail.daysOfWeek ? avail.daysOfWeek.map((d: string) => {
      const translations: Record<string, string> = {
        'Monday': language === 'en' ? 'Mon' : 'T2',
        'Tuesday': language === 'en' ? 'Tue' : 'T3',
        'Wednesday': language === 'en' ? 'Wed' : 'T4',
        'Thursday': language === 'en' ? 'Thu' : 'T5',
        'Friday': language === 'en' ? 'Fri' : 'T6',
        'Saturday': language === 'en' ? 'Sat' : 'T7',
        'Sunday': language === 'en' ? 'Sun' : 'CN'
      };
      return translations[d] || d;
    }).join(', ') : '';
    const time = `${avail.startTime?.substring(0, 5)} - ${avail.endTime?.substring(0, 5)}`;
    return days ? `${days} (${time})` : time;
  };

  return (
    <div className="admin-module animate-fade-in">
      <header className="module-header">
        <h1>{language === 'en' ? 'Listings Verification' : 'Phê duyệt Tin đăng'}</h1>
        <p>{language === 'en' ? 'Review lease and time-sharing offers before publishing' : 'Kiểm tra và duyệt các gói tin đăng cho thuê trước khi công khai lên sàn giao dịch'}</p>
      </header>

      {/* Status Filters */}
      <div className="admin-listings-controls glass-card">
        <div className="admin-listings-filters">
          {(['all', 'pending', 'accepted', 'canceled'] as const).map((f) => (
            <button
              key={f}
              className={`filter-tab ${listingsFilter === f ? 'filter-tab--active' : ''}`}
              onClick={() => setListingsFilter(f)}
            >
              {f === 'all' 
                ? (language === 'en' ? 'All' : 'Tất cả') 
                : f === 'pending' 
                ? (language === 'en' ? 'Pending' : 'Chờ duyệt')
                : f === 'accepted'
                ? (language === 'en' ? 'Accepted' : 'Đã duyệt')
                : (language === 'en' ? 'Canceled' : 'Từ chối')}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="approval-list-grid">
        {filteredListings.length === 0 ? (
          <div className="empty-approval glass-card">
            <Check size={36} className="text-neon-green" />
            <h3>{language === 'en' ? 'No listings found' : 'Không tìm thấy bài đăng nào'}</h3>
            <p>{language === 'en' ? 'Everything is clear for this filter' : 'Không có bài đăng nào tương ứng với bộ lọc này'}</p>
          </div>
        ) : (
          filteredListings.map(lt => {
            const cleanStatus = (lt.status || 'Pending').toLowerCase();
            const isPending = cleanStatus === 'pending';
            const hasPictures = lt.listingPictures && lt.listingPictures.length > 0 && lt.listingPictures[0] !== 'string';

            return (
              <div key={lt.id} className="approval-card glass-card">
                
                {/* Dynamic Listing Picture Header */}
                <div className="approval-card-image">
                  <img 
                    src={hasPictures ? lt.listingPictures[0] : "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800"} 
                    alt="Space Preview" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800";
                    }}
                  />
                  <span className="approval-card-type-badge">
                    {lt.listingType || 'SharedSpace'}
                  </span>
                  <span className={`approval-card-status-badge ${cleanStatus === 'accepted' ? 'approved' : cleanStatus === 'canceled' ? 'rejected' : cleanStatus}`}>
                    {cleanStatus === 'pending' ? (language === 'en' ? 'Pending' : 'Chờ duyệt')
                     : cleanStatus === 'accepted' ? (language === 'en' ? 'Accepted' : 'Đã duyệt')
                     : cleanStatus === 'canceled' ? (language === 'en' ? 'Canceled' : 'Từ chối')
                     : cleanStatus}
                  </span>
                </div>

                <div className="approval-card-header">
                  <span className="approval-id">ID: {lt.id}</span>
                  <span className="approval-date">{new Date(lt.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN')}</span>
                </div>

                {/* Prominent Address Strip above the title */}
                <div className="approval-address-strip">
                  <MapPin size={15} />
                  <span className="approval-address-text" title={lt.spaceAddress}>
                    {lt.spaceAddress || (language === 'en' ? 'Not updated' : 'Chưa cập nhật')}
                  </span>
                </div>

                {/* Description/Title below Address */}
                <p className="approval-desc" title={lt.description}>
                  {lt.description && lt.description.length > 100 
                    ? `${lt.description.substring(0, 100)}...` 
                    : lt.description || (language === 'en' ? 'Rental Listing' : 'Bài đăng cho thuê')}
                </p>

                {/* Evaluation Indicators Strip */}
                <div className="evaluation-indicators">
                  <div className={`indicator-badge ${lt.shareSpaceDetailIsLegalCommitted ? 'success' : 'danger'}`}>
                    {lt.shareSpaceDetailIsLegalCommitted 
                      ? (language === 'en' ? '✓ Legally Committed' : '✅ Đã cam kết pháp lý') 
                      : (language === 'en' ? '⚠️ Not Legally Committed' : '⚠️ Chưa cam kết pháp lý')}
                  </div>

                  <div className={`indicator-badge ${lt.shareSpaceDetailIsOwner ? 'info' : 'warning'}`}>
                    {lt.shareSpaceDetailIsOwner 
                      ? (language === 'en' ? '👤 Property Owner' : '👤 Chủ sở hữu') 
                      : (language === 'en' ? '🔄 Sub-lessor' : '🔄 Cho thuê lại')}
                  </div>

                  {lt.shareSpaceDetailShareSpaceCategories && lt.shareSpaceDetailShareSpaceCategories.length > 0 && (
                    <div className="indicator-badge category">
                      {language === 'en' ? 'Category: ' : 'Ngành: '}
                      {categories.find(c => c.id === lt.shareSpaceDetailShareSpaceCategories![0].bussinessCategoryId)?.name || `ID ${lt.shareSpaceDetailShareSpaceCategories![0].bussinessCategoryId}`}
                    </div>
                  )}
                </div>
                
                <div className="approval-details">
                  <div className="detail-item">
                    <DollarSign size={14} />
                    <span>
                      <strong>{language === 'en' ? 'Price:' : 'Giá thuê:'}</strong>{' '}
                      <strong className="text-neon-green">
                        {lt.price ? `${lt.price.toLocaleString('vi-VN')} đ/giờ` : (language === 'en' ? 'Negotiable' : 'Thỏa thuận')}
                      </strong>
                    </span>
                  </div>

                  <div className="detail-item">
                    <Clock size={14} />
                    <span>
                      <strong>{language === 'en' ? 'Availability:' : 'Thời gian:'}</strong>{' '}
                      {formatAvailability(lt.shareSpaceDetailAvailabilitiesTimes || [])}
                    </span>
                  </div>

                  <div className="detail-item">
                    <UserIcon size={14} />
                    <span>
                      <strong>{language === 'en' ? 'Poster:' : 'Người đăng:'}</strong>{' '}
                      {lt.lessorName && lt.lessorName !== 'string' ? lt.lessorName : (language === 'en' ? 'Owner' : 'Chủ nhà')} (ID: {lt.creatorId ? `${lt.creatorId.substring(0, 8)}...` : 'N/A'})
                    </span>
                  </div>

                  {lt.shareSpaceDetailMaxSubRenter !== undefined && (
                    <div className="detail-item">
                      <Users size={14} />
                      <span>
                        <strong>{language === 'en' ? 'Max Sub-renter:' : 'Số người thuê tối đa:'}</strong>{' '}
                        {lt.shareSpaceDetailMaxSubRenter}
                      </span>
                    </div>
                  )}
                </div>

                <div className="approval-card-actions">
                  {/* View Details Button */}
                  <button 
                    className="btn-approve" 
                    style={{ background: 'rgba(58, 134, 255, 0.15)', border: '1px solid rgba(58, 134, 255, 0.3)', color: '#3a86ff' }}
                    onClick={() => setSelectedListing(lt)}
                    title={language === 'en' ? 'View details' : 'Xem chi tiết'}
                  >
                    <Eye size={15} />
                    {language === 'en' ? 'View Details' : 'Xem Chi tiết'}
                  </button>

                  {isPending && (
                    <>
                      <button 
                        className="btn-approve" 
                        disabled={isLoading}
                        onClick={() => handleApproveListing(lt.id)}
                      >
                        <Check size={15} />
                        {language === 'en' ? 'Approve' : 'Duyệt'}
                      </button>

                      <button 
                        className="btn-reject" 
                        disabled={isLoading}
                        onClick={() => {
                          setRejectingId(lt.id);
                          setCancelReason('');
                        }}
                      >
                        <X size={15} />
                        {language === 'en' ? 'Reject' : 'Từ chối'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

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
                style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer' }}
                onClick={() => setRejectingId(null)}
              >
                <X size={18} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
              <p style={{ fontSize: '13px', color: '#8b949e', margin: 0 }}>
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
