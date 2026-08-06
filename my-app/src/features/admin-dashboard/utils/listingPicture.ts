// BE đôi khi trả listingPictures là mảng string, đôi khi là mảng object { imageUrl } / { url }
export const getPictureUrl = (pic: unknown): string | null => {
  if (!pic) return null;
  if (typeof pic === 'string') return pic !== 'string' ? pic : null;
  if (typeof pic === 'object') {
    const obj = pic as { imageUrl?: string; url?: string };
    return obj.imageUrl || obj.url || null;
  }
  return null;
};
