import React, { useState, useEffect } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import { useNavigate } from 'react-router-dom';
import 'maplibre-gl/dist/maplibre-gl.css';
import { API_BASE_URL } from '../../../config/api';

export const MapComponent: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [listings, setListings] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [popupInfo, setPopupInfo] = useState<any | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/Listing/GetAll`, { headers: { 'accept': '*/*' } });
        if (response.ok) {
          const data = await response.json();
          const safeData = Array.isArray(data) ? data : (data?.data || data?.items || []);
          
          // GIẢ LẬP TỌA ĐỘ: Rải ngẫu nhiên các bài đăng quanh trung tâm TP.HCM
          // Nếu sau này BE có trả về lat/lng thì xóa đoạn Math.random() này đi
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const listingsWithCoords = safeData.map((item: any) => ({
            ...item,
            lat: 10.7769 + (Math.random() - 0.5) * 0.08,
            lng: 106.7000 + (Math.random() - 0.5) * 0.08,
          }));
          
          setListings(listingsWithCoords);
        }
      } catch (error) {
        console.error("Lỗi lấy dữ liệu bản đồ:", error);
      }
    };

    fetchListings();
  }, []);

  // Hàm lấy URL an toàn cho ảnh
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getUrl = (img: any) => typeof img === 'string' ? img : (img.imageUrl || img.url);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '600px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'relative' }}>
      <Map
        initialViewState={{ longitude: 106.7000, latitude: 10.7769, zoom: 12 }}
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
        mapStyle="https://tiles.openfreemap.org/styles/bright"
      >
        {/* Render các cái ghim (Marker) */}
        {listings.map((p) => (
          <Marker 
            key={p.id || p.Id} 
            longitude={p.lng} 
            latitude={p.lat} 
            color="#E03C31"
            onClick={(e) => {
              // Ngăn không cho map zoom khi click vào marker
              e.originalEvent.stopPropagation(); 
              setPopupInfo(p);
            }}
            style={{ cursor: 'pointer' }}
          />
        ))}

        {/* Render bảng thông tin (Popup) khi click vào một Marker */}
        {popupInfo && (
          <Popup
            anchor="bottom"
            longitude={popupInfo.lng}
            latitude={popupInfo.lat}
            onClose={() => setPopupInfo(null)}
            closeButton={false} // Tắt nút X mặc định, click ra ngoài tự đóng
            offset={25}
            style={{ padding: 0 }}
          >
            <div 
              style={{ width: '200px', cursor: 'pointer', display: 'flex', flexDirection: 'column' }} 
              onClick={() => navigate(`/listing/${popupInfo.id || popupInfo.Id}`)}
            >
              {/* Ảnh bìa Popup */}
              <img 
                src={popupInfo.listingPictures?.[0] ? getUrl(popupInfo.listingPictures[0]) : "https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&q=80&w=400"} 
                alt="venue" 
                style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }} 
              />
              {/* Thông tin Popup */}
              <div style={{ padding: '8px 4px 4px 4px' }}>
                <div style={{ color: 'var(--color-positive)', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                  {popupInfo.price ? `${popupInfo.price.toLocaleString('vi-VN')} ₫/h` : 'Thỏa thuận'}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#333', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '4px', lineHeight: '1.3' }}>
                  {popupInfo.name || popupInfo.description || 'Mặt bằng cho thuê'}
                </div>
                <div style={{ fontSize: '11px', color: '#777' }}>
                  {popupInfo.area ? `${popupInfo.area} m²` : 'N/A'} • {popupInfo.location?.substring(0, 15) || 'TP.HCM'}
                </div>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};