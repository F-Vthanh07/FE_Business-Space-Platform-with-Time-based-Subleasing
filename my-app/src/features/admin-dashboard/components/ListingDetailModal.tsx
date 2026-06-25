import React, { useState } from 'react';
import { 
  X, MapPin, DollarSign, Clock, User, ShieldCheck
} from 'lucide-react';
import type { AdminListingItem, BusinessCategory } from '../types';

interface ListingDetailModalProps {
  listing: AdminListingItem;
  onClose: () => void;
  language: 'en' | 'vi';
  categories: BusinessCategory[];
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({ listing, onClose, language, categories }) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const cleanStatus = (listing.status || 'Pending').toLowerCase();
  const hasPictures = listing.listingPictures && listing.listingPictures.length > 0 && listing.listingPictures[0] !== 'string';
  const pictures = hasPictures ? listing.listingPictures : [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&q=80&w=800"
  ];

  const formatDays = (days: string[]) => {
    if (!days || days.length === 0) return '';
    return days.map(d => {
      const translations: Record<string, string> = {
        'Monday': language === 'en' ? 'Mon' : 'Thứ 2',
        'Tuesday': language === 'en' ? 'Tue' : 'Thứ 3',
        'Wednesday': language === 'en' ? 'Wed' : 'Thứ 4',
        'Thursday': language === 'en' ? 'Thu' : 'Thứ 5',
        'Friday': language === 'en' ? 'Fri' : 'Thứ 6',
        'Saturday': language === 'en' ? 'Sat' : 'Thứ 7',
        'Sunday': language === 'en' ? 'Sun' : 'Chủ Nhật'
      };
      return translations[d] || d;
    }).join(', ');
  };

