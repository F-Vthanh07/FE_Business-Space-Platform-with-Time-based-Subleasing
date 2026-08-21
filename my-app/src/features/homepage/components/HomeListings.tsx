/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Globe, ShieldCheck, Clock3, Camera, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPriceUnitText } from '../../../utils/formatPriceUnit';

interface HomeListingsProps {
  onCardClick: (id: string) => void;
  selectedId: string;
  isMapMode?: boolean;
  onToggleMap?: () => void;
}

// Ảnh mặc định duy nhất, chỉ dùng khi bài đăng KHÔNG có ảnh thật nào
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800';

// Số tin tối đa hiện ở mỗi cột trên trang chủ
const MAX_VISIBLE = 5;

const getPicUrl = (pic: any): string => {
  return typeof pic === 'string' ? pic : (pic?.imageUrl || pic?.url || '');
};

// Hiển thị thời gian tương đối dựa trên createdAt trả về từ BE
const formatTimeAgo = (dateStr?: string) => {
  if (!dateStr) return 'Vừa cập nhật';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Vừa cập nhật';
  d.setHours(d.getHours() + 7);
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} ngày trước`;
  return d.toLocaleDateString('vi-VN');
};

type RentalCategory = 'full' | 'timeslot' | 'partial';

const getRentalCategory = (listing: any): RentalCategory => {
  const rawPriceUnit = listing.priceUnit || listing.PriceUnit;
  const listingType = listing.listingType || listing.ListingType;
  if (rawPriceUnit === 'PerHour' || listingType === 'SharedSpace') return 'timeslot';
  return 'full';
};

export const HomeListings: React.FC<HomeListingsProps> = ({
  selectedId,
  isMapMode,
  onToggleMap,
}) => {
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // STATE LƯU TIN TRANG CHỦ
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  const navigate = useNavigate();
  const token = localStorage.getItem('portal_token');

  // FETCH API KHI LOAD TRANG CHỦ
  useEffect(() => {
    const fetchPublicListings = async () => {
      try {
        // BƯỚC 1: Load danh sách lưu tin trước
        if (token) {
          fetch('https://flexi-space-capstone-project.onrender.com/api/FavoriteList/FavoriteByUser', {
            headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
          })
            .then(res => res.ok ? res.json() : [])
            .then(data => {
              const favData = Array.isArray(data) ? data : (data?.data || data?.items || data?.listingIds || []);
              const favIds = new Set<number>();

              favData.forEach((item: any) => {
                if (typeof item === 'number' || typeof item === 'string') {
                  favIds.add(Number(item));
                } else {
                  const itemId = item?.listingId || item?.ListingId || item?.listing?.id || item?.id || item?.Id;
                  if (itemId) favIds.add(Number(itemId));
                }
              });

              setFavoriteIds(favIds);
            })
            .catch(err => console.error('Lỗi tải danh sách yêu thích', err));
        }

        // BƯỚC 2: LẤY DANH SÁCH MẶT BẰNG ĐỂ LẤY ĐỊA CHỈ
        const spaceResponse = await fetch(
          'https://flexi-space-capstone-project.onrender.com/api/Space/GetAll',
          { headers: { accept: '*/*' } }
        );

        let spaces: any[] = [];
        if (spaceResponse.ok) {
          const spaceData = await spaceResponse.json();
          spaces = Array.isArray(spaceData) ? spaceData : (spaceData?.data || spaceData?.items || []);
        }

        // BƯỚC 3: LẤY DANH SÁCH BÀI ĐĂNG (Thêm header giống bên OwnerListings)
        const headers: any = { accept: '*/*' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(
          'https://flexi-space-capstone-project.onrender.com/api/Listing/GetAll',
          { headers }
        );

        if (response.ok) {
          const data = await response.json();
          const safeData = Array.isArray(data) ? data : (data?.data || data?.items || []);

          // BƯỚC 4: XÁC ĐỊNH SPACE PART VÀ FETCH DATA CẦN THIẾT
          const spacePartPromises: number[] = [];
          const listingsWithAddressBase = safeData
            .filter((l: any) => {
              const status = l.status ?? l.Status;
              return status !== 1 && status !== 'Occupied';
            })
            .map((l: any) => {
              let currentSpaceId = l.spaceId || l.SpaceId;
              let parentSpace = spaces.find((s) => (s.id || s.Id) == currentSpaceId);
              
              let isSpacePart = false;
              if (!parentSpace) {
                  isSpacePart = true;
                  if (currentSpaceId) spacePartPromises.push(currentSpaceId);
              }
              return { ...l, isSpacePart, _tempSpaceId: currentSpaceId, _parentSpace: parentSpace };
            });

          // FETCH UNIQUE SPACE PARTS
          const uniqueSpacePartIds = Array.from(new Set(spacePartPromises));
          const fetchedSpaceParts: Record<number, any> = {};
          if (uniqueSpacePartIds.length > 0) {
              await Promise.all(uniqueSpacePartIds.map(async (spId) => {
                  try {
                      const res = await fetch(`https://flexi-space-capstone-project.onrender.com/api/SpacePart/GetById/${spId}`, { headers });
                      if (res.ok) {
                          fetchedSpaceParts[spId] = await res.json();
                      }
                  } catch (e) {}
              }));
          }

          // GHÉP AREA & ADDRESS
          const listingsWithAddress = listingsWithAddressBase.map((l: any) => {
            let spaceOrPart = l._parentSpace || fetchedSpaceParts[l._tempSpaceId];
            
            let address = l.spaceAddress || l.location || l.address || '';
            let city = l.city || '';
            let computedArea = l.area || l.Area || spaceOrPart?.area || spaceOrPart?.Area || null;

            if (l.isSpacePart && spaceOrPart?.parentSpaceId) {
               const parent = spaces.find(s => (s.id || s.Id) == spaceOrPart.parentSpaceId);
               if (parent && !address) {
                 address = parent.address || parent.location || '';
                 city = parent.city || '';
               }
            } else if (spaceOrPart && !address) {
                 address = spaceOrPart.address || spaceOrPart.location || '';
                 city = spaceOrPart.city || '';
            }

            return {
              ...l,
              address,
              area: computedArea,
              city,
              isSpacePart: l.isSpacePart
            };
          });

          console.log("listingsWithAddress mapped count:", listingsWithAddress.length);
          setListings(listingsWithAddress);
        }
      } catch (error) {
        console.error('Lỗi tải danh sách bài đăng trang chủ:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicListings();
  }, [token]);

  // HÀM TOGGLE YÊU THÍCH CHO CARD TRANG CHỦ
  const handleToggleFavorite = async (e: React.MouseEvent, listingIdStr: string | number) => {
    e.stopPropagation();
    if (!token) {
      alert("Vui lòng đăng nhập để lưu mặt bằng!");
      navigate('/login');
      return;
    }
    const numericId = Number(listingIdStr);
    const isFav = favoriteIds.has(numericId);

    try {
      let res;
      if (isFav) {
        res = await fetch(`https://flexi-space-capstone-project.onrender.com/api/FavoriteList/listings/${numericId}`, {
          method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        res = await fetch('https://flexi-space-capstone-project.onrender.com/api/FavoriteList/listings', {
          method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingIds: [numericId] })
        });
      }

      if (res?.ok) {
        setFavoriteIds(prev => {
          const next = new Set(prev);
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          isFav ? next.delete(numericId) : next.add(numericId);
          return next;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fullListings = listings.filter((l) => getRentalCategory(l) === 'full');
  const sharedListings = listings.filter((l) => getRentalCategory(l) === 'timeslot' || getRentalCategory(l) === 'partial');

  const hasMoreOverall = fullListings.length > MAX_VISIBLE || sharedListings.length > MAX_VISIBLE;

  // ================= RENDER 1 CARD =================
  const renderCard = (item: any, category: RentalCategory) => {
    const itemId = item.id?.toString() || item.Id?.toString() || item.listingId?.toString();

    const rawPictures = item.listingPictures || [];
    const realImages: string[] = rawPictures.map(getPicUrl).filter((url: string) => !!url);
    const imageCount = realImages.length;
    const mainImage = imageCount > 0 ? realImages[0] : FALLBACK_IMAGE;

    const isHourly = category === 'timeslot';
    const rawPriceUnit = item.priceUnit || item.PriceUnit;
    const priceUnitText = rawPriceUnit ? getPriceUnitText(rawPriceUnit) : (isHourly ? 'giờ' : 'tháng');
    
    // 2. Type Label (Theo giờ, dài hạn, v.v.)
    let typeLabel = '';
    const listingType = item.listingType || item.ListingType;
    if (rawPriceUnit === 'PerHour') {
       typeLabel = 'Theo ca/giờ';
    } else if (rawPriceUnit === 'PerDay') {
       typeLabel = 'Theo ngày';
    } else if (rawPriceUnit === 'PerWeek') {
       typeLabel = 'Theo tuần';
    } else {
       typeLabel = 'Cố định 24/7';
    }
    if (listingType === 'SharedSpace' && rawPriceUnit !== 'PerHour') {
       typeLabel = 'Chia sẻ không gian';
    }

    const actionLabel = isHourly ? 'Đặt giờ' : 'Nhắn tin';

    const isSaved = favoriteIds.has(Number(itemId));

    let timeSlotStr = '';
    if (isHourly && item.shareSpaceDetailAvailabilitiesTimes?.length > 0) {
      const firstSlot = item.shareSpaceDetailAvailabilitiesTimes[0];
      const formatToAmPm = (timeStr?: string) => {
        if (!timeStr) return '';
        const [h, m] = timeStr.split(':');
        const hh = parseInt(h, 10);
        const ampm = hh >= 12 ? 'PM' : 'AM';
        const hh12 = hh % 12 || 12;
        return `${hh12.toString().padStart(2, '0')}:${m} ${ampm}`;
      };
      
      const dayStr = firstSlot.daysOfWeek?.length > 0 ? firstSlot.daysOfWeek.join(', ') : 'Hôm nay';
      timeSlotStr = `⏱ ${dayStr}: ${formatToAmPm(firstSlot.startTime)} - ${formatToAmPm(firstSlot.endTime)}`;
      if (item.shareSpaceDetailAvailabilitiesTimes.length > 1) {
         timeSlotStr += ` (và ${item.shareSpaceDetailAvailabilitiesTimes.length - 1} ca khác)`;
      }
    }

    // TAG 1: HÌNH THỨC THUÊ
    let typeTag = { label: 'Dài hạn', bg: '#F0FDF4', color: '#166534' };
    if (listingType === 'SharedSpace' && item.shareSpaceDetailIsOwner === false) {
      typeTag = { label: 'Cho thuê lại', bg: '#FCE7F3', color: '#9D174D' };
    } else if (rawPriceUnit === 'PerHour') {
      typeTag = { label: 'Theo ca', bg: '#EEF2FF', color: '#3730A3' };
    }

    // TAG 2: QUY MÔ KHÔNG GIAN
    let scopeTag = { label: 'Nguyên căn', bg: '#ECFDF5', color: '#047857' };
    if (item.isSpacePart) {
      scopeTag = { label: 'Chia nhỏ', bg: '#FEF9C3', color: '#854D0E' };
    }

    return (
      <div
        key={itemId}
        className={`rental-card rental-card--${category} ${selectedId === itemId ? 'selected' : ''}`}
        onClick={() => navigate(`/listing/${itemId}`)}
      >
        <div className="rental-card-img">
          <img src={mainImage} alt={item.name || 'Ảnh mặt bằng'} />
          {imageCount > 0 && (
            <div className="rental-card-img-badge">
              <Camera size={12} /> {imageCount}
            </div>
          )}
        </div>

        <div className="rental-card-info">
          <div className="rental-card-title-row">
            {/* SỬA GIỐNG OWNERLISTINGS: Dùng item.name thuần túy, xóa fallback text */}
            {item.name && (
              <h4 className="rental-card-title">
                {item.name}
              </h4>
            )}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: typeTag.bg, color: typeTag.color }}>
                {typeTag.label}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: scopeTag.bg, color: scopeTag.color }}>
                {scopeTag.label}
              </span>
            </div>
          </div>

          <div className="rental-card-price-row">
            <span className={`rental-card-price rental-card-price--${category}`}>
              {item.price ? `${item.price.toLocaleString('vi-VN')} đ/${priceUnitText}` : 'Thỏa thuận'}
            </span>
            <span className="dot-sep">•</span>
            <span>{item.area ? `${item.area} m²` : 'N/A'}</span>
            <span className="dot-sep">•</span>
            <span>{typeLabel}</span>
          </div>

          {timeSlotStr && (
             <p className="rental-card-time" style={{ fontSize: '13px', color: '#10B981', margin: '4px 0 0 0', fontWeight: 500 }}>
                {timeSlotStr}
             </p>
          )}

          <p className="rental-card-loc" style={{ marginTop: timeSlotStr ? '4px' : '8px' }}>📍 {item.location || item.address || 'Đang cập nhật địa chỉ'}</p>

          <div className="rental-card-footer">
            <div className="rental-card-agent">
              <div className="rental-card-avatar">
                {(item.lessorName || 'CH').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="rental-card-agent-name">
                  Chủ nhà {item.lessorName || 'Ẩn danh'}
                </div>
                <div className="rental-card-agent-time">{formatTimeAgo(item.createdAt)}</div>
              </div>
            </div>

            <div className="rental-card-actions">
              <button
                className={`rental-card-btn rental-card-btn--${category}`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/listing/${itemId}`);
                }}
              >
                <MessageCircle size={14} /> {actionLabel}
              </button>

              <button className="rental-card-heart" onClick={(e) => handleToggleFavorite(e, itemId)}>
                <Heart size={16} fill={isSaved ? '#E02424' : 'none'} color={isSaved ? '#E02424' : '#6B7280'} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ================= RENDER 1 CỘT =================
  const renderColumn = (
    category: RentalCategory,
    items: any[],
    bannerIcon: React.ReactNode,
    bannerLabel: string,
    bannerTitle: string,
    bannerDesc: string,
    badgeText: string
  ) => {
    const visibleItems = items.slice(0, MAX_VISIBLE);

    return (
      <div className={`rental-column rental-column--${category}`}>
        <div className={`rental-banner rental-banner--${category}`}>
          <div className="rental-banner-top">
            <span className="rental-banner-icon">{bannerIcon}</span>
            <span className="rental-banner-label">{bannerLabel}</span>
          </div>
          <h3 className="rental-banner-title">{bannerTitle}</h3>
          <p className="rental-banner-desc">{bannerDesc}</p>
          <span className="rental-banner-badge">{badgeText}</span>
        </div>

        <div className="rental-list">
          {isLoading ? (
            <div className="rental-empty">Đang tải danh sách bài đăng...</div>
          ) : visibleItems.length === 0 ? (
            <div className="rental-empty">Hiện chưa có tin nào ở mục này.</div>
          ) : (
            visibleItems.map((item) => renderCard(item, category))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="listings-column">
      <div
        className="listings-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h3 style={{ margin: 0 }}>Cho Thuê Mặt Bằng, Kiot TP.HCM</h3>
          <button
            className="btn-primary"
            onClick={() => navigate('/feed')}
            style={{
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              padding: '8px 16px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Globe size={14} /> Khám phá Feed
          </button>
          
          {onToggleMap && (
            <button
              onClick={onToggleMap}
              style={{
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                padding: '8px 16px',
                border: '1px solid #00D4A0',
                backgroundColor: isMapMode ? '#00D4A0' : '#fff',
                color: isMapMode ? '#fff' : '#00D4A0',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <Globe size={14} /> {isMapMode ? 'Ẩn bản đồ' : 'Xem bản đồ'}
            </button>
          )}
        </div>

        <span className="sort-by">
          Hiện có {listings.length} bài đăng. &nbsp;&nbsp;|&nbsp;&nbsp; Sắp xếp:{' '}
          <span className="active-sort">Mới nhất</span>
        </span>
      </div>

      <div className="dual-rental-grid">
        {renderColumn(
          'full',
          fullListings,
          <ShieldCheck size={16} />,
          'THUÊ CỐ ĐỊNH / DÀI HẠN',
          'Mặt bằng toàn quyền 24/7',
          'Sở hữu không gian làm việc ổn định, bao gồm nguyên căn hoặc góc nhỏ.',
          `${fullListings.length} tin`
        )}

        {renderColumn(
          'timeslot', // 'timeslot' class will be used in CSS
          sharedListings,
          <Clock3 size={16} />,
          'CHIA SẺ / THEO CA',
          'Tối ưu theo thời gian & diện tích',
          'Phù hợp kinh doanh theo ca hoặc thuê lại không gian trống để tiết kiệm.',
          `${sharedListings.length} tin`
        )}
      </div>

      {!isLoading && hasMoreOverall && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <button className="rental-viewall-btn" onClick={() => navigate('/feed')}>
            Xem tất cả <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};