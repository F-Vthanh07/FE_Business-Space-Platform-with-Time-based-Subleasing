import React, { useState, useEffect } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import { useNavigate } from 'react-router-dom';
import 'maplibre-gl/dist/maplibre-gl.css';

export const MapComponent: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [listings, setListings] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [popupInfo, setPopupInfo] = useState<any | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch('https://flexi-space-capstone-project.onrender.com/api/Listing/GetAll', { headers: { 'accept': '*/*' } });
        if (response.ok) {
          const data = await response.json();
          const safeData = Array.isArray(data) ? data : (data?.data || data?.items || []);
          
          const processedListings = [];

          // Dùng vòng lặp for...of để có thể dùng await (chờ gọi API từng cái một)
          for (const item of safeData) {
            let currentLat = item.spaceLatitude;
            let currentLng = item.spaceLongitude;

            // Nếu BE trả về 0 (chưa có tọa độ) và có địa chỉ cụ thể
            if ((!currentLat || currentLat === 0) && item.spaceAddress) {
              try {
                // Gọi API Geocoding của Nominatim
                const geoRes = await fetch(
                  `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(item.spaceAddress)}&format=json&limit=1`,
                  { headers: { 'User-Agent': 'FlexiSpaceApp/1.0' } } // Bắt buộc phải có User-Agent
                );
                
                const geoData = await geoRes.json();
                
                if (geoData && geoData.length > 0) {
                  // Nominatim trả về lat/lon dạng string, ép kiểu về float
                  currentLat = parseFloat(geoData[0].lat);
                  currentLng = parseFloat(geoData[0].lon);
                  console.log(`Đã tìm thấy tọa độ cho ${item.spaceAddress}:`, currentLat, currentLng);
                } else {
                  console.warn(`Không tìm thấy tọa độ cho: ${item.spaceAddress}`);
                }

                // Chờ 500ms trước khi gọi request tiếp theo để không bị block IP
                await new Promise(resolve => setTimeout(resolve, 500));
              } catch (err) {
                console.error("Lỗi Geocoding:", err);
              }
            }

            // Push vào mảng list chuẩn bị render
            processedListings.push({
              ...item,
              // Gán vào lat/lng để MapGL xài. Nếu vẫn ko tìm ra thì cho fallback về trung tâm Q1
              lat: currentLat || 10.7769, 
              lng: currentLng || 106.7000,
            });
          }
          
          setListings(processedListings);
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