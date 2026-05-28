import React, { useState } from 'react';
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

// Dữ liệu mock ban đầu
const initialSpaces: Space[] = [
  {
    id: 1,
    name: 'Mặt bằng kinh doanh Lê Lợi',
    address: 'Quận 1, TP.HCM',
    area: '45 m²',
    status: 'active',
    revenue: '12.500.000₫',
    occupancy: 92,
    amenities: ['wifi', 'ac', 'parking', 'wc'],
    categories: ['retail', 'cafe'],
  },
  {
    id: 2,
    name: 'Shop Mini Phan Đình Phùng',
    address: 'Bình Thạnh, TP.HCM',
    area: '30 m²',
    status: 'active',
    revenue: '8.200.000₫',
    occupancy: 78,
    amenities: ['wifi', 'ac', 'wc'],
    categories: ['cafe', 'office'],
  },
  {
    id: 3,
    name: 'Kiosk Quang Trung',
    address: 'Gò Vấp, TP.HCM',
    area: '18 m²',
    status: 'pending',
    revenue: '0₫',
    occupancy: 0,
    amenities: ['wifi', 'parking'],
    categories: ['kiosk'],
  },
];

export const OwnerSpaces: React.FC = () => {
  const [spaces, setSpaces] = useState<Space[]>(initialSpaces);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const { t } = useThemeLanguage();

  const handleOpenFormForNew = () => {
    setEditingSpace(null);
    setIsFormOpen(true);
  };

  const handleOpenFormForEdit = (space: Space) => {
    setEditingSpace(space);
    setIsFormOpen(true);
  };

  const handleDeleteSpace = (id: number) => {
    if (window.confirm(t('spaces.confirmDeleteSpace'))) {
      setSpaces(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleFormSubmit = (data: any) => {
    if (editingSpace) {
      // Chế độ Edit
      setSpaces(prev =>
        prev.map(s => (s.id === editingSpace.id ? { ...s, ...data, status: s.status } : s))
      );
    } else {
      // Chế độ Create mới
      setSpaces(prev => [data, ...prev]);
    }
    setIsFormOpen(false);
    setEditingSpace(null);
  };

  const filteredSpaces = spaces.filter(space =>
    space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    space.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="owner-spaces animate-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('spaces.mySpaces')}</h1>
          <p className="page-subtitle text-secondary">{t('spaces.spacesSubtitle')}</p>
        </div>
        <button className="btn-primary" onClick={handleOpenFormForNew}>
          <Plus size={16} />
          {t('spaces.registerNewSpace')}
        </button>
      </div>

      {/* Controls */}
      <div className="spaces-controls glass-card">
        <div className="spaces-search">
          <Search size={15} style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            placeholder={t('spaces.searchSpacePlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="spaces-stats text-secondary">
          <span>{t('spaces.totalSpacesCount', { count: spaces.length })}</span>
        </div>
      </div>

      {/* Grid danh sách mặt bằng */}
      <div className="spaces-grid">
        {filteredSpaces.map((space, i) => (
          <div key={space.id} className={`glass-card space-card animate-in delay-${Math.min(i + 1, 6)}`}>
            
            {/* Top row */}
            <div className="space-card-top">
              <div className="space-card-type">
                <Building2 size={14} />
                <span>{t('spaces.physicalSpace')}</span>
              </div>
              <span className={`badge ${space.status === 'active' ? 'badge--positive' : 'badge--warning'}`}>
                {space.status === 'active' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                {space.status === 'active' ? t('spaces.statusActive') : t('spaces.statusPending')}
              </span>
            </div>

            {/* Visual Icon */}
            <div className="space-card-visual">
              <Building2 size={36} className="visual-building-icon" />
              <div className="space-area-tag">
                <Minimize2 size={11} />
                <span>{space.area}</span>
              </div>
            </div>

            {/* Info */}
            <div className="space-card-info">
              <h3 className="space-name">{space.name}</h3>
              <p className="space-address text-secondary">
                <MapPin size={12} />
                {space.address}
              </p>
              
              {/* Tiện ích */}
              <div className="space-meta-section">
                <span className="meta-label">{t('spaces.amenities')}</span>
                <div className="meta-badges">
                  {space.amenities.length > 0 ? (
                    space.amenities.map(a => (
                      <span key={a} className="badge badge--neutral badge-sm">
                        {t('amenity.' + a)}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted text-xs">{t('spaces.noAmenities')}</span>
                  )}
                </div>
              </div>

              {/* Ngành nghề kinh doanh cho phép */}
              <div className="space-meta-section">
                <span className="meta-label">{t('spaces.allowedModels')}</span>
                <div className="meta-badges">
                  {space.categories.length > 0 ? (
                    space.categories.map(c => (
                      <span key={c} className="badge badge--accent badge-sm">
                        {t('category.' + c)}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted text-xs">{t('spaces.notConfigured')}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer / Actions */}
            <div className="space-card-actions">
              <button className="btn-ghost" onClick={() => handleOpenFormForEdit(space)}>
                <Edit3 size={13} /> {t('spaces.edit')}
              </button>
              <button className="btn-ghost btn-danger-icon" onClick={() => handleDeleteSpace(space.id)} title={t('spaces.delete')}>
                <Trash2 size={13} />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <SpaceForm
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
          initialData={editingSpace}
        />
      )}
    </div>
  );
};
