import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Check, X, Tag, Sparkles } from 'lucide-react';
import type { BusinessCategory } from '../types';

interface CategoriesModuleProps {
  categories: BusinessCategory[];
  handleCreateCategory: (name: string, isActive: boolean) => Promise<void>;
  handleBulkCreateCategories: () => Promise<void>;
  handleUpdateCategory: (id: number, name: string, isActive: boolean) => Promise<void>;
  handleDeleteCategory: (id: number) => Promise<void>;
  isLoading: boolean;
  language: 'en' | 'vi';
}

export const CategoriesModule: React.FC<CategoriesModuleProps> = ({
  categories,
  handleCreateCategory,
  handleBulkCreateCategories,
  handleUpdateCategory,
  handleDeleteCategory,
  isLoading,
  language,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleOpenAdd = () => {
    setName('');
    setIsActive(true);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (cat: BusinessCategory) => {
    setSelectedCategory(cat);
    setName(cat.name);
    setIsActive(cat.isActive);
    setIsEditModalOpen(true);
  };

  const onAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert(language === 'en' ? 'Please enter a category name' : 'Vui lòng nhập tên ngành nghề');
    try {
      await handleCreateCategory(name.trim(), isActive);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const onEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert(language === 'en' ? 'Please enter a category name' : 'Vui lòng nhập tên ngành nghề');
    if (!selectedCategory) return;
    try {
      await handleUpdateCategory(selectedCategory.id, name.trim(), isActive);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const onToggleActive = async (cat: BusinessCategory) => {
    try {
      await handleUpdateCategory(cat.id, cat.name, !cat.isActive);
    } catch (err) {
      console.error(err);
    }
  };

  const onDeleteClick = async (id: number) => {
    if (window.confirm(language === 'en' ? 'Are you sure you want to delete this category?' : 'Bạn có chắc chắn muốn xóa ngành nghề này?')) {
      try {
        await handleDeleteCategory(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="admin-module animate-fade-in">
      <header className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>{language === 'en' ? 'Business Categories' : 'Quản lý Ngành nghề'}</h1>
          <p>{language === 'en' ? 'Configure available business niches allowed for sub-leasing' : 'Quản lý các ngành hàng kinh doanh được phép đăng ký thuê lại mặt bằng'}</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-approve" 
            style={{ background: 'rgba(131, 56, 236, 0.15)', border: '1px solid rgba(131, 56, 236, 0.3)', color: '#8338ec' }}
            disabled={isLoading}
            onClick={handleBulkCreateCategories}
          >
            <Sparkles size={16} />
            {language === 'en' ? 'Quick Initialize' : 'Khởi tạo Nhanh'}
          </button>
          <button className="btn-approve" disabled={isLoading} onClick={handleOpenAdd}>
            <Plus size={16} />
            {language === 'en' ? 'Add Category' : 'Thêm Ngành nghề'}
          </button>
        </div>
      </header>

      {/* Summary Stats Cards */}
      <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper blue"><Tag size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'TOTAL CATEGORIES' : 'TỔNG SỐ NGÀNH NGHỀ'}</span>
            <h2 className="stat-value">{categories.length}</h2>
          </div>
        </div>

        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper green"><Check size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'ACTIVE CATEGORIES' : 'ĐANG HOẠT ĐỘNG'}</span>
            <h2 className="stat-value">{categories.filter(c => c.isActive).length}</h2>
          </div>
        </div>

        <div className="admin-stat-card glass-card">
          <div className="stat-icon-wrapper orange"><X size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">{language === 'en' ? 'INACTIVE CATEGORIES' : 'DỪNG HOẠT ĐỘNG'}</span>
            <h2 className="stat-value">{categories.filter(c => !c.isActive).length}</h2>
          </div>
        </div>
      </div>

      {/* Grid Table */}
      <div className="admin-table-container glass-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{language === 'en' ? 'Category Name' : 'Tên Ngành nghề'}</th>
              <th>{language === 'en' ? 'Status' : 'Trạng thái'}</th>
              <th>{language === 'en' ? 'Created Date' : 'Ngày tạo'}</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>
                  {language === 'en' ? 'No categories found. Click Quick Initialize to load default categories.' : 'Chưa có ngành nghề nào. Nhấn Khởi tạo Nhanh để nạp danh sách mẫu.'}
                </td>
              </tr>
            ) : (
              categories.map(cat => (
                <tr key={cat.id} className={!cat.isActive ? 'blocked-row' : ''}>
                  <td className="font-mono">{cat.id}</td>
                  <td>
                    <strong>{cat.name}</strong>
                  </td>
                  <td>
                    <span className={`badge-status ${cat.isActive ? 'active' : 'blocked'}`}>
                      {cat.isActive ? (language === 'en' ? 'Active' : 'Hoạt động') : (language === 'en' ? 'Inactive' : 'Tạm dừng')}
                    </span>
                  </td>
                  <td>
                    {cat.createdAt && cat.createdAt !== '0001-01-01T00:00:00' 
                      ? new Date(cat.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN')
                      : 'N/A'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      {/* Toggle Active status */}
                      <button 
                        className={`btn-action-icon ${cat.isActive ? 'block' : 'unblock'}`}
                        onClick={() => onToggleActive(cat)}
                        title={cat.isActive ? (language === 'en' ? 'Deactivate' : 'Tạm khóa') : (language === 'en' ? 'Activate' : 'Kích hoạt')}
                        disabled={isLoading}
                      >
                        {cat.isActive ? <X size={14} /> : <Check size={14} />}
                      </button>

                      {/* Edit Name */}
                      <button 
                        className="btn-action-icon unblock"
                        onClick={() => handleOpenEdit(cat)}
                        title={language === 'en' ? 'Edit name' : 'Đổi tên'}
                        disabled={isLoading}
                      >
                        <Edit3 size={14} />
                      </button>

                      {/* Delete */}
                      <button 
                        className="btn-action-icon block"
                        onClick={() => onDeleteClick(cat.id)}
                        title={language === 'en' ? 'Delete' : 'Xóa bỏ'}
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

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <div className="listing-detail-backdrop">
          <div className="listing-form-modal glass-card" style={{ maxWidth: '400px', width: '100%' }}>
            <div className="listing-form-header">
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                {language === 'en' ? 'Add Business Category' : 'Thêm Ngành nghề Kinh doanh'}
              </h2>
              <button className="btn-icon" onClick={() => setIsAddModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={onAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600 }}>
                  {language === 'en' ? 'Category Name' : 'Tên ngành nghề'} <span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="slot-input-text"
                  style={{ height: '40px', width: '100%', boxSizing: 'border-box', padding: '0 12px' }}
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  required 
                  placeholder={language === 'en' ? 'e.g. Retail Services' : 'Ví dụ: Dịch vụ ăn uống'}
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
                <button type="submit" className="btn-primary" style={{ padding: '0 20px' }}>
                  {language === 'en' ? 'Create' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {isEditModalOpen && (
        <div className="listing-detail-backdrop">
          <div className="listing-form-modal glass-card" style={{ maxWidth: '400px', width: '100%' }}>
            <div className="listing-form-header">
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                {language === 'en' ? 'Edit Business Category' : 'Chỉnh sửa Ngành nghề'}
              </h2>
              <button className="btn-icon" onClick={() => setIsEditModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={onEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600 }}>
                  {language === 'en' ? 'Category Name' : 'Tên ngành nghề'} <span style={{ color: 'red' }}>*</span>
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
                <button type="submit" className="btn-primary" style={{ padding: '0 20px' }}>
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
