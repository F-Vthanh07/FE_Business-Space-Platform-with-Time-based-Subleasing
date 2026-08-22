/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Eye, MapPin, Bookmark, ShieldCheck, Home, X,
  ChevronLeft, ChevronRight, Building2, Clock3, User, Camera, Heart, Share2, Layers, Tag
} from 'lucide-react';
import { Header } from '../../components/Header'; // Chỉnh lại đường dẫn cho đúng nha
import { useNavigate } from 'react-router-dom';
import { HomeSearchBar, type FeedFilterState } from '../homepage/components/HomeSearchBar';
import { getListingPictureUrl, getListingPictureUrls } from '../shared/listingPictures';
import { getPriceUnitText } from '../../utils/formatPriceUnit';
import '../homepage/Homepage.css';
import '../homepage/Homepage.css';

const ExpandableDescription: React.FC<{ text: string }> = ({ text }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!text) return <div>Chủ nhà chưa cung cấp mô tả chi tiết cho mặt bằng này.</div>;
  
  const maxLength = 250;
  const isLong = text.length > maxLength;
  const displayText = isExpanded ? text : (isLong ? `${text.slice(0, maxLength)}...` : text);

  return (
    <div style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
      {displayText}
      {isLong && (
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }}
          style={{
            background: 'none', border: 'none', color: '#3b82f6',
            padding: 0, marginLeft: '6px', fontSize: '13px',
            fontWeight: 500, cursor: 'pointer', textDecoration: 'underline'
          }}
        >
          {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
        </button>
      )}
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyItem = any;


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

