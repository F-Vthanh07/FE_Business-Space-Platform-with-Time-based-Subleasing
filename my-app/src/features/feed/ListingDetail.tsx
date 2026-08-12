/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Share2, Heart, ChevronRight, Home, TrendingUp, Calendar, Hash, ShieldCheck, Edit3, Send, X, ClipboardSignature, Wifi, Snowflake, Car, Sparkles, Clock, Tag, Flag } from 'lucide-react';
import { Header } from '../../components/Header';
import { Copy, Check, Mail } from "lucide-react";
import { FaFacebook, FaFacebookMessenger, FaTelegramPlane, FaLink } from "react-icons/fa";
import { SiZalo } from "react-icons/si";

// --- COMPONENT NÚT CHIA SẺ DÙNG LẠI (SHARE BUTTON) ---
interface ShareButtonProps {
  icon: React.ReactNode;
  label: string;
  url?: string;
  onClick?: () => void;
}

const ShareButton: React.FC<ShareButtonProps> = ({ icon, label, url, onClick }) => {
  const [hover, setHover] = useState(false);

  const handleClick = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '14px 8px',
        borderRadius: '10px',
        border: '1px solid #EAEAEA',
        backgroundColor: hover ? '#F5F5F5' : '#fff',
        cursor: 'pointer',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.2s ease',
        fontSize: '12px',
        color: '#333',
        fontWeight: 500
      }}
    >
      <span style={{ fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </span>
      {label}
    </button>
  );
};

// --- MAP TÊN TIỆN ÍCH -> ICON + NHÃN TIẾNG VIỆT ---
const AMENITY_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  wifi: { label: 'Wifi', icon: <Wifi size={16} /> },
  ac: { label: 'Điều hòa', icon: <Snowflake size={16} /> },
  aircon: { label: 'Điều hòa', icon: <Snowflake size={16} /> },
  parking: { label: 'Chỗ đậu xe', icon: <Car size={16} /> },
};

const getAmenityInfo = (name: string) => {
  const key = (name || '').toLowerCase();
  return AMENITY_MAP[key] || { label: name, icon: <Sparkles size={16} /> };
};

// --- MAP DAYOFWEEK (.NET: 0=Chủ Nhật ... 6=Thứ 7) -> NHÃN TIẾNG VIỆT, SẮP THỨ TỰ THỨ 2 -> CN ---
const DAY_LABELS: Record<number, string> = {
  0: 'Chủ Nhật',
  1: 'Thứ 2',
  2: 'Thứ 3',
  3: 'Thứ 4',
  4: 'Thứ 5',
  5: 'Thứ 6',
  6: 'Thứ 7',
};
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const formatTime = (t: string) => (t ? t.substring(0, 5) : '');

// --- LÝ DO BÁO CÁO BÀI ĐĂNG VI PHẠM (ReportReasonEnum) ---
const REPORT_REASONS: { value: string; label: string }[] = [
  { value: 'ScamOrFraud', label: 'Lừa đảo / Gian lận' },
  { value: 'FakeInformation', label: 'Thông tin giả mạo' },
  { value: 'PriceMismatch', label: 'Giá không đúng thực tế' },
  { value: 'FakeAddress', label: 'Địa chỉ không chính xác' },
  { value: 'InappropriateContent', label: 'Nội dung không phù hợp' },
  { value: 'WrongCategory', label: 'Sai danh mục' },
  { value: 'Other', label: 'Lý do khác' },
];

