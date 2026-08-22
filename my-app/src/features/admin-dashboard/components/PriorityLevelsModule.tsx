import React, { useEffect, useRef, useState } from 'react';
import { Plus, Check, X, Zap, Edit3, Trash2, Eye, Image, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PriorityLevel } from '../types';
import type { AdminBannerItem, CreateAdminBannerPayload, PriorityLevelPayload, PriorityLevelType } from '../api/admin.api';
import { RefreshButton } from './RefreshButton';
import { getPictureUrl } from '../utils/listingPicture';
import { useConfirm } from '../../../components/ConfirmModal';

const ITEMS_PER_PAGE = 10;
const BANNER_CROP_WIDTH = 2100;
const BANNER_CROP_HEIGHT = 700;

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

interface PriorityLevelsModuleProps {
  priorityLevels: PriorityLevel[];
  adminBanners: AdminBannerItem[];
  handleGetPriorityLevelById: (id: number) => Promise<PriorityLevel>;
  handleCreatePriorityLevel: (payload: PriorityLevelPayload) => Promise<void>;
  handleUpdatePriorityLevel: (id: number, payload: PriorityLevelPayload) => Promise<void>;
  handleDeletePriorityLevel: (id: number) => Promise<void>;
  handleCreateAdminBanner: (payload: CreateAdminBannerPayload, durationInDays: number, files: File[]) => Promise<void>;
  handleUpdateAdminBanner: (id: number, payload: CreateAdminBannerPayload, durationInDays: number, files: File[]) => Promise<void>;
  handleDeleteAdminBanner: (id: number) => Promise<void>;
  isLoading: boolean;
  language: 'en' | 'vi';
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const PriorityLevelsModule: React.FC<PriorityLevelsModuleProps> = ({
  priorityLevels,
  adminBanners,
  handleGetPriorityLevelById,
  handleCreatePriorityLevel,
  handleUpdatePriorityLevel,
  handleDeletePriorityLevel,
  handleCreateAdminBanner,
  handleUpdateAdminBanner,
  handleDeleteAdminBanner,
  isLoading,
  language,
  onRefresh,
  isRefreshing,
}) => {
  const { confirm, confirmModal } = useConfirm();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<PriorityLevel | null>(null);
  const [detailLevel, setDetailLevel] = useState<PriorityLevel | null>(null);
  const [activeTypeTab, setActiveTypeTab] = useState<PriorityLevelType>('Listing');
  const [currentPage, setCurrentPage] = useState(1);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [durationInDays, setDurationInDays] = useState('');
  const [durationForBanner, setDurationForBanner] = useState('');
  const [type, setType] = useState<PriorityLevelType>('Listing');
  const [isActive, setIsActive] = useState(true);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerDescription, setBannerDescription] = useState('');
  const [bannerDurationInDays, setBannerDurationInDays] = useState('');
  const [bannerFiles, setBannerFiles] = useState<File[]>([]);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState('');
  const [bannerImagePosition, setBannerImagePosition] = useState({ x: 50, y: 50 });
  const [isDraggingBannerImage, setIsDraggingBannerImage] = useState(false);
  const bannerImageDragRef = useRef(false);
  const [editingBanner, setEditingBanner] = useState<AdminBannerItem | null>(null);

  useEffect(() => {
    if (bannerFiles.length === 0) {
      setBannerPreviewUrl('');
      return;
    }
    const objectUrl = URL.createObjectURL(bannerFiles[0]);
    setBannerPreviewUrl(objectUrl);
    setBannerImagePosition({ x: 50, y: 50 });
    return () => URL.revokeObjectURL(objectUrl);
  }, [bannerFiles]);

  const getPriorityType = (level: PriorityLevel): PriorityLevelType => {
    return String(level.type || '').toLowerCase() === 'banner' ? 'Banner' : 'Listing';
  };

  const resetForm = (nextType: PriorityLevelType = 'Listing') => {
    setName('');
    setDescription('');
    setPrice('');
    setDurationInDays(nextType === 'Banner' ? '99' : '');
    setDurationForBanner('');
    setType(nextType);
    setIsActive(true);
  };

  const handleOpenAdd = () => {
    resetForm(activeTypeTab);
    setIsAddModalOpen(true);
  };

