/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, Share2, Heart, ChevronRight, Home, Calendar, Edit3, Send, X, ClipboardSignature, Wifi, Snowflake, Car, Sparkles, Tag, Flag, Star, Sofa, Wand2, Eye, ShieldCheck, Lock, FileText } from 'lucide-react';
import { Header } from '../../components/Header';
import { Copy, Check, Mail } from "lucide-react";
import { FaFacebook, FaFacebookMessenger, FaTelegramPlane, FaLink } from "react-icons/fa";
import { SiZalo } from "react-icons/si";
import { formatDate } from '../../utils/dateUtils';
import { getListingPictureUrl, getListingPictureUrls } from '../shared/listingPictures';
import { getPriceUnitText } from '../../utils/formatPriceUnit';
import { API_BASE_URL } from '../../config/api';

const recordListingView = async (listingId: string, token: string | null): Promise<number | null> => {
  if (!listingId) return null;

  const headers: Record<string, string> = { accept: '*/*' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const url = `${API_BASE_URL}/api/Listing/ViewCount/${encodeURIComponent(listingId)}`;
  const candidateMethods = ['PATCH', 'PUT', 'POST', 'GET'];

  try {
    for (const method of candidateMethods) {
      const response = await fetch(url, {
        method,
        headers,
        keepalive: true,
      });
      if (response.ok) {
        const data = await response.json().catch(() => null);
        const nextViewCount = Number(
          data?.viewCount ??
          data?.ViewCount ??
          data?.data?.viewCount ??
          data?.data?.ViewCount ??
          data?.listing?.viewCount ??
          data?.listing?.ViewCount
        );
        return Number.isFinite(nextViewCount) ? nextViewCount : null;
      }
    }
  } catch (error) {
    console.warn('Không thể ghi nhận lượt xem bài đăng:', error);
  }

  return null;
};

// --- COMPONENT NÚT CHIA SẺ DÙNG LẠI (SHARE BUTTON) ---
const ExpandableDescription: React.FC<{ text: string }> = ({ text }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return <div style={{ lineHeight: '1.7', color: '#444', marginBottom: '40px', fontSize: '15px' }}>Chủ nhà chưa cung cấp mô tả chi tiết cho mặt bằng này. Vui lòng liên hệ trực tiếp để biết thêm thông tin về hợp đồng và cọc.</div>;

  const maxLength = 250;
  const isLong = text.length > maxLength;
  const displayText = isExpanded ? text : (isLong ? `${text.slice(0, maxLength)}...` : text);

  return (
    <div style={{ lineHeight: '1.7', color: '#444', whiteSpace: 'pre-wrap', marginBottom: '40px', fontSize: '15px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
      {displayText}
      {isLong && (
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }}
          style={{
            background: 'none', border: 'none', color: '#3b82f6',
            padding: 0, marginLeft: '6px', fontSize: '14px',
            fontWeight: 500, cursor: 'pointer', textDecoration: 'underline'
          }}
        >
          {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
        </button>
      )}
    </div>
  );
};
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


// --- REVIEW / ĐÁNH GIÁ ---
interface SpaceReview {
  id: number;
  bookingRequestId: number;
  reviewerId: string;
  reviewerName: string;
  targetUserId: string;
  targetUserName: string;
  spaceId: number;
  spaceAddress: string;
  rating: number;
  description: string;
  createdAt: string;
}

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

  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportReasons, setReportReasons] = useState<string[]>([]);
  const [reportDetails, setReportDetails] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  const [reviews, setReviews] = useState<SpaceReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewStarFilter, setReviewStarFilter] = useState<number | 'all'>('all');

  const [businessCategoriesById, setBusinessCategoriesById] = useState<Record<number, string>>({});

  const [furnitureImageIndex, setFurnitureImageIndex] = useState(0);
  const trackedViewRef = useRef<string | null>(null);

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

        // LẤY DANH SÁCH NGÀNH NGHỀ ĐỂ ĐỔI bussinessCategoryId -> TÊN NGÀNH NGHỀ
        try {
          const categoryResponse = await fetch('https://flexi-space-capstone-project.onrender.com/api/BussinessCategory/GetAll', {
            headers: { 'accept': '*/*' }
          });
          if (categoryResponse.ok) {
            const categoryData = await categoryResponse.json();
            const categories = Array.isArray(categoryData) ? categoryData : (categoryData?.data || categoryData?.items || []);
            const map: Record<number, string> = {};
            categories.forEach((c: any) => {
              const catId = c.id ?? c.Id;
              if (catId != null) map[catId] = c.name;
            });
            setBusinessCategoriesById(map);
          }
        } catch (catErr) {
          console.error('Lỗi lấy danh sách ngành nghề:', catErr);
        }

        // BƯỚC 2: LẤY DANH SÁCH BÀI ĐĂNG (Thêm header)
        const headers: any = { accept: '*/*' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('https://flexi-space-capstone-project.onrender.com/api/Listing/GetAll', { headers });
        if (response.ok) {
          const data = await response.json();
          const safeData = Array.isArray(data) ? data : (data?.data || data?.items || []);

          let found = safeData.find((item: any) => (item.id?.toString() === id || item.Id?.toString() === id));

          if (!found) {
            const occResponse = await fetch('https://flexi-space-capstone-project.onrender.com/api/Listing/GetAll?status=Occupied', { headers });
            if (occResponse.ok) {
              const occData = await occResponse.json();
              const safeOccData = Array.isArray(occData) ? occData : (occData?.data || occData?.items || []);
              found = safeOccData.find((item: any) => (item.id?.toString() === id || item.Id?.toString() === id));
            }
          }

          // BƯỚC 3: GHÉP area/address/amenities/allowedCategories (TỪ SPACE CHA)
          let foundWithSpaceInfo = found || null;
          if (found) {
            let currentSpaceId = found.spaceId || found.SpaceId;
            let parentSpace = spaces.find(s => (s.id || s.Id) == currentSpaceId);

            // GET SPACE PARTS
            let spaceOrPart = parentSpace;
            let isSpacePart = false;
            
            if (!parentSpace) {
               isSpacePart = true;
               try {
                   const token = localStorage.getItem('token');
                   const headers: any = { accept: '*/*' };
                   if (token) headers['Authorization'] = `Bearer ${token}`;
                   
                   const spRes = await fetch(`https://flexi-space-capstone-project.onrender.com/api/SpacePart/GetById/${currentSpaceId}`, { headers });
                   if (spRes.ok) {
                       spaceOrPart = await spRes.json();
                   }
               } catch (e) {}
            }

            const computedArea = found.area || found.Area || spaceOrPart?.area || spaceOrPart?.Area || null;
            foundWithSpaceInfo = {
              ...found,
              area: computedArea,
              address: found.spaceAddress || found.location || found.address || parentSpace?.address || parentSpace?.location || '',
              city: found.city || parentSpace?.city || '',
              spaceLatitude: found.spaceLatitude ?? parentSpace?.latitude ?? parentSpace?.Latitude ?? null,
              spaceLongitude: found.spaceLongitude ?? parentSpace?.longitude ?? parentSpace?.Longitude ?? null,
              amenities: found.amenities || spaceOrPart?.amenities || parentSpace?.amenities || [],
              allowedCategories: found.spaceAllowedCategories || spaceOrPart?.spaceAllowedCategories || parentSpace?.spaceAllowedCategories || [],
              isSpacePart
            };
          }
          setListing(foundWithSpaceInfo);

          const isListingOwner = currentUserId && (currentUserId === foundWithSpaceInfo?.creatorId);

          if (foundWithSpaceInfo && id && trackedViewRef.current !== id && !isListingOwner) {
            trackedViewRef.current = id;
            void recordListingView(id, token).then((nextViewCount) => {
              setListing((current: any) => {
                if (!current || (current.id?.toString() !== id && current.Id?.toString() !== id)) return current;
                const currentViewCount = Number(current.viewCount ?? current.ViewCount ?? 0);
                const viewCount = nextViewCount ?? currentViewCount + 1;
                return { ...current, viewCount, ViewCount: viewCount };
              });
            });
          }

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
    const spaceId = listing?.spaceId || listing?.SpaceId;
    if (!spaceId) return;

    const fetchReviews = async () => {
      setIsLoadingReviews(true);
      try {
        const res = await fetch(`https://flexi-space-capstone-project.onrender.com/api/Review/GetBySpaceId/${spaceId}`, {
          headers: { accept: '*/*' }
        });
        if (res.ok) {
          const data = await res.json();
          const safeData: SpaceReview[] = Array.isArray(data) ? data : (data?.data || data?.items || []);
          setReviews(safeData);
        } else {
          setReviews([]);
        }
      } catch (error) {
        console.error("Lỗi tải đánh giá:", error);
        setReviews([]);
      } finally {
        setIsLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [listing?.spaceId, listing?.SpaceId]);

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
      toast.error("Vui lòng đăng nhập để lưu mặt bằng!");
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
      toast.error("Vui lòng đăng nhập để gửi yêu cầu thuê!");
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
      toast.error("Vui lòng đăng nhập để báo cáo bài đăng!");
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

  const realImages = getListingPictureUrls(listing.listingPictures);
  const getUrl = (img: any) => getListingPictureUrl(img) || '';
  const mainImage = realImages.length > 0 ? realImages[currentImageIndex] : "https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&q=80&w=800";

  const isOwner = currentUserId && (currentUserId === listing.creatorId);
  const ownerName = listing.lessorName || 'Ẩn danh';

  const amenities: any[] = listing.amenities || [];
  const activeAmenities = amenities.filter((a: any) => a.isActive !== false);

  const allowedCategories: any[] = listing.allowedCategories || [];
  const viewCount = Number(listing.viewCount ?? listing.ViewCount ?? 0);

  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount
    : 0;
  const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) ratingCounts[r.rating] += 1;
  });
  const filteredReviews = reviewStarFilter === 'all'
    ? reviews
    : reviews.filter((r) => r.rating === reviewStarFilter);

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

            {/* TAXONOMY DUAL BADGES */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {/* TAG 1: HÌNH THỨC THUÊ */}
              {listing.listingType === 'SharedSpace' && listing.shareSpaceDetailIsOwner === false ? (
                <span style={{ backgroundColor: '#FCE7F3', color: '#BE185D', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Share2 size={14} /> Cho thuê lại
                </span>
              ) : listing.priceUnit === 'PerHour' ? (
                <span style={{ backgroundColor: '#EEF2FF', color: '#3730A3', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} /> Chia sẻ khung giờ
                </span>
              ) : (
                <span style={{ backgroundColor: '#F0FDF4', color: '#166534', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Home size={14} /> Dài hạn
                </span>
              )}

              {/* TAG 2: QUY MÔ KHÔNG GIAN */}
              {listing.isSpacePart === true ? (
                <span style={{ backgroundColor: '#FEF9C3', color: '#854D0E', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Sofa size={14} /> Diện tích chia nhỏ
                </span>
              ) : (
                <span style={{ backgroundColor: '#ECFDF5', color: '#047857', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Tag size={14} /> Nguyên căn
                </span>
              )}
            </div>

            {/* SỬA GIỐNG OWNERLISTINGS: Chỉ render Name khi tồn tại */}
            {listing.name && (
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 12px 0', lineHeight: '1.4', color: '#2C2C2C' }}>
                {listing.name}
              </h1>
            )}

            <p style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#505050', margin: '0 0 20px 0' }}>
              <MapPin size={16} />
              {[listing.location || listing.address || listing.spaceAddress, listing.city].filter(Boolean).join(', ') || 'Đang cập nhật địa chỉ'}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E0E0E0', borderBottom: '1px solid #E0E0E0', padding: '16px 0', marginBottom: '30px' }}>
              <div style={{ display: 'flex', gap: '40px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: '#777', marginBottom: '4px' }}>Mức giá</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-positive)' }}>
                    {listing.price ? `${listing.price.toLocaleString('vi-VN')} ₫/${listing.priceUnit ? getPriceUnitText(listing.priceUnit) : 'giờ'}` : 'Thỏa thuận'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#777', marginBottom: '4px' }}>Diện tích</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>{listing.area ? `${listing.area} m²` : 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#777', marginBottom: '4px' }}>Lượt xem</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                    <Eye size={18} color="#777" />
                    {viewCount.toLocaleString('vi-VN')}
                  </div>
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
            <ExpandableDescription text={listing.description} />

            {/* TÌNH TRẠNG MẶT BẰNG VISUALIZER */}
            <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#2C2C2C' }}>Tình trạng mặt bằng</h3>
            <div style={{ padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '40px' }}>
              {(listing.isSpacePart === true) && (
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#FEF3C7', color: '#D97706', borderRadius: '8px', fontWeight: 600, fontSize: '14px', marginBottom: '16px' }}>
                    <Sofa size={18} /> Bạn đang xem một phần diện tích chia nhỏ của mặt bằng gốc.
                 </div>
              )}
              {(listing.listingType === 'SharedSpace' && listing.shareSpaceDetailIsOwner === false) && (
                 <>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#FCE7F3', color: '#BE185D', borderRadius: '8px', fontWeight: 600, fontSize: '14px', marginBottom: '16px' }}>
                      <ShieldCheck size={18} /> Mặt bằng này đang được sang nhượng / cho thuê lại.
                   </div>
                   
                   {/* Khối Verified Sublease Contract */}
                   <div style={{ border: '1px solid #10B981', borderRadius: '8px', padding: '16px', marginBottom: '16px', backgroundColor: '#ECFDF5' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                       <div>
                         <h4 style={{ margin: '0 0 4px 0', color: '#047857', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}>
                           <FileText size={16} /> Chứng nhận quyền cho thuê lại
                         </h4>
                         <p style={{ margin: 0, fontSize: '13px', color: '#065F46' }}>Tài liệu hợp đồng gốc đã được xác thực bởi hệ thống.</p>
                       </div>
                       <div style={{ backgroundColor: '#D1FAE5', color: '#047857', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                         ĐÃ XÁC THỰC
                       </div>
                     </div>
                     <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                       <div 
                         onClick={() => setIsContractModalOpen(true)}
                         style={{ width: '80px', height: '100px', backgroundColor: '#fff', border: '1px dashed #10B981', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                       >
                         <div style={{ position: 'absolute', width: '100%', height: '100%', filter: 'blur(4px)', background: 'url("https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=200") center/cover' }} />
                         <Lock size={24} color="#047857" style={{ position: 'relative', zIndex: 1 }} />
                       </div>
                       <div style={{ flex: 1, fontSize: '13px', color: '#065F46' }}>
                         <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '4px', marginBottom: '8px' }}>
                           <span style={{ fontWeight: 600 }}>Người thuê gốc:</span>
                           <span>{(listing.ownerName || 'Nguyễn Văn A').substring(0, 8)}***</span>
                           
                           <span style={{ fontWeight: 600 }}>Thời hạn HĐ:</span>
                           <span>{listing.allowedEndTime ? new Date(listing.allowedEndTime).toLocaleDateString('vi-VN') : 'Còn hiệu lực (Đã xác minh)'}</span>
                         </div>
                         <button 
                           onClick={() => setIsContractModalOpen(true)}
                           style={{ padding: '6px 12px', backgroundColor: '#10B981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                         >
                           Xem chi tiết hợp đồng
                         </button>
                       </div>
                     </div>
                   </div>
                 </>
              )}
              {((listing.listingType === 'SharedSpace' || listing.priceUnit === 'PerHour') && listing.shareSpaceDetailAvailabilitiesTimes?.length > 0) ? (
                 <div>
                   <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569', fontWeight: 500 }}>Các ca chia sẻ hiện đang trống:</p>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                     {listing.shareSpaceDetailAvailabilitiesTimes.map((slot: any, idx: number) => {
                       const formatToAmPm = (timeStr?: string) => {
                         if (!timeStr) return '';
                         const [h, m] = timeStr.split(':');
                         const hh = parseInt(h, 10);
                         const ampm = hh >= 12 ? 'PM' : 'AM';
                         const hh12 = hh % 12 || 12;
                         return `${hh12.toString().padStart(2, '0')}:${m} ${ampm}`;
                       };
                       const formatDate = (dateStr: string) => {
                         if (!dateStr) return '';
                         const d = new Date(dateStr);
                         return d.toLocaleDateString('vi-VN');
                       };
                       const dayStr = slot.daysOfWeek?.length > 0 ? slot.daysOfWeek.join(', ') : (slot.specificdate ? formatDate(slot.specificdate) : 'Hôm nay');
                       return (
                         <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                           <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '14px' }}>{dayStr}</span>
                           <span style={{ color: '#10B981', fontWeight: 600, fontSize: '14px' }}>{formatToAmPm(slot.startTime)} - {formatToAmPm(slot.endTime)}</span>
                         </div>
                       );
                     })}
                   </div>
                 </div>
              ) : (
                !(listing.isSpacePart === true) ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#D1FAE5', color: '#047857', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}>
                    <Check size={18} /> Mặt bằng nguyên căn - Thuê toàn quyền sử dụng 24/7.
                  </div>
                ) : null
              )}
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
                    const categoryId = cat?.bussinessCategoryId ?? cat?.businessCategoryId ?? cat?.categoryId;
                    const label = typeof cat === 'string'
                      ? cat
                      : (cat.name || cat.categoryName || cat.title || businessCategoriesById[categoryId] || '');
                    if (!label) return null;
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

            <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#2C2C2C' }}>Lịch sử giá cho thuê</h3>
            <div style={{ border: '1px solid #E0E0E0', borderRadius: '8px', padding: '20px', marginBottom: '40px', display: 'flex', gap: '40px', backgroundColor: '#fff' }}>
              <div>
                <div style={{ color: '#777', fontSize: '13px', marginBottom: '8px' }}>Giá hiện tại</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-positive)' }}>{listing.price ? `${listing.price.toLocaleString('vi-VN')} ₫` : 'N/A'}</div>
              </div>
              <div>
                <div style={{ color: '#777', fontSize: '13px', marginBottom: '8px' }}>Đánh giá thị trường</div>
                <div style={{ fontSize: '15px', color: '#333', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={16} color="#F5A623" fill="#F5A623" />
                  {reviewCount > 0
                    ? `${averageRating.toFixed(1)}/5 (${reviewCount} đánh giá)`
                    : 'Chưa có đánh giá'}
                </div>
              </div>
            </div>

            {/* ĐÁNH GIÁ & NHẬN XÉT */}
            <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#2C2C2C', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={18} /> Đánh giá & Nhận xét {reviewCount > 0 && `(${reviewCount})`}
            </h3>
            <div style={{ border: '1px solid #E0E0E0', borderRadius: '8px', padding: '20px', marginBottom: '40px', backgroundColor: '#fff' }}>
              {isLoadingReviews ? (
                <div style={{ textAlign: 'center', color: '#777', padding: '20px 0' }}>Đang tải đánh giá...</div>
              ) : reviewCount === 0 ? (
                <div style={{ textAlign: 'center', color: '#777', padding: '20px 0' }}>Chưa có đánh giá nào cho mặt bằng này.</div>
              ) : (
                <>
                  {/* TỔNG QUAN RATING */}
                  <div style={{ display: 'flex', gap: '32px', paddingBottom: '20px', marginBottom: '20px', borderBottom: '1px solid #F0F0F0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '90px' }}>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2C2C2C' }}>{averageRating.toFixed(1)}</div>
                      <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} size={14} color="#F5A623" fill={star <= Math.round(averageRating) ? '#F5A623' : 'none'} />
                        ))}
                      </div>
                      <div style={{ fontSize: '12px', color: '#777' }}>{reviewCount} đánh giá</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = ratingCounts[star];
                        const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                        return (
                          <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#555' }}>
                            <span style={{ width: '40px' }}>{star} sao</span>
                            <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: '#F0F0F0', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#F5A623' }} />
                            </div>
                            <span style={{ width: '24px', textAlign: 'right', color: '#999' }}>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* FILTER THEO SỐ SAO */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    {(['all', 5, 4, 3, 2, 1] as const).map((opt) => {
                      const isActive = reviewStarFilter === opt;
                      const label = opt === 'all' ? `Tất cả (${reviewCount})` : `${opt} sao (${ratingCounts[opt]})`;
                      return (
                        <button
                          key={opt}
                          onClick={() => setReviewStarFilter(opt)}
                          style={{
                            padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
                            border: isActive ? '1px solid var(--color-primary)' : '1px solid #E0E0E0',
                            backgroundColor: isActive ? 'var(--color-primary)' : '#fff',
                            color: isActive ? '#fff' : '#555',
                            cursor: 'pointer', transition: 'all 0.15s'
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* DANH SÁCH REVIEW */}
                  {filteredReviews.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#999', padding: '16px 0', fontSize: '14px' }}>
                      Không có đánh giá nào ở mức lọc này.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {filteredReviews.map((review) => (
                        <div key={review.id} style={{ display: 'flex', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid #F5F5F5' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#E4E6EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', color: '#333', flexShrink: 0 }}>
                            {(review.reviewerName || '?').substring(0, 2).toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 600, fontSize: '14px', color: '#2C2C2C' }}>{review.reviewerName || 'Ẩn danh'}</span>
                              <span style={{ fontSize: '12px', color: '#999' }}>
                                {review.createdAt ? formatDate(review.createdAt) : ''}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} size={12} color="#F5A623" fill={star <= review.rating ? '#F5A623' : 'none'} />
                              ))}
                            </div>
                            {review.description && (
                              <div style={{ fontSize: '14px', color: '#444', lineHeight: '1.6' }}>{review.description}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#2C2C2C' }}>Xem trên bản đồ</h3>
            {(() => {
              const lat = listing.spaceLatitude ?? listing.latitude ?? listing.Latitude;
              const lng = listing.spaceLongitude ?? listing.longitude ?? listing.Longitude;
              const hasValidCoords = typeof lat === 'number' && typeof lng === 'number' && lat !== 0 && lng !== 0;

              const textAddress = [
                listing.spaceAddress || listing.address || listing.location,
                listing.city
              ].filter(Boolean).join(', ');

              const mapQuery = hasValidCoords
                ? `${lat},${lng}`
                : (textAddress || 'Hồ Chí Minh, Việt Nam');

              return (
                <div style={{ width: '100%', height: '350px', backgroundColor: '#e5e3df', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px', border: '1px solid #E0E0E0' }}>
                  <iframe
                    width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight={0} marginWidth={0}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  />
                </div>
              );
            })()}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', paddingBottom: '30px', borderBottom: '1px solid #E0E0E0', marginBottom: '40px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#777', fontSize: '12px', marginBottom: '4px' }}><Calendar size={12} /> Ngày đăng</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>
                  {listing.createdAt ? formatDate(listing.createdAt) : 'Hôm nay'}
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#777', fontSize: '12px', marginBottom: '4px' }}><Calendar size={12} /> Ngày hết hạn</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>
                  {listing.allowedEndTime ? new Date(listing.allowedEndTime).toLocaleDateString('vi-VN') : 'Sau 30 ngày'}
                </div>
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
                            <MapPin size={10} /> {simItem.location?.substring(0, 25) || simItem.address?.substring(0, 25) || simItem.spaceAddress?.substring(0, 25) || 'TP.HCM'}
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
                  <div style={{ fontSize: '12px', color: (listing.status === 'Occupied' || listing.status === 1) ? '#E02424' : '#16A34A', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: (listing.status === 'Occupied' || listing.status === 1) ? '#E02424' : '#16A34A', display: 'inline-block' }}></span> 
                    {(listing.status === 'Occupied' || listing.status === 1) ? 'Mặt bằng này đã được ký' : 'Đang hoạt động'}
                  </div>

                  {listing.status !== 'Occupied' && listing.status !== 1 && (
                    <button
                      onClick={() => {
                        if (!currentUserId) { navigate('/login'); return; }
                        setIsBookingModalOpen(true);
                      }}
                      style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#1E293B', color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      <Send size={16} /> Gửi yêu cầu thuê
                    </button>
                  )}
                </>
              )}
            </div>

            {realImages.length > 0 && (
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #E0E0E0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Sofa size={18} color="var(--color-primary)" />
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#2C2C2C' }}>Thử đặt đồ vật lên mặt bằng</h4>
                </div>
                <p style={{ margin: '0 0 14px', fontSize: '12.5px', color: '#6B7280', lineHeight: 1.5 }}>
                  Chọn 1 ảnh mặt bằng và dùng AI để thử đặt bàn ghế, đồ trang trí... giúp bạn dễ hình dung không gian.
                </p>

                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>
                  Bước 1 · Chọn ảnh muốn chỉnh
                </div>

                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '10px' }}>
                  {realImages.map((img: string, idx: number) => {
                    const isSelected = idx === furnitureImageIndex;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFurnitureImageIndex(idx)}
                        aria-pressed={isSelected}
                        title={`Ảnh ${idx + 1}${isSelected ? ' (đang chọn)' : ' — bấm để chọn'}`}
                        style={{
                          position: 'relative',
                          flex: '0 0 auto',
                          width: '56px',
                          height: '56px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          padding: 0,
                          cursor: 'pointer',
                          border: isSelected ? '2px solid var(--color-primary)' : '2px solid #E5E7EB',
                          opacity: isSelected ? 1 : 0.75,
                          background: 'none',
                          boxShadow: isSelected ? '0 0 0 3px rgba(59,130,246,0.18)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <img src={img} alt={`furniture-thumb-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {isSelected && (
                          <span style={{
                            position: 'absolute', top: '2px', right: '2px', width: '16px', height: '16px', borderRadius: '50%',
                            backgroundColor: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '10px', lineHeight: 1, boxShadow: '0 0 0 1.5px #fff',
                          }}>
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#9CA3AF' }}>
                  Đang chọn ảnh {furnitureImageIndex + 1}/{realImages.length} — bấm nút bên dưới để tiếp tục.
                </p>

                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>
                  Bước 2 · Chỉnh ảnh với AI
                </div>

                <button
                  onClick={() => {
                    if (!currentUserId) { navigate('/login'); return; }
                    const selectedUrl = realImages[Math.min(furnitureImageIndex, realImages.length - 1)];
                    navigate('/ai-image-editor', { state: { sourceImageUrl: selectedUrl, sourceListingId: listing.id } });
                  }}
                  style={{ width: '100%', padding: '11px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px' }}
                >
                  <Wand2 size={16} /> Chỉnh ảnh với AI
                </button>
              </div>
            )}
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
                <input type="number" required value={bookingData.offeredPrice} onChange={(e) => setBookingData({ ...bookingData, offeredPrice: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', color: '#555', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Thời lượng thuê</label>
                  <input type="number" required min={1} value={bookingData.duration} onChange={(e) => setBookingData({ ...bookingData, duration: Number(e.target.value) })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', color: '#555', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Đơn vị</label>
                  <select value={bookingData.durationUnit} onChange={(e) => setBookingData({ ...bookingData, durationUnit: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                    <option value="Days">Ngày</option>
                    <option value="Months">Tháng</option>
                    <option value="Years">Năm</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#555', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Ngày bắt đầu dự kiến</label>
                <input type="date" required value={bookingData.expectedStartDate} onChange={(e) => setBookingData({ ...bookingData, expectedStartDate: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#555', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Mục đích sử dụng</label>
                <input type="text" required placeholder="VD: Mở quán cafe, làm kho..." value={bookingData.purpose} onChange={(e) => setBookingData({ ...bookingData, purpose: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#555', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Ghi chú cho chủ nhà (Tùy chọn)</label>
                <textarea rows={3} placeholder="Bạn có yêu cầu gì thêm không?" value={bookingData.note} onChange={(e) => setBookingData({ ...bookingData, note: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', resize: 'none' }} />
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
      {/* CONTRACT MODAL */}
      {isContractModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '90%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E0E0E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
              <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1E293B' }}>
                <ShieldCheck size={20} color="#10B981" /> Chi tiết hợp đồng gốc (Bản xem trước)
              </h2>
              <button onClick={() => setIsContractModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: '#F1F5F9', position: 'relative', display: 'flex', justifyContent: 'center' }}>
              {/* Fake Contract Document Container */}
              <div style={{ width: '100%', maxWidth: '600px', backgroundColor: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', minHeight: '800px', position: 'relative', padding: '40px' }}>
                {/* WATERMARK */}
                <div style={{ 
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  pointerEvents: 'none', zIndex: 10, overflow: 'hidden'
                }}>
                  <div style={{
                    transform: 'rotate(-45deg)',
                    color: 'rgba(239, 68, 68, 0.15)',
                    fontSize: '48px',
                    fontWeight: 900,
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    lineHeight: '1.2',
                    userSelect: 'none'
                  }}>
                    FLEXISPACE DEMO<br/>
                    KHÔNG CÓ GIÁ TRỊ PHÁP LÝ<br/>
                    CHỈ DÙNG ĐỂ XÁC MINH
                  </div>
                </div>

                {/* Fake Contract Content */}
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h3>
                  <h4 style={{ margin: 0, fontSize: '16px', textDecoration: 'underline' }}>Độc lập - Tự do - Hạnh phúc</h4>
                </div>
                <h2 style={{ textAlign: 'center', margin: '30px 0', fontSize: '24px' }}>HỢP ĐỒNG THUÊ MẶT BẰNG</h2>
                <div style={{ lineHeight: '1.8', color: '#333' }}>
                  <p><strong>Bên Cho Thuê (Bên A):</strong> Chủ mặt bằng gốc</p>
                  <p><strong>Bên Thuê (Bên B):</strong> {(listing.ownerName || 'Nguyễn Văn A')}</p>
                  <p><strong>Diện tích thuê:</strong> {listing.area || 'Không rõ'} m2</p>
                  <p><strong>Địa chỉ:</strong> {listing.spaceAddress || listing.address || listing.location || 'Hồ Chí Minh'}</p>
                  <p><strong>Thời hạn thuê:</strong> Từ 01/01/2023 đến {listing.allowedEndTime ? new Date(listing.allowedEndTime).toLocaleDateString('vi-VN') : '31/12/2025'}</p>
                  <p><strong>Điều khoản đặc biệt:</strong> Bên B <span style={{ color: '#10B981', fontWeight: 'bold' }}>ĐƯỢC PHÉP</span> cho thuê lại (sublease) một phần hoặc toàn bộ mặt bằng trong thời gian hợp đồng còn hiệu lực.</p>
                </div>
                
                {/* Fake image to simulate a real document scan */}
                <img src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800" alt="contract scan" style={{ width: '100%', marginTop: '30px', opacity: 0.5, mixBlendMode: 'multiply' }} />
              </div>
            </div>
            
            <div style={{ padding: '16px 20px', borderTop: '1px solid #E0E0E0', backgroundColor: '#fff', textAlign: 'right' }}>
              <button onClick={() => setIsContractModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