export const ListingFeed: React.FC = () => {
  const [listings, setListings] = useState<AnyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- BỘ LỌC MULTI-SELECT ---
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [onlyMine, setOnlyMine] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [myListingKeys, setMyListingKeys] = useState<Set<string>>(new Set());
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  const [feedFilters, setFeedFilters] = useState<FeedFilterState>({
    searchQuery: '',
    provinceCode: '',
    provinceLabel: '',
    districtCode: '',
    districtLabel: '',
    priceRange: 'all',
    minPrice: '',
    maxPrice: '',
    areaRange: 'all',
    minArea: '',
    maxArea: '',
    categoryId: '',
    categoryLabel: '',
  });

  const [businessCategories, setBusinessCategories] = useState<{ value: string; label: string }[]>([]);

  const handleFilterChange = (updated: Partial<FeedFilterState>) => {
    setFeedFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFeedFilters({
      searchQuery: '',
      provinceCode: '',
      provinceLabel: '',
      districtCode: '',
      districtLabel: '',
      priceRange: 'all',
      minPrice: '',
      maxPrice: '',
      areaRange: 'all',
      minArea: '',
      maxArea: '',
      categoryId: '',
      categoryLabel: '',
    });
  };

  // --- STATE QUẢN LÝ POPUP XEM ẢNH ---
  const [viewingImages, setViewingImages] = useState<AnyItem[] | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const navigate = useNavigate();
  const token = localStorage.getItem('portal_token');
  const currentUserId = localStorage.getItem('current_user_id');

  useEffect(() => {
    const fetchFeedAndFavorites = async () => {
      try {
        // 1. Lấy danh sách yêu thích nếu đã đăng nhập
        if (token) {
          fetch('https://flexi-space-capstone-project.onrender.com/api/FavoriteList/FavoriteByUser', {
            headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
          })
            .then(res => res.ok ? res.json() : [])
            .then(data => {
              console.log("Dữ liệu Yêu thích (Feed):", data); // Xem log ở Console nha

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
            .catch(err => console.error('Lỗi lấy danh sách yêu thích:', err));
        }

        // 2. Lấy toàn bộ bài đăng (fetch kèm Space để có area) + danh mục ngành nghề
        const [spaceRes, response, categoryRes] = await Promise.all([
          fetch('https://flexi-space-capstone-project.onrender.com/api/Space/GetAll', { headers: { accept: '*/*' } }),
          fetch('https://flexi-space-capstone-project.onrender.com/api/Listing/GetAll', { headers: { accept: '*/*' } }),
          fetch('https://flexi-space-capstone-project.onrender.com/api/BussinessCategory/GetAll', { headers: { accept: '*/*' } })
        ]);

        let spaces: AnyItem[] = [];
        if (spaceRes.ok) {
          const spaceData = await spaceRes.json();
          spaces = Array.isArray(spaceData) ? spaceData : (spaceData?.data || spaceData?.items || []);
        }

        if (categoryRes.ok) {
          try {
            const categoryData = await categoryRes.json();
            const rawCategories = Array.isArray(categoryData) ? categoryData : (categoryData?.data || categoryData?.items || []);
            const options = rawCategories
              .map((c: AnyItem) => ({ value: String(c.id ?? c.Id ?? ''), label: c.name ?? c.Name ?? '' }))
              .filter((c: { value: string; label: string }) => c.value && c.label);
            setBusinessCategories(options);
          } catch (catErr) {
            console.error('Lỗi lấy danh sách ngành nghề:', catErr);
          }
        }

        let safeData: AnyItem[] = [];
        if (response.ok) {
          let data = await response.json();
          if (data && typeof data === 'object' && data.isSuccess === false) {
            console.warn('Lỗi từ API Listing/GetAll:', data.message);
            // Thử fallback gọi API có status=Accepted nếu cache mặc định gặp lỗi
            try {
              const fallbackRes = await fetch('https://flexi-space-capstone-project.onrender.com/api/Listing/GetAll?status=Accepted', { headers: { accept: '*/*' } });
              if (fallbackRes.ok) {
                const fallbackData = await fallbackRes.json();
                if (fallbackData?.isSuccess !== false) {
                  data = fallbackData;
                }
              }
            } catch (fbErr) {
              console.error('Lỗi fallback Listing/GetAll:', fbErr);
            }
          }
          const listItems = Array.isArray(data) ? data : (data?.data || data?.items || []);
          const rawItems = Array.isArray(listItems) ? listItems : [];
          const headers: any = { accept: '*/*' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const spacePartPromises: number[] = [];
          const listingsWithAddressBase = rawItems
            .filter((l: any) => {
              const status = l.status ?? l.Status;
              return status !== 1 && status !== 'Occupied';
            })
            .map((l: any) => {
              let currentSpaceId = l.spaceId || l.SpaceId;
              let parentSpace = spaces.find((s: AnyItem) => (s.id || s.Id) == currentSpaceId);
              
              let isSpacePart = false;
              if (!parentSpace) {
                  isSpacePart = true;
                  if (currentSpaceId) spacePartPromises.push(currentSpaceId);
              }
              return { ...l, isSpacePart, _tempSpaceId: currentSpaceId, _parentSpace: parentSpace };
            });

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

          safeData = listingsWithAddressBase.map((item: AnyItem) => {
            let spaceOrPart = item._parentSpace || fetchedSpaceParts[item._tempSpaceId];
            
            let address = item.spaceAddress || item.location || item.address || '';
            let city = item.city || '';
            let computedArea = item.area || item.Area || spaceOrPart?.area || spaceOrPart?.Area || null;

            if (item.isSpacePart && spaceOrPart?.parentSpaceId) {
               const parent = spaces.find((s: AnyItem) => (s.id || s.Id) == spaceOrPart.parentSpaceId);
               if (parent && !address) {
                 address = parent.address || parent.location || '';
                 city = parent.city || '';
               }
            } else if (spaceOrPart && !address) {
                 address = spaceOrPart.address || spaceOrPart.location || '';
                 city = spaceOrPart.city || '';
            }

            let combinedAddr = address;
            if (city && address && !address.toLowerCase().includes(city.toLowerCase())) {
               combinedAddr = `${address}, ${city}`;
            } else if (city && !address) {
               combinedAddr = city;
            }
            const allowedCategories = (item.spaceAllowedCategories?.length > 0 ? item.spaceAllowedCategories : null) || (spaceOrPart?.spaceAllowedCategories?.length > 0 ? spaceOrPart.spaceAllowedCategories : null) || [];

            let parentForOwner = item.isSpacePart && spaceOrPart?.parentSpaceId 
              ? spaces.find((s: AnyItem) => (s.id || s.Id) == spaceOrPart.parentSpaceId) 
              : null;
            const spaceOwnerId = spaceOrPart?.ownerId || spaceOrPart?.createdBy || spaceOrPart?.OwnerId || spaceOrPart?.CreatedBy || parentForOwner?.ownerId || parentForOwner?.createdBy || parentForOwner?.OwnerId || parentForOwner?.CreatedBy || null;

            return {
              ...item,
              spaceCity: city,
              spaceAddress: address,
              area: computedArea,
              address: combinedAddr || item.location || item.address || 'Đang cập nhật',
              city: city,
              isSpacePart: item.isSpacePart,
              allowedCategories,
              spaceOwnerId
            };
          });
        }
        setListings(safeData);

        if (currentUserId) {
          try {
            const spaceRes2 = await fetch(
              `https://flexi-space-capstone-project.onrender.com/api/Space/GetAll?OwnerId=${encodeURIComponent(currentUserId)}`,
              { headers: { accept: '*/*' } }
            );
            if (spaceRes2.ok) {
              const spaceData2 = await spaceRes2.json();
              const mySpaces = Array.isArray(spaceData2) ? spaceData2 : (spaceData2?.data || spaceData2?.items || []);
              const mySpaceIds = new Set(mySpaces.map((s: AnyItem) => (s.id || s.Id)?.toString()));

              const myKeys = new Set<string>();
              safeData.forEach((l) => {
                const sId = (l.spaceId || l.SpaceId)?.toString();
                const cId = (l.creatorId || l.CreatorId)?.toString();
                if ((sId && mySpaceIds.has(sId)) || (cId && cId === currentUserId.toString())) {
                  myKeys.add((l.id || l.Id).toString());
                }
              });
              setMyListingKeys(myKeys);
            }
          } catch (err) {
            console.error('Lỗi kiểm tra bài đăng cá nhân:', err);
          }
        }
      } catch (err) {
        console.error('Lỗi khi nạp dữ liệu trang Feed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedAndFavorites();
  }, [currentUserId, token]);

  const handleToggleFavorite = async (e?: React.MouseEvent, listingId?: number) => {
    if (e) e.stopPropagation();
    const targetId = listingId;
    if (!targetId) return;
    if (!currentUserId) {
      alert("Vui lòng đăng nhập để lưu bài đăng yêu thích!");
      return;
    }

    try {
      const isSaved = favoriteIds.has(targetId);
      let res;
      
      if (isSaved) {
        res = await fetch(`https://flexi-space-capstone-project.onrender.com/api/FavoriteList/listings/${targetId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
        });
      } else {
        res = await fetch('https://flexi-space-capstone-project.onrender.com/api/FavoriteList/listings', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'accept': '*/*' },
          body: JSON.stringify({ listingIds: [targetId] })
        });
      }

      if (res.ok) {
        setFavoriteIds(prev => {
          const next = new Set(prev);
          if (next.has(targetId)) {
            next.delete(targetId);
          } else {
            next.add(targetId);
          }
          return next;
        });
      } else {
        alert("Có lỗi xảy ra khi cập nhật mục yêu thích.");
      }
    } catch (error) {
      console.error("Lỗi API Favorite:", error);
    }
  };

  const getUrl = (img: AnyItem) => getListingPictureUrl(img) || '';

  const handleImageClick = (images: AnyItem[], index: number) => {
    setViewingImages(images);
    setCurrentImageIndex(index);
  };

  const counts = useMemo(() => {
    const getRentalType = (item: AnyItem) => {
      const cId = item.creatorId || item.CreatorId;
      if (item.listingType === 'SharedSpace' && cId && item.spaceOwnerId && String(cId) !== String(item.spaceOwnerId)) return 'sublet';
      if (item.listingType === 'SharedSpace' || item.priceUnit === 'PerHour') return 'hourly';
      return 'longterm';
    };

    const longterm = listings.filter((l) => getRentalType(l) === 'longterm').length;
    const hourly = listings.filter((l) => getRentalType(l) === 'hourly').length;
    const sublet = listings.filter((l) => getRentalType(l) === 'sublet').length;
    const fullSpace = listings.filter((l) => !l.isSpacePart).length;
    const spacePart = listings.filter((l) => l.isSpacePart).length;
    const mine = listings.filter((l) => myListingKeys.has((l.id || l.Id)?.toString())).length;

    return { all: listings.length, longterm, hourly, sublet, fullSpace, spacePart, mine };
  }, [listings, myListingKeys]);

  const filteredListings = useMemo(() => {
    const cleanLocation = (text: string) => {
      if (!text) return '';
      return text.replace(/(Thành phố|Tỉnh|Quận|Huyện|Phường|Xã|TP\.?)\s+/gi, '').trim().toLowerCase();
    };

    return listings.filter((item) => {
      const status = item.status ?? item.Status;
      const isOccupied = status === 1 || status === 'Occupied';
      if (isOccupied) return false;

      // LỌC MULTI-SELECT TYPE & SCOPE
      const getRentalType = (item: AnyItem) => {
        const cId = item.creatorId || item.CreatorId;
        if (item.listingType === 'SharedSpace' && cId && item.spaceOwnerId && String(cId) !== String(item.spaceOwnerId)) return 'sublet';
        if (item.listingType === 'SharedSpace' || item.priceUnit === 'PerHour') return 'hourly';
        return 'longterm';
      };
      const itemType = getRentalType(item);
      const itemScope = item.isSpacePart ? 'space_part' : 'full_space';

      let matchCategory = true;
      if (selectedFilters.length > 0) {
        const typeKeys = ['longterm', 'hourly', 'sublet'];
        const scopeKeys = ['full_space', 'space_part'];

        const selectedTypes = selectedFilters.filter((k) => typeKeys.includes(k));
        const selectedScopes = selectedFilters.filter((k) => scopeKeys.includes(k));

        const matchType = selectedTypes.length === 0 || selectedTypes.includes(itemType);
        const matchScope = selectedScopes.length === 0 || selectedScopes.includes(itemScope);

        matchCategory = matchType && matchScope;
      }
      const matchMine = !onlyMine || myListingKeys.has((item.id || item.Id)?.toString());
      const matchFav = !showFavoritesOnly || favoriteIds.has(Number(item.id || item.Id));

      const q = feedFilters.searchQuery.trim().toLowerCase();
      let matchQuery = true;
      if (q) {
        const name = (item.name || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const addr = (item.spaceAddress || item.address || item.location || '').toLowerCase();
        const city = (item.spaceCity || item.city || '').toLowerCase();
        const lessor = (item.lessorName || '').toLowerCase();
        matchQuery = name.includes(q) || desc.includes(q) || addr.includes(q) || city.includes(q) || lessor.includes(q);
      }

      let matchProvince = true;
      if (feedFilters.provinceLabel) {
        const fullProv = feedFilters.provinceLabel.toLowerCase();
        const rawProv = cleanLocation(feedFilters.provinceLabel);
        const targetText = `${item.spaceCity || ''} ${item.city || ''} ${item.spaceAddress || ''} ${item.address || ''}`.toLowerCase();

        matchProvince = targetText.includes(fullProv) || (rawProv.length > 0 && targetText.includes(rawProv));
      }

      let matchDistrict = true;
      if (feedFilters.districtLabel) {
        const fullDist = feedFilters.districtLabel.toLowerCase();
        const rawDist = cleanLocation(feedFilters.districtLabel);
        const targetText = `${item.spaceCity || ''} ${item.spaceAddress || ''} ${item.address || ''}`.toLowerCase();

        matchDistrict = targetText.includes(fullDist) || (rawDist.length > 0 && targetText.includes(rawDist));
      }

      let matchPrice = true;
      const price = Number(item.price || item.Price || 0);
      if (feedFilters.priceRange === 'under5') {
        matchPrice = price > 0 && price <= 5000000;
      } else if (feedFilters.priceRange === '5-15') {
        matchPrice = price >= 5000000 && price <= 15000000;
      } else if (feedFilters.priceRange === '15-30') {
        matchPrice = price >= 15000000 && price <= 30000000;
      } else if (feedFilters.priceRange === 'over30') {
        matchPrice = price > 30000000;
      }

      // 5. Lọc theo Diện tích
      let matchArea = true;
      const area = Number(item.area || item.Area || 0);
      if (feedFilters.areaRange === 'under30') {
        matchArea = area > 0 && area <= 30;
      } else if (feedFilters.areaRange === '30-70') {
        matchArea = area >= 30 && area <= 70;
      } else if (feedFilters.areaRange === '70-150') {
        matchArea = area >= 70 && area <= 150;
      } else if (feedFilters.areaRange === 'over150') {
        matchArea = area > 150;
      }

      // 6. Lọc theo Ngành nghề được phép kinh doanh
      let matchBusinessCategory = true;
      if (feedFilters.categoryId) {
        const allowed: AnyItem[] = item.allowedCategories || [];
        matchBusinessCategory = allowed.some((cat: AnyItem) => {
          const catId = cat?.bussinessCategoryId ?? cat?.businessCategoryId ?? cat?.categoryId;
          return catId != null && String(catId) === feedFilters.categoryId;
        });
      }

      return (
        matchCategory &&
        matchMine &&
        matchFav &&
        matchQuery &&
        matchProvince &&
        matchDistrict &&
        matchPrice &&
        matchArea &&
        matchBusinessCategory
      );
    });
  }, [listings, selectedFilters, onlyMine, myListingKeys, showFavoritesOnly, favoriteIds, feedFilters]);

  const renderImages = (rawImages: AnyItem[]) => {
    const images = getListingPictureUrls(rawImages);
    if (images.length === 0) {
      return (
        <div style={{ width: '100%', height: '300px', backgroundColor: '#EFF1F4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9AA1AC', gap: '8px', fontSize: '14px' }}>
          <Camera size={18} /> Chưa có hình ảnh
        </div>
      );
    }
    if (images.length === 1) {
      return <img onClick={() => handleImageClick(images, 0)} src={getUrl(images[0])} alt="media" style={{ width: '100%', maxHeight: '580px', objectFit: 'cover', display: 'block', cursor: 'pointer' }} />;
    }
    if (images.length === 2) {
      return (
        <div style={{ display: 'flex', gap: '2px', height: '440px' }}>
          <img onClick={() => handleImageClick(images, 0)} src={getUrl(images[0])} alt="media1" style={{ width: '50%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} />
          <img onClick={() => handleImageClick(images, 1)} src={getUrl(images[1])} alt="media2" style={{ width: '50%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} />
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', height: '540px' }}>
        <img onClick={() => handleImageClick(images, 0)} src={getUrl(images[0])} alt="media1" style={{ width: '100%', height: '60%', objectFit: 'cover', cursor: 'pointer' }} />
        <div style={{ display: 'flex', gap: '2px', height: '40%' }}>
          <img onClick={() => handleImageClick(images, 1)} src={getUrl(images[1])} alt="media2" style={{ width: '50%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} />
          <div onClick={() => handleImageClick(images, 2)} style={{ width: '50%', height: '100%', position: 'relative', cursor: 'pointer' }}>
            <img src={getUrl(images[2])} alt="media3" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {images.length > 3 && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '26px', fontWeight: 700 }}>
                +{images.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const toggleFilter = (key: string) => {
    if (key === 'all') {
      setSelectedFilters([]);
      return;
    }
    setSelectedFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const filterOptions = [
    { key: 'all', label: 'Tất cả', icon: <Home size={14} />, count: counts.all, isAll: true },
    { key: 'longterm', label: 'Dài hạn', icon: <Building2 size={14} />, count: counts.longterm },
    { key: 'hourly', label: 'Chia sẻ / Theo ca', icon: <Clock3 size={14} />, count: counts.hourly },
    { key: 'sublet', label: 'Cho thuê lại', icon: <Share2 size={14} />, count: counts.sublet },
    { key: 'full_space', label: 'Nguyên căn', icon: <Tag size={14} />, count: counts.fullSpace },
    { key: 'space_part', label: 'Diện tích chia nhỏ', icon: <Layers size={14} />, count: counts.spacePart },
  ];

  return (
    <div style={{ backgroundColor: '#F0F2F5', minHeight: '100vh', color: '#050505', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 999 }}>
        <Header />
      </div>

      <div style={{ maxWidth: '1380px', margin: '0 auto', paddingTop: '30px', display: 'grid', gridTemplateColumns: '280px minmax(auto, 760px) 280px', gap: '24px', justifyContent: 'center', paddingBottom: '50px' }}>

        {/* CỘT TRÁI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '110px', height: 'fit-content' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#050505' }}>Lối tắt của bạn</h4>

            <div
              onClick={() => { setOnlyMine(!onlyMine); setShowFavoritesOnly(false); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '8px 6px', borderRadius: '8px', cursor: 'pointer', color: '#050505', fontWeight: 500, backgroundColor: onlyMine ? '#F0F2F5' : 'transparent' }}
              onMouseEnter={(e) => { if (!onlyMine) e.currentTarget.style.backgroundColor = '#F0F2F5'; }}
              onMouseLeave={(e) => { if (!onlyMine) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E4E6EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={18} color="var(--color-gold, #D9A05B)" /></div>
                Chỉ xem bài đăng của tôi
              </div>
              <div style={{
                width: '38px', height: '22px', borderRadius: '999px', padding: '2px',
                backgroundColor: onlyMine ? 'var(--color-primary)' : '#CED0D4',
                display: 'flex', alignItems: 'center', justifyContent: onlyMine ? 'flex-end' : 'flex-start',
                transition: 'background-color .2s'
              }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }} />
              </div>
            </div>

            <div
              onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setOnlyMine(false); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '8px 6px', borderRadius: '8px', cursor: 'pointer', color: '#050505', fontWeight: 500, backgroundColor: showFavoritesOnly ? '#F0F2F5' : 'transparent', marginTop: '4px' }}
              onMouseEnter={(e) => { if (!showFavoritesOnly) e.currentTarget.style.backgroundColor = '#F0F2F5'; }}
              onMouseLeave={(e) => { if (!showFavoritesOnly) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E4E6EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bookmark size={18} color={showFavoritesOnly ? "#E02424" : "var(--color-gold, #D9A05B)"} /></div>
                Đã lưu gần đây
              </div>
            </div>

          </div>

          <div style={{ fontSize: '13px', color: '#65676B', padding: '0 8px' }}>
            Quyền riêng tư · Điều khoản · Quảng cáo · Tùy chọn · <br /> EtherSpace © 2026
          </div>
        </div>

        {/* CỘT GIỮA: FEED BÀI ĐĂNG */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <HomeSearchBar
            filters={feedFilters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            categories={businessCategories}
          />

          {/* THANH BỘ LỌC MULTI-SELECT */}
          <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {filterOptions.map((opt) => {
              const active = opt.isAll ? selectedFilters.length === 0 : selectedFilters.includes(opt.key);
              return (
                <button
                  key={opt.key}
                  onClick={() => toggleFilter(opt.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                    borderRadius: '20px', border: active ? '1px solid var(--color-primary)' : '1px solid transparent', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                    backgroundColor: active ? 'var(--color-primary)' : '#F0F2F5',
                    color: active ? '#fff' : '#050505',
                    transition: 'all .15s'
                  }}
                >
                  {opt.icon} {opt.label}
                  <span style={{
                    fontSize: '11px', padding: '1px 6px', borderRadius: '10px',
                    backgroundColor: active ? 'rgba(255,255,255,0.25)' : '#E4E6EB',
                    color: active ? '#fff' : '#65676B'
                  }}>{opt.count}</span>
                </button>
              );
            })}

            {selectedFilters.length > 0 && (
              <button
                onClick={() => setSelectedFilters([])}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#E02424', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <X size={12} /> Xóa bộ lọc ({selectedFilters.length})
              </button>
            )}

            {(onlyMine || showFavoritesOnly) && (
              <button
                onClick={() => { setOnlyMine(false); setShowFavoritesOnly(false); }}
                style={{ marginLeft: selectedFilters.length > 0 ? '8px' : 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '20px', border: '1px solid var(--color-primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, backgroundColor: '#fff', color: 'var(--color-primary)' }}
              >
                {onlyMine ? <User size={13} /> : <Bookmark size={13} />}
                {onlyMine ? `Bài đăng của tôi (${counts.mine})` : 'Đang xem tin đã lưu'} <X size={13} />
              </button>
            )}
          </div>

          {isLoading ? (
            <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '40px', textAlign: 'center', color: '#65676B' }}>Đang tải bảng tin...</div>
          ) : filteredListings.length === 0 ? (
            <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '40px', textAlign: 'center', color: '#65676B' }}>
              {onlyMine ? 'Bạn chưa có bài đăng nào phù hợp với bộ lọc này.' : showFavoritesOnly ? 'Bạn chưa lưu bài đăng nào.' : 'Không có bài đăng nào phù hợp.'}
            </div>
          ) : (
            filteredListings.map((item, index) => {
              const isMine = myListingKeys.has((item.id || item.Id)?.toString());
              const currentListingId = Number(item.id || item.Id);
              const isSaved = favoriteIds.has(currentListingId);

              // TAG 1: HÌNH THỨC THUÊ
              let typeBadge = { label: 'Dài hạn', bg: '#F0FDF4', color: '#166534', icon: <Building2 size={11} /> };
              const cIdBadge = item.creatorId || item.CreatorId;
              if (item.listingType === 'SharedSpace' && cIdBadge && item.spaceOwnerId && String(cIdBadge) !== String(item.spaceOwnerId)) {
                typeBadge = { label: 'Cho thuê lại', bg: '#FCE7F3', color: '#9D174D', icon: <Share2 size={11} /> };
              } else if (item.priceUnit === 'PerHour') {
                typeBadge = { label: 'Theo ca', bg: '#EEF2FF', color: '#3730A3', icon: <Clock3 size={11} /> };
              } else if (item.listingType === 'SharedSpace') {
                typeBadge = { label: 'Chia sẻ', bg: '#EEF2FF', color: '#3730A3', icon: <Share2 size={11} /> };
              }

              // TAG 2: QUY MÔ KHÔNG GIAN
              let scopeBadge = { label: 'Nguyên căn', bg: '#ECFDF5', color: '#047857' };
              if (item.isSpacePart) {
                scopeBadge = { label: 'Diện tích chia nhỏ', bg: '#FEF9C3', color: '#854D0E' };
              }

              // LOGIC THỜI GIAN THEO CA
              let timeSlotStr = '';
              if (item.shareSpaceDetailAvailabilitiesTimes && item.shareSpaceDetailAvailabilitiesTimes.length > 0) {
                const firstSlot = item.shareSpaceDetailAvailabilitiesTimes[0];
                const formatToAmPm = (timeStr: string) => {
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

              return (
                <div key={item.id || index} style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>

                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      onClick={(e) => { e.stopPropagation(); navigate(`/profile/${item.creatorId || item.CreatorId}`); }}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', flexShrink: 0, cursor: 'pointer' }}
                    >
                      {(item.lessorName || 'CH').substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '15px', color: '#050505', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          onClick={(e) => { e.stopPropagation(); navigate(`/profile/${item.creatorId || item.CreatorId}`); }}
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                          Chủ nhà {item.lessorName || 'Ẩn danh'}
                        </span>
                        {isMine && (
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', backgroundColor: 'rgba(0,0,0,0.05)', padding: '1px 8px', borderRadius: '10px' }}>Bài của bạn</span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#65676B', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                        {formatTimeAgo(item.createdAt)} • <MapPin size={10} /> {item.address || 'Đang cập nhật'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '12px', flexShrink: 0,
                        backgroundColor: typeBadge.bg,
                        color: typeBadge.color
                      }}>
                        {typeBadge.icon} {typeBadge.label}
                      </span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '12px', flexShrink: 0,
                        backgroundColor: scopeBadge.bg,
                        color: scopeBadge.color
                      }}>
                        {scopeBadge.label}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '4px 16px 12px 16px', fontSize: '15px', lineHeight: '1.5', color: '#050505' }}>
                    {item.name && (
                      <div style={{ fontWeight: 700, fontSize: '16px', color: '#050505', marginBottom: '4px' }}>
                        {item.name}
                      </div>
                    )}
                    <div style={{ fontWeight: 'bold', color: 'var(--color-positive, #2E7D32)', fontSize: '16px', marginBottom: '6px' }}>
                      💰 {item.price ? `${item.price.toLocaleString('vi-VN')} ₫/${item.priceUnit ? getPriceUnitText(item.priceUnit) : 'giờ'}` : 'Thỏa thuận'} • {item.area ? `${item.area}m²` : 'N/A'}
                    </div>
                    {timeSlotStr && (
                      <div style={{ fontSize: '14px', color: '#10B981', marginBottom: '8px', fontWeight: 600 }}>
                        {timeSlotStr}
                      </div>
                    )}
                    <ExpandableDescription text={item.description} />
                  </div>

                  {/* KHU VỰC ẢNH */}
                  <div style={{ width: '100%', backgroundColor: '#fff' }}>
                    {renderImages(item.listingPictures)}
                  </div>

                  <div style={{ padding: '12px 16px', borderTop: '1px solid #CED0D4' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={(e) => handleToggleFavorite(e, currentListingId)}
                        style={{ flex: 1, padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '14px', backgroundColor: '#E4E6EB', color: isSaved ? '#E02424' : '#050505', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        <Heart size={16} fill={isSaved ? '#E02424' : 'none'} color={isSaved ? '#E02424' : 'currentColor'} />
                        {isSaved ? 'Đã lưu' : 'Lưu tin'}
                      </button>
                      <button
                        onClick={() => navigate(`/listing/${item.id || item.Id}`)}
                        style={{ flex: 1, padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', backgroundColor: '#E4E6EB', color: '#050505', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                        <Eye size={16} /> Xem chi tiết
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* CỘT PHẢI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '110px', height: 'fit-content' }}>

          <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#050505', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="var(--color-primary)" /> Mẹo an toàn
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#65676B', lineHeight: '1.5' }}>
              Luôn xác minh danh tính chủ nhà và ký hợp đồng rõ ràng trước khi đặt cọc bạn nhé.
            </p>
          </div>
        </div>

      </div>

      {/* MODAL XEM ẢNH FULL MÀN HÌNH */}
      {viewingImages && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 999999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setViewingImages(null)}
        >
          <button
            onClick={() => setViewingImages(null)}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
          >
            <X size={24} color="#fff" />
          </button>

          {viewingImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : viewingImages.length - 1)); }}
              style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
            >
              <ChevronLeft size={32} color="#fff" />
            </button>
          )}

          <div style={{ width: '90%', height: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={getUrl(viewingImages[currentImageIndex])}
              alt="fullscreen view"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {viewingImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev < viewingImages.length - 1 ? prev + 1 : 0)); }}
              style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
            >
              <ChevronRight size={32} color="#fff" />
            </button>
          )}

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