  const fillForm = (level: PriorityLevel) => {
    setSelectedLevel(level);
    setName(level.name);
    setDescription(level.description || '');
    setPrice(String(level.price));
    setDurationInDays(level.durationInDays != null ? String(level.durationInDays) : '');
    setDurationForBanner(level.durationForBanner != null ? String(level.durationForBanner) : '');
    setType(getPriorityType(level));
    setIsActive(level.isActive);
  };

  const handleOpenEdit = async (level: PriorityLevel) => {
    try {
      const latestLevel = await handleGetPriorityLevelById(level.id);
      fillForm(latestLevel);
    } catch (err) {
      console.error(err);
      fillForm(level);
    }
    setIsEditModalOpen(true);
  };

  const handleOpenDetail = async (level: PriorityLevel) => {
    try {
      const latestLevel = await handleGetPriorityLevelById(level.id);
      setDetailLevel(latestLevel);
    } catch (err) {
      console.error(err);
      setDetailLevel(level);
    }
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (level: PriorityLevel) => {
    const confirmed = await confirm({
      title: language === 'en' ? 'Delete priority level' : 'Xoá gói ưu tiên',
      message: language === 'en' ? `Delete "${level.name}"?` : `Xóa gói "${level.name}"?`,
      confirmLabel: language === 'en' ? 'Delete' : 'Xoá',
      danger: true,
    });
    if (!confirmed) return;
    await handleDeletePriorityLevel(level.id);
  };

  const validatePriceInput = (): number | null => {
    const priceValue = Number(price);
    if (Number.isNaN(priceValue) || priceValue < 0) {
      alert(language === 'en' ? 'Please enter a valid price' : 'Vui lòng nhập giá hợp lệ');
      return null;
    }
    return priceValue;
  };

  const validateNonNegativeInteger = (value: string, label: string): number | null => {
    const numberValue = Number(value);
    if (!Number.isInteger(numberValue) || numberValue < 0) {
      alert(language === 'en' ? `Please enter a valid ${label}` : `Vui lòng nhập ${label} hợp lệ`);
      return null;
    }
    return numberValue;
  };

  const buildPayload = (): PriorityLevelPayload | null => {
    if (!name.trim()) {
      alert(language === 'en' ? 'Please enter a package name' : 'Vui lòng nhập tên gói');
      return null;
    }

    const priceValue = validatePriceInput();
    if (priceValue === null) return null;

    const durationInDaysValue = type === 'Banner' ? 99 : validateNonNegativeInteger(
      durationInDays,
      language === 'en' ? 'duration in days' : 'thời gian tồn tại'
    );
    if (durationInDaysValue === null) return null;

    const durationForBannerValue = type === 'Banner'
      ? validateNonNegativeInteger(
          durationForBanner,
          language === 'en' ? 'banner upload limit' : 'giới hạn số banner'
        )
      : 0;
    if (durationForBannerValue === null) return null;

    return {
      name: name.trim(),
      description: description.trim(),
      price: priceValue,
      durationInDays: durationInDaysValue,
      durationForBanner: durationForBannerValue,
      type,
      isActive,
    };
  };

  const onAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) return;
    await handleCreatePriorityLevel(payload);
    setIsAddModalOpen(false);
  };

  const onEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLevel) return;
    const payload = buildPayload();
    if (!payload) return;
    await handleUpdatePriorityLevel(selectedLevel.id, payload);
    setIsEditModalOpen(false);
  };

  const resetAdminBannerForm = () => {
    setEditingBanner(null);
    setBannerTitle('');
    setBannerDescription('');
    setBannerDurationInDays('');
    setBannerFiles([]);
    setBannerImagePosition({ x: 50, y: 50 });
  };

  const handleBannerPreviewPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!bannerPreviewUrl) return;
    bannerImageDragRef.current = true;
    setIsDraggingBannerImage(true);
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleBannerPreviewPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!bannerImageDragRef.current || !bannerPreviewUrl) return;
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

  const getBannerImageUrl = (banner: AdminBannerItem): string | null => {
    const direct = getPictureUrl(banner);
    if (direct) return direct;
    const groups = [banner.bannerPictures, banner.pictures, banner.images, banner.bannerPicture, banner.picture];
    for (const group of groups) {
      if (Array.isArray(group)) {
        const found = group.map(getPictureUrl).find(Boolean);
        if (found) return found;
      } else {
        const found = getPictureUrl(group);
        if (found) return found;
      }
    }
    return null;
  };

  const getBannerDuration = (banner: AdminBannerItem) => {
    const direct = Number(banner.durationInDays ?? banner.duration ?? banner.bannerDurationInDays);
    if (Number.isFinite(direct) && direct >= 0) return String(direct);
    if (banner.startDate && banner.endDate) {
      const start = new Date(banner.startDate).getTime();
      const end = new Date(banner.endDate).getTime();
      if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
        return String(Math.ceil((end - start) / 86400000));
      }
    }
    return '';
  };

  const handleEditBanner = (banner: AdminBannerItem) => {
    setEditingBanner(banner);
    setBannerTitle(banner.title || '');
    setBannerDescription(banner.description || '');
    setBannerDurationInDays(getBannerDuration(banner));
    setBannerFiles([]);
    setBannerImagePosition({ x: 50, y: 50 });
  };

  const onAdminBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle.trim()) {
      alert(language === 'en' ? 'Please enter a banner title' : 'Vui lòng nhập tiêu đề banner');
      return;
    }
    const durationValue = validateNonNegativeInteger(
      bannerDurationInDays,
      language === 'en' ? 'duration in days' : 'thời gian banner'
    );
    if (durationValue === null) return;

    const uploadFiles = bannerFiles.length > 0 && bannerPreviewUrl
      ? [await cropBannerFile(bannerFiles[0], bannerPreviewUrl, bannerImagePosition), ...bannerFiles.slice(1)]
      : bannerFiles;

    const payload = {
      title: bannerTitle.trim(),
      description: bannerDescription.trim(),
      listingId: editingBanner?.listingId ?? null,
    };

    if (editingBanner) {
      await handleUpdateAdminBanner(editingBanner.id, payload, durationValue, uploadFiles);
    } else {
      await handleCreateAdminBanner(payload, durationValue, uploadFiles);
    }
    resetAdminBannerForm();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === '0001-01-01T00:00:00' || dateStr.startsWith('0001-01-01')) {
      return language === 'en' ? 'N/A' : 'Chưa cập nhật';
    }
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN');
  };

  const visiblePriorityLevels = priorityLevels.filter(p => getPriorityType(p) === activeTypeTab);
  const totalPages = Math.max(1, Math.ceil(visiblePriorityLevels.length / ITEMS_PER_PAGE));
  const pagedPriorityLevels = visiblePriorityLevels.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTypeTab, priorityLevels.length]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  const renderAdminBannerForm = () => (
    <form onSubmit={onAdminBannerSubmit} className="glass-card" style={{ padding: '20px', display: 'grid', gap: '16px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="stat-icon-wrapper orange"><Image size={18} /></div>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px' }}>{language === 'en' ? 'Create Platform Ad Banner' : 'Tạo banner quảng cáo nền tảng'}</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)' }}>
            {language === 'en' ? 'Create a banner and attach images by banner ID' : 'Tạo banner bằng API admin và gắn ảnh theo bannerId'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>{language === 'en' ? 'Title' : 'Tiêu đề'} <span style={{ color: 'red' }}>*</span></label>
          <input className="slot-input-text" style={{ height: '40px', padding: '0 12px' }} value={bannerTitle} onChange={e => setBannerTitle(e.target.value)} required />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>{language === 'en' ? 'Duration In Days' : 'Thời hạn hiển thị (ngày)'} <span style={{ color: 'red' }}>*</span></label>
          <input type="number" min={0} step={1} className="slot-input-text" style={{ height: '40px', padding: '0 12px' }} value={bannerDurationInDays} onChange={e => setBannerDurationInDays(e.target.value)} required />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>{language === 'en' ? 'Banner Images' : 'Ảnh banner'}</label>
          <label className="btn-ghost" style={{ height: '40px', justifyContent: 'center', cursor: 'pointer' }}>
            <Upload size={16} />
            {bannerFiles.length > 0 ? `${bannerFiles.length} file` : (language === 'en' ? 'Choose images' : 'Chọn ảnh')}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setBannerFiles(Array.from(e.target.files || []))} />
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600 }}>{language === 'en' ? 'Description' : 'Mô tả'}</label>
        <textarea className="slot-input-text" style={{ minHeight: '90px', padding: '10px 12px', resize: 'vertical' }} value={bannerDescription} onChange={e => setBannerDescription(e.target.value)} />
      </div>

      <div
        className={`admin-banner-preview ${bannerPreviewUrl ? 'admin-banner-preview--draggable' : ''} ${isDraggingBannerImage ? 'admin-banner-preview--dragging' : ''}`}
        onPointerDown={handleBannerPreviewPointerDown}
        onPointerMove={handleBannerPreviewPointerMove}
        onPointerUp={handleBannerPreviewPointerEnd}
        onPointerCancel={handleBannerPreviewPointerEnd}
      >
        {bannerPreviewUrl ? (
          <>
            <img
              src={bannerPreviewUrl}
              alt=""
              draggable={false}
              style={{ objectPosition: `${bannerImagePosition.x}% ${bannerImagePosition.y}%` }}
            />
            <div className="admin-banner-drag-hint">
              {language === 'en' ? 'Drag image to reposition' : 'Kéo ảnh để canh khung'}
            </div>
          </>
        ) : (
          <div className="admin-banner-preview-empty">
            <Image size={24} />
            <span>{language === 'en' ? 'Horizontal image preview' : 'Xem trước ảnh ngang'}</span>
          </div>
        )}
        <div className="admin-banner-preview-shade" />
        <div className="admin-banner-preview-content">
          <strong>{bannerTitle || (language === 'en' ? 'Banner title' : 'Tiêu đề banner')}</strong>
          <p>{bannerDescription || (language === 'en' ? 'Banner description will appear over the image.' : 'Mô tả banner sẽ hiển thị trực tiếp trên ảnh.')}</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        {editingBanner && (
          <button type="button" className="btn-ghost" disabled={isLoading} onClick={resetAdminBannerForm}>
            <X size={16} />
            {language === 'en' ? 'Cancel Edit' : 'Hủy sửa'}
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {editingBanner ? <Check size={16} /> : <Plus size={16} />}
          {editingBanner
            ? (language === 'en' ? 'Update Banner' : 'Cập nhật banner')
            : (language === 'en' ? 'Create Banner' : 'Tạo banner')}
        </button>
      </div>
    </form>
  );

  const renderAdminBannerManager = () => (
    <div className="glass-card" style={{ padding: 20, display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>{language === 'en' ? 'Created Platform Banners' : 'Banner admin đã tạo'}</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)' }}>
            {language === 'en' ? 'Edit, delete, or add more platform banners.' : 'Sửa, xóa hoặc thêm các banner quảng cáo nền tảng.'}
          </p>
        </div>
        <RefreshButton onRefresh={onRefresh} isRefreshing={isRefreshing} language={language} />
      </div>

      {adminBanners.length === 0 ? (
        <div className="empty-state" style={{ padding: 24 }}>
          <Image size={28} />
          <p>{language === 'en' ? 'No platform banners yet.' : 'Chưa có banner nền tảng nào.'}</p>
        </div>
      ) : (
        <div className="admin-banner-grid">
          {adminBanners.map((banner) => {
            const imageUrl = getBannerImageUrl(banner);
            return (
              <article className="admin-banner-card" key={banner.id}>
                <div className="admin-banner-card-media">
                  {imageUrl ? <img src={imageUrl} alt="" /> : <Image size={24} />}
                </div>
                <div className="admin-banner-card-body">
                  <strong>{banner.title || (language === 'en' ? 'Untitled banner' : 'Banner chưa có tiêu đề')}</strong>
                  <p>{banner.description || (language === 'en' ? 'No description' : 'Chưa có mô tả')}</p>
                  <span>
                    ID #{banner.id}
                    {banner.endDate ? ` · ${formatDate(banner.endDate)}` : ''}
                  </span>
                </div>
                <div className="admin-banner-card-actions">
                  <button type="button" className="btn-ghost" onClick={() => handleEditBanner(banner)} disabled={isLoading}>
                    <Edit3 size={14} />
                    {language === 'en' ? 'Edit' : 'Sửa'}
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={async () => {
                      const ok = await confirm({
                        title: language === 'en' ? 'Delete banner' : 'Xoá banner',
                        message: language === 'en' ? 'Delete this banner?' : 'Xóa banner này?',
                        confirmLabel: language === 'en' ? 'Delete' : 'Xoá',
                        danger: true,
                      });
                      if (ok) handleDeleteAdminBanner(banner.id);
                    }}
                    disabled={isLoading}
                  >
                    <Trash2 size={14} />
                    {language === 'en' ? 'Delete' : 'Xóa'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderForm = (mode: 'add' | 'edit') => (
    <form onSubmit={mode === 'add' ? onAddSubmit : onEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600 }}>
          {language === 'en' ? 'Package Name' : 'Tên gói'} <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          type="text"
          className="slot-input-text"
          style={{ height: '40px', width: '100%', boxSizing: 'border-box', padding: '0 12px' }}
          value={name}
          onChange={e => setName(e.target.value)}
          required
          placeholder={language === 'en' ? 'e.g. Premium Boost' : 'VD: Gói ưu tiên'}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600 }}>{language === 'en' ? 'Description' : 'Mô tả'}</label>
        <textarea
          className="slot-input-text"
          style={{ minHeight: '80px', width: '100%', boxSizing: 'border-box', padding: '10px 12px', resize: 'vertical' }}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={language === 'en' ? 'Package details' : 'Thông tin gói'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>
            {language === 'en' ? 'Package Type' : 'Loại gói'} <span style={{ color: 'red' }}>*</span>
          </label>
          <select
            className="slot-input-text"
            style={{ height: '40px', width: '100%', boxSizing: 'border-box', padding: '0 12px' }}
            value={type}
            onChange={e => setType(e.target.value as PriorityLevelType)}
          >
            <option value="Listing">Listing</option>
            <option value="Banner">Banner</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>
            {language === 'en' ? 'Price (VND)' : 'Giá (VNĐ)'} <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="number"
            min={0}
            step={1000}
            className="slot-input-text"
            style={{ height: '40px', width: '100%', boxSizing: 'border-box', padding: '0 12px' }}
            value={price}
            onChange={e => setPrice(e.target.value)}
            required
            placeholder="0"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
        {type !== 'Banner' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>
              {language === 'en' ? 'Duration In Days' : 'Thời gian tồn tại (ngày)'} <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="number"
              min={0}
              step={1}
              className="slot-input-text"
              style={{ height: '40px', width: '100%', boxSizing: 'border-box', padding: '0 12px' }}
              value={durationInDays}
              onChange={e => setDurationInDays(e.target.value)}
              required
              placeholder="0"
            />
          </div>
        )}

        {type === 'Banner' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>
              {language === 'en' ? 'Banner Upload Limit' : 'Giới hạn số banner'} <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="number"
              min={0}
              step={1}
              className="slot-input-text"
              style={{ height: '40px', width: '100%', boxSizing: 'border-box', padding: '0 12px' }}
              value={durationForBanner}
              onChange={e => setDurationForBanner(e.target.value)}
              required
              placeholder="0"
            />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="checkbox"
          id={mode === 'add' ? 'isActiveAdd' : 'isActiveEdit'}
          checked={isActive}
          onChange={e => setIsActive(e.target.checked)}
        />
        <label htmlFor={mode === 'add' ? 'isActiveAdd' : 'isActiveEdit'} style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          {language === 'en' ? 'Active' : 'Đang hoạt động'}
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
        <button type="button" className="btn-ghost" onClick={() => mode === 'add' ? setIsAddModalOpen(false) : setIsEditModalOpen(false)}>
          {language === 'en' ? 'Cancel' : 'Hủy'}
        </button>
        <button type="submit" className="btn-primary" style={{ padding: '0 20px' }} disabled={isLoading}>
          {mode === 'add'
            ? (language === 'en' ? 'Create' : 'Thêm mới')
            : (language === 'en' ? 'Save Changes' : 'Lưu thay đổi')}
        </button>
      </div>
    </form>
  );

  return (
    <div className="admin-module animate-fade-in">
      {confirmModal}
      <header className="module-header">
        <div>
          <h1>{language === 'en' ? 'Paid Service Management' : 'Quản lý Dịch vụ Trả phí'}</h1>
          <p>{language === 'en' ? 'Manage listing packages, banner packages, and platform ad banners' : 'Quản lý gói listing, gói banner và banner quảng cáo nền tảng'}</p>
        </div>
        <RefreshButton onRefresh={onRefresh} isRefreshing={isRefreshing} language={language} />
      </header>

      <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper blue"><Zap size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'TOTAL PACKAGES' : 'TỔNG SỐ GÓI'}</span>
            <h2 className="stat-value">{priorityLevels.length}</h2>
          </div>
        </div>

        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper green"><Check size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'ACTIVE PACKAGES' : 'ĐANG HOẠT ĐỘNG'}</span>
            <h2 className="stat-value">{priorityLevels.filter(p => p.isActive).length}</h2>
          </div>
        </div>

        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper orange"><X size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'INACTIVE PACKAGES' : 'TẠM DỪNG'}</span>
            <h2 className="stat-value">{priorityLevels.filter(p => !p.isActive).length}</h2>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={activeTypeTab === 'Listing' ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setActiveTypeTab('Listing')}
            disabled={isLoading}
          >
            {language === 'en' ? 'Listing Packages' : 'Gói Listing'}
          </button>
          <button
            type="button"
            className={activeTypeTab === 'Banner' ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setActiveTypeTab('Banner')}
            disabled={isLoading}
          >
            {language === 'en' ? 'Banner Packages' : 'Gói Banner'}
          </button>
        </div>

        <button className="btn-ghost" disabled={isLoading} onClick={handleOpenAdd}>
          <Plus size={16} />
          {activeTypeTab === 'Banner'
            ? (language === 'en' ? 'Add Banner Package' : 'Thêm gói banner')
            : (language === 'en' ? 'Add Listing Package' : 'Thêm gói listing')}
        </button>
      </div>

      <div className="admin-table-container glass-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{language === 'en' ? 'Package Name' : 'Tên gói'}</th>
              <th>{language === 'en' ? 'Type' : 'Loại'}</th>
              <th>{language === 'en' ? 'Duration' : 'Thời hạn'}</th>
              <th style={{ textAlign: 'right' }}>{language === 'en' ? 'Price' : 'Giá'}</th>
              <th>{language === 'en' ? 'Status' : 'Trạng thái'}</th>
              <th>{language === 'en' ? 'Created Date' : 'Ngày tạo'}</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visiblePriorityLevels.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                  {language === 'en' ? 'No priority packages found.' : 'Chưa có gói nào.'}
                </td>
              </tr>
            ) : (
              pagedPriorityLevels.map(p => (
                <tr key={p.id} className={!p.isActive ? 'blocked-row' : ''}>
                  <td className="font-mono">{p.id}</td>
                  <td>
                    <strong>{p.name}</strong>
                    {p.description && (
                      <div style={{ marginTop: '4px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                        {p.description}
                      </div>
                    )}
                  </td>
                  <td><span className="badge-status">{getPriorityType(p)}</span></td>
                  <td>
                    <div>{p.durationInDays ?? 0} {language === 'en' ? 'days' : 'ngày'}</div>
                    {(getPriorityType(p) === 'Banner' || (p.durationForBanner ?? 0) > 0) && (
                      <div style={{ marginTop: '4px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                        {language === 'en' ? 'Banner limit' : 'Giới hạn banner'}: {p.durationForBanner ?? 0}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <strong className="text-neon-green">{p.price.toLocaleString('vi-VN')} VND</strong>
                  </td>
                  <td>
                    <span className={`badge-status ${p.isActive ? 'active' : 'blocked'}`}>
                      {p.isActive ? (language === 'en' ? 'Active' : 'Hoạt động') : (language === 'en' ? 'Inactive' : 'Tạm dừng')}
                    </span>
                  </td>
                  <td>{formatDate(p.createdAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        className="btn-action-icon"
                        onClick={() => handleOpenDetail(p)}
                        title={language === 'en' ? 'View details' : 'Xem chi tiết'}
                        disabled={isLoading}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn-action-icon unblock"
                        onClick={() => handleOpenEdit(p)}
                        title={language === 'en' ? 'Edit' : 'Sửa'}
                        disabled={isLoading}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        className="btn-action-icon block"
                        onClick={() => handleDelete(p)}
                        title={language === 'en' ? 'Delete' : 'Xóa'}
                        disabled={isLoading}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {visiblePriorityLevels.length > 0 && totalPages > 1 && (
        <div className="admin-pagination">
          <button
            type="button"
            className="btn-icon"
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
            title={language === 'en' ? 'Previous' : 'Trang trước'}
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              type="button"
              key={page}
              className={`admin-pagination-page ${page === currentPage ? 'admin-pagination-page--active' : ''}`}
              onClick={() => goToPage(page)}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            className="btn-icon"
            disabled={currentPage === totalPages}
            onClick={() => goToPage(currentPage + 1)}
            title={language === 'en' ? 'Next' : 'Trang sau'}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {activeTypeTab === 'Banner' && (
        <div style={{ marginTop: '24px', display: 'grid', gap: 20 }}>
          {renderAdminBannerForm()}
          {renderAdminBannerManager()}
        </div>
      )}

      {isAddModalOpen && (
        <div className="listing-detail-backdrop">
          <div className="listing-form-modal glass-card" style={{ maxWidth: '520px', width: '100%' }}>
            <div className="listing-form-header">
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                {language === 'en' ? 'Add Priority Package' : 'Them goi uu tien'}
              </h2>
              <button className="btn-icon" onClick={() => setIsAddModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            {renderForm('add')}
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="listing-detail-backdrop">
          <div className="listing-form-modal glass-card" style={{ maxWidth: '520px', width: '100%' }}>
            <div className="listing-form-header">
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                {language === 'en' ? 'Edit Priority Package' : 'Chinh sua goi uu tien'}
              </h2>
              <button className="btn-icon" onClick={() => setIsEditModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            {renderForm('edit')}
          </div>
        </div>
      )}

      {isDetailModalOpen && detailLevel && (
        <div className="listing-detail-backdrop">
          <div className="listing-form-modal glass-card" style={{ maxWidth: '520px', width: '100%' }}>
            <div className="listing-form-header">
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                {language === 'en' ? 'Package Details' : 'Chi tiet goi'}
              </h2>
              <button className="btn-icon" onClick={() => setIsDetailModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '14px', marginTop: '16px' }}>
              <div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>ID</div>
                <strong className="font-mono">{detailLevel.id}</strong>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                  {language === 'en' ? 'Package Name' : 'Ten goi'}
                </div>
                <strong>{detailLevel.name}</strong>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                  {language === 'en' ? 'Description' : 'Mô tả'}
                </div>
                <span>{detailLevel.description || (language === 'en' ? 'N/A' : 'Không có')}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    {language === 'en' ? 'Type' : 'Loại'}
                  </div>
                  <span className="badge-status">{getPriorityType(detailLevel)}</span>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    {language === 'en' ? 'Status' : 'Trạng thái'}
                  </div>
                  <span className={`badge-status ${detailLevel.isActive ? 'active' : 'blocked'}`}>
                    {detailLevel.isActive ? (language === 'en' ? 'Active' : 'Hoạt động') : (language === 'en' ? 'Inactive' : 'Tạm dừng')}
                  </span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    {language === 'en' ? 'Price' : 'Giá'}
                  </div>
                  <strong className="text-neon-green">{detailLevel.price.toLocaleString('vi-VN')} VND</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    {language === 'en' ? 'Duration In Days' : 'Thời gian tồn tại'}
                  </div>
                  <strong>{detailLevel.durationInDays ?? 0} {language === 'en' ? 'days' : 'ngày'}</strong>
                </div>
              </div>
              {getPriorityType(detailLevel) === 'Banner' && (
                <div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    {language === 'en' ? 'Banner Upload Limit' : 'Giới hạn số banner'}
                  </div>
                  <strong>{detailLevel.durationForBanner ?? 0}</strong>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    {language === 'en' ? 'Created Date' : 'Ngày tạo'}
                  </div>
                  <span>{formatDate(detailLevel.createdAt)}</span>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    {language === 'en' ? 'Updated Date' : 'Ngày cập nhật'}
                  </div>
                  <span>{detailLevel.updatedAt ? formatDate(detailLevel.updatedAt) : (language === 'en' ? 'N/A' : 'Chưa cập nhật')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


