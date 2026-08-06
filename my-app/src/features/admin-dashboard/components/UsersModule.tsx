import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, PauseCircle, Eye, X } from 'lucide-react';
import type { UserAccount } from '../types';

interface UsersModuleProps {
  users: UserAccount[];
  updateUserStatus: (userId: string, newStatus: string) => void;
  language: 'en' | 'vi';
}

export const UsersModule: React.FC<UsersModuleProps> = ({ users, updateUserStatus, language }) => {
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

  const renderStatusBadge = (status: string) => {
    let bg = 'rgba(100, 116, 139, 0.12)';
    let color = '#64748b';
    let text = status;

    if (status === 'Active') {
      bg = 'rgba(22, 163, 74, 0.1)';
      color = '#16a34a';
      text = language === 'en' ? 'Active' : 'Hoạt động';
    } else if (status === 'Suspended') {
      bg = 'rgba(217, 119, 6, 0.1)';
      color = '#d97706';
      text = language === 'en' ? 'Suspended' : 'Đình chỉ';
    } else if (status === 'Banned') {
      bg = 'rgba(220, 38, 38, 0.1)';
      color = '#dc2626';
      text = language === 'en' ? 'Banned' : 'Bị Cấm';
    }

    return (
      <span style={{
        fontSize: '11px',
        fontWeight: 700,
        padding: '4px 10px',
        borderRadius: '6px',
        background: bg,
        color: color,
        border: `1px solid ${color}40`,
        display: 'inline-block'
      }}>
        {text}
      </span>
    );
  };

  const ActionButton = ({ onClick, icon: Icon, text, color, hoverBg }: any) => (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={text}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 12px',
        borderRadius: '8px',
        border: `1px solid ${color}40`,
        background: `${color}15`,
        color: color,
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 600,
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = hoverBg;
        e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = `${color}15`;
        e.currentTarget.style.borderColor = `${color}40`;
      }}
    >
      <Icon size={16} />
      <span>{text}</span>
    </button>
  );

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
                className={`${u.status === 'Banned' ? 'blocked-row' : ''} user-row-clickable`}
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
                  {renderStatusBadge(u.status)}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <ActionButton
                      icon={Eye}
                      text={language === 'en' ? 'View' : 'Xem'}
                      color="#2563eb"
                      hoverBg="rgba(37, 99, 235, 0.2)"
                      onClick={() => setSelectedUser(u)}
                    />

                    {u.role !== 'ADMIN' && (
                      <>
                        {u.status !== 'Active' && (
                          <ActionButton
                            icon={CheckCircle}
                            text={language === 'en' ? 'Activate' : 'Kích hoạt'}
                            color="#16a34a"
                            hoverBg="rgba(22, 163, 74, 0.2)"
                            onClick={() => updateUserStatus(u.id, 'Active')}
                          />
                        )}
                        {u.status === 'Active' && (
                          <ActionButton
                            icon={PauseCircle}
                            text={language === 'en' ? 'Suspend' : 'Đình chỉ'}
                            color="#d97706"
                            hoverBg="rgba(217, 119, 6, 0.2)"
                            onClick={() => updateUserStatus(u.id, 'Suspended')}
                          />
                        )}
                        {u.status !== 'Banned' && (
                          <ActionButton
                            icon={ShieldAlert}
                            text={language === 'en' ? 'Ban' : 'Cấm'}
                            color="#dc2626"
                            hoverBg="rgba(220, 38, 38, 0.2)"
                            onClick={() => updateUserStatus(u.id, 'Banned')}
                          />
                        )}
                      </>
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
                <div style={{width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', overflow: 'hidden', color: 'var(--color-text-primary)'}}>
                  {selectedUser.profileAvatarUrl ? (
                    <img src={selectedUser.profileAvatarUrl} alt="avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  ) : (
                    selectedUser.name[0]
                  )}
                </div>
                <div>
                  <h3 style={{margin: 0, fontSize: '1.25rem', color: 'var(--color-text-primary)'}}>{selectedUser.name}</h3>
                  <div style={{display: 'flex', gap: '10px', marginTop: '6px', alignItems: 'center'}}>
                    <span className={`badge-role ${selectedUser.role.toLowerCase()}`}>{selectedUser.role}</span>
                    {renderStatusBadge(selectedUser.status)}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr',
                gap: '12px 16px',
                alignItems: 'start',
                background: 'var(--color-bg-hover)',
                padding: '20px',
                borderRadius: '12px'
              }}>
                <strong style={{color: 'var(--color-text-secondary)'}}>ID:</strong>
                <span className="font-mono" style={{wordBreak: 'break-all'}}>{selectedUser.id}</span>

                <strong style={{color: 'var(--color-text-secondary)'}}>Email:</strong>
                <span style={{wordBreak: 'break-all'}}>{selectedUser.email}</span>

                <strong style={{color: 'var(--color-text-secondary)'}}>{language === 'en' ? 'Phone' : 'Số điện thoại'}:</strong>
                <span>{renderValue(selectedUser.phoneNumber)}</span>

                <strong style={{color: 'var(--color-text-secondary)'}}>{language === 'en' ? 'Full Name' : 'Họ và tên'}:</strong>
                <span>{renderValue(selectedUser.profileFullName)}</span>

                <strong style={{color: 'var(--color-text-secondary)'}}>{language === 'en' ? 'Date of Birth' : 'Ngày sinh'}:</strong>
                <span>{formatDate(selectedUser.dob)}</span>

                <strong style={{color: 'var(--color-text-secondary)'}}>{language === 'en' ? 'Gender' : 'Giới tính'}:</strong>
                <span>{renderValue(selectedUser.profileGender)}</span>

                <strong style={{color: 'var(--color-text-secondary)'}}>{language === 'en' ? 'Bio' : 'Tiểu sử'}:</strong>
                <span>{renderValue(selectedUser.profileBio)}</span>

                <strong style={{color: 'var(--color-text-secondary)'}}>{language === 'en' ? 'Social Link' : 'Liên kết MXH'}:</strong>
                <span>
                  {selectedUser.profileSocialLink ? (
                    <a href={selectedUser.profileSocialLink} target="_blank" rel="noreferrer" style={{color: 'var(--color-accent)', textDecoration: 'none'}}>
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
