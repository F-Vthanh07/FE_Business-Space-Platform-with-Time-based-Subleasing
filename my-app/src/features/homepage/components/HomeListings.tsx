/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Heart, ChevronLeft, ChevronRight, MessageCircle, Globe } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';

interface HomeListingsProps {
  onCardClick: (id: string) => void;
  selectedId: string;
}

export const HomeListings: React.FC<HomeListingsProps> = ({ selectedId }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const ITEMS_PER_PAGE = 4;
  const [currentPage, setCurrentPage] = useState(1);

  // FETCH API KHI LOAD TRANG CHỦ
  useEffect(() => {
    const fetchPublicListings = async () => {
      try {
        // BƯỚC 1: LẤY DANH SÁCH MẶT BẰNG ĐỂ LẤY ĐỊA CHỈ
        const spaceResponse = await fetch('https://flexi-space-capstone-project.onrender.com/api/Space/GetAll', {
          headers: { 'accept': '*/*' }
        });
        
        let spaces: any[] = [];
        if (spaceResponse.ok) {
           const spaceData = await spaceResponse.json();
           spaces = Array.isArray(spaceData) ? spaceData : (spaceData?.data || spaceData?.items || []);
        }

        // BƯỚC 2: LẤY DANH SÁCH BÀI ĐĂNG
        const response = await fetch('https://flexi-space-capstone-project.onrender.com/api/Listing/GetAll', {
          headers: { 'accept': '*/*' }
        });
        
        if (response.ok) {
          const data = await response.json();
          const safeData = Array.isArray(data) ? data : (data?.data || data?.items || []);
          
          // BƯỚC 3: GHÉP ĐỊA CHỈ TỪ MẶT BẰNG VÀO BÀI ĐĂNG
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const listingsWithAddress = safeData.map((l: any) => {
             const parentSpace = spaces.find(s => (s.id || s.Id) === (l.spaceId || l.SpaceId));
             return {
                 ...l,
                 address: l.location || l.address || parentSpace?.address || parentSpace?.location || '',
                 // BỔ SUNG: area không có sẵn trong Listing, phải lấy từ Space cha
                 area: l.area || parentSpace?.area || null,
                 city: l.city || parentSpace?.city || ''
             }
          });

          setListings(listingsWithAddress);
        }
      } catch (error) {
        console.error("Lỗi tải danh sách bài đăng trang chủ:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicListings();
  }, []);

  const totalPages = Math.max(1, Math.ceil(listings.length / ITEMS_PER_PAGE));
  const currentItems = listings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  // Ảnh mặc định duy nhất, chỉ dùng khi bài đăng KHÔNG có ảnh thật nào
  const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800";

  const getPicUrl = (pic: any): string => {
    return typeof pic === 'string' ? pic : (pic?.imageUrl || pic?.url || '');
  };

  return (
    <div className="listings-column">
      <div className="listings-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h3 style={{ margin: 0 }}>Cho Thuê Mặt Bằng, Kiot TP.HCM Giá Tốt Nhất</h3>
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
                cursor: 'pointer' 
              }}
            >
              <Globe size={14} /> Khám phá Feed
          </button>
        </div>

        <span className="sort-by">
          Hiện có {listings.length} bài đăng. &nbsp;&nbsp;|&nbsp;&nbsp; Sắp xếp: <span className="active-sort">Mới nhất</span>
        </span>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
          Đang tải danh sách bài đăng...
        </div>
      ) : listings.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
          Hiện chưa có bài đăng nào trên hệ thống.
        </div>
      ) : (
        currentItems.map((item) => {
          // eslint-disable-next-line react-hooks/purity
          const itemId = item.id?.toString() || item.Id?.toString() || Math.random().toString();

          // Lọc ra danh sách ảnh thật, bỏ qua ảnh rỗng/lỗi
          const rawPictures = item.listingPictures || [];
          const realImages: string[] = rawPictures
            .map(getPicUrl)
            .filter((url: string) => !!url);

          // Số ảnh thực tế sẽ quyết định layout hiển thị (KHÔNG ép cứng 3 ô nữa)
          const imageCount = realImages.length;
          const displayImages = imageCount > 0 ? realImages : [FALLBACK_IMAGE];
          const hasRealImages = imageCount > 0;

          return (
            <div
              key={itemId}
              className={`listing-card-complex gsap-listing-card ${selectedId === itemId ? 'selected' : ''}`}
              onClick={() => navigate(`/listing/${itemId}`)}
            >
              <div className={`complex-images-block img-count-${Math.min(displayImages.length, 3)}`}>
                {/* Ảnh chính - luôn hiện */}
                <div className="img-main">
                  <img src={displayImages[0]} alt="Main" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {hasRealImages && (
                    <div className="img-count-badge">📸 {imageCount}</div>
                  )}
                </div>

                {/* Chỉ hiện khối thumbs nếu có từ 2 ảnh trở lên */}
                {displayImages.length > 1 && (
                  <div
                    className="img-thumbs"
                    style={{
                      // 1 thumb -> chiếm full chiều cao, 2 thumb -> chia đôi
                      gridTemplateRows: displayImages.length - 1 === 1 ? '1fr' : '1fr 1fr'
                    }}
                  >
                    {displayImages.slice(1, 3).map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Thumb ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              <div className="complex-info-block">
                <h4 className="complex-title">{item.name || item.description?.substring(0, 50) || 'Bài đăng cho thuê mặt bằng'}</h4>
                
                <div className="complex-price-row">
                  <span className="price-text" style={{ color: 'var(--color-positive)', fontWeight: 'bold' }}>
                    {item.price ? `${item.price.toLocaleString('vi-VN')} ₫/giờ` : 'Thỏa thuận'}
                  </span>
                  <span className="dot-sep">•</span>
                  <span>{item.area ? `${item.area} m²` : 'N/A'}</span>
                  <span className="dot-sep">•</span>
                  <span>Mặt bằng kinh doanh</span>
                </div>
                
                <p className="complex-loc">📍 {item.location || item.address || 'Đang cập nhật địa chỉ'}</p>
                <p className="complex-desc" style={{ 
                  display: '-webkit-box', 
                  WebkitLineClamp: 2, 
                  WebkitBoxOrient: 'vertical', 
                  overflow: 'hidden' 
                }}>
                  {item.description || 'Chủ nhà chưa cung cấp mô tả chi tiết cho mặt bằng này.'}
                </p>
                
                <div className="complex-agent-footer">
                  <div className="agent-info-left">
                    <div className="agent-avatar-mini">CH</div>
                    <div>
                      <div className="agent-name-mini">Chủ nhà {item.createdBy?.substring(0, 4) || 'Ẩn danh'}</div>
                      <div className="agent-time">Vừa cập nhật</div>
                    </div>
                  </div>
                  <div className="agent-actions">
                    <button className="btn-call" onClick={(e) => { 
                      e.stopPropagation(); 
                      navigate(`/listing/${itemId}`); 
                    }}>
                      <MessageCircle size={14}/> Nhắn tin
                    </button>
                    <button className="btn-heart" onClick={(e) => { e.stopPropagation(); }}>
                      <Heart size={16} color="#6B7280" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })
      )}

      {!isLoading && listings.length > 0 && (
        <div className="pagination-container">
          <button 
            className="page-btn" 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button 
              key={i}
              className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`} 
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          
          {totalPages > 5 && (
            <>
              <span className="page-dots">...</span>
              <button className="page-btn" onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
            </>
          )}
          
          <button 
            className="page-btn"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};