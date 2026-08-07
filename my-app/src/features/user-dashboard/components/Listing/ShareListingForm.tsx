/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, Users, ShieldCheck, ShieldAlert, Plus, Trash2, Clock, Type } from 'lucide-react';
import "../../../shared/ModalShell.css";
import { Select } from '../../../../components/Select';
import { createShareListing, updateShareListing } from './shareListing.api';
import { fetchPriorityLevels, type PriorityLevel } from './priorityLevel.api';
import { fetchWalletAccount } from '../../../wallet/api/wallet.api';
import type { ShareListingPayload } from '../../types';

interface SpaceOption {
  id: number;
  name: string;
}

interface ShareListingFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  spaceOptions: SpaceOption[]; 
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

  const isEditingListing = !!initialData;
  const [priorityLevels, setPriorityLevels] = useState<PriorityLevel[]>([]);
  const [priorityLevelId, setPriorityLevelId] = useState<number | ''>('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    if (isEditingListing) return;
    const loadPriorityLevels = async () => {
      const levels = await fetchPriorityLevels();
      setPriorityLevels(levels);
      if (levels.length > 0) setPriorityLevelId(levels[0].id);
    };
    loadPriorityLevels();

    const loadWalletBalance = async () => {
      try {
        const token = localStorage.getItem('portal_token') || '';
        const wallet = await fetchWalletAccount(token);
        setWalletBalance(wallet.balance);
      } catch (err) {
        console.error("Lỗi lấy số dư ví:", err);
      }
    };
    loadWalletBalance();
  }, [isEditingListing]);

  const [spaceId, setSpaceId] = useState<number | ''>(initialData?.spaceId || '');
  const [name, setName] = useState(initialData?.name || '');
  const [price, setPrice] = useState<number>(initialData?.price || 0);
  const [description, setDescription] = useState(initialData?.description || '');
  const [maxSubRenter, setMaxSubRenter] = useState<number>(initialData?.shareSpaceDetailMaxSubRenter || 1);
  const [isLegalCommitted, setIsLegalCommitted] = useState<boolean>(initialData?.shareSpaceDetailIsLegalCommitted ?? false);

  // Ngày hôm nay (dùng làm mốc so sánh + làm min cho input date)
  const todayStr = getSafeDateString(null);

  const [allowedStartTime, setAllowedStartTime] = useState(() => getSafeDateString(initialData?.allowedStartTime));
  const [allowedEndTime, setAllowedEndTime] = useState(() => {
    if (initialData?.allowedEndTime) return getSafeDateString(initialData.allowedEndTime);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return getSafeDateString(nextMonth);
  });

  // Giá trị gốc của allowedStartTime khi mở form (dùng để biết user có thay đổi ngày bắt đầu hay không khi edit)
  const originalStartTime = initialData?.allowedStartTime
    ? getSafeDateString(initialData.allowedStartTime)
    : null;

  const [selectedAmenities, setSelectedAmenities] = useState<Record<number, { included: boolean; price: number }>>(
    () => {
      const init: Record<number, { included: boolean; price: number }> = {};
      (initialData?.shareSpaceDetailShareSpaceAmenities || []).forEach((a: any) => {
        init[a.amenityId] = { included: a.isIncluded, price: a.price };
      });
      return init;
    }
  );

  const [selectedCategories, setSelectedCategories] = useState<Record<number, { included: boolean; note: string }>>(
    () => {
      const init: Record<number, { included: boolean; note: string }> = {};
      (initialData?.shareSpaceDetailShareSpaceCategories || []).forEach((c: any) => {
        init[c.bussinessCategoryId] = { included: true, note: c.note || '' };
      });
      return init;
    }
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
    setSelectedCategories(prev => ({
      ...prev,
      [catId]: prev[catId]?.included
        ? { ...prev[catId], included: false }
        : { included: true, note: prev[catId]?.note || '' }
    }));
  };

  const setCategoryNote = (catId: number, value: string) => {
    setSelectedCategories(prev => ({ ...prev, [catId]: { ...prev[catId], note: value } }));
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(allowedStartTime);

    // Chỉ chặn khi: đang tạo mới, HOẶC đang edit nhưng người dùng đã đổi ngày bắt đầu sang một giá trị khác
    const startTimeChanged = originalStartTime !== allowedStartTime;
    if ((!initialData || startTimeChanged) && startDate < today) {
      setError('Thời gian bắt đầu không thể nằm trong quá khứ!');
      return;
    }

    if (new Date(allowedEndTime) <= new Date(allowedStartTime)) {
      setError('Thời gian kết thúc phải sau thời gian bắt đầu!');
      return;
    }

    if (!maxSubRenter || maxSubRenter < 1) {
      setError('Số người thuê chung tối đa phải từ 1 trở lên!');
      return;
    }

    if (availabilities.some(slot => slot.daysOfWeek.length === 0 && !slot.specificdate)) {
      setError('Vui lòng chọn ít nhất 1 ngày hoặc ngày cụ thể cho mỗi khung giờ chia sẻ!');
      return;
    }

    const badTimeSlot = availabilities.find(slot => slot.startTime >= slot.endTime);
    if (badTimeSlot) {
      setError('Giờ kết thúc khung giờ chia sẻ phải sau giờ bắt đầu!');
      return;
    }

    const badRangeSlot = availabilities.find(slot => new Date(slot.validFrom) > new Date(slot.validTo));
    if (badRangeSlot) {
      setError('"Áp dụng từ" phải trước hoặc bằng "Áp dụng đến"!');
      return;
    }

    if (!isLegalCommitted) {
      setError('Vui lòng tích "Cam kết pháp lý" để xác nhận thỏa thuận!');
      return;
    }

    if (!isEditingListing && priorityLevelId === '') {
      setError('Vui lòng chọn gói bài đăng!');
      return;
    }

    const chosenPackagePrice = priorityLevels.find(p => p.id === priorityLevelId)?.price ?? 0;
    if (!isEditingListing && walletBalance !== null && walletBalance < chosenPackagePrice) {
      setError(`Số dư ví không đủ để đăng tin! Cần ${chosenPackagePrice.toLocaleString('vi-VN')} VNĐ, ví hiện có ${walletBalance.toLocaleString('vi-VN')} VNĐ.`);
      return;
    }

    setIsLoading(true);

    const payload: ShareListingPayload = {
      spaceId: Number(spaceId),
      name,
      allowedStartTime,
      allowedEndTime,
      description,
      price: Number(price),
      shareSpaceDetailMaxSubRenter: Number(maxSubRenter),
      shareSpaceDetailIsOwner: false, 
      shareSpaceDetailIsLegalCommitted: isLegalCommitted,
      shareSpaceDetailShareSpaceAmenities: Object.entries(selectedAmenities)
        .filter(([, v]) => v.included)
        .map(([amenityId, v]) => ({ amenityId: Number(amenityId), isIncluded: true, price: Number(v.price) || 0 })),
      shareSpaceDetailAvailabilitiesTimes: availabilities.map(slot => ({
        ...slot,
        specificdate: slot.specificdate || null
      })),
      shareSpaceDetailShareSpaceCategories: Object.entries(selectedCategories)
        .filter(([, v]) => v.included)
        .map(([catId, v]) => ({ bussinessCategoryId: Number(catId), note: v.note || '' }))
    };

    try {
      if (initialData) {
        await updateShareListing(initialData.id || initialData.Id, payload);
      } else {
        await createShareListing(payload, chosenPackagePrice);
      }
      onSuccess();
    } catch (err: any) {
        let errorMsg = err.message || 'Lỗi xử lý hệ thống';
        try {
            const parsed = JSON.parse(errorMsg);
            errorMsg = parsed.message || parsed.title || parsed.detail || errorMsg;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch(e) { /* empty */ }
        setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    // Đã xóa inline styles
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

            <div className="form-group">
              <label className="form-label">
                <Type size={14} /> Tên bài đăng <span className="required-mark">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

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

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label"><Users size={14} /> Số người được thuê chung tối đa</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={maxSubRenter}
                  onChange={e => setMaxSubRenter(Number(e.target.value))}
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
                  <ShieldCheck size={14} /> Cam kết pháp lý (có hợp đồng ràng buộc) <span className="required-mark">*</span>
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
                  type="date"
                  className="form-input"
                  value={allowedStartTime}
                  onChange={e => setAllowedStartTime(e.target.value)}
                  disabled={isLoading}
                  min={!initialData ? todayStr : undefined}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Kết thúc</label>
                <input
                  type="date"
                  className="form-input"
                  value={allowedEndTime}
                  onChange={e => setAllowedEndTime(e.target.value)}
                  disabled={isLoading}
                  min={allowedStartTime || todayStr}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">
              <Clock size={14} /> Khung giờ chia sẻ
            </h3>
            {availabilities.map((slot, idx) => (
              <div key={idx} style={{ background: 'rgba(0,0,0,0.02)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '14px', marginBottom: '10px' }}>
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

                <div className="form-group">
                  <label className="form-label">Ngày cụ thể (tùy chọn)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={slot.specificdate || ''}
                    onChange={e => updateSlotField(idx, 'specificdate', e.target.value)}
                    disabled={isLoading}
                    min={!initialData ? todayStr : undefined}
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
                    <input type="date" className="form-input" value={slot.validFrom}
                      onChange={e => updateSlotField(idx, 'validFrom', e.target.value)} disabled={isLoading}
                      min={!initialData ? todayStr : undefined} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Áp dụng đến</label>
                    <input type="date" className="form-input" value={slot.validTo}
                      onChange={e => updateSlotField(idx, 'validTo', e.target.value)} disabled={isLoading}
                      min={slot.validFrom || todayStr} />
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
                        type="number"
                        min="0"
                        className="form-input"
                        style={{ width: 120 }}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {apiCategories.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={!!selectedCategories[c.id]?.included}
                      onChange={() => toggleCategory(c.id)}
                      disabled={isLoading}
                    />
                    <span style={{ flex: 1 }}>{c.name}</span>
                    {selectedCategories[c.id]?.included && (
                      <input
                        type="text"
                        className="form-input"
                        style={{ width: 200 }}
                        placeholder="Ghi chú (tùy chọn)"
                        value={selectedCategories[c.id]?.note || ''}
                        onChange={e => setCategoryNote(c.id, e.target.value)}
                        disabled={isLoading}
                      />
                    )}
                  </div>
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