/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, FileText, Camera, Plus, Trash2, Calendar, ShieldAlert, Users, ShieldCheck, Clock, Megaphone, Wallet, CheckSquare, Briefcase } from 'lucide-react';
import { VerificationWarningBanner, useIdentityVerification } from '../../../identity-verification';
import { Select } from '../../../../components/Select';
import { DatePicker } from '../../../../components/DatePicker';
import "../../../shared/ModalShell.css";
import './ListingForm.css';
import { createShareListing, updateShareListing } from './shareListing.api';
import { createUserBanner, uploadUserBannerPictures } from './banner.api';
import { fetchBannerPriorityLevels, fetchPriorityLevels, type PriorityLevel } from './priorityLevel.api';
import { fetchWalletAccount } from '../../../wallet/api/wallet.api';
import type { ShareListingPayload } from '../../types';
import { formatDateISOOnly } from '../../../../utils/dateUtils';
import { API_BASE_URL } from '../../../../config/api';

interface ListingFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  mode?: 'create' | 'edit' | 'renew';
}

type ListingMode = 'longterm' | 'share';
const BANNER_CROP_WIDTH = 2100;
const BANNER_CROP_HEIGHT = 700;

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_LABEL_VI: Record<string, string> = {
  Monday: 'T2', Tuesday: 'T3', Wednesday: 'T4', Thursday: 'T5',
  Friday: 'T6', Saturday: 'T7', Sunday: 'CN'
};

const getValidDaysOfWeek = (validFrom?: string, validTo?: string) => {
  if (!validFrom || !validTo) return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const parseDate = (dStr: string) => {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0);
    }
    return new Date(dStr);
  };

  const start = parseDate(validFrom);
  const end = parseDate(validTo);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return [];

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= 6) {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  }

  const validDays = [];
  const current = new Date(start.getTime());
  const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  for (let i = 0; i <= diffDays; i++) {
    validDays.push(daysMap[current.getDay()]);
    current.setDate(current.getDate() + 1);
  }
  return [...new Set(validDays)];
};

const getSafeDateOnly = formatDateISOOnly;

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = document.createElement('img');
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

const cropBannerFile = async (file: File, previewUrl: string, position: { x: number; y: number }) => {
  const img = await loadImage(previewUrl);
  const canvas = document.createElement('canvas');
  canvas.width = BANNER_CROP_WIDTH;
  canvas.height = BANNER_CROP_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  const scale = Math.max(BANNER_CROP_WIDTH / img.naturalWidth, BANNER_CROP_HEIGHT / img.naturalHeight);
  const cropWidth = BANNER_CROP_WIDTH / scale;
  const cropHeight = BANNER_CROP_HEIGHT / scale;
  const sourceX = (img.naturalWidth - cropWidth) * (position.x / 100);
  const sourceY = (img.naturalHeight - cropHeight) * (position.y / 100);

  ctx.drawImage(img, sourceX, sourceY, cropWidth, cropHeight, 0, 0, BANNER_CROP_WIDTH, BANNER_CROP_HEIGHT);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, file.type || 'image/jpeg', 0.92));
  if (!blob) return file;
  return new File([blob], file.name, { type: blob.type || file.type, lastModified: Date.now() });
};

