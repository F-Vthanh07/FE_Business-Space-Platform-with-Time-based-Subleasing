/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { Plus, Search, Building2, MapPin, Edit3, Trash2, CheckCircle2, Clock, Eye, X, Layers, Briefcase, User as UserIcon } from 'lucide-react';
import { SpaceForm } from './SpaceForm';
import { SpacePartForm } from './SpacePartForm';
import { SpacePartListModal } from './SpacePartListModal';
import { useThemeLanguage } from '../../../../context/ThemeLanguageContext';
import '../../../shared/ModalShell.css';
import './OwnerSpaces.css';

interface Space {
  id: number;
  name: string;
  address: string;
  area: string;
  status: 'active' | 'pending' | 'inactive';
  revenue: string;
  occupancy: number;
  isActive: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  amenities: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spaceAllowedCategories: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  operatingHours?: any[];
  pictureURLs?: any[];
  spacePictures?: any[];
  pictures?: any[];
}

export const OwnerSpaces: React.FC = () => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [ownerNames, setOwnerNames] = useState<Record<string, string>>({});
  const [apiCategories, setApiCategories] = useState<any[]>([]); 
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSpacePartFormOpen, setIsSpacePartFormOpen] = useState(false);
  const [isSpacePartListOpen, setIsSpacePartListOpen] = useState(false);
  const [parentSpaceForPart, setParentSpaceForPart] = useState<Space | null>(null);
  const [editingSpacePart, setEditingSpacePart] = useState<any | null>(null);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [viewingSpace, setViewingSpace] = useState<Space | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t, language } = useThemeLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  // --- 1. LẤY DANH MỤC NGÀNH NGHỀ TỪ API ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('https://flexi-space-capstone-project.onrender.com/api/BussinessCategory/GetAll', {
          headers: { 'accept': '*/*' }
        });
        if (res.ok) {
          const data = await res.json();
          setApiCategories(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Lỗi lấy danh mục ngành nghề:", err);
      }
    };
    fetchCategories();
  }, []);

  // --- 2. API GET ALL VỚI QUERY THAM SỐ (Lấy mặt bằng của chính mình) ---
  const fetchSpaces = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('portal_token');
      const ownerId = localStorage.getItem('current_user_id') || '01KVJGBEXR0X7A2PN520FJTVZT';

      const url = `https://flexi-space-capstone-project.onrender.com/api/Space/GetAll?OwnerId=${encodeURIComponent(ownerId)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': '*/*'
        }
      });

      let ownerSpaces: Space[] = [];
      if (response.ok) {
        const data = await response.json();
        ownerSpaces = Array.isArray(data) ? data : (data?.data || data?.items || []);
      }

      const resUsage = await fetch(`https://flexi-space-capstone-project.onrender.com/api/SpaceUsageRight/Mine`, {
         headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
      });
      let usageSpaces: Space[] = [];
      if (resUsage.ok) {
         const usageData = await resUsage.json();
         const rights = Array.isArray(usageData) ? usageData : usageData?.data || [];
         const spacePromises = rights.map((r: any) =>
            fetch(`https://flexi-space-capstone-project.onrender.com/api/Space/GetById/${r.spaceId}`, {
                headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
            }).then(res => res.ok ? res.json() : null)
         );
         const resolvedSpaces = await Promise.all(spacePromises);
         usageSpaces = resolvedSpaces.filter(Boolean) as Space[];
      }

      const allSpaces = [...ownerSpaces, ...usageSpaces];
      const uniqueSpaces = Array.from(new Map(allSpaces.map((item) => [(item as any).id || (item as any).Id, item])).values());
      
      setSpaces(uniqueSpaces as Space[]);

      const ownerIds = Array.from(new Set(uniqueSpaces.map(s => (s as any).ownerId || (s as any).OwnerId).filter(Boolean)));
      const ownerPromises = ownerIds.map(async (id: any) => {
         try {
             const res = await fetch(`https://flexi-space-capstone-project.onrender.com/api/User/${id}`, { headers: { 'Authorization': `Bearer ${token}` }});
             if (res.ok) {
                 const data = await res.json();
                 return { id, name: data.profileFullName || data.userName || data.email };
             }
         } catch {}
         return { id, name: 'Unknown' };
      });
      const resolvedOwners = await Promise.all(ownerPromises);
      const ownerMap: Record<string, string> = {};
      resolvedOwners.forEach(o => { ownerMap[o.id] = o.name; });
      setOwnerNames(ownerMap);

    } catch (error) {
      console.error("Lỗi khi tải danh sách mặt bằng:", error);
      setSpaces([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSpaces();
  }, [fetchSpaces]);

  // Bộ lọc frontend
  const filteredSpaces = spaces.filter(space => {
    const safeName = space?.name || '';
    const safeAddress = space?.address || '';
    return safeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           safeAddress.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // GSAP animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.space-card');
      if (cards.length > 0) {
        gsap.fromTo(cards,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out' }
        );
      }
    }, containerRef);
    return () => ctx.revert();
  }, [filteredSpaces.length]);

  const handleOpenFormForNew = () => {
    setEditingSpace(null);
    setIsFormOpen(true);
  };

  // ÁO GIÁP: Xử lý data an toàn trước khi ném cho SpaceForm
  const handleOpenFormForEdit = (space: Space) => {
    const safeSpaceForEdit = {
      ...space,
      amenities: space.amenities || [],
      spaceAllowedCategories: space.spaceAllowedCategories || [],
      operatingHours: space.operatingHours || []
    };
    setEditingSpace(safeSpaceForEdit); 
    setIsFormOpen(true);
  };

  const handleOpenSpacePartForm = (space: Space) => {
    const currentUserId = localStorage.getItem('current_user_id');
    const spaceOwnerId = (space as any).ownerId || (space as any).OwnerId;
    if (spaceOwnerId && currentUserId !== spaceOwnerId) {
      alert("Bạn không có quyền chia nhỏ space được lấy từ người chủ");
      return;
    }
    setParentSpaceForPart(space);
    setEditingSpacePart(null);
    setIsSpacePartFormOpen(true);
  };

  const handleOpenSpacePartList = (space: Space) => {
    const currentUserId = localStorage.getItem('current_user_id');
    const spaceOwnerId = (space as any).ownerId || (space as any).OwnerId;
    if (spaceOwnerId && currentUserId !== spaceOwnerId) {
      alert("Bạn không có quyền quản lý không gian chia nhỏ của mặt bằng này!");
      return;
    }
    setParentSpaceForPart(space);
    setIsSpacePartListOpen(true);
  };

  const handleEditSpacePart = (part: any) => {
    setEditingSpacePart(part);
    setIsSpacePartListOpen(false);
    setIsSpacePartFormOpen(true);
  };

  // --- 3. API DELETE: XÓA MẶT BẰNG ---
  const handleDeleteSpace = async (spaceToDelete: Space) => {
    // Ép lấy đúng ID (Phòng trường hợp C# trả về 'Id' in hoa)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targetId = spaceToDelete.id || (spaceToDelete as any).Id;

    if (!targetId) {
      alert("Lỗi: Không tìm thấy ID của mặt bằng này để xóa.");
      return;
    }

    if (window.confirm(t('spaces.confirmDeleteSpace') || 'Bạn có chắc chắn muốn xóa mặt bằng này?')) {
      try {
        const token = localStorage.getItem('portal_token');
        const response = await fetch(`https://flexi-space-capstone-project.onrender.com/api/Space/Delete${targetId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': '*/*'
          }
        });

        if (response.ok) {
          setSpaces(prev => prev.filter(s => (s.id || (s as any).Id) !== targetId));
        } else {
          const errData = await response.json().catch(() => ({}));
          alert(errData.message || "Xóa thất bại do lỗi hệ thống.");
        }
      } catch (error) {
        console.error("Lỗi khi xóa:", error);
        alert("Lỗi kết nối đến máy chủ.");
      }
    }
  };

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    setEditingSpace(null);
    fetchSpaces();
  };

  const handleSpacePartSubmit = () => {
    setIsSpacePartFormOpen(false);
    setParentSpaceForPart(null);
    // Có thể cần refresh lại danh sách nếu cần thiết, hoặc lấy thông tin các phần tử con
    fetchSpaces();
  };

  return (
    <div className="owner-spaces animate-in" ref={containerRef}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('spaces.mySpaces') || 'Quản lý Mặt bằng'}</h1>
          <p className="page-subtitle text-secondary">{t('spaces.spacesSubtitle') || 'Quản lý các không gian vật lý của bạn'}</p>
        </div>
        <button className="btn-primary" onClick={handleOpenFormForNew}>
          <Plus size={16} />
          {t('spaces.registerNewSpace') || 'Thêm Mặt bằng'}
        </button>
      </div>

      <div className="spaces-controls glass-card">
        <div className="spaces-search">
          <Search size={15} style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            placeholder={t('spaces.searchSpacePlaceholder') || 'Tìm kiếm tên, địa chỉ...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="spaces-stats text-secondary">
          <span>{t('spaces.totalSpacesCount', { count: spaces.length }) || `Tổng cộng ${spaces.length} mặt bằng`}</span>
        </div>
      </div>

      {isLoading && (
        <div className="loading-state text-secondary">
          <Clock size={20} />
          <span>{t('spaces.loading') || 'Đang tải...'}</span>
        </div>
      )}

      {!isLoading && (
        <div className="spaces-grid">
          {filteredSpaces.map((space, index) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const currentId = space.id || (space as any).Id;
            const safeAmenities = space?.amenities || [];
            const safeCategories = space?.spaceAllowedCategories || [];

            const pic = space.pictureURLs?.[0] || space.spacePictures?.[0] || space.pictures?.[0];
            const picUrl = pic ? (typeof pic === 'string' ? pic : (pic.imageUrl || pic.url || pic.pictureUrl)) : null;

            return (
              <div key={currentId || index} className="glass-card space-card">
                <div className="space-card-top">
                  <div className="space-card-type">
                    <Briefcase size={12} />
                    {safeCategories.length > 0
                      ? (apiCategories.find(cat => cat.id === safeCategories[0].businessCategoryId)?.name || '...')
                      : t('spaces.notSpecified') || 'Chưa xác định'}
                  </div>
                  <span className={`badge ${space.isActive !== false ? 'badge--positive' : 'badge--warning'}`}>
                    {space.isActive !== false ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                    {space.isActive !== false ? 'Hoạt động' : 'Tạm khóa'}
                  </span>
                </div>

                <div className="space-card-visual" style={picUrl ? { background: `url(${picUrl}) center/cover no-repeat` } : {}}>
                  {!picUrl && <Building2 className="visual-building-icon" />}
                  <div className="space-area-tag">
                    {space?.area || 'N/A'} m²
                  </div>
                </div>

                <div className="space-card-info">
                  <h3 className="space-name">{space?.name || 'Mặt bằng chưa có tên'}</h3>
                  <div className="space-address text-secondary">
                    <MapPin size={12} style={{ flexShrink: 0 }} />
                    <span className="truncate">{space?.address || 'Chưa cập nhật địa chỉ'}</span>
                  </div>
                  <div className="space-address text-secondary" style={{ marginTop: '2px' }}>
                    <UserIcon size={12} style={{ flexShrink: 0 }} />
                    <span className="truncate">Chủ mặt bằng: {ownerNames[(space as any).ownerId || (space as any).OwnerId] || 'Unknown'}</span>
                  </div>

                  <div className="space-meta-section">
                    <span className="meta-label">{t('spaces.amenities') || 'Tiện ích'}</span>
                    <div className="meta-badges">
                      {safeAmenities.length > 0 ? (
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        safeAmenities.map((a: any, idx: number) => (
                          <span key={idx} className="badge badge--neutral badge-sm">
                            {a.name || t('amenity.' + a) || 'Tiện ích'}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted text-xs">{t('spaces.noAmenities') || 'Chưa cập nhật'}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-meta-section">
                    <span className="meta-label">{t('spaces.allowedModels') || 'Ngành nghề phù hợp'}</span>
                    <div className="meta-badges">
                      {safeCategories.length > 0 ? (
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        safeCategories.map((c: any, idx: number) => {
                          const catId = c.bussinessCategoryId;
                          const catObj = apiCategories.find(cat => cat.id === catId);
                          const catName = catObj ? catObj.name : `Ngành nghề ID: ${catId}`;
                          return (
                            <span key={idx} className="badge badge--accent badge-sm">
                              {catName}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-muted text-xs">{t('spaces.notConfigured') || 'Không ràng buộc'}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-card-actions">
                  <button className="btn-ghost" onClick={() => handleOpenSpacePartList(space)}>
                    <Layers size={13} /> D.sách chia nhỏ
                  </button>
                  <button className="btn-ghost" onClick={() => handleOpenSpacePartForm(space)}>
                    <Plus size={13} /> {language === 'en' ? 'Divide' : 'Chia nhỏ'}
                  </button>
                  <button className="btn-ghost" onClick={() => setViewingSpace(space)}>
                    <Eye size={13} /> {language === 'en' ? 'View' : 'Xem'}
                  </button>
                  <button className="btn-ghost" onClick={() => handleOpenFormForEdit(space)}>
                    <Edit3 size={13} /> {t('spaces.edit') || 'Sửa'}
                  </button>
                  <button className="btn-ghost btn-danger-icon" onClick={() => handleDeleteSpace(space)} title={t('spaces.delete') || 'Xóa'}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isFormOpen && (
        <SpaceForm onClose={() => setIsFormOpen(false)} onSubmit={handleFormSubmit} initialData={editingSpace} />
      )}

      {isSpacePartFormOpen && parentSpaceForPart && (
        <SpacePartForm
          onClose={() => { setIsSpacePartFormOpen(false); setParentSpaceForPart(null); setEditingSpacePart(null); }}
          onSubmit={() => { setParentSpaceForPart(null); setEditingSpacePart(null); handleSpacePartSubmit(); }}
          parentSpace={parentSpaceForPart}
          initialData={editingSpacePart}
        />
      )}

      {isSpacePartListOpen && parentSpaceForPart && (
        <SpacePartListModal
          parentSpace={parentSpaceForPart}
          onClose={() => { setIsSpacePartListOpen(false); setParentSpaceForPart(null); }}
          onEditPart={handleEditSpacePart}
        />
      )}

      {viewingSpace && createPortal(
        <div className="modal-backdrop" onClick={() => setViewingSpace(null)}>
          <div className="modal-shell" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-area">
                <div className="modal-icon-wrap modal-icon-wrap--blue">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="modal-title">{viewingSpace.name || (language === 'en' ? 'Space detail' : 'Chi tiết mặt bằng')}</h3>
                  <p className="modal-subtitle text-secondary">
                    {viewingSpace.isActive !== false ? (language === 'en' ? 'Active' : 'Đang hoạt động') : (language === 'en' ? 'Suspended' : 'Tạm khóa')}
                  </p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setViewingSpace(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-section">
                <div className="form-section-title">{language === 'en' ? 'General information' : 'Thông tin chung'}</div>
                <div className="space-detail-row">
                  <span className="space-detail-label">
                    <MapPin size={12} />
                    {language === 'en' ? 'Address' : 'Địa chỉ'}
                  </span>
                  <span className="space-detail-value">{viewingSpace.address || (language === 'en' ? 'Not updated' : 'Chưa cập nhật')}</span>
                </div>
                <div className="space-detail-row">
                  <span className="space-detail-label">{language === 'en' ? 'Area' : 'Diện tích'}</span>
                  <span className="space-detail-value">{viewingSpace.area || 'N/A'} m²</span>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">{language === 'en' ? 'Operating hours' : 'Giờ hoạt động'}</div>
                <div className="meta-badges" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(() => {
                    const hours = viewingSpace.operatingHours || [];
                    if (hours.length === 0) return <span className="text-muted text-xs">{language === 'en' ? 'Not configured' : 'Chưa thiết lập'}</span>;
                    
                    const isFullWeek = hours.length === 7 && hours.every((h: any, _i: number, arr: any[]) => h.openTime === arr[0].openTime && h.closeTime === arr[0].closeTime);
                    
                    if (isFullWeek) {
                      return <div className="space-detail-row"><span className="space-detail-label"><Clock size={12}/> {language === 'en' ? 'Full week' : 'Cả tuần'}</span><span className="space-detail-value">{hours[0].openTime?.substring(0, 5)} - {hours[0].closeTime?.substring(0, 5)}</span></div>;
                    }
                    
                    const daysMap: Record<number, string> = { 0: 'Chủ Nhật', 1: 'Thứ Hai', 2: 'Thứ Ba', 3: 'Thứ Tư', 4: 'Thứ Năm', 5: 'Thứ Sáu', 6: 'Thứ Bảy' };
                    return hours.map((h: any, idx: number) => (
                      <div key={idx} className="space-detail-row">
                        <span className="space-detail-label" style={{ minWidth: '100px' }}><Clock size={12}/> {daysMap[h.dayOfWeek] || h.dayOfWeek}</span>
                        <span className="space-detail-value">{h.openTime?.substring(0, 5)} - {h.closeTime?.substring(0, 5)}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">{t('spaces.amenities') || 'Tiện ích'}</div>
                <div className="meta-badges">
                  {(viewingSpace.amenities || []).length > 0 ? (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (viewingSpace.amenities || []).map((a: any, idx: number) => (
                      <span key={idx} className="badge badge--neutral badge-sm">
                        {a.name || t('amenity.' + a) || 'Tiện ích'}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted text-xs">{t('spaces.noAmenities') || 'Chưa cập nhật'}</span>
                  )}
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">{t('spaces.allowedModels') || 'Ngành nghề phù hợp'}</div>
                <div className="meta-badges">
                  {(viewingSpace.spaceAllowedCategories || []).length > 0 ? (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (viewingSpace.spaceAllowedCategories || []).map((c: any, idx: number) => {
                      const catId = c.bussinessCategoryId;
                      const catObj = apiCategories.find(cat => cat.id === catId);
                      const catName = catObj ? catObj.name : `Ngành nghề ID: ${catId}`;
                      return (
                        <span key={idx} className="badge badge--accent badge-sm">
                          {catName}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-muted text-xs">{t('spaces.notConfigured') || 'Không ràng buộc'}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-actions-footer">
              <button className="btn-ghost cancel-btn" onClick={() => setViewingSpace(null)}>
                {language === 'en' ? 'Close' : 'Đóng'}
              </button>
              <button
                className="btn-primary submit-btn"
                onClick={() => { const s = viewingSpace; setViewingSpace(null); handleOpenFormForEdit(s); }}
              >
                <Edit3 size={14} /> {t('spaces.edit') || 'Sửa'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};