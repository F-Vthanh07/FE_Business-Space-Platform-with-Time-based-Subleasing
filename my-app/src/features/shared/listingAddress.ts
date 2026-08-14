/* eslint-disable @typescript-eslint/no-explicit-any */
// Listing API không trả sẵn địa chỉ — phải ghép từ Space cha (spaceId) để hiển thị đúng.
export const fetchSpacesById = async (token: string | null): Promise<Record<number, any>> => {
  try {
    const res = await fetch('https://flexi-space-capstone-project.onrender.com/api/Space/GetAll', {
      headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
    });
    if (!res.ok) return {};
    const data = await res.json();
    const spaces = Array.isArray(data) ? data : (data?.data || data?.items || []);
    const map: Record<number, any> = {};
    spaces.forEach((s: any) => {
      const spaceId = s.id ?? s.Id;
      if (spaceId != null) map[spaceId] = s;
    });
    return map;
  } catch {
    return {};
  }
};

export const getListingAddress = (listing: any, spacesById: Record<number, any>): string => {
  if (!listing) return '';
  const parentSpace = spacesById[listing.spaceId ?? listing.SpaceId];
  return listing.location || listing.address || parentSpace?.address || parentSpace?.location || '';
};
