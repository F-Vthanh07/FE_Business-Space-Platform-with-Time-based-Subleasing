/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, FileText, Camera, Plus, Trash2 } from 'lucide-react';
import { VerificationWarningBanner, useIdentityVerification } from '../../identity-verification';
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
  const { isVerified } = useIdentityVerification();

  // --- STATE DỮ LIỆU CƠ BẢN ---
  const [spaceId, setSpaceId] = useState<number | ''>(initialData?.spaceId || '');
  const [price, setPrice] = useState<number>(initialData?.price || 0);
  const [description, setDescription] = useState(initialData?.description || '');
  
  // --- STATE DÀNH RIÊNG CHO TẢI ẢNH (API /api/Picture) ---
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // Lưu file thật để gửi BE
  const [previewUrls, setPreviewUrls] = useState<string[]>([]); // Lưu link ảo để hiện lên màn hình FE

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

  // Xử lý khi người dùng chọn file từ máy
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    
    // Lưu file vào mảng để chờ Submit
    setSelectedFiles(prev => [...prev, ...filesArray]);
    
    // Tạo link ảo xem trước
    const newUrls = filesArray.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newUrls]);
    
    e.target.value = ''; // Xóa value input để lần sau chọn lại ảnh cũ vẫn nhận
  };

  // Xóa ảnh trước khi Submit
  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== indexToRemove));
    setPreviewUrls(prev => {
      const newUrls = [...prev];
      URL.revokeObjectURL(newUrls[indexToRemove]); // Giải phóng bộ nhớ ảo
      newUrls.splice(indexToRemove, 1);
      return newUrls;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (spaceId === '') return alert('Vui lòng chọn mặt bằng!');

    setIsLoading(true);
    const token = localStorage.getItem('portal_token');
    const ownerId = localStorage.getItem('current_user_id'); // Lấy thẳng từ Local Storage

    // Check nhẹ một cái, nếu lỡ mất ID thì bắt đăng nhập lại
    if (!ownerId || !token) {
      alert("Phiên đăng nhập đã hết hạn hoặc không tìm thấy ID. Vui lòng đăng nhập lại!");
      setIsLoading(false);
      return;
    }

    try {
      // ==========================================
      // BƯỚC 1: GỌI API TẠO BÀI ĐĂNG (LISTING)
      // ==========================================
      const isEditing = !!initialData;
      const targetId = initialData?.id || initialData?.Id;
      const url = isEditing
        ? `https://flexi-space-capstone-project.onrender.com/api/Listing/Update/${targetId}`
        : `https://flexi-space-capstone-project.onrender.com/api/Listing/Create`;

      const listingPayload = {
        spaceId: Number(spaceId),
        allowedStartTime: allowedStartTime.substring(0, 10), // Đã ép kiểu DateOnly chuẩn YYYY-MM-DD
        allowedEndTime: allowedEndTime.substring(0, 10),
        description: description,
        price: Number(price),
        listingPictures: [] // Truyền rỗng ở đây vì ảnh sẽ được xử lý riêng ở Bước 2
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
        alert(`Lỗi tạo bài đăng: ${errData.title || 'Kiểm tra Console log'}`);
        setIsLoading(false);
        return;
      }

      // Xử lý lấy ID của bài đăng vừa tạo để gửi kèm với hình ảnh
      const textRes = await res.text();
      let createdListingId = targetId; // Mặc định dùng targetId nếu đang edit
      
      if (!isEditing && textRes) {
        try {
          const resData = JSON.parse(textRes);
          // Dự phòng các format BE trả về: { id: 1 }, { data: { id: 1 } }, hoặc trả thẳng số 1
          createdListingId = resData.id || resData.data?.id || resData; 
        } catch {
          createdListingId = textRes;
        }
      }

      // ==========================================
      // BƯỚC 2: GỌI API UP ẢNH NẾU CÓ CHỌN FILE
      // ==========================================
      if (selectedFiles.length > 0 && createdListingId) {
        const formData = new FormData();
        
        // Nhét file vào
        selectedFiles.forEach(file => {
          formData.append('file', file);
        });
        
        // CHỈ GỬI ĐÚNG MỘT MÌNH LISTING ID (Đúng chuẩn ý đồ của BE)
        formData.append('listingId', createdListingId.toString());

        // Bỏ hết mấy dòng append spaceId hay userProfileId đi nhé!

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
          alert('Bài đăng tạo thành công nhưng đẩy ảnh thất bại (Check API Picture)!');
        }
      }

      // Hoàn thành cả 2 bước thành công mĩ mãn
      onSuccess();

    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="listing-form-backdrop">
      <div className="listing-form-modal">
        <div className="listing-form-header">
          <div className="listing-form-title-area">
            <div className="listing-form-icon-wrap"><FileText size={18} /></div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                {initialData ? 'Cập nhật bài đăng' : 'Tạo bài đăng cho thuê'}
              </h2>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} disabled={isLoading} style={{ width: 32, height: 32 }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!isVerified && <VerificationWarningBanner />}
          
          <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Chọn mặt bằng vật lý <span style={{ color: 'red' }}>*</span></label>
              <select 
                className="form-select-input" 
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Đơn giá cơ bản (VNĐ) <span style={{ color: 'red' }}>*</span></label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <DollarSign size={16} style={{ position: 'absolute', left: 12, color: 'var(--color-text-secondary)' }} />
                <input 
                  type="number" 
                  min="0"
                  className="slot-input-text" 
                  style={{ paddingLeft: 36, height: 40, width: '100%', boxSizing: 'border-box' }}
                  value={price} 
                  onChange={e => setPrice(Number(e.target.value))} 
                  required
                />
              </div>
            </div>
          </div>

          {/* KHU VỰC THÊM HÌNH ẢNH (UPLOAD TRỰC TIẾP LÊN BACKEND CỦA ÔNG) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Camera size={14} /> Hình ảnh bài đăng
            </label>
            
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
                style={{ height: 36, padding: '0 16px', display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer' }}
              >
                <Plus size={14} /> Chọn ảnh từ máy
              </label>
            </div>

            {/* Render ảnh Preview ảo */}
            {previewUrls.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                {previewUrls.map((url, index) => (
                  <div key={index} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                    <img src={url} alt={`preview-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button 
                      type="button" 
                      onClick={() => handleRemoveFile(index)}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,0,0,0.8)', border: 'none', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Thời gian bắt đầu</label>
              <input 
                type="datetime-local" 
                className="slot-input-text" 
                style={{ height: 40, width: '100%', boxSizing: 'border-box' }}
                value={allowedStartTime}
                onChange={e => setAllowedStartTime(e.target.value)} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Thời gian kết thúc</label>
              <input 
                type="datetime-local" 
                className="slot-input-text" 
                style={{ height: 40, width: '100%', boxSizing: 'border-box' }}
                value={allowedEndTime}
                onChange={e => setAllowedEndTime(e.target.value)} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Tiêu đề / Mô tả <span style={{ color: 'red' }}>*</span></label>
            <textarea 
              className="slot-input-text"
              style={{ minHeight: '80px', paddingTop: 10, resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" className="btn-ghost" onClick={onClose} disabled={isLoading}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={isLoading} style={{ padding: '0 24px' }}>
              {isLoading ? 'Đang xử lý...' : (initialData ? 'Lưu thay đổi' : 'Đăng tin')}
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
};