  return (
    <div className="listing-detail-backdrop">
      <div className="listing-detail-modal glass-card">
        
        {/* Header */}
        <div className="listing-detail-header">
          <div className="title-area">
            <h2 className="title-text">
              {language === 'en' ? 'Listing Details Inspection' : 'Thông tin Chi tiết Tin đăng'}
            </h2>
            <p className="subtitle-text">ID: {listing.id} · {listing.listingType || 'SharedSpace'}</p>
          </div>
          <button className="btn-icon close-btn" onClick={onClose} title={language === 'en' ? 'Close' : 'Đóng'}>
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="listing-detail-body">
          
          {/* Left Column: Visuals & Description */}
          <div className="detail-left-col">
            
            {/* Image Previewer */}
            <div className="detail-media-gallery">
              <div className="main-image-wrap">
                <img 
                  src={pictures[activeImageIdx]} 
                  alt="Listing Display" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800";
                  }}
                />
              </div>
              {pictures.length > 1 && (
                <div className="image-thumbnails-strip">
                  {pictures.map((pic, idx) => (
                    <button 
                      key={idx} 
                      className={`thumb-btn ${idx === activeImageIdx ? 'active' : ''}`}
                      onClick={() => setActiveImageIdx(idx)}
                    >
                      <img 
                        src={pic} 
                        alt={`Thumb ${idx + 1}`} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description card */}
            <div className="detail-desc-card glass-card--inset">
              <h3>{language === 'en' ? 'Description' : 'Mô tả'}</h3>
              <p className="desc-content">{listing.description || (language === 'en' ? 'No description provided.' : 'Chủ nhà chưa cung cấp thông tin mô tả.')}</p>
            </div>

            {/* Categories Notes */}
            {listing.shareSpaceDetailShareSpaceCategories && listing.shareSpaceDetailShareSpaceCategories.length > 0 && (
              <div className="detail-category-card glass-card--inset">
                <h3>{language === 'en' ? 'Allowed Business Categories' : 'Ngành hàng Ưu tiên / Cho phép'}</h3>
                {listing.shareSpaceDetailShareSpaceCategories.map((cat, i) => (
                  <div key={i} className="category-note-item">
                    <span className="cat-bullet">▸</span>
                    <div className="cat-note-detail">
                      <strong>{language === 'en' ? 'Category:' : 'Ngành hàng:'}</strong>{' '}
                      {categories.find(c => c.id === cat.bussinessCategoryId)?.name || `${language === 'en' ? 'Category ID' : 'ID Ngành'} ${cat.bussinessCategoryId}`}
                      {cat.note && <p className="cat-note-text"><em>"{cat.note}"</em></p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Parameters & Amenities */}
          <div className="detail-right-col">
            
            {/* Parameters Block */}
            <div className="detail-section">
              <h3 className="section-title">{language === 'en' ? 'Operational Details' : 'Thông tin Hoạt động'}</h3>
              <div className="parameter-grid">
                
                <div className="param-item">
                  <div className="param-label"><MapPin size={13} /> {language === 'en' ? 'Space Address' : 'Địa chỉ mặt bằng'}</div>
                  <div className="param-value">{listing.spaceAddress || 'N/A'}</div>
                </div>

                <div className="param-item">
                  <div className="param-label"><DollarSign size={13} /> {language === 'en' ? 'Basic Price' : 'Giá thuê cơ bản'}</div>
                  <div className="param-value text-neon-green">
                    {listing.price ? `${listing.price.toLocaleString('vi-VN')} đ/giờ` : (language === 'en' ? 'Negotiable' : 'Thỏa thuận')}
                  </div>
                </div>

                <div className="param-item">
                  <div className="param-label"><User size={13} /> {language === 'en' ? 'Lessor / Poster' : 'Chủ nhà đăng tin'}</div>
                  <div className="param-value">
                    {listing.lessorName && listing.lessorName !== 'string' ? listing.lessorName : (language === 'en' ? 'Owner Account' : 'Chủ sở hữu')}
                    <span className="param-subvalue"> (Creator ID: {listing.creatorId})</span>
                  </div>
                </div>

                <div className="param-item">
                  <div className="param-label"><Clock size={13} /> {language === 'en' ? 'Validity Period' : 'Thời gian cho thuê'}</div>
                  <div className="param-value">
                    <div>{language === 'en' ? 'From:' : 'Từ:'} {new Date(listing.allowedStartTime).toLocaleDateString()}</div>
                    <div>{language === 'en' ? 'To:' : 'Đến:'} {new Date(listing.allowedEndTime).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="param-item">
                  <div className="param-label"><ShieldCheck size={13} /> {language === 'en' ? 'Legal Verification' : 'Cam kết Pháp lý'}</div>
                  <div className="param-value">
                    {listing.shareSpaceDetailIsLegalCommitted ? (
                      <span className="badge-legal active">
                        ✓ {language === 'en' ? 'Committed' : 'Đã xác minh cam kết'}
                      </span>
                    ) : (
                      <span className="badge-legal warning">
                        ✗ {language === 'en' ? 'Uncommitted' : 'Chưa xác minh cam kết'}
                      </span>
                    )}
                    {listing.shareSpaceDetailLegalCommittedAt && (
                      <span className="param-subvalue"> ({new Date(listing.shareSpaceDetailLegalCommittedAt).toLocaleString()})</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Availability Times */}
            {listing.shareSpaceDetailAvailabilitiesTimes && listing.shareSpaceDetailAvailabilitiesTimes.length > 0 && (
              <div className="detail-section">
                <h3 className="section-title">{language === 'en' ? 'Availability Schedule' : 'Khung giờ Hoạt động'}</h3>
                <div className="availability-slot-list">
                  {listing.shareSpaceDetailAvailabilitiesTimes.map((time, idx) => (
                    <div key={idx} className="avail-slot-card">
                      <div className="slot-days">📅 {formatDays(time.daysOfWeek)}</div>
                      <div className="slot-hours">
                        ⏰ {time.startTime?.substring(0, 5)} - {time.endTime?.substring(0, 5)}
                      </div>
                      <div className="slot-dates text-secondary">
                        {language === 'en' ? 'Valid:' : 'Áp dụng:'} {time.validFrom} {language === 'en' ? 'to' : 'đến'} {time.validTo}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities Checklist */}
            {listing.shareSpaceDetailShareSpaceAmenities && listing.shareSpaceDetailShareSpaceAmenities.length > 0 && (
              <div className="detail-section">
                <h3 className="section-title">{language === 'en' ? 'Amenities Checklist' : 'Trang thiết bị & Tiện ích'}</h3>
                <div className="amenities-detailed-list">
                  {listing.shareSpaceDetailShareSpaceAmenities.map((amen, idx) => (
                    <div key={idx} className={`amenity-detailed-row ${amen.isIncluded ? 'included' : 'chargeable'}`}>
                      <div className="amenity-name-part">
                        <span className="check-dot">✓</span>
                        <span>{language === 'en' ? `Amenity #${amen.amenityId}` : `Tiện ích #${amen.amenityId}`}</span>
                      </div>
                      <div className="amenity-price-part">
                        {amen.isIncluded ? (
                          <span className="free-badge">{language === 'en' ? 'Included' : 'Bao gồm'}</span>
                        ) : (
                          <span className="price-tag">+{amen.price.toLocaleString('vi-VN')} đ</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="listing-detail-footer">
          <div className="status-indicator">
            <span className={`status-badge-inline ${cleanStatus === 'accepted' ? 'approved' : cleanStatus === 'canceled' ? 'rejected' : cleanStatus}`}>
              {cleanStatus === 'pending' ? (language === 'en' ? 'Pending Review' : 'Đang chờ duyệt')
               : cleanStatus === 'accepted' ? (language === 'en' ? 'Accepted' : 'Đã duyệt')
               : cleanStatus === 'canceled' ? (language === 'en' ? 'Canceled' : 'Đã từ chối')
               : cleanStatus}
            </span>
          </div>
          <button className="btn-secondary" onClick={onClose}>
            {language === 'en' ? 'Close Panel' : 'Đóng cửa sổ'}
          </button>
        </div>
      </div>
    </div>
  );
};
