type PictureObject = Record<string, unknown>;

const URL_KEYS = [
  'imageUrl',
  'url',
  'pictureUrl',
  'fileUrl',
  'secureUrl',
  'publicUrl',
  'src',
  'link',
  'path'
];

const NESTED_KEYS = ['picture', 'image', 'file', 'media'];

export const getListingPictureUrl = (picture: unknown): string | null => {
  if (!picture) return null;
  if (typeof picture === 'string') return picture;
  if (typeof picture !== 'object') return null;

  const obj = picture as PictureObject;

  for (const key of URL_KEYS) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value;
  }

  for (const key of NESTED_KEYS) {
    const nestedUrl = getListingPictureUrl(obj[key]);
    if (nestedUrl) return nestedUrl;
  }

  return null;
};

export const getListingPictureUrls = (pictures: unknown): string[] => {
  if (!Array.isArray(pictures)) return [];
  return pictures
    .map(getListingPictureUrl)
    .filter((url): url is string => !!url);
};
