/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Share2, Heart, ChevronRight, Home, TrendingUp, Calendar, Hash, ShieldCheck, Edit3, Send, X, ClipboardSignature } from 'lucide-react';
import { Header } from '../../components/Header'; // Chỉnh đường dẫn cho đúng nếu cần
import { API_BASE_URL } from '../../config/api';

export const ListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [listing, setListing] = useState<any | null>(null);
  const [similarListings, setSimilarListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // --- THÊM STATE CHO MODAL ĐẶT CHỖ ---
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState({
    offeredPrice: '',
    duration: 1,
    durationUnit: 'Months',
    purpose: '',
    note: '',
    expectedStartDate: new Date().toISOString().split('T')[0]
  });

  const currentUserId = localStorage.getItem('current_user_id'); 
  const token = localStorage.getItem('portal_token');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await fetch('https://flexi-space-capstone-project.onrender.com/api/Listing/GetAll', { headers: { 'accept': '*/*' } });
        if (response.ok) {
          const data = await response.json();
          const safeData = Array.isArray(data) ? data : (data?.data || data?.items || []);
          
          const found = safeData.find((item: any) => (item.id?.toString() === id || item.Id?.toString() === id));
          setListing(found || null);

          // Cập nhật giá mặc định cho form dựa trên giá bài đăng
          if (found && found.price) {
            setBookingData(prev => ({ ...prev, offeredPrice: found.price.toString() }));
          }

          const others = safeData.filter((item: any) => (item.id?.toString() !== id && item.Id?.toString() !== id));
          setSimilarListings(others.slice(0, 3));
        }
      } catch (error) {
        console.error("Lỗi tải chi tiết:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  // --- HÀM XỬ LÝ GỬI YÊU CẦU THUÊ ---
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUserId || !token) {
      alert("Vui lòng đăng nhập để gửi yêu cầu thuê!");
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      // Ép kiểu chuẩn Payload theo Swagger
      const payload = {
        listingId: Number(listing.id || listing.Id),
        offeredPrice: Number(bookingData.offeredPrice),
        duration: Number(bookingData.duration),
        durationUnit: bookingData.durationUnit,
        purpose: bookingData.purpose,
        note: bookingData.note,
        expectedStartDate: new Date(bookingData.expectedStartDate).toISOString()
      };

      const response = await fetch('https://flexi-space-capstone-project.onrender.com/api/PrimaryBookingRequest/Create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("🎉 Gửi yêu cầu thuê thành công! Vui lòng chờ chủ nhà duyệt trong mục Quản lý.");
        setIsBookingModalOpen(false); // Đóng modal
      } else {
        const err = await response.json().catch(() => ({}));
        alert(err.message || "Có lỗi xảy ra khi gửi yêu cầu.");
      }
    } catch (error) {
      console.error("Lỗi API Booking:", error);
      alert("Lỗi kết nối máy chủ!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div style={{ paddingTop: '100px', textAlign: 'center' }}>Đang tải thông tin...</div>;
  if (!listing) return <div style={{ paddingTop: '100px', textAlign: 'center' }}>Không tìm thấy bài đăng!</div>;

  const realImages = listing.listingPictures || [];
  const getUrl = (img: any) => typeof img === 'string' ? img : (img.imageUrl || img.url);
  const mainImage = realImages.length > 0 ? getUrl(realImages[currentImageIndex]) : "https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&q=80&w=800";

  const isOwner = currentUserId && (currentUserId === listing.creatorId);
  const ownerName = listing.lessorName || 'Ẩn danh';

  return (
    <div style={{ backgroundColor: '#F9F9F9', minHeight: '100vh', color: '#333', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 99 }}><Header /></div>

      <div style={{ maxWidth: '1140px', margin: '0 auto', paddingTop: '20px', paddingBottom: '50px' }}>
        
        {/* BREADCRUMB */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#999', marginBottom: '16px' }}>
          <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => navigate('/')}>
            <Home size={14} /> Trang chủ
          </span>
          <ChevronRight size={14} />
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/feed')}>Khám phá</span>
          <ChevronRight size={14} />
          <span style={{ color: '#333', fontWeight: 500 }}>{listing.name || 'Chi tiết mặt bằng'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(auto, 780px) 320px', gap: '30px' }}>
          
          {/* CỘT TRÁI */}
          <div>
            {/* THƯ VIỆN ẢNH */}
            <div style={{ backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px', position: 'relative' }}>
              <img src={mainImage} alt="Main" style={{ width: '100%', height: '450px', objectFit: 'contain', display: 'block' }} />
              <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 12px', borderRadius: '16px', fontSize: '13px' }}>
                {currentImageIndex + 1} / {realImages.length || 1}
              </div>
            </div>
            {/* ẢNH THUMBNAIL */}
            {realImages.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '24px' }}>
                {realImages.map((img: any, idx: number) => (
                  <img 
                    key={idx} src={getUrl(img)} alt={`thumb-${idx}`} onClick={() => setCurrentImageIndex(idx)}
                    style={{ 
                      width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer',
                      border: currentImageIndex === idx ? '2px solid var(--color-primary)' : '2px solid transparent',
                      opacity: currentImageIndex === idx ? 1 : 0.6
                    }} 
                  />
                ))}
              </div>
            )}

            {/* TIÊU ĐỀ & GIÁ */}
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 12px 0', lineHeight: '1.4', color: '#2C2C2C' }}>
              {listing.name || listing.description?.substring(0, 80) || 'Mặt bằng kinh doanh vị trí đắc địa, giá tốt nhất khu vực'}
            </h1>
            <p style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#505050', margin: '0 0 20px 0' }}>
              <MapPin size={16} /> {listing.location || listing.spaceAddress || 'Đang cập nhật địa chỉ'}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E0E0E0', borderBottom: '1px solid #E0E0E0', padding: '16px 0', marginBottom: '30px' }}>
              <div style={{ display: 'flex', gap: '40px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: '#777', marginBottom: '4px' }}>Mức giá</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-positive)' }}>
                    {listing.price ? `${listing.price.toLocaleString('vi-VN')} ₫/giờ` : 'Thỏa thuận'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#777', marginBottom: '4px' }}>Diện tích</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>{listing.area ? `${listing.area} m²` : 'N/A'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#555', fontWeight: 500 }}><Share2 size={18} /> Chia sẻ</button>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#555', fontWeight: 500 }}><Heart size={18} /> Lưu tin</button>
              </div>
            </div>

            {/* THÔNG TIN MÔ TẢ */}
            <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#2C2C2C' }}>Thông tin mô tả</h3>
            <div style={{ lineHeight: '1.7', color: '#444', whiteSpace: 'pre-wrap', marginBottom: '40px', fontSize: '15px' }}>
              {listing.description || 'Chủ nhà chưa cung cấp mô tả chi tiết cho mặt bằng này. Vui lòng liên hệ trực tiếp để biết thêm thông tin về hợp đồng và cọc.'}
            </div>

            {/* LỊCH SỬ GIÁ (MOCK UI) */}
            <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#2C2C2C' }}>Lịch sử giá cho thuê</h3>
            <div style={{ border: '1px solid #E0E0E0', borderRadius: '8px', padding: '20px', marginBottom: '40px', display: 'flex', gap: '40px', backgroundColor: '#fff' }}>
               <div>
                  <div style={{ color: '#777', fontSize: '13px', marginBottom: '8px' }}>Giá hiện tại</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-positive)' }}>{listing.price ? `${listing.price.toLocaleString('vi-VN')} ₫` : 'N/A'}</div>
               </div>
               <div>
                  <div style={{ color: '#777', fontSize: '13px', marginBottom: '8px' }}>Biến động trong 1 tháng</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={18} color="var(--color-positive)" /> 0% (Giữ giá)
                  </div>
               </div>
               <div>
                  <div style={{ color: '#777', fontSize: '13px', marginBottom: '8px' }}>Đánh giá thị trường</div>
                  <div style={{ fontSize: '15px', color: '#333', fontWeight: 500 }}>
                    ⭐ Giá phổ biến khu vực
                  </div>
               </div>
            </div>

            {/* BẢN ĐỒ (GOOGLE MAPS IFRAME) */}
            <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#2C2C2C' }}>Xem trên bản đồ</h3>
            <div style={{ width: '100%', height: '350px', backgroundColor: '#e5e3df', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px', border: '1px solid #E0E0E0' }}>
               <iframe 
                 width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight={0} marginWidth={0} 
                 src={`https://maps.google.com/maps?q=${encodeURIComponent(listing.location || listing.spaceAddress || 'Hồ Chí Minh, Việt Nam')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
               />
            </div>

            {/* THÔNG TIN BÀI ĐĂNG (META DATA) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', paddingBottom: '30px', borderBottom: '1px solid #E0E0E0', marginBottom: '40px' }}>
               <div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#777', fontSize: '12px', marginBottom: '4px' }}><Calendar size={12}/> Ngày đăng</div>
                 <div style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>
                    {listing.createdAt ? new Date(listing.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay'}
                 </div>
               </div>
               <div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#777', fontSize: '12px', marginBottom: '4px' }}><Calendar size={12}/> Ngày hết hạn</div>
                 <div style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>
                    {listing.allowedEndTime ? new Date(listing.allowedEndTime).toLocaleDateString('vi-VN') : 'Sau 30 ngày'}
                 </div>
               </div>
               <div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#777', fontSize: '12px', marginBottom: '4px' }}><ShieldCheck size={12}/> Loại tin</div>
                 <div style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>
                    {listing.listingType === 'EntireSpace' ? 'Nguyên căn' : 'Tin thường'}
                 </div>
               </div>
               <div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#777', fontSize: '12px', marginBottom: '4px' }}><Hash size={12}/> Mã tin</div>
                 <div style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>#{listing.id || listing.Id || '46032982'}</div>
               </div>
            </div>

            {/* BẤT ĐỘNG SẢN DÀNH CHO BẠN (SIMILAR LISTINGS) */}
            {similarListings.length > 0 && (
              <>
                <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#2C2C2C' }}>Bất động sản dành cho bạn</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {similarListings.map((simItem, idx) => {
                    const simImgs = simItem.listingPictures || [];
                    const simMainImg = simImgs.length > 0 ? getUrl(simImgs[0]) : "https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&q=80&w=400";
                    return (
                      <div 
                        key={idx} 
                        onClick={() => {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          navigate(`/listing/${simItem.id || simItem.Id}`);
                        }}
                        style={{ border: '1px solid #E0E0E0', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', backgroundColor: '#fff', transition: 'box-shadow 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                        onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                      >
                        <div style={{ position: 'relative' }}>
                          <img src={simMainImg} alt="similar" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
                            📸 {simImgs.length || 1}
                          </div>
                        </div>
                        <div style={{ padding: '12px' }}>
                          <h4 style={{ fontSize: '13px', margin: '0 0 8px 0', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: '#2C2C2C' }}>
                            {simItem.name || simItem.description || 'Mặt bằng cho thuê'}
                          </h4>
                          <div style={{ color: 'var(--color-positive)', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                            {simItem.price ? `${simItem.price.toLocaleString('vi-VN')} ₫/h` : 'Thỏa thuận'}
                          </div>
                          <div style={{ color: '#777', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={10} /> {simItem.location?.substring(0,25) || simItem.spaceAddress?.substring(0,25) || 'TP.HCM'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

          </div>

          {/* CỘT PHẢI: THẺ LIÊN HỆ STICKY (BÁM DÍNH) */}
          <div style={{ position: 'sticky', top: '90px', height: 'fit-content' }}>
            <div style={{ backgroundColor: '#fff', padding: '24px 20px', borderRadius: '8px', border: '1px solid #E0E0E0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#E4E6EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '12px', border: '2px solid var(--color-primary)' }}>
                {ownerName.substring(0, 2).toUpperCase()}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px', color: '#2C2C2C' }}>
                Chủ nhà {ownerName}
              </div>

              {isOwner ? (
                <button 
                  onClick={() => navigate('/user/listings')} 
                  style={{ width: '100%', padding: '12px', marginTop: '16px', borderRadius: '6px', border: 'none', backgroundColor: '#333', color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <Edit3 size={18} /> Quản lý bài đăng
                </button>
              ) : (
                <>
                  <div style={{ fontSize: '12px', color: '#16A34A', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }}></span> Đang hoạt động
                  </div>

                  {/* NÚT MỞ FORM GỬI YÊU CẦU THUÊ */}
                  <button 
                    onClick={() => {
                      if(!currentUserId) { alert("Vui lòng đăng nhập!"); navigate('/login'); return; }
                      setIsBookingModalOpen(true);
                    }}
                    style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#1E293B', color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <Send size={16} /> Gửi yêu cầu thuê
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ================================================== */}
      {/* POPUP (MODAL) ĐIỀN FORM ĐẶT CHỖ */}
      {/* ================================================== */}
      {isBookingModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', width: '450px', borderRadius: '12px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E0E0E0', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '18px', color: '#1E293B' }}>
                <ClipboardSignature size={20} /> Gửi Yêu Cầu Thuê
              </div>
              <button onClick={() => setIsBookingModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitBooking} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div>
                <label style={{ fontSize: '13px', color: '#555', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Mức giá đề xuất (VNĐ)</label>
                <input type="number" required value={bookingData.offeredPrice} onChange={(e) => setBookingData({...bookingData, offeredPrice: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', color: '#555', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Thời lượng thuê</label>
                  <input type="number" required min={1} value={bookingData.duration} onChange={(e) => setBookingData({...bookingData, duration: Number(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', color: '#555', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Đơn vị</label>
                  <select value={bookingData.durationUnit} onChange={(e) => setBookingData({...bookingData, durationUnit: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                    <option value="Days">Ngày</option>
                    <option value="Months">Tháng</option>
                    <option value="Years">Năm</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#555', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Ngày bắt đầu dự kiến</label>
                <input type="date" required value={bookingData.expectedStartDate} onChange={(e) => setBookingData({...bookingData, expectedStartDate: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#555', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Mục đích sử dụng</label>
                <input type="text" required placeholder="VD: Mở quán cafe, làm kho..." value={bookingData.purpose} onChange={(e) => setBookingData({...bookingData, purpose: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#555', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Ghi chú cho chủ nhà (Tùy chọn)</label>
                <textarea rows={3} placeholder="Bạn có yêu cầu gì thêm không?" value={bookingData.note} onChange={(e) => setBookingData({...bookingData, note: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', resize: 'none' }} />
              </div>

              <button type="submit" disabled={isSubmitting} style={{ marginTop: '8px', width: '100%', padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#1E293B', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                {isSubmitting ? 'Đang gửi yêu cầu...' : 'Xác nhận gửi Yêu Cầu'}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};