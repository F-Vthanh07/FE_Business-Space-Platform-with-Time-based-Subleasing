/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { X, Building2, Check, ShieldAlert, Briefcase, Camera, Plus, Trash2 } from 'lucide-react';
import { useThemeLanguage } from '../../../../context/ThemeLanguageContext';
import { VerificationWarningBanner, useIdentityVerification } from '../../../identity-verification';
import '../../../shared/ModalShell.css';
import './SpaceForm.css';

interface SpacePartFormProps {
  onClose: () => void;
  onSubmit: (data?: any) => void;
  initialData?: any;
  parentSpace: any; // Dữ liệu space gốc, bắt buộc phải có để lấy parentSpace.id, latitude, longitude
}

const AMENITIES_IDS = ['wifi', 'ac', 'parking', 'wc', 'projector', 'sound'];



export const SpacePartForm: React.FC<SpacePartFormProps> = ({ onClose, onSubmit, initialData, parentSpace }) => {
  const { t } = useThemeLanguage();
  const { isVerified } = useIdentityVerification();

  const [name, setName] = useState(initialData?.name || '');
  const [area, setArea] = useState(initialData?.area?.toString().replace(/[^\d]/g, '') || '');

  const initialAmenities = (initialData?.amenities || []).map((a: any) => a.name || a);
  const initialCustomAmenities = initialAmenities.filter((a: string) => !AMENITIES_IDS.includes(a));
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    initialAmenities.filter((a: string) => AMENITIES_IDS.includes(a))
  );
  const [customAmenityChecked, setCustomAmenityChecked] = useState(initialCustomAmenities.length > 0);
  const [customAmenityText, setCustomAmenityText] = useState(initialCustomAmenities.join(', '));

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>(initialData?.pictureURLs || initialData?.spacePictures || initialData?.pictures || []);


  const [apiCategories, setApiCategories] = useState<any[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const initialCat = initialData?.spaceAllowedCategories?.[0]?.bussinessCategoryId || '';
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>(initialCat);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      setIsCategoriesLoading(true);
      try {
        const res = await fetch('https://flexi-space-capstone-project.onrender.com/api/BussinessCategory/GetAll', {
          headers: { 'accept': '*/*' }
        });
        if (res.ok) {
          const data = await res.json();
          setApiCategories(Array.isArray(data) ? data : (data?.items || []));
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách ngành nghề:", err);
      } finally {
        setIsCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);


  const handleAmenityToggle = (id: string) => {
    setSelectedAmenities(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    setSelectedFiles(prev => [...prev, ...filesArray]);

    const newPreviewUrls = filesArray.map(f => URL.createObjectURL(f));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      const urls = [...prev];
      URL.revokeObjectURL(urls[index]);
      return urls.filter((_, i) => i !== index);
    });
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !name.trim()) {
      setError('Vui lòng nhập tên không gian.');
      return;
    }

    const numArea = Number(area);
    if (!area || isNaN(numArea) || numArea <= 0) {
      setError('Diện tích phải là số lớn hơn 0.');
      return;
    }

    if (!parentSpace || !parentSpace.id) {
      setError('Lỗi: Không tìm thấy ID của space gốc.');
      return;
    }
    


    setIsLoading(true);

    const token = localStorage.getItem('portal_token');

    const customAmenities = customAmenityChecked
      ? customAmenityText
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
      : [];
    const allAmenities = [...selectedAmenities, ...customAmenities];

    const payload = {
      name: name,
      area: Number(area),
      isActive: true,
      latitude: parentSpace.latitude || 0,
      longitude: parentSpace.longitude || 0,
      amenities: allAmenities.map(am => ({
        name: am,
        quantity: 1,
        isActive: true
      })),

      spaceAllowedCategories: selectedCategoryId !== ''
        ? [{ bussinessCategoryId: selectedCategoryId }]
        : []
    };

    try {
      const isEditing = !!initialData;
      const url = isEditing
        ? `https://flexi-space-capstone-project.onrender.com/api/SpacePart/Update/${initialData.id}`
        : `https://flexi-space-capstone-project.onrender.com/api/SpacePart/Create/${parentSpace.id}`;

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'accept': '*/*'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        let errorMessage = errText;
        try {
          const errData = JSON.parse(errText);
          errorMessage = errData.message || errData.title || errText;
        } catch (e) {}
        
        if (!errorMessage) {
            errorMessage = 'Có lỗi xảy ra, vui lòng thử lại.';
        }
        throw new Error(errorMessage);
      }

      let createdSpaceId = initialData?.id || initialData?.Id;
      if (!isEditing) {
          const text = await response.text();
          try {
              const data = JSON.parse(text);
              createdSpaceId = data.id || data.Id || data;
          } catch (e) {
              createdSpaceId = text;
          }
      }

      if (selectedFiles.length > 0 && createdSpaceId) {
          const formData = new FormData();
          selectedFiles.forEach(file => formData.append('file', file));
          formData.append('spaceId', createdSpaceId.toString());

          const picRes = await fetch('https://flexi-space-capstone-project.onrender.com/api/Picture', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' },
            body: formData
          });

          if (!picRes.ok) {
            console.error("LỖI UP ẢNH:", await picRes.text());
            setError('Không gian chia nhỏ đã lưu nhưng đẩy ảnh thất bại!');
            setIsLoading(false);
            return;
          }
      }

      onSubmit();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="glass-card modal-shell animate-in">

        <div className="modal-header">
          <div className="modal-title-area">
            <div className="modal-icon-wrap modal-icon-wrap--blue"><Building2 size={16} /></div>
            <div>
              <h2 className="modal-title">{initialData ? 'Chỉnh sửa không gian' : 'Tạo không gian con'}</h2>
              <p className="modal-subtitle text-secondary">Thuộc không gian: {parentSpace?.name}</p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} disabled={isLoading}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {!isVerified && <VerificationWarningBanner />}

          <div className="form-section">
            <h3 className="form-section-title">{t('spaceForm.formSectionBasic')}</h3>

            <div className="form-group">
              <label className="form-label">{t('spaceForm.formLabelSpaceName')}</label>
              <div className="input-with-icon">
                <Building2 size={14} className="input-icon" />
                <input type="text" placeholder={t('spaceForm.formPlaceholderSpaceName')} value={name} onChange={(e) => setName(e.target.value)} className="form-input" disabled={isLoading} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('spaceForm.formLabelArea') || 'Diện tích (m²)'}</label>
              <div className="input-with-icon">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="VD: 50"
                  value={area}
                  onChange={(e) => setArea(e.target.value.replace(/[^\d]/g, ''))}
                  className="form-input"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-section">
              <h3 className="form-section-title">{t('spaceForm.formSectionAmenities')} (Tùy chọn)</h3>

              <div className="checkbox-list">
                {AMENITIES_IDS.map(id => {
                  const isChecked = selectedAmenities.includes(id);
                  return (
                    <label key={id} className={`checkbox-item ${isChecked ? 'checkbox-item--checked' : ''}`}>
                      <input type="checkbox" checked={isChecked} onChange={() => handleAmenityToggle(id)} className="hidden-checkbox" disabled={isLoading} />
                      <span className="checkbox-indicator">{isChecked && <Check size={10} />}</span>
                      <span className="checkbox-label">{t('amenity.' + id)}</span>
                    </label>
                  );
                })}

                <label
                  className={`checkbox-item ${customAmenityChecked ? 'checkbox-item--checked' : ''}`}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).tagName === 'INPUT' && (e.target as HTMLInputElement).type === 'text') {
                      e.stopPropagation();
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={customAmenityChecked}
                    onChange={() => setCustomAmenityChecked(prev => !prev)}
                    className="hidden-checkbox"
                    disabled={isLoading}
                  />
                  <span className="checkbox-indicator">{customAmenityChecked && <Check size={10} />}</span>
                  <input
                    type="text"
                    value={customAmenityText}
                    onChange={(e) => setCustomAmenityText(e.target.value)}
                    onFocus={() => !customAmenityChecked && setCustomAmenityChecked(true)}
                    placeholder="Tiện ích khác..."
                    disabled={isLoading}
                    className="checkbox-label"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'inherit',
                      width: '100%',
                      font: 'inherit'
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Ngành nghề cho phép (Tùy chọn)</h3>

              <div className="form-group" style={{ marginTop: '8px' }}>
                <div className="input-with-icon">
                  <Briefcase size={14} className="input-icon" />
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="form-select-input"
                    disabled={isLoading || isCategoriesLoading}
                  >
                    <option value="">
                      {isCategoriesLoading ? 'Đang tải ngành nghề...' : 'Không (Không thiết lập)'}
                    </option>
                    {apiCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="section-desc text-secondary" style={{ marginTop: '8px' }}>
                Nếu chọn "Không", mặt bằng này sẽ không có ràng buộc ngành nghề.
              </p>
            </div>
          </div>



          <div className="form-section">
              <h3 className="form-section-title">Hình ảnh (Tùy chọn)</h3>
              <div style={{ background: 'rgba(0,0,0,0.02)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '16px' }}>
                <div className="form-group" style={{ gap: '10px' }}>
                  <label className="form-label"><Camera size={14} /> Chọn ảnh từ máy</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      id="spacepart-file-upload"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                    <label
                      htmlFor="spacepart-file-upload"
                      className="btn-primary"
                      style={{ height: 36, padding: '0 16px', display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer', width: 'fit-content' }}
                    >
                      <Plus size={14} /> Chọn ảnh từ máy
                    </label>
                  </div>
                  {(existingImages.length > 0 || previewUrls.length > 0) && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {existingImages.map((img: any, index: number) => {
                        const url = typeof img === 'string' ? img : (img.imageUrl || img.url || img.pictureUrl);
                        return (
                          <div key={`existing-${index}`} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                            <img src={url} alt={`existing-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingImage(index)}
                              style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                              disabled={isLoading}
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        );
                      })}
                      {previewUrls.map((url, index) => (
                        <div key={`preview-${index}`} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                          <img src={url} alt={`preview-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
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

          {error && (
            <div className="form-error-box">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="modal-actions-footer">
            <button type="button" className="btn-ghost cancel-btn" onClick={onClose} disabled={isLoading}>
              {t('spaceForm.cancel')}
            </button>
            <button type="submit" className="btn-primary submit-btn" disabled={isLoading}>
              {isLoading ? 'Đang lưu...' : t('spaceForm.saveSpaceInfo')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};