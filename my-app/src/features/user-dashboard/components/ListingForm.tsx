/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, FileText, Camera, Plus, Trash2, Calendar, ShieldAlert } from 'lucide-react';
import { VerificationWarningBanner, useIdentityVerification } from '../../identity-verification';
import '../../shared/ModalShell.css';
import './ListingForm.css';

interface ListingFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

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

export const ListingForm: React.FC<ListingFormProps> = ({ onClose, onSuccess, initialData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [mySpaces, setMySpaces] = useState<any[]>([]);
  const [error, setError] = useState('');
  const { isVerified } = useIdentityVerification();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (spaceId === '') {
      setError('Vui lòng chọn mặt bằng!');
      return;
    }

    setIsLoading(true);
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
            <div className="modal-icon-wrap modal-icon-wrap--green"><FileText size={16} /></div>
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
                  Đơn giá cơ bản (VNĐ) <span className="required-mark">*</span>
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
            <h3 className="form-section-title">Thời gian cho thuê</h3>
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
              {isLoading ? 'Đang xử lý...' : (initialData ? 'Lưu thay đổi' : 'Đăng tin')}
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
};