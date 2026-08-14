import React, { useState } from 'react';
import { Plus, Check, X, Zap, Edit3, Trash2, Eye } from 'lucide-react';
import type { PriorityLevel } from '../types';
import type { PriorityLevelPayload, PriorityLevelType } from '../api/admin.api';
import { RefreshButton } from './RefreshButton';

interface PriorityLevelsModuleProps {
  priorityLevels: PriorityLevel[];
  handleGetPriorityLevelById: (id: number) => Promise<PriorityLevel>;
  handleCreatePriorityLevel: (payload: PriorityLevelPayload) => Promise<void>;
  handleUpdatePriorityLevel: (id: number, payload: PriorityLevelPayload) => Promise<void>;
  handleDeletePriorityLevel: (id: number) => Promise<void>;
  isLoading: boolean;
  language: 'en' | 'vi';
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const PriorityLevelsModule: React.FC<PriorityLevelsModuleProps> = ({
  priorityLevels,
  handleGetPriorityLevelById,
  handleCreatePriorityLevel,
  handleUpdatePriorityLevel,
  handleDeletePriorityLevel,
  isLoading,
  language,
  onRefresh,
  isRefreshing,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<PriorityLevel | null>(null);
  const [detailLevel, setDetailLevel] = useState<PriorityLevel | null>(null);
  const [activeTypeTab, setActiveTypeTab] = useState<PriorityLevelType>('Listing');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [durationInDays, setDurationInDays] = useState('');
  const [durationForBanner, setDurationForBanner] = useState('');
  const [type, setType] = useState<PriorityLevelType>('Listing');
  const [isActive, setIsActive] = useState(true);

  const getPriorityType = (level: PriorityLevel): PriorityLevelType => {
    return String(level.type || '').toLowerCase() === 'banner' ? 'Banner' : 'Listing';
  };

  const resetForm = (nextType: PriorityLevelType = 'Listing') => {
    setName('');
    setDescription('');
    setPrice('');
    setDurationInDays('');
    setDurationForBanner('');
    setType(nextType);
    setIsActive(true);
  };

  const handleOpenAdd = () => {
    resetForm(activeTypeTab);
    setIsAddModalOpen(true);
  };

  const fillForm = (level: PriorityLevel) => {
    setSelectedLevel(level);
    setName(level.name);
    setDescription(level.description || '');
    setPrice(String(level.price));
    setDurationInDays(level.durationInDays != null ? String(level.durationInDays) : '');
    setDurationForBanner(level.durationForBanner != null ? String(level.durationForBanner) : '');
    setType(getPriorityType(level));
    setIsActive(level.isActive);
  };

  const handleOpenEdit = async (level: PriorityLevel) => {
    try {
      const latestLevel = await handleGetPriorityLevelById(level.id);
      fillForm(latestLevel);
    } catch (err) {
      console.error(err);
      fillForm(level);
    }
    setIsEditModalOpen(true);
  };

  const handleOpenDetail = async (level: PriorityLevel) => {
    try {
      const latestLevel = await handleGetPriorityLevelById(level.id);
      setDetailLevel(latestLevel);
    } catch (err) {
      console.error(err);
      setDetailLevel(level);
    }
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (level: PriorityLevel) => {
    const confirmed = window.confirm(
      language === 'en'
        ? `Delete "${level.name}"?`
        : `Xoa goi "${level.name}"?`
    );
    if (!confirmed) return;
    await handleDeletePriorityLevel(level.id);
  };

  const validatePriceInput = (): number | null => {
    const priceValue = Number(price);
    if (Number.isNaN(priceValue) || priceValue < 0) {
      alert(language === 'en' ? 'Please enter a valid price' : 'Vui long nhap gia hop le');
      return null;
    }
    return priceValue;
  };

  const validateNonNegativeInteger = (value: string, label: string): number | null => {
    const numberValue = Number(value);
    if (!Number.isInteger(numberValue) || numberValue < 0) {
      alert(language === 'en' ? `Please enter a valid ${label}` : `Vui long nhap ${label} hop le`);
      return null;
    }
    return numberValue;
  };

  const buildPayload = (): PriorityLevelPayload | null => {
    if (!name.trim()) {
      alert(language === 'en' ? 'Please enter a package name' : 'Vui long nhap ten goi');
      return null;
    }

    const priceValue = validatePriceInput();
    if (priceValue === null) return null;

    const durationInDaysValue = validateNonNegativeInteger(
      durationInDays,
      language === 'en' ? 'duration in days' : 'thoi gian ton tai'
    );
    if (durationInDaysValue === null) return null;

    const durationForBannerValue = type === 'Banner'
      ? validateNonNegativeInteger(
          durationForBanner,
          language === 'en' ? 'banner upload limit' : 'gioi han so banner'
        )
      : 0;
    if (durationForBannerValue === null) return null;

    return {
      name: name.trim(),
      description: description.trim(),
      price: priceValue,
      durationInDays: durationInDaysValue,
      durationForBanner: durationForBannerValue,
      type,
      isActive,
    };
  };

  const onAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) return;
    await handleCreatePriorityLevel(payload);
    setIsAddModalOpen(false);
  };

  const onEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLevel) return;
    const payload = buildPayload();
    if (!payload) return;
    await handleUpdatePriorityLevel(selectedLevel.id, payload);
    setIsEditModalOpen(false);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === '0001-01-01T00:00:00' || dateStr.startsWith('0001-01-01')) {
      return language === 'en' ? 'N/A' : 'Chua cap nhat';
    }
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN');
  };

  const visiblePriorityLevels = priorityLevels.filter(p => getPriorityType(p) === activeTypeTab);

  const renderForm = (mode: 'add' | 'edit') => (
    <form onSubmit={mode === 'add' ? onAddSubmit : onEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600 }}>
          {language === 'en' ? 'Package Name' : 'Ten goi'} <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          type="text"
          className="slot-input-text"
          style={{ height: '40px', width: '100%', boxSizing: 'border-box', padding: '0 12px' }}
          value={name}
          onChange={e => setName(e.target.value)}
          required
          placeholder={language === 'en' ? 'e.g. Premium Boost' : 'VD: Goi uu tien'}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600 }}>{language === 'en' ? 'Description' : 'Mo ta'}</label>
        <textarea
          className="slot-input-text"
          style={{ minHeight: '80px', width: '100%', boxSizing: 'border-box', padding: '10px 12px', resize: 'vertical' }}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={language === 'en' ? 'Package details' : 'Thong tin goi'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>
            {language === 'en' ? 'Package Type' : 'Loai goi'} <span style={{ color: 'red' }}>*</span>
          </label>
          <select
            className="slot-input-text"
            style={{ height: '40px', width: '100%', boxSizing: 'border-box', padding: '0 12px' }}
            value={type}
            onChange={e => setType(e.target.value as PriorityLevelType)}
          >
            <option value="Listing">Listing</option>
            <option value="Banner">Banner</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>
            {language === 'en' ? 'Price (VND)' : 'Gia (VND)'} <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="number"
            min={0}
            step={1000}
            className="slot-input-text"
            style={{ height: '40px', width: '100%', boxSizing: 'border-box', padding: '0 12px' }}
            value={price}
            onChange={e => setPrice(e.target.value)}
            required
            placeholder="0"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: type === 'Banner' ? '1fr 1fr' : '1fr', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>
            {language === 'en' ? 'Duration In Days' : 'Thoi gian ton tai (ngay)'} <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="number"
            min={0}
            step={1}
            className="slot-input-text"
            style={{ height: '40px', width: '100%', boxSizing: 'border-box', padding: '0 12px' }}
            value={durationInDays}
            onChange={e => setDurationInDays(e.target.value)}
            required
            placeholder="0"
          />
        </div>

        {type === 'Banner' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>
              {language === 'en' ? 'Banner Upload Limit' : 'Gioi han so banner'} <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="number"
              min={0}
              step={1}
              className="slot-input-text"
              style={{ height: '40px', width: '100%', boxSizing: 'border-box', padding: '0 12px' }}
              value={durationForBanner}
              onChange={e => setDurationForBanner(e.target.value)}
              required
              placeholder="0"
            />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="checkbox"
          id={mode === 'add' ? 'isActiveAdd' : 'isActiveEdit'}
          checked={isActive}
          onChange={e => setIsActive(e.target.checked)}
        />
        <label htmlFor={mode === 'add' ? 'isActiveAdd' : 'isActiveEdit'} style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          {language === 'en' ? 'Active' : 'Dang hoat dong'}
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
        <button type="button" className="btn-ghost" onClick={() => mode === 'add' ? setIsAddModalOpen(false) : setIsEditModalOpen(false)}>
          {language === 'en' ? 'Cancel' : 'Huy'}
        </button>
        <button type="submit" className="btn-primary" style={{ padding: '0 20px' }} disabled={isLoading}>
          {mode === 'add'
            ? (language === 'en' ? 'Create' : 'Them moi')
            : (language === 'en' ? 'Save Changes' : 'Luu thay doi')}
        </button>
      </div>
    </form>
  );

  return (
    <div className="admin-module animate-fade-in">
      <header className="module-header">
        <div>
          <h1>{language === 'en' ? 'Priority Packages' : 'Goi uu tien'}</h1>
          <p>{language === 'en' ? 'Configure listing and banner priority packages' : 'Quan ly goi uu tien cho listing va banner'}</p>
        </div>
        <RefreshButton onRefresh={onRefresh} isRefreshing={isRefreshing} language={language} />
      </header>

      <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper blue"><Zap size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'TOTAL PACKAGES' : 'TONG SO GOI'}</span>
            <h2 className="stat-value">{priorityLevels.length}</h2>
          </div>
        </div>

        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper green"><Check size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'ACTIVE PACKAGES' : 'DANG HOAT DONG'}</span>
            <h2 className="stat-value">{priorityLevels.filter(p => p.isActive).length}</h2>
          </div>
        </div>

        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper orange"><X size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'INACTIVE PACKAGES' : 'TAM DUNG'}</span>
            <h2 className="stat-value">{priorityLevels.filter(p => !p.isActive).length}</h2>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          className={activeTypeTab === 'Listing' ? 'btn-primary' : 'btn-ghost'}
          onClick={() => setActiveTypeTab('Listing')}
          disabled={isLoading}
        >
          Listing
        </button>
        <button
          type="button"
          className={activeTypeTab === 'Banner' ? 'btn-primary' : 'btn-ghost'}
          onClick={() => setActiveTypeTab('Banner')}
          disabled={isLoading}
        >
          Banner
        </button>
      </div>

      <div className="admin-table-container glass-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{language === 'en' ? 'Package Name' : 'Ten goi'}</th>
              <th>{language === 'en' ? 'Type' : 'Loai'}</th>
              <th>{language === 'en' ? 'Duration' : 'Thoi han'}</th>
              <th style={{ textAlign: 'right' }}>{language === 'en' ? 'Price' : 'Gia'}</th>
              <th>{language === 'en' ? 'Status' : 'Trang thai'}</th>
              <th>{language === 'en' ? 'Created Date' : 'Ngay tao'}</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visiblePriorityLevels.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                  {language === 'en' ? 'No priority packages found.' : 'Chua co goi nao.'}
                </td>
              </tr>
            ) : (
              visiblePriorityLevels.map(p => (
                <tr key={p.id} className={!p.isActive ? 'blocked-row' : ''}>
                  <td className="font-mono">{p.id}</td>
                  <td>
                    <strong>{p.name}</strong>
                    {p.description && (
                      <div style={{ marginTop: '4px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                        {p.description}
                      </div>
                    )}
                  </td>
                  <td><span className="badge-status">{getPriorityType(p)}</span></td>
                  <td>
                    <div>{p.durationInDays ?? 0} {language === 'en' ? 'days' : 'ngay'}</div>
                    {(getPriorityType(p) === 'Banner' || (p.durationForBanner ?? 0) > 0) && (
                      <div style={{ marginTop: '4px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                        {language === 'en' ? 'Banner limit' : 'Gioi han banner'}: {p.durationForBanner ?? 0}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <strong className="text-neon-green">{p.price.toLocaleString('vi-VN')} VND</strong>
                  </td>
                  <td>
                    <span className={`badge-status ${p.isActive ? 'active' : 'blocked'}`}>
                      {p.isActive ? (language === 'en' ? 'Active' : 'Hoat dong') : (language === 'en' ? 'Inactive' : 'Tam dung')}
                    </span>
                  </td>
                  <td>{formatDate(p.createdAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        className="btn-action-icon"
                        onClick={() => handleOpenDetail(p)}
                        title={language === 'en' ? 'View details' : 'Xem chi tiet'}
                        disabled={isLoading}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn-action-icon unblock"
                        onClick={() => handleOpenEdit(p)}
                        title={language === 'en' ? 'Edit' : 'Sua'}
                        disabled={isLoading}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        className="btn-action-icon block"
                        onClick={() => handleDelete(p)}
                        title={language === 'en' ? 'Delete' : 'Xoa'}
                        disabled={isLoading}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
        <button className="btn-ghost" disabled={isLoading} onClick={handleOpenAdd}>
          <Plus size={16} />
          {activeTypeTab === 'Banner'
            ? (language === 'en' ? 'Add Banner Package' : 'Them goi banner')
            : (language === 'en' ? 'Add Listing Package' : 'Them goi listing')}
        </button>
      </div>

      {isAddModalOpen && (
        <div className="listing-detail-backdrop">
          <div className="listing-form-modal glass-card" style={{ maxWidth: '520px', width: '100%' }}>
            <div className="listing-form-header">
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                {language === 'en' ? 'Add Priority Package' : 'Them goi uu tien'}
              </h2>
              <button className="btn-icon" onClick={() => setIsAddModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            {renderForm('add')}
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="listing-detail-backdrop">
          <div className="listing-form-modal glass-card" style={{ maxWidth: '520px', width: '100%' }}>
            <div className="listing-form-header">
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                {language === 'en' ? 'Edit Priority Package' : 'Chinh sua goi uu tien'}
              </h2>
              <button className="btn-icon" onClick={() => setIsEditModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            {renderForm('edit')}
          </div>
        </div>
      )}

      {isDetailModalOpen && detailLevel && (
        <div className="listing-detail-backdrop">
          <div className="listing-form-modal glass-card" style={{ maxWidth: '520px', width: '100%' }}>
            <div className="listing-form-header">
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                {language === 'en' ? 'Package Details' : 'Chi tiet goi'}
              </h2>
              <button className="btn-icon" onClick={() => setIsDetailModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '14px', marginTop: '16px' }}>
              <div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>ID</div>
                <strong className="font-mono">{detailLevel.id}</strong>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                  {language === 'en' ? 'Package Name' : 'Ten goi'}
                </div>
                <strong>{detailLevel.name}</strong>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                  {language === 'en' ? 'Description' : 'Mo ta'}
                </div>
                <span>{detailLevel.description || (language === 'en' ? 'N/A' : 'Khong co')}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    {language === 'en' ? 'Type' : 'Loai'}
                  </div>
                  <span className="badge-status">{getPriorityType(detailLevel)}</span>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    {language === 'en' ? 'Status' : 'Trang thai'}
                  </div>
                  <span className={`badge-status ${detailLevel.isActive ? 'active' : 'blocked'}`}>
                    {detailLevel.isActive ? (language === 'en' ? 'Active' : 'Hoat dong') : (language === 'en' ? 'Inactive' : 'Tam dung')}
                  </span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    {language === 'en' ? 'Price' : 'Gia'}
                  </div>
                  <strong className="text-neon-green">{detailLevel.price.toLocaleString('vi-VN')} VND</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    {language === 'en' ? 'Duration In Days' : 'Thoi gian ton tai'}
                  </div>
                  <strong>{detailLevel.durationInDays ?? 0} {language === 'en' ? 'days' : 'ngay'}</strong>
                </div>
              </div>
              {getPriorityType(detailLevel) === 'Banner' && (
                <div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    {language === 'en' ? 'Banner Upload Limit' : 'Gioi han so banner'}
                  </div>
                  <strong>{detailLevel.durationForBanner ?? 0}</strong>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    {language === 'en' ? 'Created Date' : 'Ngay tao'}
                  </div>
                  <span>{formatDate(detailLevel.createdAt)}</span>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    {language === 'en' ? 'Updated Date' : 'Ngay cap nhat'}
                  </div>
                  <span>{detailLevel.updatedAt ? formatDate(detailLevel.updatedAt) : (language === 'en' ? 'N/A' : 'Chua cap nhat')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
