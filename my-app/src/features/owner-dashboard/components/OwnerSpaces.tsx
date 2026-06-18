import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Plus, Search, Building2, MapPin, Minimize2, Edit3, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { SpaceForm } from './SpaceForm';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import './OwnerSpaces.css';

interface Space {
  id: number;
  name: string;
  address: string;
  area: string;
  status: 'active' | 'pending' | 'inactive';
  revenue: string;
  occupancy: number;
  amenities: string[];
  categories: string[];
  operatingHours?: any[];
}

const initialSpaces: Space[] = [
  { id: 1, name: 'Mặt bằng kinh doanh Lê Lợi', address: 'Quận 1, TP.HCM', area: '45 m²', status: 'active', revenue: '12.500.000₫', occupancy: 92, amenities: ['wifi', 'ac', 'parking', 'wc'], categories: ['retail', 'cafe'] },
  { id: 2, name: 'Shop Mini Phan Đình Phùng', address: 'Bình Thạnh, TP.HCM', area: '30 m²', status: 'active', revenue: '8.200.000₫', occupancy: 78, amenities: ['wifi', 'ac', 'wc'], categories: ['cafe', 'office'] },
  { id: 3, name: 'Kiosk Quang Trung', address: 'Gò Vấp, TP.HCM', area: '18 m²', status: 'pending', revenue: '0₫', occupancy: 0, amenities: ['wifi', 'parking'], categories: ['kiosk'] },
];

export const OwnerSpaces: React.FC = () => {
  const [spaces, setSpaces] = useState<Space[]>(initialSpaces);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const { t } = useThemeLanguage();

  // Ref cho GSAP
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSpaces = spaces.filter(space =>
    space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    space.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Hiệu ứng GSAP: Trượt các thẻ card lên mượt mà
  useEffect(() => {
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.space-card');
      if (cards.length > 0) {
        gsap.fromTo(cards, 
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out' }
        );
      }
    }
  }, [filteredSpaces.length]); // Chạy lại khi danh sách lọc thay đổi

  const handleOpenFormForNew = () => {
    setEditingSpace(null);
    setIsFormOpen(true);
  };

  const handleOpenFormForEdit = (space: Space) => {
    setEditingSpace(space);
    setIsFormOpen(true);
  };

  const handleDeleteSpace = (id: number) => {
    if (window.confirm(t('spaces.confirmDeleteSpace') || 'Bạn có chắc chắn muốn xóa mặt bằng này?')) {
      setSpaces(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleFormSubmit = (data: any) => {
    if (editingSpace) {
      setSpaces(prev => prev.map(s => (s.id === editingSpace.id ? { ...s, ...data, status: s.status } : s)));
    } else {
      setSpaces(prev => [data, ...prev]);
    }
    setIsFormOpen(false);
    setEditingSpace(null);
  };

  return (
    <div className="owner-spaces animate-in" ref={containerRef}>
      {/* Page Header */}
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

      {/* Controls */}
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

      {/* Grid */}
      <div className="spaces-grid">
        {filteredSpaces.map((space) => (
          <div key={space.id} className="glass-card space-card">
            <div className="space-card-top">
              <div className="space-card-type">
                <Building2 size={14} />
                <span>{t('spaces.physicalSpace') || 'Không gian vật lý'}</span>
              </div>
              <span className={`badge ${space.status === 'active' ? 'badge--positive' : 'badge--warning'}`}>
                {space.status === 'active' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                {space.status === 'active' ? (t('spaces.statusActive') || 'Hoạt động') : (t('spaces.statusPending') || 'Chờ duyệt')}
              </span>
            </div>

            <div className="space-card-visual">
              <Building2 size={36} className="visual-building-icon" />
              <div className="space-area-tag">
                <Minimize2 size={11} />
                <span>{space.area}</span>
              </div>
            </div>

            <div className="space-card-info">
              <h3 className="space-name">{space.name}</h3>
              <p className="space-address text-secondary">
                <MapPin size={12} />
                {space.address}
              </p>
              
              <div className="space-meta-section">
                <span className="meta-label">{t('spaces.amenities') || 'Tiện ích'}</span>
                <div className="meta-badges">
                  {space.amenities.length > 0 ? (
                    space.amenities.map(a => (
                      <span key={a} className="badge badge--neutral badge-sm">
                        {t('amenity.' + a) || a}
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
                  {space.categories.length > 0 ? (
                    space.categories.map(c => (
                      <span key={c} className="badge badge--accent badge-sm">
                        {t('category.' + c) || c}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted text-xs">{t('spaces.notConfigured') || 'Chưa thiết lập'}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-card-actions">
              <button className="btn-ghost" onClick={() => handleOpenFormForEdit(space)}>
                <Edit3 size={13} /> {t('spaces.edit') || 'Sửa'}
              </button>
              <button className="btn-ghost btn-danger-icon" onClick={() => handleDeleteSpace(space.id)} title={t('spaces.delete') || 'Xóa'}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <SpaceForm onClose={() => setIsFormOpen(false)} onSubmit={handleFormSubmit} initialData={editingSpace} />
      )}
    </div>
  );
};