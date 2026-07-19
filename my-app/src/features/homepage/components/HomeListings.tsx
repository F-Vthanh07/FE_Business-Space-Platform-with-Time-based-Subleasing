import React, { useState, useEffect } from 'react';
import { Heart, ChevronLeft, ChevronRight, MessageCircle, Globe } from 'lucide-react'; // Đổi Phone thành MessageCircleimport { useNavigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config/api';


interface HomeListingsProps {
  onCardClick: (id: string) => void;
  selectedId: string;
}

export const HomeListings: React.FC<HomeListingsProps> = ({ selectedId }) => {
  // --- ĐỔI TÊN STATE CHO CHUẨN LISTING ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  // --- LOGIC PHÂN TRANG ---
  const ITEMS_PER_PAGE = 4;
  const [currentPage, setCurrentPage] = useState(1);

  // FETCH API KHI LOAD TRANG CHỦ
  useEffect(() => {
    const fetchPublicListings = async () => {
      try {
        // ĐỔI TỪ Space/GetAll SANG Listing/GetAll
        const response = await fetch(`${API_BASE_URL}/api/Listing/GetAll`, {
          headers: { 'accept': '*/*' }
        });
        if (response.ok) {
          const data = await response.json();
          // Áo giáp chống null/undefined
          const safeData = Array.isArray(data) ? data : (data?.data || data?.items || []);
          
          // NẾU CÓ STATUS THÌ LỌC CHỈ LẤY BÀI ĐÃ DUYỆT (Published) 
          // Tạm thời lấy hết để test cho dễ thấy
          setListings(safeData);
        }
      } catch (error) {
        console.error("Lỗi tải danh sách bài đăng trang chủ:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicListings();
  }, []);

  // Tính toán phân trang
  const totalPages = Math.max(1, Math.ceil(listings.length / ITEMS_PER_PAGE));
  const currentItems = listings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  // Ảnh giả lập (Chờ BE làm tính năng upload ảnh thật)
  const DUMMY_IMAGES = [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=400"
  ];

  return (
    <div className="listings-column">
      <div className="listings-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Bọc Tiêu đề và Nút vào một cụm Flexbox để nó nằm kế nhau */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h3 style={{ margin: 0 }}>Cho Thuê Mặt Bằng, Kiot TP.HCM Giá Tốt Nhất</h3>
          <button 
              className="btn-primary" // Class này đã định nghĩa sẵn màu xanh của ông rồi
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
          // Lấy ID thật ra để map
          // eslint-disable-next-line react-hooks/purity
          const itemId = item.id?.toString() || item.Id?.toString() || Math.random().toString();
          
          // --- LOGIC LẤY ẢNH THẬT TỪ BE ---
          const realImages = item.listingPictures || [];
          
          // Hàm lấy URL an toàn
          const getImageUrl = (index: number, fallbackUrl: string) => {
            if (!realImages[index]) return fallbackUrl;
            const pic = realImages[index];
            return typeof pic === 'string' ? pic : (pic.imageUrl || pic.url || fallbackUrl);
          };

          // Gán ảnh thật, nếu thiếu thì xài tạm ảnh giả lập cho giao diện không bị trống
          const imgMain = getImageUrl(0, DUMMY_IMAGES[0]);
          const imgThumb1 = getImageUrl(1, DUMMY_IMAGES[1]);
          const imgThumb2 = getImageUrl(2, DUMMY_IMAGES[2]);
          
          return (
            <div
              key={itemId}
              className={`listing-card-complex gsap-listing-card ${selectedId === itemId ? 'selected' : ''}`}
              onClick={() => navigate(`/listing/${itemId}`)} // ĐỔI THÀNH DÒNG NÀY ĐỂ CLICK VÀO CARD LÀ BAY QUA TRANG CHI TIẾT
            >
              <div className="complex-images-block">
                <div className="img-main">
                  <img src={imgMain} alt="Main" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {/* Hiển thị số lượng ảnh thật */}
                  <div className="img-count-badge">📸 {realImages.length > 0 ? realImages.length : 3}</div>
                </div>
                <div className="img-thumbs">
                  <img src={imgThumb1} alt="Thumb 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <img src={imgThumb2} alt="Thumb 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </div>
              
              <div className="complex-info-block">
                {/* Lấy description làm tiêu đề tạm nếu name chưa có */}
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
                
                {/* Agent Footer */}
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

      {/* THANH PHÂN TRANG (PAGINATION) DYNAMIC */}
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