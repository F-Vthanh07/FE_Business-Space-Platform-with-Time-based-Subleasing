import React, { useState } from 'react';
import { Plus, Check, X, Zap, Edit3 } from 'lucide-react';
import type { PriorityLevel } from '../types';

interface PriorityLevelsModuleProps {
  priorityLevels: PriorityLevel[];
  handleCreatePriorityLevel: (name: string, price: number, isActive: boolean) => Promise<void>;
  handleUpdatePriorityLevel: (id: number, name: string, price: number, isActive: boolean) => Promise<void>;
  isLoading: boolean;
  language: 'en' | 'vi';
}

export const PriorityLevelsModule: React.FC<PriorityLevelsModuleProps> = ({
  priorityLevels,
  handleCreatePriorityLevel,
  handleUpdatePriorityLevel,
  isLoading,
  language,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<PriorityLevel | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleOpenAdd = () => {
    setName('');
    setPrice('');
    setIsActive(true);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (level: PriorityLevel) => {
    setSelectedLevel(level);
    setName(level.name);
    setPrice(String(level.price));
    setIsActive(level.isActive);
    setIsEditModalOpen(true);
  };

  const validatePriceInput = (): number | null => {
    const priceValue = Number(price);
    if (isNaN(priceValue) || priceValue < 0) {
      alert(language === 'en' ? 'Please enter a valid price' : 'Vui lòng nhập giá hợp lệ');
      return null;
    }
    return priceValue;
  };

  const onAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert(language === 'en' ? 'Please enter a package name' : 'Vui lòng nhập tên gói giá');
    const priceValue = validatePriceInput();
    if (priceValue === null) return;
    try {
      await handleCreatePriorityLevel(name.trim(), priceValue, isActive);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const onEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert(language === 'en' ? 'Please enter a package name' : 'Vui lòng nhập tên gói giá');
    if (!selectedLevel) return;
    const priceValue = validatePriceInput();
    if (priceValue === null) return;
    try {
      await handleUpdatePriorityLevel(selectedLevel.id, name.trim(), priceValue, isActive);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === '0001-01-01T00:00:00' || dateStr.startsWith('0001-01-01')) {
      return language === 'en' ? 'N/A' : 'Chưa cập nhật';
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN');
  };

  return (
    <div className="admin-module animate-fade-in">
      <header className="module-header">
        <h1>{language === 'en' ? 'Listing Priority Packages' : 'Gói giá đăng bài'}</h1>
        <p>{language === 'en' ? 'Configure priority packages that boost listing visibility' : 'Quản lý các gói giá ưu tiên giúp tăng khả năng hiển thị của bài đăng'}</p>
      </header>

      {/* Summary Stats Cards */}
      <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper blue"><Zap size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'TOTAL PACKAGES' : 'TỔNG SỐ GÓI'}</span>
            <h2 className="stat-value">{priorityLevels.length}</h2>
          </div>
        </div>

        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper green"><Check size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'ACTIVE PACKAGES' : 'ĐANG HOẠT ĐỘNG'}</span>
            <h2 className="stat-value">{priorityLevels.filter(p => p.isActive).length}</h2>
          </div>
        </div>

        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper orange"><X size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'INACTIVE PACKAGES' : 'DỪNG HOẠT ĐỘNG'}</span>
            <h2 className="stat-value">{priorityLevels.filter(p => !p.isActive).length}</h2>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-container glass-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{language === 'en' ? 'Package Name' : 'Tên gói giá'}</th>
              <th style={{ textAlign: 'right' }}>{language === 'en' ? 'Price' : 'Giá'}</th>
              <th>{language === 'en' ? 'Status' : 'Trạng thái'}</th>
              <th>{language === 'en' ? 'Created Date' : 'Ngày tạo'}</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {priorityLevels.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                  {language === 'en' ? 'No priority packages found.' : 'Chưa có gói giá nào.'}
                </td>
              </tr>
            ) : (
              priorityLevels.map(p => (
                <tr key={p.id} className={!p.isActive ? 'blocked-row' : ''}>
                  <td className="font-mono">{p.id}</td>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <strong className="text-neon-green">{p.price.toLocaleString('vi-VN')}₫</strong>
                  </td>
                  <td>
                    <span className={`badge-status ${p.isActive ? 'active' : 'blocked'}`}>
                      {p.isActive ? (language === 'en' ? 'Active' : 'Hoạt động') : (language === 'en' ? 'Inactive' : 'Tạm dừng')}
                    </span>
                  </td>
                  <td>{formatDate(p.createdAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        className="btn-action-icon unblock"
                        onClick={() => handleOpenEdit(p)}
                        title={language === 'en' ? 'Edit' : 'Sửa'}
                        disabled={isLoading}
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add button — đặt dưới bảng, dạng nút phụ nhỏ gọn */}
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
        <button className="btn-ghost" disabled={isLoading} onClick={handleOpenAdd}>
          <Plus size={16} />
          {language === 'en' ? 'Add Package' : 'Thêm gói giá'}
        </button>
      </div>

      {/* Add Priority Package Modal */}
      {isAddModalOpen && (
        <div className="listing-detail-backdrop">
          <div className="listing-form-modal glass-card" style={{ maxWidth: '400px', width: '100%' }}>
            <div className="listing-form-header">
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                {language === 'en' ? 'Add Priority Package' : 'Thêm gói giá đăng bài'}
              </h2>
              <button className="btn-icon" onClick={() => setIsAddModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={onAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600 }}>
                  {language === 'en' ? 'Package Name' : 'Tên gói giá'} <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  className="slot-input-text"
                  style={{ height: '40px', width: '100%', boxSizing: 'border-box', padding: '0 12px' }}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder={language === 'en' ? 'e.g. Premium Boost' : 'Ví dụ: Ưu tiên cao cấp'}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600 }}>
                  {language === 'en' ? 'Price (VND)' : 'Giá (VNĐ)'} <span style={{ color: 'red' }}>*</span>
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="isActiveAdd"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                />
                <label htmlFor="isActiveAdd" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  {language === 'en' ? 'Active immediately' : 'Kích hoạt hoạt động ngay'}
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn-ghost" onClick={() => setIsAddModalOpen(false)}>
                  {language === 'en' ? 'Cancel' : 'Hủy'}
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0 20px' }} disabled={isLoading}>
                  {language === 'en' ? 'Create' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Priority Package Modal */}
      {isEditModalOpen && (
        <div className="listing-detail-backdrop">
          <div className="listing-form-modal glass-card" style={{ maxWidth: '400px', width: '100%' }}>
            <div className="listing-form-header">
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                {language === 'en' ? 'Edit Priority Package' : 'Chỉnh sửa gói giá đăng bài'}
              </h2>
              <button className="btn-icon" onClick={() => setIsEditModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={onEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600 }}>
                  {language === 'en' ? 'Package Name' : 'Tên gói giá'} <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  className="slot-input-text"
                  style={{ height: '40px', width: '100%', boxSizing: 'border-box', padding: '0 12px' }}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600 }}>
                  {language === 'en' ? 'Price (VND)' : 'Giá (VNĐ)'} <span style={{ color: 'red' }}>*</span>
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
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="isActiveEdit"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                />
                <label htmlFor="isActiveEdit" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  {language === 'en' ? 'Active' : 'Đang hoạt động'}
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn-ghost" onClick={() => setIsEditModalOpen(false)}>
                  {language === 'en' ? 'Cancel' : 'Hủy'}
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0 20px' }} disabled={isLoading}>
                  {language === 'en' ? 'Save Changes' : 'Lưu Thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
