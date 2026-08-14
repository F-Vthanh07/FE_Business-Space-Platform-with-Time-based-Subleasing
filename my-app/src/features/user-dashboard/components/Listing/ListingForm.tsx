/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Camera, Plus, Trash2, Calendar, ShieldAlert, Users, ShieldCheck, Clock, Megaphone } from 'lucide-react';
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

interface ListingFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

type ListingMode = 'longterm' | 'share';

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

export const ListingForm: React.FC<ListingFormProps> = ({ onClose, onSuccess, initialData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [mySpaces, setMySpaces] = useState<any[]>([]);
  const [error, setError] = useState('');
  const { isVerified } = useIdentityVerification();

  const isEditingListing = !!initialData;
  const [priorityLevels, setPriorityLevels] = useState<PriorityLevel[]>([]);
  const [bannerPriorityLevels, setBannerPriorityLevels] = useState<PriorityLevel[]>([]);
  const [priorityLevelId, setPriorityLevelId] = useState<number | ''>('');
  const [bannerPriorityLevelId, setBannerPriorityLevelId] = useState<number | ''>('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [createBannerWithListing, setCreateBannerWithListing] = useState(false);
  const [bannerTitle, setBannerTitle] = useState(initialData?.name || '');
  const [bannerDescription, setBannerDescription] = useState(initialData?.description || '');
  const [bannerFiles, setBannerFiles] = useState<File[]>([]);
  const [bannerPreviewUrls, setBannerPreviewUrls] = useState<string[]>([]);

  // Đã sửa: Dựa vào listingType thật từ API để quyết định form
  const initialMode: ListingMode = initialData?.listingType === 'SharedSpace' ? 'share' : 'longterm';
  const [mode, setMode] = useState<ListingMode>(initialMode);

  const [spaceId, setSpaceId] = useState<number | ''>(initialData?.spaceId || '');
  const [price, setPrice] = useState<number>(initialData?.price || 0);
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');

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
  const listingPackagePrice = selectedListingPackage?.price ?? 0;
  const bannerPackagePrice = createBannerWithListing ? (selectedBannerPackage?.price ?? 0) : 0;
  const totalPublishPrice = listingPackagePrice + bannerPackagePrice;

  useEffect(() => {
    if (!spaceId) {
      setTimePolicy(null);
      return;
    }
    const fetchTimePolicy = async () => {
      try {
        const token = localStorage.getItem('portal_token') || '';
        const res = await fetch(`https://flexi-space-capstone-project.onrender.com/api/Listing/ShareListing/TimePolicy/${spaceId}`, {
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
        const url = `https://flexi-space-capstone-project.onrender.com/api/Space/GetAll?OwnerId=${encodeURIComponent(ownerId)}`;

        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
        });

        if (res.ok) {
          const data = await res.json();
          const spaces = Array.isArray(data) ? data : (data?.data || []);
          
          let allSpacesAndParts: any[] = [];
          
          for (const space of spaces) {
            allSpacesAndParts.push({ ...space, isPart: false });
            try {
              const partRes = await fetch(`https://flexi-space-capstone-project.onrender.com/api/SpacePart/GetByParent/${space.id || space.Id}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
              });
              if (partRes.ok) {
                const partData = await partRes.json();
                const parts = Array.isArray(partData) ? partData : (partData?.items || []);
                parts.forEach((p: any) => {
                  allSpacesAndParts.push({ ...p, isPart: true, parentName: space.name });
                });
              }
            } catch (err) {
              console.error("Lỗi lấy space part", err);
            }
          }
            const usageRes = await fetch(`https://flexi-space-capstone-project.onrender.com/api/SpaceUsageRight/Mine`, {
              headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
            });
            if (usageRes.ok) {
              const usageData = await usageRes.json();
              const rights = Array.isArray(usageData) ? usageData : usageData?.data || [];
              const shareableRights = rights.filter((r: any) => r.canShare === true);
              const spacePromises = shareableRights.map((r: any) =>
                  fetch(`https://flexi-space-capstone-project.onrender.com/api/Space/GetById/${r.spaceId}`, {
                      headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
                  }).then(r => r.ok ? r.json() : null)
              );
              const resolvedSpaces = await Promise.all(spacePromises);
              const validUsageSpaces = resolvedSpaces.filter(Boolean);
              for (const space of validUsageSpaces) {
                if (!allSpacesAndParts.some(s => (s.id || s.Id) === (space.id || space.Id))) {
                   allSpacesAndParts.push({ ...space, isPart: false });
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
      const levels = await fetchPriorityLevels();
      const bannerLevels = await fetchBannerPriorityLevels();
      setPriorityLevels(levels);
      setBannerPriorityLevels(bannerLevels);
      if (levels.length > 0) setPriorityLevelId(levels[0].id);
      if (bannerLevels.length > 0) setBannerPriorityLevelId(bannerLevels[0].id);
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
      throw new Error('Khong doc duoc id bai dang de gan vao banner');
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
      await uploadUserBannerPictures(bannerId, bannerFiles);
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
      setError('Vui long chon goi banner!');
      return;
    }

    if (!isEditingListing && createBannerWithListing && !bannerTitle.trim()) {
      setError('Vui long nhap tieu de banner!');
      return;
    }

    if (!isEditingListing && createBannerWithListing && !bannerDescription.trim()) {
      setError('Vui long nhap mo ta banner!');
      return;
    }

    if (!isEditingListing) {
      const chosenPackagePrice = totalPublishPrice;
      if (walletBalance !== null && walletBalance < totalPublishPrice) {
        setError(`Số dư ví không đủ để đăng tin! Cần ${chosenPackagePrice.toLocaleString('vi-VN')} VNĐ, ví hiện có ${walletBalance.toLocaleString('vi-VN')} VNĐ.`);
        return;
      }
    }

    // Bỏ validation ngày quá khứ theo yêu cầu mới

    if (new Date(allowedEndTime) <= new Date(allowedStartTime)) {
      setError('Thời gian kết thúc phải sau thời gian bắt đầu!');
      return;
    }

    if (mode === 'share' && (!maxSubRenter || maxSubRenter < 1)) {
      setError('Số người thuê chung tối đa phải từ 1 trở lên!');
      return;
    }

    if (mode === 'share' && availabilities.some(slot => slot.daysOfWeek.length === 0 && !slot.specificdate)) {
      setError('Vui lòng chọn ít nhất 1 ngày hoặc ngày cụ thể cho mỗi khung giờ chia sẻ!');
      return;
    }

    if (mode === 'share') {
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

    if (mode === 'share' && !isLegalCommitted) {
      setError('Vui lòng tích "Cam kết pháp lý" để xác nhận thỏa thuận trước khi đăng chia sẻ!');
      return;
    }

    setIsLoading(true);

    const selectedPriorityLevel = priorityLevels.find(p => p.id === priorityLevelId);
    const amount = selectedPriorityLevel?.price ?? 0;
    const durationInDays = selectedPriorityLevel?.durationInDays ?? 0;

    // ===== NHÁNH 1: CHIA SẺ MẶT BẰNG =====
    if (mode === 'share') {
      const sharePayload: ShareListingPayload = {
        spaceId: Number(spaceId),
        allowedStartTime,
        allowedEndTime,
        name,   
        description,
        price: Number(price),
        shareSpaceDetailMaxSubRenter: Number(maxSubRenter),
        shareSpaceDetailIsOwner: false,
        shareSpaceDetailIsLegalCommitted: isLegalCommitted,
        shareSpaceDetailShareSpaceAmenities: [],
        shareSpaceDetailAvailabilitiesTimes: availabilities.map(slot => ({
          ...slot,
          specificdate: (slot.specificdate && !String(slot.specificdate).startsWith('0001')) ? slot.specificdate : undefined
        })),
        shareSpaceDetailShareSpaceCategories: []
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
        } catch(e) { /* empty */ }
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
        } catch(e) { /* empty */ }
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>
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
              Trải nghiệm ngay <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
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
                disabled={isLoading || !!initialData} // không cho đổi loại khi đang sửa
                style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
              >
                <FileText size={14} /> Cho thuê dài hạn
              </button>
              <button
                type="button"
                className={`filter-tab ${mode === 'share' ? 'filter-tab--active' : ''}`}
                onClick={() => setMode('share')}
                disabled={isLoading || !!initialData}
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
                  disabled={isLoading || !!initialData}
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
                <input
                  type="number"
                  min="0"
                  className="form-input form-input--flat"
                  value={price === 0 ? '' : price}
                  onChange={e => setPrice(e.target.value === '' ? 0 : Number(e.target.value))}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {!isEditingListing && (
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Gói bài đăng <span className="required-mark">*</span>
                  </label>
                  <Select
                    value={priorityLevelId}
                    onChange={(v) => setPriorityLevelId(Number(v))}
                    disabled={isLoading}
                    placeholder="-- Chọn gói bài đăng --"
                    options={priorityLevels.map(p => ({
                      value: p.id,
                      label: `${p.name} — ${p.price.toLocaleString('vi-VN')} VNĐ`
                    }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Số dư ví</label>
                  <div className="wallet-balance-display">
                    {walletBalance === null ? 'Đang tải...' : `${walletBalance.toLocaleString('vi-VN')} VNĐ`}
                  </div>
                </div>
              </div>
            )}

            {!isEditingListing && (
              <div style={{ marginTop: 14, border: '1px solid var(--color-border)', borderRadius: 8, padding: 14, background: 'rgba(0,0,0,0.02)' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}>
                  <input
                    type="checkbox"
                    checked={createBannerWithListing}
                    onChange={(e) => setCreateBannerWithListing(e.target.checked)}
                    disabled={isLoading || bannerPriorityLevels.length === 0}
                  />
                  <Megaphone size={14} />
                  <span>Đăng kèm banner quảng cáo cho tin này</span>
                </label>

                {createBannerWithListing && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Gói banner</label>
                      <div className="wallet-balance-display">
                        {selectedBannerPackage
                          ? `${selectedBannerPackage.name} - ${selectedBannerPackage.price.toLocaleString('vi-VN')} VNĐ${selectedBannerPackage.durationInDays ? ` / ${selectedBannerPackage.durationInDays} ngày` : ''}`
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
                      <div style={{ position: 'relative', overflow: 'hidden', minHeight: 220, borderRadius: 8, background: 'linear-gradient(135deg, #111827 0%, #0f766e 55%, #d9a05b 100%)', color: '#fff' }}>
                        {bannerPreviewUrls[0] && (
                          <img src={bannerPreviewUrls[0]} alt="banner preview" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.48 }} />
                        )}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,.62), rgba(0,0,0,.18))' }} />
                        <div style={{ position: 'relative', padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 220 }}>
                          <strong style={{ fontSize: 28, lineHeight: 1.15 }}>{bannerTitle || name || 'Banner của bạn'}</strong>
                          <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.45, maxWidth: 620 }}>{bannerDescription || description || 'Nội dung banner sẽ hiển thị tại đây trước khi tạo.'}</p>
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
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isLegalCommitted}
                      onChange={e => setIsLegalCommitted(e.target.checked)}
                      disabled={isLoading}
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

          <div className="form-section">
            <h3 className="form-section-title">Thời gian hiệu lực</h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label"><Calendar size={14} /> Thời gian bắt đầu</label>
                <DatePicker
                  value={allowedStartTime}
                  onChange={setAllowedStartTime}
                  disabled={isLoading || !!(timePolicy && timePolicy.allowedStartTime)}
                />
              </div>
              <div className="form-group">
                <label className="form-label"><Calendar size={14} /> Thời gian kết thúc</label>
                <DatePicker
                  value={allowedEndTime}
                  onChange={setAllowedEndTime}
                  disabled={isLoading || !!(timePolicy && timePolicy.allowedEndTime)}
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
                        disabled={isLoading || !isDayValid}
                        style={{ opacity: isDayValid ? 1 : 0.5 }}
                      >
                        {DAYS_LABEL_VI[day]}
                      </button>
                    )})}
                  </div>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label">Ngày cụ thể (tùy chọn)</label>
                    <DatePicker
                      value={slot.specificdate || ''}
                      min={allowedStartTime}
                      max={allowedEndTime}
                      onChange={(v: any) => updateSlotField(idx, 'specificdate', v)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Giờ bắt đầu</label>
                      <input type="time" className="form-input" value={slot.startTime}
                        onChange={e => updateSlotField(idx, 'startTime', e.target.value)} disabled={isLoading} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Giờ kết thúc</label>
                      <input type="time" className="form-input" value={slot.endTime}
                        onChange={e => updateSlotField(idx, 'endTime', e.target.value)} disabled={isLoading} />
                    </div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Áp dụng từ</label>
                      <DatePicker
                        value={slot.validFrom}
                        min={allowedStartTime}
                        onChange={(v: any) => updateSlotField(idx, 'validFrom', v)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Áp dụng đến</label>
                      <DatePicker
                        value={slot.validTo}
                        max={allowedEndTime}
                        min={slot.validFrom || allowedStartTime}
                        onChange={(v: any) => updateSlotField(idx, 'validTo', v)}
                        disabled={isLoading}
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
              <button type="button" className="btn-ghost" onClick={addSlot} disabled={isLoading}>
                <Plus size={14} /> Thêm khung giờ khác
              </button>
            </div>
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
                disabled={isLoading}
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
                disabled={isLoading}
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