export const ListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [listing, setListing] = useState<any | null>(null);
  const [similarListings, setSimilarListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [isFavorite, setIsFavorite] = useState(false);
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

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareModalAnimateIn, setShareModalAnimateIn] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportReasons, setReportReasons] = useState<string[]>([]);
  const [reportDetails, setReportDetails] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  const currentUserId = localStorage.getItem('current_user_id'); 
  const token = localStorage.getItem('portal_token');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        // BƯỚC 1: LẤY DANH SÁCH MẶT BẰNG
        const spaceResponse = await fetch('https://flexi-space-capstone-project.onrender.com/api/Space/GetAll', {
          headers: { 'accept': '*/*' }
        });

        let spaces: any[] = [];
        if (spaceResponse.ok) {
          const spaceData = await spaceResponse.json();
          spaces = Array.isArray(spaceData) ? spaceData : (spaceData?.data || spaceData?.items || []);
        }

        // BƯỚC 2: LẤY DANH SÁCH BÀI ĐĂNG (Thêm header)
        const headers: any = { accept: '*/*' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('https://flexi-space-capstone-project.onrender.com/api/Listing/GetAll', { headers });
        if (response.ok) {
          const data = await response.json();
          const safeData = Array.isArray(data) ? data : (data?.data || data?.items || []);
          
          const found = safeData.find((item: any) => (item.id?.toString() === id || item.Id?.toString() === id));

          // BƯỚC 3: GHÉP area/address/amenities/operatingHours/allowedCategories (TỪ SPACE CHA)
          let foundWithSpaceInfo = found || null;
          if (found) {
            const parentSpace = spaces.find(s => (s.id || s.Id) === (found.spaceId || found.SpaceId));
            foundWithSpaceInfo = {
              ...found,
              area: found.area || parentSpace?.area || null,
              address: found.location || found.address || parentSpace?.address || parentSpace?.location || '',
              city: found.city || parentSpace?.city || '',
              amenities: found.amenities || parentSpace?.amenities || [],
              operatingHours: found.operatingHours || parentSpace?.operatingHours || [],
              allowedCategories: found.spaceAllowedCategories || parentSpace?.spaceAllowedCategories || []
            };
          }
          setListing(foundWithSpaceInfo);

          if (foundWithSpaceInfo && foundWithSpaceInfo.price) {
            setBookingData(prev => ({ ...prev, offeredPrice: foundWithSpaceInfo.price.toString() }));
          }

          // BƯỚC 4: TÌM BÀI ĐĂNG TƯƠNG TỰ
          const others = safeData
            .filter((item: any) => (item.id?.toString() !== id && item.Id?.toString() !== id))
            .map((item: any) => {
              const parentSpace = spaces.find(s => (s.id || s.Id) === (item.spaceId || item.SpaceId));
              return {
                ...item,
                area: item.area || parentSpace?.area || null,
                address: item.location || item.address || parentSpace?.address || parentSpace?.location || ''
              };
            });
          setSimilarListings(others.slice(0, 3));
        }

        // BƯỚC 5: KIỂM TRA TRẠNG THÁI YÊU THÍCH
        if (token && id) {
          const favRes = await fetch('https://flexi-space-capstone-project.onrender.com/api/FavoriteList/FavoriteByUser', {
            headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
          });
          if (favRes.ok) {
            const favData = await favRes.json();
            const favArray = Array.isArray(favData) ? favData : (favData?.data || favData?.items || favData?.listingIds || []);
            const isFav = favArray.some((item: any) => {
              if (typeof item === 'number' || typeof item === 'string') {
                return item.toString() === id.toString();
              }
              const itemId = item?.listingId || item?.ListingId || item?.listing?.id || item?.id || item?.Id;
              return itemId?.toString() === id.toString();
            });
            setIsFavorite(isFav);
          }
        }

      } catch (error) {
        console.error("Lỗi tải chi tiết:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [id, token]);

  useEffect(() => {
    if (isShareModalOpen) {
      const timer = setTimeout(() => setShareModalAnimateIn(true), 10);
      return () => clearTimeout(timer);
    } else {
      setShareModalAnimateIn(false);
    }
  }, [isShareModalOpen]);

  const handleToggleFavorite = async () => {
    if (!token) {
      alert("Vui lòng đăng nhập để lưu mặt bằng!");
      navigate('/login');
      return;
    }
    try {
      const numericId = Number(id);
      if (isFavorite) {
        const res = await fetch(`https://flexi-space-capstone-project.onrender.com/api/FavoriteList/listings/${numericId}`, {
          method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
        });
        if (res.ok) setIsFavorite(false);
      } else {
        const res = await fetch('https://flexi-space-capstone-project.onrender.com/api/FavoriteList/listings', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'accept': '*/*' },
          body: JSON.stringify({ listingIds: [numericId] })
        });
        if (res.ok) setIsFavorite(true);
      }
    } catch (err) { 
      console.error(err); 
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !token) {
      alert("Vui lòng đăng nhập để gửi yêu cầu thuê!");
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("🎉 Gửi yêu cầu thuê thành công! Vui lòng chờ chủ nhà duyệt trong mục Quản lý.");
        setIsBookingModalOpen(false); 
      } else {
        const err = await response.json().catch(() => ({}));
        alert(err.message || "Có lỗi xảy ra khi gửi yêu cầu.");
      }
    } catch (error) {
      console.error("Lỗi API Booking:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: listing?.name || 'Mặt bằng cho thuê',
      text: listing?.description || '',
      url: window.location.href
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        console.warn("navigator.share thất bại hoặc bị hủy:", err);
      }
    }
    setIsShareModalOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Sao chép liên kết thất bại:", err);
    }
  };

  const toggleReportReason = (value: string) => {
    setReportReasons(prev => prev.includes(value) ? prev.filter(r => r !== value) : [...prev, value]);
  };

  const handleOpenReportModal = () => {
    if (!token) {
      alert("Vui lòng đăng nhập để báo cáo bài đăng!");
      navigate('/login');
      return;
    }
    setReportReasons([]);
    setReportDetails('');
    setReportSuccess(false);
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reportReasons.length === 0) {
      alert("Vui lòng chọn ít nhất một lý do báo cáo.");
      return;
    }
    setIsSubmittingReport(true);
    try {
      const payload = {
        listingId: Number(listing.id || listing.Id),
        reasons: reportReasons,
        additionalDetails: reportDetails
      };

      const response = await fetch('https://flexi-space-capstone-project.onrender.com/api/Listing/Reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'accept': '*/*' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setReportSuccess(true);
      } else {
        const err = await response.json().catch(() => ({}));
        alert(err.message || "Có lỗi xảy ra khi gửi báo cáo.");
      }
    } catch (error) {
      console.error("Lỗi API Report:", error);
      alert("Có lỗi xảy ra khi gửi báo cáo.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (isLoading) return <div style={{ paddingTop: '100px', textAlign: 'center' }}>Đang tải thông tin...</div>;
  if (!listing) return <div style={{ paddingTop: '100px', textAlign: 'center' }}>Không tìm thấy bài đăng!</div>;

  const realImages = listing.listingPictures || [];
  const getUrl = (img: any) => typeof img === 'string' ? img : (img.imageUrl || img.url);
  const mainImage = realImages.length > 0 ? getUrl(realImages[currentImageIndex]) : "https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&q=80&w=800";

  const isOwner = currentUserId && (currentUserId === listing.creatorId);
  const ownerName = listing.lessorName || 'Ẩn danh';

  const amenities: any[] = listing.amenities || [];
  const activeAmenities = amenities.filter((a: any) => a.isActive !== false);
  const operatingHours: any[] = listing.operatingHours || [];
  const allowedCategories: any[] = listing.allowedCategories || [];

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
            <div style={{ backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px', position: 'relative' }}>
              <img src={mainImage} alt="Main" style={{ width: '100%', height: '450px', objectFit: 'contain', display: 'block' }} />
              <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 12px', borderRadius: '16px', fontSize: '13px' }}>
                {currentImageIndex + 1} / {realImages.length || 1}
              </div>
            </div>
            
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

            {/* SỬA GIỐNG OWNERLISTINGS: Chỉ render Name khi tồn tại */}
            {listing.name && (
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 12px 0', lineHeight: '1.4', color: '#2C2C2C' }}>
                {listing.name}
              </h1>
            )}

            <p style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#505050', margin: '0 0 20px 0' }}>
              <MapPin size={16} /> {listing.location || listing.address || listing.spaceAddress || 'Đang cập nhật địa chỉ'}
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
                <button onClick={handleShare} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#555', fontWeight: 500 }}><Share2 size={18} /> Chia sẻ</button>
                <button 
                  onClick={handleToggleFavorite}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: isFavorite ? '#E02424' : '#555', fontWeight: 500 }}
                >
                  <Heart size={18} fill={isFavorite ? '#E02424' : 'none'} color={isFavorite ? '#E02424' : 'currentColor'} />
                  {isFavorite ? 'Đã lưu' : 'Lưu tin'}
                </button>
                {!isOwner && (
                  <button onClick={handleOpenReportModal} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#E02424', fontWeight: 500 }}>
                    <Flag size={18} /> Báo cáo
                  </button>
                )}
              </div>
            </div>

            <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#2C2C2C' }}>Thông tin mô tả</h3>
            <div style={{ lineHeight: '1.7', color: '#444', whiteSpace: 'pre-wrap', marginBottom: '40px', fontSize: '15px' }}>
              {listing.description || 'Chủ nhà chưa cung cấp mô tả chi tiết cho mặt bằng này. Vui lòng liên hệ trực tiếp để biết thêm thông tin về hợp đồng và cọc.'}
            </div>

            {/* TIỆN ÍCH */}
            {activeAmenities.length > 0 && (
              <>
                <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#2C2C2C' }}>Tiện ích</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '40px' }}>
                  {activeAmenities.map((a: any, idx: number) => {
                    const info = getAmenityInfo(a.name);
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '10px 16px', borderRadius: '8px',
                          border: '1px solid #E0E0E0', backgroundColor: '#fff',
                          fontSize: '14px', color: '#333'
                        }}
                      >
                        <span style={{ color: 'var(--color-primary)', display: 'flex' }}>{info.icon}</span>
                        {info.label}
                        {a.quantity > 1 && <span style={{ color: '#999' }}>× {a.quantity}</span>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* MỤC ĐÍCH SỬ DỤNG PHÙ HỢP */}
            {allowedCategories.length > 0 && (
              <>
                <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#2C2C2C' }}>Mục đích sử dụng phù hợp</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '40px' }}>
                  {allowedCategories.map((cat: any, idx: number) => {
                    const label = typeof cat === 'string' ? cat : (cat.name || cat.categoryName || cat.title || '');
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '8px 14px', borderRadius: '20px',
                          backgroundColor: '#EEF2F7', color: '#1E293B',
                          fontSize: '13px', fontWeight: 500
                        }}
                      >
                        <Tag size={13} /> {label}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* GIỜ HOẠT ĐỘNG */}
            {operatingHours.length > 0 && (
              <>
                <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#2C2C2C', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} /> Giờ hoạt động
                </h3>
                <div style={{ border: '1px solid #E0E0E0', borderRadius: '8px', backgroundColor: '#fff', marginBottom: '40px', overflow: 'hidden' }}>
                  {DAY_ORDER.map((day, idx) => {
                    const entry = operatingHours.find((h: any) => h.dayOfWeek === day);
                    return (
                      <div
                        key={day}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '12px 20px',
                          borderBottom: idx !== DAY_ORDER.length - 1 ? '1px solid #F0F0F0' : 'none'
                        }}
                      >
                        <span style={{ fontSize: '14px', color: '#333', fontWeight: 500 }}>{DAY_LABELS[day]}</span>
                        {entry ? (
                          <span style={{ fontSize: '14px', color: '#16A34A', fontWeight: 500 }}>
                            {formatTime(entry.openTime)} - {formatTime(entry.closeTime)}
                          </span>
                        ) : (
                          <span style={{ fontSize: '14px', color: '#999' }}>Đóng cửa</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

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

            <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#2C2C2C' }}>Xem trên bản đồ</h3>
            <div style={{ width: '100%', height: '350px', backgroundColor: '#e5e3df', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px', border: '1px solid #E0E0E0' }}>
               <iframe 
                 width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight={0} marginWidth={0} 
                 src={`https://maps.google.com/maps?q=${encodeURIComponent(listing.location || listing.address || listing.spaceAddress || 'Hồ Chí Minh, Việt Nam')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
               />
            </div>

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
                          {/* TƯƠNG TỰ CÁCH XỬ LÝ NAME CHO CARD SIMILAR LISTING */}
                          {simItem.name && (
                            <h4 style={{ fontSize: '13px', margin: '0 0 8px 0', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: '#2C2C2C' }}>
                              {simItem.name}
                            </h4>
                          )}
                          <div style={{ color: 'var(--color-positive)', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                            {simItem.price ? `${simItem.price.toLocaleString('vi-VN')} ₫/h` : 'Thỏa thuận'}
                          </div>
                          <div style={{ color: '#777', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={10} /> {simItem.location?.substring(0,25) || simItem.address?.substring(0,25) || simItem.spaceAddress?.substring(0,25) || 'TP.HCM'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

          </div>

          {/* CỘT PHẢI: THẺ LIÊN HỆ STICKY */}
          <div style={{ position: 'sticky', top: '90px', height: 'fit-content' }}>
            <div style={{ backgroundColor: '#fff', padding: '24px 20px', borderRadius: '8px', border: '1px solid #E0E0E0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              
              <div
                onClick={() => listing.creatorId && navigate(`/profile/${listing.creatorId}`)}
                style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#E4E6EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '12px', border: '2px solid var(--color-primary)', cursor: listing.creatorId ? 'pointer' : 'default' }}
              >
                {ownerName.substring(0, 2).toUpperCase()}
              </div>
              <div
                onClick={() => listing.creatorId && navigate(`/profile/${listing.creatorId}`)}
                style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px', color: '#2C2C2C', cursor: listing.creatorId ? 'pointer' : 'default' }}
              >
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

      {isShareModalOpen && (
        <div
          onClick={() => setIsShareModalOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: shareModalAnimateIn ? 1 : 0,
            transition: 'opacity 0.25s ease'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff', width: '440px', maxWidth: '90vw', borderRadius: '16px',
              padding: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
              transform: shareModalAnimateIn ? 'scale(1)' : 'scale(0.95)',
              opacity: shareModalAnimateIn ? 1 : 0,
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1E293B', marginBottom: '4px' }}>Share Listing</div>
                <div style={{ fontSize: '13px', color: '#777' }}>Anyone with this link can view this listing.</div>
              </div>
              <button onClick={() => setIsShareModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                type="text"
                readOnly
                value={window.location.href}
                onFocus={(e) => e.target.select()}
                style={{ flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', color: '#555', backgroundColor: '#F9F9F9' }}
              />
              <button
                onClick={handleCopyLink}
                style={{
                  padding: '10px 16px', borderRadius: '8px', border: 'none',
                  backgroundColor: copied ? '#16A34A' : '#1E293B', color: '#fff',
                  fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: '6px', transition: 'background-color 0.2s'
                }}
              >
                {copied ? (<><Check size={14} /> Copied</>) : (<><Copy size={14} /> Copy</>)}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <ShareButton
                icon={<FaFacebookMessenger color="#0084FF" />}
                label="Messenger"
                url={`https://www.facebook.com/dialog/send?link=${encodeURIComponent(window.location.href)}`}
              />
              <ShareButton
                icon={<FaFacebook color="#1877F2" />}
                label="Facebook"
                url={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
              />
              <ShareButton
                icon={<FaTelegramPlane color="#229ED9" />}
                label="Telegram"
                url={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}`}
              />
              <ShareButton
                icon={<SiZalo color="#0068FF" />}
                label="Zalo"
                url={`https://zalo.me/share?url=${encodeURIComponent(window.location.href)}`}
              />
              <ShareButton
                icon={<Mail color="#EA4335" />}
                label="Email"
                url={`mailto:?subject=${encodeURIComponent(listing.name || 'Mặt bằng cho thuê')}&body=${encodeURIComponent(window.location.href)}`}
              />
              <ShareButton
                icon={<FaLink color="#555" />}
                label="Copy Link"
                onClick={handleCopyLink}
              />
            </div>
          </div>
        </div>
      )}

      {isReportModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', width: '460px', maxWidth: '90vw', borderRadius: '12px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E0E0E0', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '18px', color: '#1E293B' }}>
                <Flag size={20} color="#E02424" /> Báo cáo bài đăng vi phạm
              </div>
              <button onClick={() => setIsReportModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                <X size={20} />
              </button>
            </div>

            {reportSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '15px', color: '#333', marginBottom: '20px' }}>
                  Cảm ơn bạn đã gửi báo cáo. Đội ngũ quản trị sẽ xem xét bài đăng này sớm nhất có thể.
                </div>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  style={{ padding: '10px 24px', borderRadius: '6px', border: 'none', backgroundColor: '#1E293B', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Đóng
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#555', fontWeight: 500, marginBottom: '8px', display: 'block' }}>
                    Lý do báo cáo (chọn ít nhất 1)
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {REPORT_REASONS.map(reason => (
                      <label
                        key={reason.value}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '10px 12px', borderRadius: '6px',
                          border: reportReasons.includes(reason.value) ? '1px solid #E02424' : '1px solid #ddd',
                          backgroundColor: reportReasons.includes(reason.value) ? '#FEF2F2' : '#fff',
                          cursor: 'pointer', fontSize: '14px', color: '#333'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={reportReasons.includes(reason.value)}
                          onChange={() => toggleReportReason(reason.value)}
                        />
                        {reason.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', color: '#555', fontWeight: 500, marginBottom: '6px', display: 'block' }}>
                    Mô tả thêm (Tùy chọn)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Cung cấp thêm thông tin chi tiết về vi phạm..."
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', resize: 'none' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  style={{ marginTop: '8px', width: '100%', padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#E02424', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {isSubmittingReport ? 'Đang gửi báo cáo...' : 'Gửi báo cáo'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};