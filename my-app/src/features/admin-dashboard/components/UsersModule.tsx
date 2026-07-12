import React, { useState } from 'react';
import { ShieldAlert as BlockIcon, Eye, X } from 'lucide-react';
import type { UserAccount } from '../types';

interface UsersModuleProps {
  users: UserAccount[];
  toggleUserStatus: (userId: string) => void;
  language: 'en' | 'vi';
}

export const UsersModule: React.FC<UsersModuleProps> = ({ users, toggleUserStatus, language }) => {
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  const renderValue = (val: string | null | undefined) => {
    return val ? val : (language === 'en' ? 'Not updated' : 'Chưa cập nhật');
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr || dateStr === '0001-01-01T00:00:00' || dateStr.startsWith('0001-01-01')) return renderValue(null);
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="admin-module animate-fade-in">
      <header className="module-header">
        <h1>{language === 'en' ? 'User Accounts' : 'Quản lý Người dùng'}</h1>
        <p>{language === 'en' ? 'Manage roles, permission layers, and access keys' : 'Quản lý quyền hạn, vai trò và trạng thái tài khoản'}</p>
      </header>

      <div className="admin-table-container glass-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{language === 'en' ? 'User Info' : 'Người dùng'}</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr 
                key={u.id} 
                className={`${u.status === 'BLOCKED' ? 'blocked-row' : ''} user-row-clickable`}
                onClick={() => setSelectedUser(u)}
              >
                <td>
                  <div className="user-info-cell">
                    <div className="user-avatar-mini">
                      {u.profileAvatarUrl ? (
                        <img src={u.profileAvatarUrl} alt="avatar" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
                      ) : (
                        u.name[0]
                      )}
                    </div>
                    <span className="user-name">{u.name}</span>
                  </div>
                </td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge-role ${u.role.toLowerCase()}`}>{u.role}</span>
                </td>
                <td>
                  <span className={`badge-status ${u.status.toLowerCase()}`}>
                    {u.status === 'ACTIVE' ? (language === 'en' ? 'Active' : 'Hoạt động') : (language === 'en' ? 'Blocked' : 'Bị Khóa')}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button 
                      className="btn-action-icon edit"
                      onClick={() => setSelectedUser(u)}
                      title={language === 'en' ? 'View Details' : 'Xem chi tiết'}
                    >
                      <Eye size={16} />
                    </button>
                    {u.role !== 'ADMIN' && (
                      <button 
                        className={`btn-action-icon ${u.status === 'ACTIVE' ? 'block' : 'unblock'}`}
                        onClick={(e) => { e.stopPropagation(); toggleUserStatus(u.id); }}
                        title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                      >
                        <BlockIcon size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="admin-modal-overlay animate-fade-in" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal-content glass-card" style={{maxWidth: '550px'}} onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setSelectedUser(null)}>
              <X size={20} />
            </button>
            <h2 style={{marginBottom: '24px', fontSize: '1.5rem'}}>{language === 'en' ? 'User Details' : 'Chi tiết Người dùng'}</h2>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                <div style={{width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', overflow: 'hidden'}}>
                  {selectedUser.profileAvatarUrl ? (
                    <img src={selectedUser.profileAvatarUrl} alt="avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  ) : (
                    selectedUser.name[0]
                  )}
                </div>
                <div>
                  <h3 style={{margin: 0, fontSize: '1.25rem', color: '#fff'}}>{selectedUser.name}</h3>
                  <div style={{display: 'flex', gap: '10px', marginTop: '6px'}}>
                    <span className={`badge-role ${selectedUser.role.toLowerCase()}`}>{selectedUser.role}</span>
                    <span className={`badge-status ${selectedUser.status.toLowerCase()}`}>
                      {selectedUser.status === 'ACTIVE' ? (language === 'en' ? 'Active' : 'Hoạt động') : (language === 'en' ? 'Blocked' : 'Bị Khóa')}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid', 
                gridTemplateColumns: '140px 1fr', 
                gap: '12px 16px', 
                alignItems: 'start',
                background: 'rgba(0, 0, 0, 0.2)',
                padding: '20px',
                borderRadius: '12px'
              }}>
                <strong style={{color: 'rgba(255,255,255,0.7)'}}>ID:</strong> 
                <span className="font-mono" style={{wordBreak: 'break-all'}}>{selectedUser.id}</span>
                
                <strong style={{color: 'rgba(255,255,255,0.7)'}}>Email:</strong> 
                <span style={{wordBreak: 'break-all'}}>{selectedUser.email}</span>
                
                <strong style={{color: 'rgba(255,255,255,0.7)'}}>{language === 'en' ? 'Phone' : 'Số điện thoại'}:</strong> 
                <span>{renderValue(selectedUser.phoneNumber)}</span>
                
                <strong style={{color: 'rgba(255,255,255,0.7)'}}>{language === 'en' ? 'Full Name' : 'Họ và tên'}:</strong> 
                <span>{renderValue(selectedUser.profileFullName)}</span>

                <strong style={{color: 'rgba(255,255,255,0.7)'}}>{language === 'en' ? 'Date of Birth' : 'Ngày sinh'}:</strong> 
                <span>{formatDate(selectedUser.dob)}</span>
                
                <strong style={{color: 'rgba(255,255,255,0.7)'}}>{language === 'en' ? 'Gender' : 'Giới tính'}:</strong> 
                <span>{renderValue(selectedUser.profileGender)}</span>
                
                <strong style={{color: 'rgba(255,255,255,0.7)'}}>{language === 'en' ? 'Bio' : 'Tiểu sử'}:</strong> 
                <span>{renderValue(selectedUser.profileBio)}</span>
                
                <strong style={{color: 'rgba(255,255,255,0.7)'}}>{language === 'en' ? 'Social Link' : 'Liên kết MXH'}:</strong> 
                <span>
                  {selectedUser.profileSocialLink ? (
                    <a href={selectedUser.profileSocialLink} target="_blank" rel="noreferrer" style={{color: '#4db8ff', textDecoration: 'none'}}>
                      {selectedUser.profileSocialLink}
                    </a>
                  ) : renderValue(null)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