export const ListingForm: React.FC<ListingFormProps> = ({ onClose, onSuccess, initialData, mode: formMode = initialData ? 'edit' : 'create' }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [mySpaces, setMySpaces] = useState<any[]>([]);
  const [error, setError] = useState('');
  const { isVerified } = useIdentityVerification();

  const isRenewMode = formMode === 'renew';
  const isEditingListing = !!initialData && !isRenewMode;
  const lockRenewFields = isRenewMode;
  const [priorityLevels, setPriorityLevels] = useState<PriorityLevel[]>([]);
  const [bannerPriorityLevels, setBannerPriorityLevels] = useState<PriorityLevel[]>([]);
  const [priorityLevelId, setPriorityLevelId] = useState<number | ''>('');
  const [bannerPriorityLevelId, setBannerPriorityLevelId] = useState<number | ''>('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [createBannerWithListing, setCreateBannerWithListing] = useState(false);
  const [bannerSlotsInfo, setBannerSlotsInfo] = useState<{
    maxSlots: number;
    usedSlots: number;
    remainingSlots: number;
    isAvailable: boolean;
  } | null>(null);
  const [bannerTitle, setBannerTitle] = useState(initialData?.name || '');
  const [bannerDescription, setBannerDescription] = useState(initialData?.description || '');
  const [bannerFiles, setBannerFiles] = useState<File[]>([]);
  const [bannerPreviewUrls, setBannerPreviewUrls] = useState<string[]>([]);
  const [bannerImagePosition, setBannerImagePosition] = useState({ x: 50, y: 50 });
  const [isDraggingBannerImage, setIsDraggingBannerImage] = useState(false);
  const bannerImageDragRef = useRef(false);

  // Đã sửa: Dựa vào listingType thật từ API để quyết định form
  const initialMode: ListingMode = initialData?.listingType === 'SharedSpace' ? 'share' : 'longterm';
  const [mode, setMode] = useState<ListingMode>(initialMode);

  const [spaceId, setSpaceId] = useState<number | ''>(initialData?.spaceId ? Number(initialData.spaceId) : '');
  const [price, setPrice] = useState<number>(initialData?.price || 0);
  const [priceUnit, setPriceUnit] = useState<string>(initialData?.priceUnit || 'PerHour');
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');

  useEffect(() => {
    if (initialData?.spaceId) {
      setSpaceId(Number(initialData.spaceId));
    }
  }, [initialData?.spaceId]);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>(initialData?.listingPictures || []);

  const [allowedStartTime, setAllowedStartTime] = useState(() => getSafeDateOnly(initialData?.allowedStartTime));
  const [allowedEndTime, setAllowedEndTime] = useState(() => {
    if (initialData?.allowedEndTime) return getSafeDateOnly(initialData.allowedEndTime);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return getSafeDateOnly(nextMonth);
  });

  const [maxSubRenter, setMaxSubRenter] = useState<number>(initialData?.shareSpaceDetailMaxSubRenter || 1);
  const [isLegalCommitted, setIsLegalCommitted] = useState<boolean>(initialData?.shareSpaceDetailIsLegalCommitted ?? false);
  const [availabilities, setAvailabilities] = useState<any[]>(
    initialData?.shareSpaceDetailAvailabilitiesTimes?.length
      ? initialData.shareSpaceDetailAvailabilitiesTimes.map((slot: any) => ({
        ...slot,
        specificdate: (slot.specificdate && String(slot.specificdate).startsWith('0001')) ? '' : slot.specificdate
      }))
      : [{ daysOfWeek: [], specificdate: '', startTime: '08:00', endTime: '12:00', validFrom: getSafeDateOnly(null), validTo: getSafeDateOnly(null) }]
  );

  const [timePolicy, setTimePolicy] = useState<any>(null);

  const selectedListingPackage = priorityLevels.find(p => p.id === priorityLevelId);
  const selectedBannerPackage = bannerPriorityLevels.find(p => p.id === bannerPriorityLevelId);
  const isBannerAvailable = bannerSlotsInfo ? bannerSlotsInfo.isAvailable : bannerPriorityLevels.length > 0;
  const listingPackagePrice = selectedListingPackage?.price ?? 0;
  const bannerPackagePrice = (createBannerWithListing && isBannerAvailable) ? (selectedBannerPackage?.price ?? 0) : 0;
  const totalPublishPrice = listingPackagePrice + bannerPackagePrice;

  useEffect(() => {
    if (!spaceId) {
      setTimePolicy(null);
      return;
    }
    const fetchTimePolicy = async () => {
      try {
        const token = localStorage.getItem('portal_token') || '';
        const res = await fetch(`${API_BASE_URL}/api/Listing/ShareListing/TimePolicy/${spaceId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTimePolicy(data);
          if (data && data.allowedStartTime) {
            setAllowedStartTime(getSafeDateOnly(data.allowedStartTime));
          }
          if (data && data.allowedEndTime) {
            setAllowedEndTime(getSafeDateOnly(data.allowedEndTime));
          }
        } else {
          setTimePolicy(null);
        }
      } catch (err) {
        setTimePolicy(null);
      }
    };
    fetchTimePolicy();
  }, [spaceId]);

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const token = localStorage.getItem('portal_token');
        const ownerId = localStorage.getItem('current_user_id') || '01KVJGBEXR0X7A2PN520FJTVZT';
        const url = `${API_BASE_URL}/api/Space/GetAll?OwnerId=${encodeURIComponent(ownerId)}`;

        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
        });

        if (res.ok) {
          const data = await res.json();
          const spaces = Array.isArray(data) ? data : (data?.data || []);

          const partsPromises = spaces.map(async (space: any) => {
            try {
              const partRes = await fetch(`${API_BASE_URL}/api/SpacePart/GetByParent/${space.id || space.Id}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
              });
              if (partRes.ok) {
                const partData = await partRes.json();
                const parts = Array.isArray(partData) ? partData : (partData?.items || []);
                return parts.map((p: any) => ({ ...p, isPart: true, parentName: space.name, isFromUsageRight: false }));
              }
            } catch (err) {
              console.error("Lỗi lấy space part", err);
            }
            return [];
          });

          const allPartsArrays = await Promise.all(partsPromises);
          const allSpacesAndParts: any[] = [];
          for (let i = 0; i < spaces.length; i++) {
            allSpacesAndParts.push({ ...spaces[i], isPart: false, isFromUsageRight: false });
            allSpacesAndParts.push(...allPartsArrays[i]);
          }
          const usageRes = await fetch(`${API_BASE_URL}/api/SpaceUsageRight/Mine`, {
            headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
          });
          if (usageRes.ok) {
            const usageData = await usageRes.json();
            const rights = Array.isArray(usageData) ? usageData : usageData?.data || [];
            const shareableRights = rights.filter((r: any) => r.canShare === true);
            const spacePromises = shareableRights.map((r: any) =>
              fetch(`${API_BASE_URL}/api/Space/GetById/${r.spaceId}`, {
                headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
              }).then(r => r.ok ? r.json() : null)
            );
            const resolvedSpaces = await Promise.all(spacePromises);
            const validUsageSpaces = resolvedSpaces.filter(Boolean);
            for (const space of validUsageSpaces) {
              if (!allSpacesAndParts.some(s => (s.id || s.Id) === (space.id || space.Id))) {
                allSpacesAndParts.push({ ...space, isPart: false, isFromUsageRight: true });
              }
            }
          }

          setMySpaces(allSpacesAndParts);
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách mặt bằng:", err);
      }
    };
    fetchSpaces();
  }, []);

  useEffect(() => {
    if (isEditingListing) return;
    const loadPriorityLevels = async () => {
      try {
        const [levels, bannerLevels, bannerRes] = await Promise.all([
          fetchPriorityLevels(),
          fetchBannerPriorityLevels(),
          fetch(`${API_BASE_URL}/api/Banner/GetAll`, { headers: { accept: '*/*' } }).then(r => r.ok ? r.json() : null)
        ]);
        setPriorityLevels(levels);
        setBannerPriorityLevels(bannerLevels);
        if (levels.length > 0) setPriorityLevelId(levels[0].id);
        if (bannerLevels.length > 0) setBannerPriorityLevelId(bannerLevels[0].id);

        const maxSlots = bannerLevels.length > 0 ? (bannerLevels[0].durationForBanner ?? 0) : 0;
        const allBanners = Array.isArray(bannerRes) ? bannerRes : (bannerRes?.data || bannerRes?.items || bannerRes?.result || []);
        const userBannersCount = allBanners.filter((b: any) => !b.isDeleted && b.createdBy !== 'Admin' && b.CreatedBy !== 'Admin').length;
        const remaining = Math.max(0, maxSlots - userBannersCount);
        const available = maxSlots > 0 && remaining > 0;

        setBannerSlotsInfo({
          maxSlots,
          usedSlots: userBannersCount,
          remainingSlots: remaining,
          isAvailable: available
        });

        if (!available) {
          setCreateBannerWithListing(false);
        }
      } catch (err) {
        console.error("Lỗi kiểm tra cấu hình banner:", err);
      }
    };
    loadPriorityLevels();

    const loadWalletBalance = async () => {
      try {
        const token = localStorage.getItem('portal_token') || '';
        const wallet = await fetchWalletAccount(token);
        setWalletBalance(wallet?.balance ?? 0);
      } catch (err) {
        console.error("Lỗi lấy số dư ví:", err);
        setWalletBalance(0);
      }
    };
    loadWalletBalance();
  }, [isEditingListing]);

  const DEFAULT_SHARE_AMENITIES = [
    'Wifi tốc độ cao',
    'Điều hòa / Máy lạnh',
    'Bàn ghế làm việc',
    'Máy in / Photocopy',
    'Chỗ đỗ xe máy / Ô tô',
    'Phòng họp chung',
    'Máy chiếu / TV màn hình lớn',
    'Trà & Cà phê miễn phí',
    'Lễ tân / Nhận bưu phẩm',
    'Tủ locker cá nhân'
  ];

  const DEFAULT_SHARE_CATEGORIES = [
    'Văn phòng / Co-working',
    'Bán lẻ / Cửa hàng',
    'Showroom / Trưng bày sản phẩm',
    'Kho chứa hàng / Logistics nhỏ',
    'Lớp học / Đào tạo / Hội thảo',
    'Studio / Quay phim / Chụp ảnh',
    'Spa / Làm đẹp / Massage',
    'F&B / Quán cà phê'
  ];

  const [amenityItems, setAmenityItems] = useState<{ name: string; quantity: number; isIncluded: boolean; price: number; selected: boolean }[]>(() => {
    const initFromExisting = initialData?.shareSpaceDetailShareSpaceAmenities;
    if (Array.isArray(initFromExisting) && initFromExisting.length > 0) {
      const existingNames = new Set(initFromExisting.map((a: any) => (a.name || '').toLowerCase()));
      const mappedExisting = initFromExisting.map((a: any) => ({
        name: a.name || '',
        quantity: a.quantity || 1,
        isIncluded: a.isIncluded ?? true,
        price: a.price || 0,
        selected: true
      }));
      const remainingDefaults = DEFAULT_SHARE_AMENITIES
        .filter(name => !existingNames.has(name.toLowerCase()))
        .map(name => ({ name, quantity: 1, isIncluded: true, price: 0, selected: false }));
      return [...mappedExisting, ...remainingDefaults];
    }
    return DEFAULT_SHARE_AMENITIES.map(name => ({
      name,
      quantity: 1,
      isIncluded: true,
      price: 0,
      selected: false
    }));
  });

  const [newAmenityName, setNewAmenityName] = useState('');

  const handleAddCustomAmenity = () => {
    if (!newAmenityName.trim()) return;
    setAmenityItems(prev => [
      ...prev,
      { name: newAmenityName.trim(), quantity: 1, isIncluded: true, price: 0, selected: true }
    ]);
    setNewAmenityName('');
  };

  const [categoryItems, setCategoryItems] = useState<{ name: string; note: string; selected: boolean }[]>(() => {
    const initFromExisting = initialData?.shareSpaceDetailShareSpaceCategories;
    if (Array.isArray(initFromExisting) && initFromExisting.length > 0) {
      const existingNames = new Set(initFromExisting.map((c: any) => (c.name || '').toLowerCase()));
      const mappedExisting = initFromExisting.map((c: any) => ({
        name: c.name || '',
        note: c.note || '',
        selected: true
      }));
      const remainingDefaults = DEFAULT_SHARE_CATEGORIES
        .filter(name => !existingNames.has(name.toLowerCase()))
        .map(name => ({ name, note: '', selected: false }));
      return [...mappedExisting, ...remainingDefaults];
    }
    return DEFAULT_SHARE_CATEGORIES.map(name => ({
      name,
      note: '',
      selected: false
    }));
  });

  const [showCustomAmenityInput, setShowCustomAmenityInput] = useState(false);
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddCustomCategory = () => {
    if (!newCategoryName.trim()) return;
    setCategoryItems(prev => [
      ...prev,
      { name: newCategoryName.trim(), note: '', selected: true }
    ]);
    setNewCategoryName('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    setSelectedFiles(prev => [...prev, ...filesArray]);

    const newUrls = filesArray.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newUrls]);

    e.target.value = '';
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== indexToRemove));
    setPreviewUrls(prev => {
      const newUrls = [...prev];
      URL.revokeObjectURL(newUrls[indexToRemove]);
      newUrls.splice(indexToRemove, 1);
      return newUrls;
    });
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setBannerFiles(files);
    setBannerImagePosition({ x: 50, y: 50 });
    setBannerPreviewUrls(prev => {
      prev.forEach(url => URL.revokeObjectURL(url));
      return files.map(file => URL.createObjectURL(file));
    });
    e.target.value = '';
  };

  const handleRemoveBannerFile = (indexToRemove: number) => {
    setBannerFiles(prev => prev.filter((_, i) => i !== indexToRemove));
    setBannerPreviewUrls(prev => {
      const next = [...prev];
      URL.revokeObjectURL(next[indexToRemove]);
      next.splice(indexToRemove, 1);
      return next;
    });
  };

  const handleBannerPreviewPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!bannerPreviewUrls[0]) return;
    bannerImageDragRef.current = true;
    setIsDraggingBannerImage(true);
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleBannerPreviewPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!bannerImageDragRef.current || !bannerPreviewUrls[0]) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setBannerImagePosition({
      x: clampPercent(((e.clientX - rect.left) / rect.width) * 100),
      y: clampPercent(((e.clientY - rect.top) / rect.height) * 100),
    });
  };

  const handleBannerPreviewPointerEnd = () => {
    bannerImageDragRef.current = false;
    setIsDraggingBannerImage(false);
  };

  const handleRemoveExistingImage = async (index: number) => {
    const imgToRemove = existingImages[index];
    const publicId = imgToRemove?.publicId || imgToRemove?.id;

    if (publicId) {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('portal_token');
        const res = await fetch(`https://flexi-space-capstone-project.onrender.com/api/Picture/${publicId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': '*/*'
          }
        });

        if (res.ok) {
          setExistingImages(prev => prev.filter((_, i) => i !== index));
        } else {
          setError('Không thể xóa ảnh này trên hệ thống!');
        }
      } catch (err) {
        setError('Lỗi khi xóa ảnh');
      } finally {
        setIsLoading(false);
      }
    } else if (typeof imgToRemove === 'string') {
      setExistingImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const toggleDayInSlot = (slotIndex: number, day: string) => {
    setAvailabilities(prev => prev.map((slot, i) => {
      if (i !== slotIndex) return slot;
      const days = slot.daysOfWeek.includes(day)
        ? slot.daysOfWeek.filter((d: string) => d !== day)
        : [...slot.daysOfWeek, day];
      return { ...slot, daysOfWeek: days };
    }));
  };

  const updateSlotField = (slotIndex: number, field: string, value: string) => {
    setAvailabilities(prev => prev.map((slot, i) => {
      if (i !== slotIndex) return slot;
      const newSlot = { ...slot, [field]: value };
      if (field === 'validFrom' || field === 'validTo') {
        const validDays = getValidDaysOfWeek(newSlot.validFrom, newSlot.validTo);
        newSlot.daysOfWeek = newSlot.daysOfWeek.filter((d: string) => validDays.includes(d));
      }
      return newSlot;
    }));
  };

  const addSlot = () => {
    setAvailabilities(prev => [...prev, {
      daysOfWeek: [], specificdate: '', startTime: '08:00', endTime: '12:00',
      validFrom: getSafeDateOnly(null), validTo: getSafeDateOnly(null)
    }]);
  };

  const removeSlot = (slotIndex: number) => {
    setAvailabilities(prev => prev.filter((_, i) => i !== slotIndex));
  };

  const maybeCreateBannerForListing = async (listingId: any) => {
    if (isEditingListing || !createBannerWithListing) return;

    const numericListingId = Number(listingId);
    if (!numericListingId) {
      throw new Error('Không đọc được id bài đăng để gắn vào banner');
    }

    const createdBanner = await createUserBanner(
      {
        title: bannerTitle.trim(),
        description: bannerDescription.trim(),
        listingId: numericListingId
      },
      selectedBannerPackage?.durationInDays ?? 0,
      selectedBannerPackage?.price ?? 0
    );

    const bannerId = Number(
      createdBanner?.id ??
      createdBanner?.bannerId ??
      createdBanner?.data?.id ??
      createdBanner?.data?.bannerId ??
      createdBanner
    );

    if (bannerFiles.length > 0 && bannerId) {
      const uploadFiles = bannerPreviewUrls[0]
        ? [await cropBannerFile(bannerFiles[0], bannerPreviewUrls[0], bannerImagePosition), ...bannerFiles.slice(1)]
        : bannerFiles;
      await uploadUserBannerPictures(bannerId, uploadFiles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (spaceId === '') {
      setError('Vui lòng chọn mặt bằng!');
      return;
    }

    if (!name.trim()) {
      setError('Vui lòng nhập tên bài đăng!');
      return;
    }

    if (!description.trim()) {
      setError('Vui lòng nhập mô tả!');
      return;
    }

    if (!price || price <= 0) {
      setError('Đơn giá phải lớn hơn 0!');
      return;
    }

    if (!isEditingListing && priorityLevelId === '') {
      setError('Vui lòng chọn gói bài đăng!');
      return;
    }

    if (!isEditingListing && createBannerWithListing && bannerPriorityLevelId === '') {
      setError('Vui lòng chọn gói banner!');
      return;
    }

    if (!isEditingListing && createBannerWithListing && !bannerTitle.trim()) {
      setError('Vui lòng nhập tiêu đề banner!');
      return;
    }

    if (!isEditingListing && createBannerWithListing && !bannerDescription.trim()) {
      setError('Vui lòng nhập mô tả banner!');
      return;
    }

    if (!isEditingListing) {
      const chosenPackagePrice = totalPublishPrice;
      if (walletBalance !== null && walletBalance < totalPublishPrice) {
        setError(`Số dư ví không đủ để đăng tin! Cần ${chosenPackagePrice.toLocaleString('vi-VN')} VNĐ, ví hiện có ${walletBalance.toLocaleString('vi-VN')} VNĐ.`);
        return;
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startCheck = new Date(allowedStartTime);
    startCheck.setHours(0, 0, 0, 0);

    if (mode === 'longterm' && !isEditingListing && startCheck < today) {
      setError('Thời gian bắt đầu không được ở quá khứ!');
      return;
    }

    if (new Date(allowedEndTime) <= new Date(allowedStartTime)) {
      setError('Thời gian kết thúc phải sau thời gian bắt đầu!');
      return;
    }

    const startD = new Date(allowedStartTime);
    const endD = new Date(allowedEndTime);
    const durationDays = Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 3600 * 24));

    if (priceUnit === 'PerWeek' && durationDays < 7) {
      setError('Để chọn đơn vị "/ Tuần", khoảng thời gian hiệu lực phải ít nhất 7 ngày.');
      return;
    }
    if (priceUnit === 'PerMonth' && durationDays < 30) {
      setError('Để chọn đơn vị "/ Tháng", khoảng thời gian hiệu lực phải ít nhất 30 ngày.');
      return;
    }
    if (priceUnit === 'PerYear' && durationDays < 365) {
      setError('Để chọn đơn vị "/ Năm", khoảng thời gian hiệu lực phải ít nhất 365 ngày.');
      return;
    }

    if (mode === 'share' && !isRenewMode && (!maxSubRenter || maxSubRenter < 1)) {
      setError('Số người thuê chung tối đa phải từ 1 trở lên!');
      return;
    }

    if (mode === 'share' && !isRenewMode && availabilities.some(slot => slot.daysOfWeek.length === 0 && !slot.specificdate)) {
      setError('Vui lòng chọn ít nhất 1 ngày hoặc ngày cụ thể cho mỗi khung giờ chia sẻ!');
      return;
    }

    if (mode === 'share' && !isRenewMode) {
      const allowedEnd = new Date(allowedEndTime);
      const allowedStart = new Date(allowedStartTime);
      allowedEnd.setHours(23, 59, 59, 999);
      allowedStart.setHours(0, 0, 0, 0);

      const badSlot = availabilities.find(slot => {
        if (!slot.validFrom || !slot.validTo) return false;
        const vFrom = new Date(slot.validFrom);
        const vTo = new Date(slot.validTo);
        vFrom.setHours(0, 0, 0, 0);
        vTo.setHours(23, 59, 59, 999);
        return vTo > allowedEnd || vFrom < allowedStart || vFrom > vTo;
      });
      if (badSlot) {
        setError(
          `Khung giờ chia sẻ (Áp dụng từ / đến) phải hợp lệ và nằm trong khoảng thời gian hiệu lực bài đăng!`
        );
        return;
      }

      const badSpecific = availabilities.find(slot => {
        if (slot.specificdate && slot.specificdate.trim() !== '' && !slot.specificdate.startsWith('0001')) {
          const s = new Date(slot.specificdate);
          if (!isNaN(s.getTime())) {
            s.setHours(0, 0, 0, 0);
            return s < allowedStart || s > allowedEnd;
          }
        }
        return false;
      });
      if (badSpecific) {
        setError('Ngày cụ thể của khung giờ chia sẻ phải nằm trong khoảng thời gian hiệu lực bài đăng!');
        return;
      }

      const badTimeSlot = availabilities.find(slot => slot.startTime >= slot.endTime);
      if (badTimeSlot) {
        setError('Giờ kết thúc khung giờ chia sẻ phải sau giờ bắt đầu!');
        return;
      }
    }

    if (mode === 'share' && !isRenewMode && !isLegalCommitted) {
      setError('Vui lòng tích "Cam kết pháp lý" để xác nhận thỏa thuận trước khi đăng chia sẻ!');
      return;
    }

    setIsLoading(true);

    const selectedPriorityLevel = priorityLevels.find(p => p.id === priorityLevelId);
    const amount = selectedPriorityLevel?.price ?? 0;
    const durationInDays = selectedPriorityLevel?.durationInDays ?? 0;

    if (isRenewMode) {
      const token = localStorage.getItem('portal_token');
      const targetId = initialData?.id || initialData?.Id;
      if (!targetId || !token) {
        setError('Không tìm thấy bài đăng cần gia hạn hoặc phiên đăng nhập đã hết hạn.');
        setIsLoading(false);
        return;
      }

      const renewPayload = {
        ...initialData,
        id: targetId,
        spaceId: Number(spaceId),
        allowedStartTime,
        allowedEndTime,
        name,
        description,
        price: Number(price),
        priceUnit,
        listingPictures: initialData?.listingPictures || [],
        ...(mode === 'share' ? {
          shareSpaceDetailMaxSubRenter: Number(maxSubRenter),
          shareSpaceDetailIsOwner: !(mySpaces.find(s => (s.id || s.Id) === Number(spaceId))?.isFromUsageRight),
          shareSpaceDetailIsLegalCommitted: isLegalCommitted,
          shareSpaceDetailShareSpaceAmenities: amenityItems
            .filter(a => a.selected && a.name.trim())
            .map(a => ({
              name: a.name.trim(),
              quantity: Number(a.quantity) || 1,
              isIncluded: a.isIncluded,
              price: a.isIncluded ? 0 : (Number(a.price) || 0)
            })),
          shareSpaceDetailAvailabilitiesTimes: availabilities.map(slot => ({
            ...slot,
            specificdate: (slot.specificdate && !String(slot.specificdate).startsWith('0001')) ? slot.specificdate : undefined
          })),
          shareSpaceDetailShareSpaceCategories: categoryItems
            .filter(c => c.selected && c.name.trim())
            .map(c => ({
              name: c.name.trim(),
              note: c.note ? c.note.trim() : ''
            }))
        } : {})
      };

      try {
        const params = new URLSearchParams({
          amount: String(amount),
          durationInDays: String(durationInDays)
        });
        const res = await fetch(`${API_BASE_URL}/api/Listing/Renew/${targetId}?${params.toString()}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'accept': '*/*'
          },
          body: JSON.stringify(renewPayload)
        });

        if (!res.ok) {
          const errText = await res.text();
          setError(errText || 'Gia han bai dang that bai.');
          setIsLoading(false);
          return;
        }

        await maybeCreateBannerForListing(targetId);
        onSuccess();
      } catch (err) {
        console.error(err);
        setError('Lỗi kết nối máy chủ khi gia hạn bài đăng.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // ===== NHÁNH 1: CHIA SẺ MẶT BẰNG =====
    if (mode === 'share') {
      const sharePayload: ShareListingPayload = {
        spaceId: Number(spaceId),
        allowedStartTime,
        allowedEndTime,
        name,
        description,
        price: Number(price),
        priceUnit,
        shareSpaceDetailMaxSubRenter: Number(maxSubRenter),
        shareSpaceDetailIsOwner: !(mySpaces.find(s => (s.id || s.Id) === Number(spaceId))?.isFromUsageRight),
        shareSpaceDetailIsLegalCommitted: isLegalCommitted,
        shareSpaceDetailShareSpaceAmenities: amenityItems
          .filter(a => a.selected && a.name.trim())
          .map(a => ({
            name: a.name.trim(),
            quantity: Number(a.quantity) || 1,
            isIncluded: a.isIncluded,
            price: a.isIncluded ? 0 : (Number(a.price) || 0)
          })),
          shareSpaceDetailAvailabilitiesTimes: availabilities.map(slot => {
            const hasDays = Array.isArray(slot.daysOfWeek) && slot.daysOfWeek.length > 0;
            const hasSpecificDate = slot.specificdate && !String(slot.specificdate).startsWith('0001') && slot.specificdate.trim() !== '';

            if (hasSpecificDate) {
              return {
                daysOfWeek: null,
                specificdate: slot.specificdate,
                startTime: slot.startTime,
                endTime: slot.endTime,
                validFrom: null,
                validTo: null
              };
            } else {
              return {
                daysOfWeek: hasDays ? slot.daysOfWeek : null,
                specificdate: null,
                startTime: slot.startTime,
                endTime: slot.endTime,
                validFrom: slot.validFrom || null,
                validTo: slot.validTo || null
              };
            }
          }),
        shareSpaceDetailShareSpaceCategories: categoryItems
          .filter(c => c.selected && c.name.trim())
          .map(c => ({
            name: c.name.trim(),
            note: c.note ? c.note.trim() : ''
          }))
      };

      try {
        const token = localStorage.getItem('portal_token');
        const targetId = initialData?.id || initialData?.Id;
        let createdShareListingId: any = targetId;

        if (initialData) {
          await updateShareListing(initialData.id || initialData.Id, sharePayload);
        } else {
          const created = await createShareListing(sharePayload, amount, durationInDays);
          createdShareListingId = created?.id ?? created?.Id ?? created;
        }

        if (selectedFiles.length > 0 && createdShareListingId) {
          const formData = new FormData();
          selectedFiles.forEach(file => formData.append('file', file));
          formData.append('listingId', createdShareListingId.toString());

          const picRes = await fetch('https://flexi-space-capstone-project.onrender.com/api/Picture', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' },
            body: formData
          });

          if (!picRes.ok) {
            console.error("LỖI UP ẢNH:", await picRes.text());
            setError('Bài đăng chia sẻ tạo thành công nhưng đẩy ảnh thất bại (Check API Picture)!');
            setIsLoading(false);
            return;
          }
        }

        await maybeCreateBannerForListing(createdShareListingId);
        onSuccess();
      } catch (err: any) {
        // Bắt text lỗi chuẩn xác
        let errorMsg = err.message || 'Lỗi xử lý hệ thống';
        try {
          const parsed = JSON.parse(errorMsg);
          errorMsg = parsed.message || parsed.title || parsed.detail || errorMsg;
        } catch (e) { /* empty */ }
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // ===== NHÁNH 2: CHO THUÊ DÀI HẠN =====
    const token = localStorage.getItem('portal_token');
    const ownerId = localStorage.getItem('current_user_id');

    if (!ownerId || !token) {
      setError("Phiên đăng nhập đã hết hạn hoặc không tìm thấy ID. Vui lòng đăng nhập lại!");
      setIsLoading(false);
      return;
    }

    try {
      const isEditing = !!initialData;
      const targetId = initialData?.id || initialData?.Id;
      const url = isEditing
        ? `https://flexi-space-capstone-project.onrender.com/api/Listing/Update/${targetId}`
        : `https://flexi-space-capstone-project.onrender.com/api/Listing/Create?amount=${amount}&durationInDays=${durationInDays}`;

      const listingPayload = {
        spaceId: Number(spaceId),
        allowedStartTime,
        allowedEndTime,
        name,
        description: description,
        price: Number(price),
        priceUnit,
        listingPictures: []
      };

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': '*/*'
        },
        body: JSON.stringify(isEditing ? { ...listingPayload, id: targetId } : listingPayload)
      });

      if (!res.ok) {
        // Xử lý đọc lỗi API (Text hoặc JSON)
        const errText = await res.text();
        let parsedMsg = errText;
        try {
          const errObj = JSON.parse(errText);
          if (errObj.errors && typeof errObj.errors === 'object') {
            const fieldMessages = Object.values(errObj.errors).flat().filter(Boolean) as string[];
            if (fieldMessages.length > 0) {
              parsedMsg = fieldMessages.join('\n');
            } else {
              parsedMsg = errObj.message || errObj.title || errObj.detail || errText;
            }
          } else {
            parsedMsg = errObj.message || errObj.title || errObj.detail || errText;
          }
        } catch (e) { /* empty */ }
        setError(parsedMsg || 'Lỗi xử lý hệ thống');
        setIsLoading(false);
        return;
      }

      const textRes = await res.text();
      let createdListingId = targetId;

      if (!isEditing && textRes) {
        try {
          const resData = JSON.parse(textRes);
          createdListingId = resData.id || resData.data?.id || resData;
        } catch {
          createdListingId = textRes;
        }
      }

      if (selectedFiles.length > 0 && createdListingId) {
        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append('file', file);
        });
        formData.append('listingId', createdListingId.toString());

        const picRes = await fetch('https://flexi-space-capstone-project.onrender.com/api/Picture', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': '*/*'
          },
          body: formData
        });

        if (!picRes.ok) {
          console.error("LỖI UP ẢNH:", await picRes.text());
          setError('Bài đăng tạo thành công nhưng đẩy ảnh thất bại (Check API Picture)!');
        }
      }

      await maybeCreateBannerForListing(createdListingId);
      onSuccess();
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    // Đã xóa style background trắng bóc đi
    <div className="modal-backdrop">
      <div className="modal-shell modal-shell--wide">

        <div className="modal-header">
          <div className="modal-title-area">
            <div className="modal-icon-wrap modal-icon-wrap--green">
              {mode === 'share' ? <Users size={16} /> : <FileText size={16} />}
            </div>
            <div>
              <h2 className="modal-title">
                {initialData ? 'Cập nhật bài đăng' : 'Tạo bài đăng cho thuê'}
              </h2>
              <p className="modal-subtitle text-secondary">Thông tin bài đăng hiển thị công khai trên chợ thuê</p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} disabled={isLoading}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {!isVerified && <VerificationWarningBanner />}

          {/* AI Image Editor Promo Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%' }}></div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', zIndex: 1 }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                boxShadow: '0 4px 10px rgba(168,85,247,0.3)'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" /><path d="m14 7 3 3" /><path d="M5 6v4" /><path d="M19 14v4" /><path d="M10 2v2" /><path d="M7 8H3" /><path d="M21 16h-4" /><path d="M11 3H9" /></svg>
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 'bold', color: '#1e293b' }}>
                  Làm đẹp ảnh mặt bằng bằng AI <span style={{ backgroundColor: '#fef08a', color: '#854d0e', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', verticalAlign: 'middle', marginLeft: '4px' }}>MỚI</span>
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Xóa rác, làm sáng, thêm đồ nội thất ảo... Giúp mặt bằng nổi bật và cho thuê nhanh hơn!
                </p>
              </div>
            </div>

            <a
              href="http://localhost:5173/ai-image-editor"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                zIndex: 1,
                padding: '8px 16px',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#ec4899',
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none',
                boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#ec4899'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.15)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.02)'; }}
            >
              Trải nghiệm ngay <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </a>
          </div>

          {/* --- TOGGLE LOẠI TIN --- */}
          <div className="form-section">
            <h3 className="form-section-title">Loại bài đăng</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className={`filter-tab ${mode === 'longterm' ? 'filter-tab--active' : ''}`}
                onClick={() => setMode('longterm')}
                disabled={isLoading || !!(initialData?.id || initialData?.Id)}
                style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
              >
                <FileText size={14} /> Cho thuê dài hạn
              </button>
              <button
                type="button"
                className={`filter-tab ${mode === 'share' ? 'filter-tab--active' : ''}`}
                onClick={() => setMode('share')}
                disabled={isLoading || !!(initialData?.id || initialData?.Id)}
                style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
              >
                <Users size={14} /> Chia sẻ mặt bằng
              </button>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Thông tin cơ bản</h3>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">
                  Chọn mặt bằng vật lý <span className="required-mark">*</span>
                </label>
                <Select
                  value={spaceId}
                  onChange={(v) => setSpaceId(Number(v))}
                  disabled={isLoading || !!(initialData?.id || initialData?.Id)}
                  placeholder="-- Chọn mặt bằng --"
                  options={mySpaces.map(s => ({
                    value: s.id || s.Id,
                    label: s.isPart ? `↳ [Chia nhỏ] ${s.name} (thuộc ${s.parentName})` : s.name
                  }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Đơn giá {mode === 'share' ? 'chia sẻ' : 'cơ bản'} (VNĐ) <span className="required-mark">*</span>
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    min="0"
                    className="form-input form-input--flat"
                    value={price === 0 ? '' : price}
                    onChange={e => setPrice(e.target.value === '' ? 0 : Number(e.target.value))}
                    disabled={isLoading || lockRenewFields}
                    required
                    style={{ flex: 2 }}
                  />
                  <select
                    className="form-input form-input--flat"
                    value={priceUnit}
                    onChange={e => setPriceUnit(e.target.value)}
                    disabled={isLoading}
                    style={{ flex: 1, backgroundColor: 'var(--color-bg-secondary)' }}
                  >
                    <option value="PerHour">/ Giờ</option>
                    <option value="PerDay">/ Ngày</option>
                    <option value="PerWeek">/ Tuần</option>
                    <option value="PerMonth">/ Tháng</option>
                    <option value="PerYear">/ Năm</option>
                  </select>
                </div>
              </div>
            </div>

            {!isEditingListing && (
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Gói bài đăng <span className="required-mark">*</span></span>
                    <a
                      href="/pricing"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 12, color: '#00d4a0', textDecoration: 'underline', fontWeight: 500 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Tìm hiểu thêm →
                    </a>
                  </label>
                  <Select
                    value={priorityLevelId}
                    onChange={(v) => setPriorityLevelId(Number(v))}
                    disabled={isLoading || lockRenewFields}
                    placeholder="-- Chọn gói bài đăng --"
                    options={priorityLevels.map(p => ({
                      value: p.id,
                      label: `${p.name} — ${p.price.toLocaleString('vi-VN')} VNĐ${p.durationInDays ? ` (${p.durationInDays} ngày)` : ''}`
                    }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Số dư ví</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="wallet-balance-display" style={{ flex: 1 }}>
                      {walletBalance === null ? 'Đang tải...' : `${walletBalance.toLocaleString('vi-VN')} VNĐ`}
                    </div>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ height: 42, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
                      onClick={() => navigate('/user/wallet-deposit')}
                    >
                      <Wallet size={14} /> Nạp tiền
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!isEditingListing && (
              <div style={{ marginTop: 14, border: '1px solid var(--color-border)', borderRadius: 8, padding: 14, background: 'rgba(0,0,0,0.02)' }}>
                <label
                  className="form-label"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: (isLoading || !isBannerAvailable) ? 'not-allowed' : 'pointer',
                    opacity: !isBannerAvailable ? 0.65 : 1,
                    marginBottom: (createBannerWithListing && isBannerAvailable) ? 12 : 0
                  }}
                >
                  <input
                    type="checkbox"
                    checked={createBannerWithListing && isBannerAvailable}
                    onChange={(e) => setCreateBannerWithListing(e.target.checked)}
                    disabled={isLoading || !isBannerAvailable}
                  />
                  <Megaphone size={14} />
                  <span>Đăng kèm banner quảng cáo cho tin này</span>
                  {bannerSlotsInfo && !bannerSlotsInfo.isAvailable && (
                    <span style={{ fontSize: 12, color: '#ef4444', marginLeft: 4, fontWeight: 500 }}>
                      (Đã hết vị trí banner quảng cáo)
                    </span>
                  )}
                  {bannerSlotsInfo && bannerSlotsInfo.isAvailable && (
                    <span style={{ fontSize: 12, color: '#10b981', marginLeft: 4, fontWeight: 500 }}>
                      (Còn {bannerSlotsInfo.remainingSlots}/{bannerSlotsInfo.maxSlots} chỗ)
                    </span>
                  )}
                  <a
                    href="/pricing"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, color: '#00d4a0', textDecoration: 'underline', fontWeight: 500, marginLeft: 'auto' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Tìm hiểu thêm →
                  </a>
                </label>

                {createBannerWithListing && isBannerAvailable && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Gói banner</label>
                      <div className="wallet-balance-display">
                        {selectedBannerPackage
                          ? `${selectedBannerPackage.name} - ${selectedBannerPackage.price.toLocaleString('vi-VN')} VNĐ`
                          : 'Chưa có gói banner khả dụng'}
                      </div>
                    </div>

                    <div className="form-grid-2" style={{ alignItems: 'stretch' }}>
                      <div className="form-group" style={{ minWidth: 0 }}>
                        <label className="form-label">Tiêu đề banner <span className="required-mark">*</span></label>
                        <input
                          type="text"
                          className="form-input"
                          value={bannerTitle}
                          onChange={(e) => setBannerTitle(e.target.value)}
                          disabled={isLoading}
                          placeholder={name || 'Tiêu đề nổi bật cho banner'}
                        />
                        <div style={{ marginTop: 10 }}>
                          <input
                            type="file"
                            accept="image/*"
                            id="banner-file-upload"
                            style={{ display: 'none' }}
                            onChange={handleBannerFileChange}
                            disabled={isLoading}
                          />
                          <label
                            htmlFor="banner-file-upload"
                            className="btn-ghost"
                            style={{ height: 36, padding: '0 14px', display: 'inline-flex', gap: 6, alignItems: 'center', cursor: isLoading ? 'not-allowed' : 'pointer' }}
                          >
                            <Camera size={14} /> Chọn ảnh banner
                          </label>
                          {bannerPreviewUrls.length > 0 && (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                              {bannerPreviewUrls.map((url, index) => (
                                <div key={`banner-${index}`} className="listing-image-preview">
                                  <img src={url} alt={`banner-${index}`} />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBannerFile(index)}
                                    className="listing-image-remove-btn"
                                    disabled={isLoading}
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="form-group" style={{ minWidth: 0 }}>
                        <label className="form-label">Mô tả banner <span className="required-mark">*</span></label>
                        <textarea
                          className="form-textarea form-textarea--flat"
                          value={bannerDescription}
                          onChange={(e) => setBannerDescription(e.target.value)}
                          disabled={isLoading}
                          placeholder={description || 'Mô tả ngắn gọn cho banner'}
                          style={{ minHeight: 90 }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label"><Megaphone size={14} /> Xem trước banner</label>
                      <div
                        className={`user-banner-preview ${bannerPreviewUrls[0] ? 'user-banner-preview--draggable' : ''} ${isDraggingBannerImage ? 'user-banner-preview--dragging' : ''}`}
                        onPointerDown={handleBannerPreviewPointerDown}
                        onPointerMove={handleBannerPreviewPointerMove}
                        onPointerUp={handleBannerPreviewPointerEnd}
                        onPointerCancel={handleBannerPreviewPointerEnd}
                        style={{ position: 'relative', overflow: 'hidden', minHeight: 220, borderRadius: 8, background: 'linear-gradient(135deg, #111827 0%, #0f766e 55%, #d9a05b 100%)', color: '#fff' }}
                      >
                        {bannerPreviewUrls[0] && (
                          <>
                            <img
                              src={bannerPreviewUrls[0]}
                              alt="banner preview"
                              draggable={false}
                              style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: `${bannerImagePosition.x}% ${bannerImagePosition.y}%`,
                                opacity: 0.48,
                              }}
                            />
                            <div className="user-banner-drag-hint">Kéo ảnh để canh khung</div>
                          </>
                        )}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,.62), rgba(0,0,0,.18))' }} />
                        <div className="user-banner-preview-content">
                          <strong>{bannerTitle || name || 'Banner của bạn'}</strong>
                          <p>{bannerDescription || description || 'Nội dung banner sẽ hiển thị tại đây trước khi tạo.'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {mode === 'share' && (
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label"><Users size={14} /> Số người thuê chung tối đa</label>
                  <input
                    type="number" min="1" className="form-input"
                    value={maxSubRenter} onChange={e => setMaxSubRenter(Number(e.target.value))}
                    disabled={isLoading || lockRenewFields}
                  />
                </div>
                <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isLegalCommitted}
                      onChange={e => setIsLegalCommitted(e.target.checked)}
                      disabled={isLoading || lockRenewFields}
                    />
                    <ShieldCheck size={14} style={{ flexShrink: 0 }} />
                    <span style={{ textAlign: 'left', lineHeight: '1.4' }}>
                      Tôi cam kết khoảng thời gian được chia sẻ hoàn toàn dựa trên cơ sở pháp lý và quy định của hợp đồng. <span className="required-mark">*</span>
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {!lockRenewFields && (
            <div className="form-section">
              <h3 className="form-section-title">Hình ảnh bài đăng (Tùy chọn)</h3>
              <div style={{ background: 'rgba(0,0,0,0.02)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '16px' }}>
                <div className="form-group" style={{ gap: '10px' }}>
                  <label className="form-label"><Camera size={14} /> Chọn ảnh từ máy</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      id="file-upload"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                    <label
                      htmlFor="file-upload"
                      className="btn-primary"
                      style={{ height: 36, padding: '0 16px', display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer', width: 'fit-content' }}
                    >
                      <Plus size={14} /> Chọn ảnh từ máy
                    </label>
                  </div>
                  {(existingImages.length > 0 || previewUrls.length > 0) && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {existingImages.map((img: any, index: number) => {
                        const url = typeof img === 'string' ? img : (img.imageUrl || img.url);
                        return (
                          <div key={`existing-${index}`} className="listing-image-preview">
                            <img src={url} alt={`existing-${index}`} />
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingImage(index)}
                              className="listing-image-remove-btn"
                              disabled={isLoading}
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        );
                      })}
                      {previewUrls.map((url, index) => (
                        <div key={`new-${index}`} className="listing-image-preview">
                          <img src={url} alt={`preview-${index}`} />
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="listing-image-remove-btn"
                            disabled={isLoading}
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="form-section">
            <h3 className="form-section-title">Thời gian hiệu lực</h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label"><Calendar size={14} /> Thời gian bắt đầu</label>
                <DatePicker
                  value={allowedStartTime}
                  onChange={setAllowedStartTime}
                  disabled={isLoading || (!isRenewMode && !!(timePolicy && timePolicy.allowedStartTime))}
                />
              </div>
              <div className="form-group">
                <label className="form-label"><Calendar size={14} /> Thời gian kết thúc</label>
                <DatePicker
                  value={allowedEndTime}
                  onChange={setAllowedEndTime}
                  disabled={isLoading || (!isRenewMode && !!(timePolicy && timePolicy.allowedEndTime))}
                  min={allowedStartTime}
                />
              </div>
            </div>
            {mode === 'share' && timePolicy && timePolicy.message && (
              <p style={{ fontSize: '13px', color: '#059669', marginTop: '8px', fontStyle: 'italic' }}>
                * {timePolicy.message}
              </p>
            )}
          </div>

          {/* Khung giờ chia sẻ — chỉ hiện ở mode share */}
          {mode === 'share' && (
            <div className="form-section">
              <h3 className="form-section-title">
                <Clock size={14} /> Khung giờ chia sẻ
              </h3>
              {availabilities.map((slot, idx) => {
                const validDays = getValidDaysOfWeek(slot.validFrom, slot.validTo);
                return (
                  <div key={idx} style={{ background: 'rgba(0,0,0,0.02)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '14px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      {DAYS_OF_WEEK.map(day => {
                        const isDayValid = validDays.includes(day);
                        return (
                          <button
                            type="button" key={day}
                            className={`filter-tab ${slot.daysOfWeek.includes(day) ? 'filter-tab--active' : ''}`}
                            onClick={() => toggleDayInSlot(idx, day)}
                            disabled={isLoading || lockRenewFields || !isDayValid}
                            style={{ opacity: isDayValid ? 1 : 0.5 }}
                          >
                            {DAYS_LABEL_VI[day]}
                          </button>
                        )
                      })}
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">Giờ bắt đầu</label>
                        <input type="time" className="form-input" value={slot.startTime}
                          onChange={e => updateSlotField(idx, 'startTime', e.target.value)} disabled={isLoading || lockRenewFields} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Giờ kết thúc</label>
                        <input type="time" className="form-input" value={slot.endTime}
                          onChange={e => updateSlotField(idx, 'endTime', e.target.value)} disabled={isLoading || lockRenewFields} />
                      </div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">Áp dụng từ</label>
                        <DatePicker
                          value={slot.validFrom}
                          min={allowedStartTime}
                          onChange={(v: any) => updateSlotField(idx, 'validFrom', v)}
                          disabled={isLoading || lockRenewFields}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Áp dụng đến</label>
                        <DatePicker
                          value={slot.validTo}
                          max={allowedEndTime}
                          min={slot.validFrom || allowedStartTime}
                          onChange={(v: any) => updateSlotField(idx, 'validTo', v)}
                          disabled={isLoading || lockRenewFields}
                        />
                      </div>
                    </div>
                    {availabilities.length > 1 && (
                      <button type="button" className="btn-ghost" style={{ color: 'var(--color-negative)' }} onClick={() => removeSlot(idx)}>
                        <Trash2 size={13} /> Xóa khung giờ này
                      </button>
                    )}
                  </div>
                );
              })}
              <button type="button" className="btn-ghost" onClick={addSlot} disabled={isLoading || lockRenewFields}>
                <Plus size={14} /> Thêm khung giờ khác
              </button>
            </div>
          )}

          {/* TIỆN ÍCH MẶT BẰNG CHIA SẺ & NGÀNH NGHỀ THUÊ CHUNG (HIỆN KHI CHI SẺ MẶT BẰNG) */}
          {mode === 'share' && (
            <>
              {/* TIỆN ÍCH MẶT BẰNG CHIA SẺ */}
              <div className="form-section">
                <h3 className="form-section-title">
                  <CheckSquare size={14} /> Tiện ích mặt bằng chia sẻ
                </h3>

                {/* Dropdown chọn tiện ích */}
                {!lockRenewFields && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <select
                      className="form-select-input form-select-input--flat"
                      style={{ flex: 1 }}
                      value=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__custom__') {
                          setShowCustomAmenityInput(true);
                        } else if (val) {
                          setAmenityItems(prev => prev.map(a => a.name === val ? { ...a, selected: true } : a));
                        }
                      }}
                      disabled={isLoading}
                    >
                      <option value="">-- Chọn tiện ích để thêm vào bài đăng --</option>
                      {amenityItems.filter(a => !a.selected).map((a, i) => (
                        <option key={i} value={a.name}>+ {a.name}</option>
                      ))}
                      <option value="__custom__">+ Thêm tiện ích khác...</option>
                    </select>
                  </div>
                )}

                {/* Ô nhập tiện ích tùy chỉnh */}
                {showCustomAmenityInput && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nhập tên tiện ích tùy chỉnh..."
                      value={newAmenityName}
                      onChange={e => setNewAmenityName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newAmenityName.trim()) {
                            handleAddCustomAmenity();
                            setShowCustomAmenityInput(false);
                          }
                        }
                      }}
                      disabled={isLoading || lockRenewFields}
                      style={{ flex: 1 }}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => {
                        if (newAmenityName.trim()) {
                          handleAddCustomAmenity();
                          setShowCustomAmenityInput(false);
                        }
                      }}
                      disabled={isLoading || !newAmenityName.trim()}
                      style={{ height: 38, padding: '0 14px', fontSize: 13 }}
                    >
                      Thêm
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setShowCustomAmenityInput(false)}
                      style={{ height: 38, padding: '0 12px', fontSize: 13 }}
                    >
                      Hủy
                    </button>
                  </div>
                )}

                {/* Danh sách các tiện ích đã chọn */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {amenityItems.filter(a => a.selected).length === 0 && (
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: '4px 0' }}>
                      Chưa chọn tiện ích nào. Chọn từ danh sách thả xuống ở trên.
                    </p>
                  )}

                  {amenityItems.filter(a => a.selected).map((item) => {
                    const idx = amenityItems.findIndex(a => a.name === item.name);
                    return (
                      <div
                        key={item.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          background: 'rgba(0, 212, 160, 0.04)',
                          border: '1px solid var(--color-primary)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)', flex: 1, minWidth: '140px' }}>
                          ✓ {item.name}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          {/* Số lượng */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>SL:</span>
                            <input
                              type="number"
                              min="1"
                              className="form-input"
                              style={{ width: '55px', padding: '2px 6px', fontSize: '12px', textAlign: 'center' }}
                              value={item.quantity}
                              onChange={e => {
                                const q = Number(e.target.value);
                                setAmenityItems(prev => prev.map((a, i) => i === idx ? { ...a, quantity: q < 1 ? 1 : q } : a));
                              }}
                              disabled={isLoading || lockRenewFields}
                            />
                          </div>

                          {/* Phụ phí */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                name={`listing-amenity-price-type-${idx}`}
                                checked={item.isIncluded}
                                onChange={() => {
                                  setAmenityItems(prev => prev.map((a, i) => i === idx ? { ...a, isIncluded: true, price: 0 } : a));
                                }}
                                disabled={isLoading || lockRenewFields}
                              />
                              <span>Miễn phí</span>
                            </label>
                            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                name={`listing-amenity-price-type-${idx}`}
                                checked={!item.isIncluded}
                                onChange={() => {
                                  setAmenityItems(prev => prev.map((a, i) => i === idx ? { ...a, isIncluded: false } : a));
                                }}
                                disabled={isLoading || lockRenewFields}
                              />
                              <span>Có phụ phí</span>
                            </label>
                          </div>

                          {!item.isIncluded && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                type="number"
                                min="0"
                                placeholder="Phụ phí"
                                className="form-input"
                                style={{ width: '100px', padding: '2px 6px', fontSize: '12px' }}
                                value={item.price === 0 ? '' : item.price}
                                onChange={e => {
                                  const p = Number(e.target.value);
                                  setAmenityItems(prev => prev.map((a, i) => i === idx ? { ...a, price: p } : a));
                                }}
                                disabled={isLoading || lockRenewFields}
                              />
                              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>VNĐ</span>
                            </div>
                          )}

                          {!lockRenewFields && (
                            <button
                              type="button"
                              className="btn-icon"
                              style={{ color: '#ef4444', padding: '4px' }}
                              onClick={() => {
                                setAmenityItems(prev => prev.map((a, i) => i === idx ? { ...a, selected: false } : a));
                              }}
                              disabled={isLoading}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* NGÀNH NGHỀ ĐƯỢC PHÉP THUÊ CHUNG */}
              <div className="form-section">
                <h3 className="form-section-title">
                  <Briefcase size={14} /> Ngành nghề / Mô hình phù hợp thuê chung
                </h3>

                {/* Dropdown chọn ngành nghề */}
                {!lockRenewFields && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <select
                      className="form-select-input form-select-input--flat"
                      style={{ flex: 1 }}
                      value=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__custom__') {
                          setShowCustomCategoryInput(true);
                        } else if (val) {
                          setCategoryItems(prev => prev.map(c => c.name === val ? { ...c, selected: true } : c));
                        }
                      }}
                      disabled={isLoading}
                    >
                      <option value="">-- Chọn ngành nghề / mô hình để thêm vào bài đăng --</option>
                      {categoryItems.filter(c => !c.selected).map((c, i) => (
                        <option key={i} value={c.name}>+ {c.name}</option>
                      ))}
                      <option value="__custom__">+ Thêm ngành nghề khác...</option>
                    </select>
                  </div>
                )}

                {/* Ô nhập ngành nghề tùy chỉnh */}
                {showCustomCategoryInput && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nhập tên ngành nghề tùy chỉnh..."
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newCategoryName.trim()) {
                            handleAddCustomCategory();
                            setShowCustomCategoryInput(false);
                          }
                        }
                      }}
                      disabled={isLoading || lockRenewFields}
                      style={{ flex: 1 }}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => {
                        if (newCategoryName.trim()) {
                          handleAddCustomCategory();
                          setShowCustomCategoryInput(false);
                        }
                      }}
                      disabled={isLoading || !newCategoryName.trim()}
                      style={{ height: 38, padding: '0 14px', fontSize: 13 }}
                    >
                      Thêm
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setShowCustomCategoryInput(false)}
                      style={{ height: 38, padding: '0 12px', fontSize: 13 }}
                    >
                      Hủy
                    </button>
                  </div>
                )}

                {/* Danh sách các ngành nghề đã chọn */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {categoryItems.filter(c => c.selected).length === 0 && (
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: '4px 0' }}>
                      Chưa chọn ngành nghề nào. Chọn từ danh sách thả xuống ở trên.
                    </p>
                  )}

                  {categoryItems.filter(c => c.selected).map((item) => {
                    const idx = categoryItems.findIndex(c => c.name === item.name);
                    return (
                      <div
                        key={item.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          background: 'rgba(0, 212, 160, 0.04)',
                          border: '1px solid var(--color-primary)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)', flex: 1, minWidth: '150px' }}>
                          ✓ {item.name}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 2, minWidth: '200px' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Ghi chú / Yêu cầu riêng (tùy chọn)..."
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                            value={item.note}
                            onChange={e => {
                              const val = e.target.value;
                              setCategoryItems(prev => prev.map((c, i) => i === idx ? { ...c, note: val } : c));
                            }}
                            disabled={isLoading || lockRenewFields}
                          />
                          {!lockRenewFields && (
                            <button
                              type="button"
                              className="btn-icon"
                              style={{ color: '#ef4444', padding: '4px' }}
                              onClick={() => {
                                setCategoryItems(prev => prev.map((c, i) => i === idx ? { ...c, selected: false } : c));
                              }}
                              disabled={isLoading}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="form-section">
            <h3 className="form-section-title">Tiêu đề / Mô tả</h3>
            <div className="form-group">
              <label className="form-label">
                Tên bài đăng <span className="required-mark">*</span>
              </label>
              <input
                type="text"
                className="form-input form-input--flat"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isLoading || lockRenewFields}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Nội dung mô tả <span className="required-mark">*</span>
              </label>
              <textarea
                className="form-textarea form-textarea--flat"
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={isLoading || lockRenewFields}
                required
              />
            </div>
          </div>

          {error && (
            <div className="form-error-box">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="modal-actions-footer">
            {!isEditingListing && (
              <div style={{ width: '100%', textAlign: 'right', marginBottom: 10, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Tổng phí tạm tính: <strong style={{ color: 'var(--color-text-primary)' }}>{totalPublishPrice.toLocaleString('vi-VN')} VNĐ</strong>
              </div>
            )}
            <button type="button" className="btn-ghost cancel-btn" onClick={onClose} disabled={isLoading}>
              Hủy
            </button>
            <button type="submit" className="btn-primary submit-btn" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : (initialData ? 'Lưu thay đổi' : (mode === 'share' ? 'Đăng chia sẻ' : 'Đăng tin'))}
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
};









