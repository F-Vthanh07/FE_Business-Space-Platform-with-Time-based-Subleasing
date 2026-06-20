import React, { useState, useEffect } from 'react';
import { Heart, ChevronLeft, ChevronRight, Phone } from 'lucide-react';

interface HomeListingsProps {
  onCardClick: (id: string) => void;
  selectedId: string;
}

export const HomeListings: React.FC<HomeListingsProps> = ({ onCardClick, selectedId }) => {
  // --- STATE DỮ LIỆU TỪ API ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [spaces, setSpaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- LOGIC PHÂN TRANG ---
  const ITEMS_PER_PAGE = 4;
  const [currentPage, setCurrentPage] = useState(1);

  // FETCH API KHI LOAD TRANG CHỦ
  useEffect(() => {
    const fetchPublicSpaces = async () => {
      try {
        const response = await fetch('https://localhost:7069/api/Space/GetAll', {
          headers: { 'accept': '*/*' }
        });
        if (response.ok) {
          const data = await response.json();
          // Áo giáp chống null/undefined
          const safeData = Array.isArray(data) ? data : (data?.data || data?.items || []);
          setSpaces(safeData);
        }
      } catch (error) {
        console.error("Lỗi tải danh sách mặt bằng trang chủ:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicSpaces();
  }, []);

  // Tính toán phân trang dựa trên mảng data thật
  const totalPages = Math.max(1, Math.ceil(spaces.length / ITEMS_PER_PAGE));
  const currentItems = spaces.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  // Khối ảnh và Agent giả lập (Tạm thời dùng khi BE chưa có data ảnh)
  const DUMMY_IMAGES = [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=400"
  ];

  return (
    <div className="listings-column">
      <div className="listings-header">
        <h3>Cho Thuê Mặt Bằng, Kiot TP.HCM Giá Tốt Nhất</h3>
        <span className="sort-by">
          Hiện có {spaces.length} bất động sản. &nbsp;&nbsp;|&nbsp;&nbsp; Sắp xếp: <span className="active-sort">Mặc định</span>
        </span>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
          Đang tải danh sách mặt bằng...
        </div>
      ) : spaces.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
          Hiện chưa có mặt bằng nào được đăng tải.
        </div>
      ) : (
        currentItems.map((item) => {
          // Lấy ID thật ra để map
          const itemId = item.id.toString();
          
          return (
            <div
              key={itemId}
              className={`listing-card-complex gsap-listing-card ${selectedId === itemId ? 'selected' : ''}`}
              onClick={() => onCardClick(itemId)}
            >
              {/* Khối Ảnh (Sử dụng dummy image tạm thời) */}
              <div className="complex-images-block">
                <div className="img-main">
                  <img src={DUMMY_IMAGES[0]} alt="Main" />
                  <div className="img-count-badge">📸 3</div>
                </div>
                <div className="img-thumbs">
                  <img src={DUMMY_IMAGES[1]} alt="Thumb 1" />
                  <img src={DUMMY_IMAGES[2]} alt="Thumb 2" />
                </div>
              </div>
              
              {/* Khối Thông Tin Thật (Map từ API) */}
              <div className="complex-info-block">
                <h4 className="complex-title">{item.name || 'Mặt bằng chưa có tên'}</h4>
                <div className="complex-price-row">
                  <span className="price-text">Thỏa thuận</span>
                  <span className="dot-sep">•</span>
                  <span>{item.area ? `${item.area} m²` : 'N/A'}</span>
                  <span className="dot-sep">•</span>
                  <span>Mặt bằng kinh doanh</span>
                </div>
                <p className="complex-loc">📍 {item.address || 'Chưa cập nhật địa chỉ'}</p>
                <p className="complex-desc" style={{ 
                  display: '-webkit-box', 
                  WebkitLineClamp: 2, 
                  WebkitBoxOrient: 'vertical', 
                  overflow: 'hidden' 
                }}>
                  Không gian vật lý với các tiện ích: {item.amenities?.length > 0 ? item.amenities.join(', ') : 'Cơ bản'}. 
                  Phù hợp cho các mô hình kinh doanh đa dạng.
                </p>
                
                {/* Khối Agent ở đáy (Giả lập) */}
                <div className="complex-agent-footer">
                  <div className="agent-info-left">
                    <div className="agent-avatar-mini">CH</div>
                    <div>
                      <div className="agent-name-mini">Chủ nhà {item.createdBy?.substring(0, 4) || 'Ẩn danh'}</div>
                      <div className="agent-time">Vừa cập nhật</div>
                    </div>
                  </div>
                  <div className="agent-actions">
                    <button className="btn-call" onClick={(e) => { e.stopPropagation(); alert('Tính năng gọi điện đang phát triển!'); }}>
                      <Phone size={14}/> 0909 *** ***
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

      {/* THANH PHÂN TRANG (PAGINATION) DYNAMIC - Chỉ hiện khi có > 0 trang */}
      {!isLoading && spaces.length > 0 && (
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