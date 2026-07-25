/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, Users, ShieldCheck, ShieldAlert, Plus, Trash2, Clock } from 'lucide-react';
import "../../../shared/ModalShell.css";
import type { ShareListingPayload } from '../../types';
import { createShareListing, updateShareListing } from './shareListing.api';

interface SpaceOption {
  id: number;
  name: string;
}

interface ShareListingFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  spaceOptions: SpaceOption[]; // Danh sách mặt bằng B đang thuê (lấy từ hợp đồng đang active)
  apiCategories: { id: number; name: string }[];
  apiAmenities: { id: number; name: string }[];
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_LABEL_VI: Record<string, string> = {
  Monday: 'T2', Tuesday: 'T3', Wednesday: 'T4', Thursday: 'T5',
  Friday: 'T6', Saturday: 'T7', Sunday: 'CN'
};

const getSafeDateString = (dateString: any) => {
  try {
    if (!dateString) return new Date().toISOString().slice(0, 10);
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
    return date.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

export const ShareListingForm: React.FC<ShareListingFormProps> = ({
  onClose, onSuccess, initialData, spaceOptions, apiCategories, apiAmenities
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [spaceId, setSpaceId] = useState<number | ''>(initialData?.spaceId || '');
  const [price, setPrice] = useState<number>(initialData?.price || 0);
  const [description, setDescription] = useState(initialData?.description || '');
  const [maxSubRenter, setMaxSubRenter] = useState<number>(initialData?.shareSpaceDetailMaxSubRenter || 1);
  const [isLegalCommitted, setIsLegalCommitted] = useState<boolean>(initialData?.shareSpaceDetailIsLegalCommitted ?? false);

  const [allowedStartTime, setAllowedStartTime] = useState(() => getSafeDateString(initialData?.allowedStartTime));
  const [allowedEndTime, setAllowedEndTime] = useState(() => {
    if (initialData?.allowedEndTime) return getSafeDateString(initialData.allowedEndTime);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return getSafeDateString(nextMonth);
  });

  const [selectedAmenities, setSelectedAmenities] = useState<Record<number, { included: boolean; price: number }>>(
    () => {
      const init: Record<number, { included: boolean; price: number }> = {};
      (initialData?.shareSpaceDetailShareSpaceAmenities || []).forEach((a: any) => {
        init[a.amenityId] = { included: a.isIncluded, price: a.price };
      });
      return init;
    }
  );

  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    (initialData?.shareSpaceDetailShareSpaceCategories || []).map((c: any) => c.bussinessCategoryId)
  );

  const [availabilities, setAvailabilities] = useState<any[]>(
    initialData?.shareSpaceDetailAvailabilitiesTimes?.length
      ? initialData.shareSpaceDetailAvailabilitiesTimes
      : [{ daysOfWeek: [], specificdate: '', startTime: '08:00', endTime: '12:00', validFrom: getSafeDateString(null), validTo: getSafeDateString(null) }]
  );

  const toggleAmenity = (amenityId: number) => {
    setSelectedAmenities(prev => ({
      ...prev,
      [amenityId]: prev[amenityId]?.included
        ? { ...prev[amenityId], included: false }
        : { included: true, price: prev[amenityId]?.price || 0 }
    }));
  };

  const setAmenityPrice = (amenityId: number, value: number) => {
    setSelectedAmenities(prev => ({ ...prev, [amenityId]: { ...prev[amenityId], price: value } }));
  };

  const toggleCategory = (catId: number) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
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
    setAvailabilities(prev => prev.map((slot, i) => i === slotIndex ? { ...slot, [field]: value } : slot));
  };

  const addSlot = () => {
    setAvailabilities(prev => [...prev, {
      daysOfWeek: [], specificdate: '', startTime: '08:00', endTime: '12:00',
      validFrom: getSafeDateString(null), validTo: getSafeDateString(null)
    }]);
  };

  const removeSlot = (slotIndex: number) => {
    setAvailabilities(prev => prev.filter((_, i) => i !== slotIndex));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (spaceId === '') {
      setError('Vui lòng chọn mặt bằng đang thuê để chia sẻ!');
      return;
    }
    if (availabilities.some(slot => slot.daysOfWeek.length === 0 && !slot.specificdate)) {
      setError('Vui lòng chọn ít nhất 1 ngày hoặc ngày cụ thể cho mỗi khung giờ chia sẻ!');
      return;
    }

    setIsLoading(true);

    const payload: ShareListingPayload = {
      spaceId: Number(spaceId),
      allowedStartTime,
      allowedEndTime,
      description,
      price: Number(price),
      shareSpaceDetailMaxSubRenter: Number(maxSubRenter),
      shareSpaceDetailIsOwner: false, // B không phải chủ gốc, đang chia sẻ lại phần đang thuê
      shareSpaceDetailIsLegalCommitted: isLegalCommitted,
      shareSpaceDetailShareSpaceAmenities: Object.entries(selectedAmenities)
        .filter(([, v]) => v.included)
        .map(([amenityId, v]) => ({ amenityId: Number(amenityId), isIncluded: true, price: Number(v.price) || 0 })),
      shareSpaceDetailAvailabilitiesTimes: availabilities.map(slot => ({
        ...slot,
        specificdate: slot.specificdate || null
        })),
      shareSpaceDetailShareSpaceCategories: selectedCategories.map(id => ({ bussinessCategoryId: id }))
    };

    try {
      if (initialData) {
        await updateShareListing(initialData.id || initialData.Id, payload);
      } else {
        await createShareListing(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="modal-backdrop">
      <div className="modal-shell modal-shell--wide">

        <div className="modal-header">
          <div className="modal-title-area">
            <div className="modal-icon-wrap modal-icon-wrap--green"><Users size={16} /></div>
            <div>
              <h2 className="modal-title">
                {initialData ? 'Cập nhật mặt bằng chia sẻ' : 'Chia sẻ lại mặt bằng đang thuê'}
              </h2>
              <p className="modal-subtitle text-secondary">Chia sẻ khung giờ hoặc diện tích dư cho người thuê khác</p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} disabled={isLoading}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">

          <div className="form-section">
            <h3 className="form-section-title">Thông tin cơ bản</h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">
                  Mặt bằng đang thuê <span className="required-mark">*</span>
                </label>
                <select
                  className="form-select-input form-select-input--flat"
                  value={spaceId}
                  onChange={(e) => setSpaceId(Number(e.target.value))}
                  required
                  disabled={isLoading || !!initialData}
                >
                  <option value="">-- Chọn mặt bằng --</option>
                  {spaceOptions.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Đơn giá chia sẻ (VNĐ) <span className="required-mark">*</span>
                </label>
                <div className="input-with-icon">
                  <DollarSign size={14} className="input-icon" />
                  <input
                    type="number" min="0" className="form-input"
                    value={price} onChange={e => setPrice(Number(e.target.value))}
                    disabled={isLoading} required
                  />
                </div>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label"><Users size={14} /> Số người được thuê chung tối đa</label>
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
                  <ShieldCheck size={14} /> Cam kết pháp lý (có hợp đồng ràng buộc)
                </label>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Thời gian hiệu lực bài chia sẻ</h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Bắt đầu</label>
                <input
                  type="date" className="form-input"
                  value={allowedStartTime} onChange={e => setAllowedStartTime(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Kết thúc</label>
                <input
                  type="date" className="form-input"
                  value={allowedEndTime} onChange={e => setAllowedEndTime(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

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
                      onChange={e => updateSlotField(idx, 'validFrom', e.target.value)} disabled={isLoading} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Áp dụng đến</label>
                    <input type="date" className="form-input" value={slot.validTo}
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

          {apiAmenities.length > 0 && (
            <div className="form-section">
              <h3 className="form-section-title">Tiện ích đi kèm</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {apiAmenities.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={!!selectedAmenities[a.id]?.included}
                      onChange={() => toggleAmenity(a.id)}
                      disabled={isLoading}
                    />
                    <span style={{ flex: 1 }}>{a.name}</span>
                    {selectedAmenities[a.id]?.included && (
                      <input
                        type="number" min="0" className="form-input" style={{ width: 120 }}
                        placeholder="Phụ phí"
                        value={selectedAmenities[a.id]?.price || 0}
                        onChange={e => setAmenityPrice(a.id, Number(e.target.value))}
                        disabled={isLoading}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {apiCategories.length > 0 && (
            <div className="form-section">
              <h3 className="form-section-title">Ngành nghề được phép thuê chung</h3>
              <div className="meta-badges">
                {apiCategories.map(c => (
                  <button
                    type="button" key={c.id}
                    className={`badge badge-sm ${selectedCategories.includes(c.id) ? 'badge--accent' : 'badge--neutral'}`}
                    onClick={() => toggleCategory(c.id)}
                    disabled={isLoading}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-section">
            <h3 className="form-section-title">Mô tả</h3>
            <div className="form-group">
              <label className="form-label">
                Nội dung mô tả <span className="required-mark">*</span>
              </label>
              <textarea
                className="form-textarea form-textarea--flat"
                value={description} onChange={e => setDescription(e.target.value)}
                disabled={isLoading} required
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
            <button type="button" className="btn-ghost cancel-btn" onClick={onClose} disabled={isLoading}>Hủy</button>
            <button type="submit" className="btn-primary submit-btn" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : (initialData ? 'Lưu thay đổi' : 'Đăng chia sẻ')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};