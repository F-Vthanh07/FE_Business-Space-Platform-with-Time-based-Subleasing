// ĐỔI SANG EMAIL LIÊN HỆ THẬT CỦA BẠN — Nominatim dùng cái này để định danh app,
// không dùng được header User-Agent tự set (trình duyệt chặn header đó).
const NOMINATIM_CONTACT_EMAIL = 'contact@yourdomain.com';

// Gọi Nominatim (OpenStreetMap) 1 lần, trả về {lat,lng} hoặc null.
// Đây là dịch vụ bên thứ 3 (không phải backend của app) nên tách riêng khỏi api/.
export const tryGeocode = async (query: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=1&countrycodes=vn&email=${encodeURIComponent(NOMINATIM_CONTACT_EMAIL)}`;
    const geoRes = await fetch(url, {
      headers: { 'Accept-Language': 'vi' },
      // Lưu ý: KHÔNG set 'User-Agent' ở đây — trình duyệt luôn chặn/ghi đè header này.
    });

    if (!geoRes.ok) {
      console.error(`[Geocode] HTTP ${geoRes.status} cho query: "${query}"`);
      return null;
    }

    const geoData = await geoRes.json();
    if (Array.isArray(geoData) && geoData.length > 0) {
      return { lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon) };
    }
    console.warn(`[Geocode] Không có kết quả cho query: "${query}"`);
    return null;
  } catch (err) {
    console.error(`[Geocode] Fetch lỗi cho query: "${query}"`, err);
    return null;
  }
};
