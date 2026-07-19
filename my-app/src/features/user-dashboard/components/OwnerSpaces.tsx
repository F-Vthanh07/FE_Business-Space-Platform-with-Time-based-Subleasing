/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { Plus, Search, Building2, MapPin, Edit3, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { SpaceForm } from './SpaceForm';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import { API_BASE_URL } from '../../../config/api';
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
}

export const OwnerSpaces: React.FC = () => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [apiCategories, setApiCategories] = useState<any[]>([]); 
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useThemeLanguage();
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

      if (response.ok) {
        const data = await response.json();
        const safeData = Array.isArray(data) ? data : (data?.data || data?.items || []);
        setSpaces(safeData);
      } else {
        setSpaces([]);
      }
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

            return (
              <div key={currentId || index} className="glass-card space-card">
                <div className="space-card-top">
                  <div className="space-card-type">
                    <Building2 size={14} />
                    <span>{t('spaces.physicalSpace') || 'Không gian vật lý'}</span>
                  </div>
                  <span className={`badge ${space.isActive !== false ? 'badge--positive' : 'badge--warning'}`}>
                    {space.isActive !== false ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                    {space.isActive !== false ? 'Hoạt động' : 'Tạm khóa'}
                  </span>
                </div>

                <div className="space-card-info">
                  <h3 className="space-name">{space?.name || 'Mặt bằng chưa có tên'}</h3>
                  <p className="space-address text-secondary">
                    <MapPin size={12} />
                    {space?.address || 'Chưa cập nhật địa chỉ'}
                  </p>
                  <p className="space-area text-secondary">
                    {space?.area || 'N/A'} m²
                  </p>

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
    </div>
  );
};