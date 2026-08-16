/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Home, ChevronRight, Building2, Clock3, Eye, Calendar, ShieldCheck, ChevronLeft } from 'lucide-react';
import { Header } from '../../components/Header';
import { API_BASE_URL } from '../../config/api';

type AnyItem = any;
type RentalCategory = 'all' | 'longterm' | 'hourly';

const PAGE_SIZE = 6;

const mapCategoryToListingType = (category: RentalCategory) => {
  if (category === 'longterm') return 'EntireSpace';
  if (category === 'hourly') return 'SharedSpace';
  return null;
};

const formatTimeAgo = (dateStr?: string) => {
  if (!dateStr) return 'Vừa cập nhật';
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const getUrl = (img: AnyItem) => (typeof img === 'string' ? img : (img?.imageUrl || img?.url));

export const UserPublicProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [listings, setListings] = useState<AnyItem[]>([]);
  const [countListings, setCountListings] = useState<AnyItem[]>([]);
  const [bio, setBio] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- BỘ LỌC & PHÂN TRANG ---
  const [categoryFilter, setCategoryFilter] = useState<RentalCategory>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const listingType = mapCategoryToListingType(categoryFilter);
        const listingParams = new URLSearchParams();
        if (listingType) listingParams.set('listingType', listingType);
        const listingUrl = userId
          ? `${API_BASE_URL}/api/Listing/GetAllByUserId/${encodeURIComponent(userId)}${listingParams.toString() ? `?${listingParams.toString()}` : ''}`
          : null;

        const allUserListingsUrl = userId
          ? `${API_BASE_URL}/api/Listing/GetAllByUserId/${encodeURIComponent(userId)}`
          : null;

        const [listingRes, countListingRes, profileRes] = await Promise.all([
          listingUrl
            ? fetch(listingUrl, { headers: { accept: '*/*' } })
            : Promise.resolve(null),
          allUserListingsUrl
            ? fetch(allUserListingsUrl, { headers: { accept: '*/*' } })
            : Promise.resolve(null),
          userId
            ? fetch(`${API_BASE_URL}/api/Profile/user/${userId}`, { headers: { accept: '*/*' } })
            : Promise.resolve(null),
        ]);

        let listings: AnyItem[] = [];
        if (listingRes?.ok) {
          const data = await listingRes.json();
          const safeData = Array.isArray(data) ? data : (data?.data || data?.items || []);
          listings = safeData.map((item: AnyItem) => ({
            ...item,
            area: item.area || item.Area || null,
            address: item.spaceAddress || item.SpaceAddress || item.location || item.address || '',
          }));
        }

        setListings(listings);

        if (countListingRes?.ok) {
          const countData = await countListingRes.json();
          const safeCountData = Array.isArray(countData) ? countData : (countData?.data || countData?.items || []);
          setCountListings(safeCountData);
        } else {
          setCountListings(listings);
        }

        if (profileRes?.ok) {
          const profileData = await profileRes.json();
          setBio(profileData?.bio || null);
        } else {
          setBio(null);
        }
      } catch (error) {
        console.error('Lỗi tải hồ sơ người dùng:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [categoryFilter, userId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, userId]);

  const userListings = useMemo(() => {
    return [...listings].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [listings]);

  const profile = useMemo(() => {
    const first = userListings[0];
    return {
      name: first?.lessorName || 'Ẩn danh',
      memberSince: userListings.length > 0
        ? userListings.reduce((earliest, l) => {
            const t = new Date(l.createdAt || 0).getTime();
            return t > 0 && t < earliest ? t : earliest;
          }, Date.now())
        : null,
    };
  }, [userListings]);

  const counts = useMemo(() => {
    const longterm = countListings.filter((l) => (l.listingType || l.ListingType) !== 'SharedSpace').length;
    const hourly = countListings.filter((l) => (l.listingType || l.ListingType) === 'SharedSpace').length;
    return { total: countListings.length, longterm, hourly };
  }, [countListings]);

  const filteredListings = useMemo(() => {
    return userListings;
  }, [userListings]);

  const totalPages = Math.max(1, Math.ceil(filteredListings.length / PAGE_SIZE));
  const pagedListings = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredListings.slice(start, start + PAGE_SIZE);
  }, [filteredListings, currentPage]);

  const categoryTabs: { key: RentalCategory; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'all', label: 'Tất cả', icon: <Home size={14} />, count: counts.total },
    { key: 'longterm', label: 'Dài hạn', icon: <Building2 size={14} />, count: counts.longterm },
    { key: 'hourly', label: 'Theo giờ', icon: <Clock3 size={14} />, count: counts.hourly },
  ];

  if (isLoading) {
    return <div style={{ paddingTop: '100px', textAlign: 'center' }}>Đang tải hồ sơ...</div>;
  }

  return (
    <div style={{ backgroundColor: '#F0F2F5', minHeight: '100vh', color: '#050505', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 999 }}>
        <Header />
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', paddingTop: '30px', paddingBottom: '50px' }}>

        {/* BREADCRUMB */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#65676B', marginBottom: '16px' }}>
          <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => navigate('/')}>
            <Home size={14} /> Trang chủ
          </span>
          <ChevronRight size={14} />
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/feed')}>Khám phá</span>
          <ChevronRight size={14} />
          <span style={{ color: '#050505', fontWeight: 500 }}>{profile.name}</span>
        </div>

        {/* THẺ THÔNG TIN NGƯỜI DÙNG */}
        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '84px', height: '84px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '28px', flexShrink: 0 }}>
            {profile.name.substring(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#050505', marginBottom: '6px' }}>
              Chủ nhà {profile.name}
            </div>
            <div style={{ fontSize: '13px', color: '#65676B', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {profile.memberSince && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} /> Tham gia từ {new Date(profile.memberSince).toLocaleDateString('vi-VN')}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={13} /> {counts.total} bài đăng
              </span>
            </div>
            {bio && (
              <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#3A3B3C', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {bio}
              </p>
            )}
          </div>
        </div>

        {/* TAB LỌC */}
        <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categoryTabs.map((tab) => {
            const active = categoryFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setCategoryFilter(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                  borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                  backgroundColor: active ? 'var(--color-primary)' : '#F0F2F5',
                  color: active ? '#fff' : '#050505',
                  transition: 'all .15s'
                }}
              >
                {tab.icon} {tab.label}
                <span style={{
                  fontSize: '11px', padding: '1px 6px', borderRadius: '10px',
                  backgroundColor: active ? 'rgba(255,255,255,0.25)' : '#E4E6EB',
                  color: active ? '#fff' : '#65676B'
                }}>{tab.count}</span>
              </button>
            );
          })}
        </div>

        {/* DANH SÁCH BÀI ĐĂNG */}
        {filteredListings.length === 0 ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '40px', textAlign: 'center', color: '#65676B' }}>
            {userListings.length === 0 ? 'Người dùng này chưa có bài đăng nào.' : 'Không có bài đăng nào phù hợp với bộ lọc.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pagedListings.map((item, index) => {
              const isHourly = (item.listingType || item.ListingType) === 'SharedSpace';
              const images = item.listingPictures || [];
              const mainImage = images.length > 0 ? getUrl(images[0]) : null;
              const listingId = item.id || item.Id;

              return (
                <div
                  key={listingId || index}
                  onClick={() => navigate(`/listing/${listingId}`)}
                  style={{ backgroundColor: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', gap: '0' }}
                >
                  <div style={{ width: '220px', height: '160px', flexShrink: 0, backgroundColor: '#EFF1F4' }}>
                    {mainImage ? (
                      <img src={mainImage} alt={item.name || 'listing'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9AA1AC', fontSize: '13px' }}>Chưa có hình ảnh</div>
                    )}
                  </div>
                  <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        {item.name && (
                          <div style={{ fontWeight: 700, fontSize: '16px', color: '#050505' }}>{item.name}</div>
                        )}
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', flexShrink: 0,
                          backgroundColor: isHourly ? 'rgba(0,180,160,0.12)' : 'rgba(0,110,255,0.1)',
                          color: isHourly ? '#00998A' : 'var(--color-primary)'
                        }}>
                          {isHourly ? <Clock3 size={11} /> : <Building2 size={11} />}
                          {isHourly ? 'Theo giờ' : 'Dài hạn'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#65676B', display: 'flex', alignItems: 'center', gap: '4px', margin: '4px 0' }}>
                        <MapPin size={10} /> {item.address || 'Đang cập nhật'}
                      </div>
                      <div style={{ fontWeight: 'bold', color: 'var(--color-positive, #2E7D32)', fontSize: '15px' }}>
                        {item.price ? `${item.price.toLocaleString('vi-VN')} ₫/giờ` : 'Thỏa thuận'} • {item.area ? `${item.area}m²` : 'N/A'}
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#65676B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{formatTimeAgo(item.createdAt)}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontWeight: 600 }}>
                        <Eye size={13} /> Xem chi tiết
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PHÂN TRANG */}
        {filteredListings.length > 0 && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px',
                borderRadius: '50%', border: 'none', backgroundColor: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#CCC' : '#050505'
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontSize: '13px', color: '#65676B', fontWeight: 500 }}>
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px',
                borderRadius: '50%', border: 'none', backgroundColor: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#CCC' : '#050505'
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
