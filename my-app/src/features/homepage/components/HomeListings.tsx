/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Globe, ShieldCheck, Clock3, Camera, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

type RentalCategory = 'longterm' | 'hourly';

const getRentalCategory = (item: any): RentalCategory => {
  const listingType = (item.listingType || item.ListingType || '').toString();
  if (listingType === 'SharedSpace') return 'hourly';
  if (listingType === 'EntireSpace') return 'longterm';
  if (item.isHourly === true) return 'hourly';

  const raw = (
    item.rentalType ||
    item.leaseType ||
    item.pricingType ||
    item.mode ||
    item.type ||
    ''
  ).toString().toLowerCase();

  const hourlyKeywords = ['hour', 'gio', 'giờ', 'sublease', 'share', 'flexible'];
  if (hourlyKeywords.some((kw) => raw.includes(kw))) return 'hourly';

  return 'longterm';
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

          // BƯỚC 4: GHÉP ĐỊA CHỈ TỪ MẶT BẰNG VÀO BÀI ĐĂNG
          const listingsWithAddress = safeData.map((l: any) => {
            const parentSpace = spaces.find((s) => (s.id || s.Id) === (l.spaceId || l.SpaceId));
            return {
              ...l,
              address: l.spaceAddress || l.location || l.address || parentSpace?.address || parentSpace?.location || '',
              area: l.area || parentSpace?.area || null,
              city: l.city || parentSpace?.city || '',
            };
          });

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

  const longTermListings = listings.filter((l) => getRentalCategory(l) === 'longterm');
  const hourlyListings = listings.filter((l) => getRentalCategory(l) === 'hourly');

  const hasMoreOverall = longTermListings.length > MAX_VISIBLE || hourlyListings.length > MAX_VISIBLE;

  // ================= RENDER 1 CARD =================
  const renderCard = (item: any, category: RentalCategory) => {
    const itemId = item.id?.toString() || item.Id?.toString() || item.listingId?.toString();

    const rawPictures = item.listingPictures || [];
    const realImages: string[] = rawPictures.map(getPicUrl).filter((url: string) => !!url);
    const imageCount = realImages.length;
    const mainImage = imageCount > 0 ? realImages[0] : FALLBACK_IMAGE;

    const isHourly = category === 'hourly';
    const priceUnit = isHourly ? 'đ/giờ' : 'đ/tháng';
    const typeLabel = isHourly ? 'Share theo giờ' : 'Mặt bằng kinh doanh';
    const actionLabel = isHourly ? 'Đặt giờ' : 'Nhắn tin';

    const isSaved = favoriteIds.has(Number(itemId));

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
            {item.tagLabel && (
              <span className={`rental-card-tag rental-card-tag--${category}`}>{item.tagLabel}</span>
            )}
          </div>

          <div className="rental-card-price-row">
            <span className={`rental-card-price rental-card-price--${category}`}>
              {item.price ? `${item.price.toLocaleString('vi-VN')} ${priceUnit}` : 'Thỏa thuận'}
            </span>
            <span className="dot-sep">•</span>
            <span>{item.area ? `${item.area} m²` : 'N/A'}</span>
            <span className="dot-sep">•</span>
            <span>{typeLabel}</span>
          </div>

          <p className="rental-card-loc">📍 {item.location || item.address || 'Đang cập nhật địa chỉ'}</p>

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
          'longterm',
          longTermListings,
          <ShieldCheck size={16} />,
          'THUÊ DÀI HẠN',
          'Mặt bằng thuê theo tháng',
          'Hợp đồng ổn định từ 12 tháng, có cọc và bàn giao nguyên trạng.',
          `${longTermListings.length} tin`
        )}

        {renderColumn(
          'hourly',
          hourlyListings,
          <Clock3 size={16} />,
          'SHARE THEO GIỜ',
          'Chia sẻ mặt bằng linh hoạt',
          'Đặt từng khung giờ cho pop-up, booth sự kiện hay bán hàng cuối tuần.',
          `${hourlyListings.length} slot`
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