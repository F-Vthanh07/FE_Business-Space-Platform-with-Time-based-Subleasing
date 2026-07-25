/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, FileText, Camera, Plus, Trash2, Calendar, ShieldAlert, Users, ShieldCheck, Clock } from 'lucide-react';
import { VerificationWarningBanner, useIdentityVerification } from '../../../identity-verification';
import "../../../shared/ModalShell.css";
import './ListingForm.css';
import { createShareListing, updateShareListing } from './shareListing.api';
import type { ShareListingPayload } from '../../types';

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

const getSafeDateString = (dateString: any) => {
  try {
    if (!dateString) return new Date().toISOString().slice(0, 16);
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return new Date().toISOString().slice(0, 16);
    return date.toISOString().slice(0, 16);
  } catch {
    return new Date().toISOString().slice(0, 16);
  }
};

const getSafeDateOnly = (dateString: any) => {
  try {
    if (!dateString) return new Date().toISOString().slice(0, 10);
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
    return date.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

export const ListingForm: React.FC<ListingFormProps> = ({ onClose, onSuccess, initialData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [mySpaces, setMySpaces] = useState<any[]>([]);
  const [error, setError] = useState('');
  const { isVerified } = useIdentityVerification();

  // --- Loại tin: dài hạn hay chia sẻ ---
  // Nếu đang sửa 1 tin có shareSpaceDetail -> mặc định mở lại ở chế độ 'share'
  const initialMode: ListingMode = initialData?.shareSpaceDetailMaxSubRenter !== undefined ? 'share' : 'longterm';
  const [mode, setMode] = useState<ListingMode>(initialMode);

  const [spaceId, setSpaceId] = useState<number | ''>(initialData?.spaceId || '');
  const [price, setPrice] = useState<number>(initialData?.price || 0);
  const [description, setDescription] = useState(initialData?.description || '');

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [allowedStartTime, setAllowedStartTime] = useState(() => getSafeDateString(initialData?.allowedStartTime));
  const [allowedEndTime, setAllowedEndTime] = useState(() => {
    if (initialData?.allowedEndTime) return getSafeDateString(initialData.allowedEndTime);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return getSafeDateString(nextMonth);
  });

  // --- Field riêng cho chế độ "share" ---
  const [maxSubRenter, setMaxSubRenter] = useState<number>(initialData?.shareSpaceDetailMaxSubRenter || 1);
  const [isLegalCommitted, setIsLegalCommitted] = useState<boolean>(initialData?.shareSpaceDetailIsLegalCommitted ?? false);
  const [availabilities, setAvailabilities] = useState<any[]>(
    initialData?.shareSpaceDetailAvailabilitiesTimes?.length
      ? initialData.shareSpaceDetailAvailabilitiesTimes
      : [{ daysOfWeek: [], specificdate: '', startTime: '08:00', endTime: '12:00', validFrom: getSafeDateOnly(null), validTo: getSafeDateOnly(null) }]
  );

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
          setMySpaces(Array.isArray(data) ? data : (data?.data || []));
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách mặt bằng:", err);
      }
    };
    fetchSpaces();
  }, []);

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

  // --- Helper cho khung giờ share ---
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
    setAvailabilities(prev => prev.map((slot, i) => i === slotIndex ? { ...slot, [field]: value } : slot));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (spaceId === '') {
      setError('Vui lòng chọn mặt bằng!');
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
      const allowedEnd = new Date(allowedEndTime.substring(0, 10));
      const allowedStart = new Date(allowedStartTime.substring(0, 10));
      const badSlot = availabilities.find(slot => {
        const vFrom = new Date(slot.validFrom);
        const vTo = new Date(slot.validTo);
        return vTo > allowedEnd || vFrom < allowedStart || vFrom > vTo;
     });
      if (badSlot) {
        setError(
          `Khung giờ "Áp dụng từ ${badSlot.validFrom} đến ${badSlot.validTo}" phải nằm trong khoảng thời gian hiệu lực bài đăng (${allowedStartTime.substring(0,10)} → ${allowedEndTime.substring(0,10)})!`
        );
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

    // ===== NHÁNH 1: CHIA SẺ MẶT BẰNG =====
    if (mode === 'share') {
      const sharePayload: ShareListingPayload = {
        spaceId: Number(spaceId),
        allowedStartTime: allowedStartTime.substring(0, 10),
        allowedEndTime: allowedEndTime.substring(0, 10),
        description,
        price: Number(price),
        shareSpaceDetailMaxSubRenter: Number(maxSubRenter),
        shareSpaceDetailIsOwner: false,
        shareSpaceDetailIsLegalCommitted: isLegalCommitted,
        shareSpaceDetailShareSpaceAmenities: [],
        shareSpaceDetailAvailabilitiesTimes: availabilities.map(slot => ({
          ...slot,
          specificdate: slot.specificdate || null
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
          const created = await createShareListing(sharePayload);
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

        onSuccess();
      } catch (err: any) {
        setError(err.message || 'Lỗi tạo bài đăng chia sẻ');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // ===== NHÁNH 2: CHO THUÊ DÀI HẠN (logic cũ) =====
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
        : `https://flexi-space-capstone-project.onrender.com/api/Listing/Create`;

      const listingPayload = {
        spaceId: Number(spaceId),
        allowedStartTime: allowedStartTime.substring(0, 10),
        allowedEndTime: allowedEndTime.substring(0, 10),
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
        const errData = await res.json().catch(() => ({}));
        setError(`Lỗi tạo bài đăng: ${errData.title || 'Kiểm tra Console log'}`);
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

      onSuccess();
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
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
                <select
                  className="form-select-input form-select-input--flat"
                  value={spaceId}
                  onChange={(e) => setSpaceId(Number(e.target.value))}
                  required
                  disabled={isLoading || !!initialData}
                >
                  <option value="">-- Chọn mặt bằng --</option>
                  {mySpaces.map(s => (
                    <option key={s.id || s.Id} value={s.id || s.Id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Đơn giá {mode === 'share' ? 'chia sẻ' : 'cơ bản'} (VNĐ) <span className="required-mark">*</span>
                </label>
                <div className="input-with-icon">
                  <DollarSign size={14} className="input-icon" />
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={price}
                    onChange={e => setPrice(Number(e.target.value))}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </div>

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
                    <ShieldCheck size={14} /> Cam kết pháp lý <span className="required-mark">*</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="form-section">
              <h3 className="form-section-title">Hình ảnh bài đăng (Tùy chọn)</h3>
              <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '16px' }}>
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
                  {previewUrls.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {previewUrls.map((url, index) => (
                        <div key={index} className="listing-image-preview">
                          <img src={url} alt={`preview-${index}`} />
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="listing-image-remove-btn"
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
                <div className="input-with-icon">
                  <Calendar size={14} className="input-icon" />
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={allowedStartTime}
                    onChange={e => setAllowedStartTime(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label"><Calendar size={14} /> Thời gian kết thúc</label>
                <div className="input-with-icon">
                  <Calendar size={14} className="input-icon" />
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={allowedEndTime}
                    onChange={e => setAllowedEndTime(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Khung giờ chia sẻ — chỉ hiện ở mode share */}
          {mode === 'share' && (
            <div className="form-section">
              <h3 className="form-section-title">
                <Clock size={14} /> Khung giờ chia sẻ
              </h3>
              {availabilities.map((slot, idx) => (
                <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '14px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        type="button" key={day}
                        className={`filter-tab ${slot.daysOfWeek.includes(day) ? 'filter-tab--active' : ''}`}
                        onClick={() => toggleDayInSlot(idx, day)}
                        disabled={isLoading}
                      >
                        {DAYS_LABEL_VI[day]}
                      </button>
                    ))}
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
                      <input type="date" className="form-input" value={slot.validFrom}
                        min={allowedStartTime.substring(0, 10)}
                        onChange={e => updateSlotField(idx, 'validFrom', e.target.value)} disabled={isLoading} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Áp dụng đến</label>
                      <input type="date" className="form-input" value={slot.validTo} 
                      max={allowedEndTime.substring(0, 10)}
                        onChange={e => updateSlotField(idx, 'validTo', e.target.value)} disabled={isLoading} />
                    </div>
                  </div>
                  {availabilities.length > 1 && (
                    <button type="button" className="btn-ghost" style={{ color: 'var(--color-negative)' }} onClick={() => removeSlot(idx)}>
                      <Trash2 size={13} /> Xóa khung giờ này
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="btn-ghost" onClick={addSlot} disabled={isLoading}>
                <Plus size={14} /> Thêm khung giờ khác
              </button>
            </div>
          )}

          <div className="form-section">
            <h3 className="form-section-title">Tiêu đề / Mô tả</h3>
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