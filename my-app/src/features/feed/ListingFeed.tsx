import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, MapPin, MessageCircle, Bookmark, TrendingUp, ShieldCheck, Home, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Header } from '../../components/Header'; // Chỉnh lại đường dẫn cho đúng nha
import { useNavigate } from 'react-router-dom';

export const ListingFeed: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- STATE QUẢN LÝ POPUP XEM ẢNH ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewingImages, setViewingImages] = useState<any[] | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const response = await fetch('https://flexi-space-capstone-project.onrender.com/api/Listing/GetAll', { headers: { 'accept': '*/*' } });
        if (response.ok) {
          const data = await response.json();
          const safeData = Array.isArray(data) ? data : (data?.data || data?.items || []);
          setListings(safeData.reverse());
        }
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeed();
  }, []);

  const navigate = useNavigate();

  // Hàm lấy URL an toàn
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getUrl = (img: any) => typeof img === 'string' ? img : (img.imageUrl || img.url);

  // Xử lý khi click vào ảnh
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleImageClick = (images: any[], index: number) => {
    setViewingImages(images);
    setCurrentImageIndex(index);
  };

  // --- HÀM XỬ LÝ CHIA BỐ CỤC ẢNH (NHƯ FACEBOOK) ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderImages = (images: any[]) => {
    if (!images || images.length === 0) {
      return (
        <div style={{ width: '100%', height: '300px', backgroundColor: '#E4E6EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#65676B' }}>
          Chưa có hình ảnh
        </div>
      );
    }

    // Bố cục 1 ảnh
    if (images.length === 1) {
      return <img onClick={() => handleImageClick(images, 0)} src={getUrl(images[0])} alt="media" style={{ width: '100%', maxHeight: '600px', objectFit: 'cover', display: 'block', cursor: 'pointer' }} />;
    }
    
    // Bố cục 2 ảnh
    if (images.length === 2) {
      return (
        <div style={{ display: 'flex', gap: '2px', height: '450px' }}>
          <img onClick={() => handleImageClick(images, 0)} src={getUrl(images[0])} alt="media1" style={{ width: '50%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} />
          <img onClick={() => handleImageClick(images, 1)} src={getUrl(images[1])} alt="media2" style={{ width: '50%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} />
        </div>
      );
    }

    // Bố cục 3 ảnh trở lên
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', height: '550px' }}>
        <img onClick={() => handleImageClick(images, 0)} src={getUrl(images[0])} alt="media1" style={{ width: '100%', height: '60%', objectFit: 'cover', cursor: 'pointer' }} />
        <div style={{ display: 'flex', gap: '2px', height: '40%' }}>
          <img onClick={() => handleImageClick(images, 1)} src={getUrl(images[1])} alt="media2" style={{ width: '50%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} />
          <div onClick={() => handleImageClick(images, 2)} style={{ width: '50%', height: '100%', position: 'relative', cursor: 'pointer' }}>
            <img src={getUrl(images[2])} alt="media3" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {images.length > 3 && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '28px', fontWeight: 'bold' }}>
                +{images.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ backgroundColor: '#F0F2F5', minHeight: '100vh', color: '#050505', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 999 }}>
        <Header /> 
      </div>

      {/* ĐÃ FIX: Giảm paddingTop từ 90px xuống 70px để kéo sát Header, Tăng cột giữa từ 680px lên 760px */}
      <div style={{ maxWidth: '1380px', margin: '0 auto', paddingTop: '30px', display: 'grid', gridTemplateColumns: '280px minmax(auto, 760px) 280px', gap: '24px', justifyContent: 'center', paddingBottom: '50px' }}>
        
        {/* CỘT TRÁI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '110px', height: 'fit-content' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#050505' }}>Lối tắt của bạn</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', cursor: 'pointer', color: '#050505', fontWeight: 500 }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E4E6EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Home size={18} color="var(--color-primary)" /></div>
              Mặt bằng của tôi
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', cursor: 'pointer', color: '#050505', fontWeight: 500 }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E4E6EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bookmark size={18} color="var(--color-gold)" /></div>
              Đã lưu gần đây
            </div>
          </div>
          
          <div style={{ fontSize: '13px', color: '#65676B', padding: '0 8px' }}>
            Quyền riêng tư · Điều khoản · Quảng cáo · Tùy chọn · <br/> EtherSpace © 2026
          </div>
        </div>

        {/* CỘT GIỮA: FEED BÀI ĐĂNG */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isLoading ? (
            <h3 style={{ textAlign: 'center', color: '#65676B' }}>Đang tải bảng tin...</h3>
          ) : (
            listings.map((item, index) => (
              <div key={item.id || index} style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>
                    {item.createdBy ? item.createdBy.substring(0, 2).toUpperCase() : 'CH'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '15px', color: '#050505' }}>Chủ nhà {item.createdBy?.substring(0, 4) || 'Ẩn danh'}</div>
                    <div style={{ fontSize: '12px', color: '#65676B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Vừa cập nhật • <MapPin size={10} /> {item.location || item.address || 'Đang cập nhật'}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '4px 16px 12px 16px', fontSize: '15px', lineHeight: '1.5', color: '#050505' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--color-positive)', fontSize: '16px', marginBottom: '6px' }}>
                    💰 {item.price ? `${item.price.toLocaleString('vi-VN')} ₫/giờ` : 'Thỏa thuận'} • {item.area ? `${item.area}m²` : 'N/A'}
                  </div>
                  {item.description || item.name || 'Chủ nhà chưa cung cấp mô tả chi tiết cho mặt bằng này.'}
                </div>

                {/* KHU VỰC ẢNH (Click được) */}
                <div style={{ width: '100%', backgroundColor: '#fff' }}>
                   {renderImages(item.listingPictures)}
                </div>

                <div style={{ padding: '12px 16px', borderTop: '1px solid #CED0D4' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => alert('Chuẩn bị tích hợp API Chat!')} style={{ flex: 1, padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '14px', backgroundColor: '#E4E6EB', color: '#050505', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                      <MessageCircle size={16} /> Nhắn tin
                    </button>
                    <button
                        onClick={() => navigate(`/listing/${item.id || item.Id}`)} 
                        style={{ flex: 1, padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', backgroundColor: '#E4E6EB', color: '#050505', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                      <Eye size={16} /> Xem chi tiết
                    </button>
                  </div>
                </div>
                
              </div>
            ))
          )}
        </div>

        {/* CỘT PHẢI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '110px', height: 'fit-content' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#050505', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--color-positive)"/> Đang thịnh hành
            </h4>
            <div style={{ fontSize: '14px', color: '#050505', marginBottom: '12px', fontWeight: 500, cursor: 'pointer' }}>
              📍 Khu vực Quận 1 đang sốt giá
              <div style={{ fontSize: '12px', color: '#65676B', fontWeight: 400 }}>1.2K lượt tìm kiếm</div>
            </div>
            <div style={{ fontSize: '14px', color: '#050505', fontWeight: 500, cursor: 'pointer' }}>
              📍 Pop-up Store sinh viên
              <div style={{ fontSize: '12px', color: '#65676B', fontWeight: 400 }}>Hot trend kinh doanh 2026</div>
            </div>
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#050505', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="var(--color-primary)"/> Mẹo an toàn
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#65676B', lineHeight: '1.5' }}>
              Luôn xác minh danh tính chủ nhà và ký hợp đồng rõ ràng trước khi đặt cọc bạn nhé.
            </p>
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* MODAL (POP-UP) XEM ẢNH FULL MÀN HÌNH */}
      {/* ========================================== */}
      {viewingImages && createPortal(
        <div 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 999999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setViewingImages(null)} // Click ra ngoài nền đen để đóng
        >
          {/* Nút Đóng (Góc trên phải) */}
          <button 
            onClick={() => setViewingImages(null)}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
          >
            <X size={24} color="#fff" />
          </button>

          {/* Nút lùi */}
          {viewingImages.length > 1 && (
            <button 
              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev > 0 ? prev - 1 : viewingImages.length - 1); }}
              style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
            >
              <ChevronLeft size={32} color="#fff" />
            </button>
          )}

          {/* Khu vực hiển thị ảnh */}
          <div style={{ width: '90%', height: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img 
              src={getUrl(viewingImages[currentImageIndex])} 
              alt="fullscreen view" 
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              onClick={(e) => e.stopPropagation()} // Tránh việc click vào ảnh làm đóng pop-up
            />
          </div>

          {/* Nút tới */}
          {viewingImages.length > 1 && (
            <button 
              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev < viewingImages.length - 1 ? prev + 1 : 0); }}
              style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
            >
              <ChevronRight size={32} color="#fff" />
            </button>
          )}

          {/* Bộ đếm số ảnh */}
          {viewingImages.length > 1 && (
            <div style={{ position: 'absolute', bottom: '20px', color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
              {currentImageIndex + 1} / {viewingImages.length}
            </div>
          )}
        </div>,
        document.body
      )}

    </div>
  );
};