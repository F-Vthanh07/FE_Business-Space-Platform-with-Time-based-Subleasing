import React, { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle, PauseCircle, Eye, X, BadgeCheck, ShieldQuestion, ChevronLeft, ChevronRight } from 'lucide-react';
import type { UserAccount, AdminUserProfile } from '../types';
import { fetchUserProfile } from '../api/admin.api';
import { RefreshButton } from './RefreshButton';

interface UsersModuleProps {
  users: UserAccount[];
  updateUserStatus: (userId: string, newStatus: string) => void;
  language: 'en' | 'vi';
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const ITEMS_PER_PAGE = 10;

export const UsersModule: React.FC<UsersModuleProps> = ({ users, updateUserStatus, language, onRefresh, isRefreshing }) => {
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [profile, setProfile] = useState<AdminUserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const token = localStorage.getItem('portal_token');

  const totalPages = Math.max(1, Math.ceil(users.length / ITEMS_PER_PAGE));
  const pagedUsers = users.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [users.length]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  const openUserDetail = async (user: UserAccount) => {
    setSelectedUser(user);
    setProfile(null);
    setProfileError(false);
    if (!token) return;
    setIsProfileLoading(true);
    try {
      const data = await fetchUserProfile(user.id, token);
      setProfile(data);
    } catch (e) {
      console.warn('Không tải được hồ sơ CCCD của người dùng', user.id, e);
      setProfileError(true);
    } finally {
      setIsProfileLoading(false);
    }
  };

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
        <div>
          <h1>{language === 'en' ? 'User Accounts' : 'Quản lý Người dùng'}</h1>
          <p>{language === 'en' ? 'Manage roles, permission layers, and access keys' : 'Quản lý quyền hạn, vai trò và trạng thái tài khoản'}</p>
        </div>
        <RefreshButton onRefresh={onRefresh} isRefreshing={isRefreshing} language={language} />
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
            {pagedUsers.map(u => (
              <tr
                key={u.id}
                className={`${u.status === 'Banned' ? 'blocked-row' : ''} user-row-clickable`}
                onClick={() => openUserDetail(u)}
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
                      onClick={() => openUserDetail(u)}
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

      {/* Pagination */}
      {users.length > 0 && totalPages > 1 && (
        <div className="admin-pagination">
          <button
            type="button"
            className="btn-icon"
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
            title={language === 'en' ? 'Previous' : 'Trang trước'}
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              type="button"
              key={page}
              className={`admin-pagination-page ${page === currentPage ? 'admin-pagination-page--active' : ''}`}
              onClick={() => goToPage(page)}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            className="btn-icon"
            disabled={currentPage === totalPages}
            onClick={() => goToPage(currentPage + 1)}
            title={language === 'en' ? 'Next' : 'Trang sau'}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

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
                  {(profile?.avatarUrl || selectedUser.profileAvatarUrl) ? (
                    <img src={profile?.avatarUrl || selectedUser.profileAvatarUrl || ''} alt="avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  ) : (
                    (profile?.fullName || selectedUser.name)[0]
                  )}
                </div>
                <div>
                  <h3 style={{margin: 0, fontSize: '1.25rem', color: 'var(--color-text-primary)'}}>{profile?.fullName || selectedUser.name}</h3>
                  <div style={{display: 'flex', gap: '10px', marginTop: '6px', alignItems: 'center'}}>
                    <span className={`badge-role ${selectedUser.role.toLowerCase()}`}>{selectedUser.role}</span>
                    {renderStatusBadge(selectedUser.status)}
                    {profile && (
                      profile.isVerified ? (
                        <span style={{display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', border: '1px solid #16a34a40'}}>
                          <BadgeCheck size={13} />
                          {language === 'en' ? 'ID Verified' : 'Đã xác minh CCCD'}
                        </span>
                      ) : (
                        <span style={{display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: 'rgba(217, 119, 6, 0.1)', color: '#d97706', border: '1px solid #d9770640'}}>
                          <ShieldQuestion size={13} />
                          {language === 'en' ? 'Not verified' : 'Chưa xác minh'}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Citizen ID information — sourced from Profile API, takes precedence over account data */}
              {isProfileLoading && (
                <p className="text-secondary" style={{padding: '8px 0'}}>
                  {language === 'en' ? 'Loading citizen ID information...' : 'Đang tải thông tin CCCD...'}
                </p>
              )}

              {!isProfileLoading && profile && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr',
                  gap: '12px 16px',
                  alignItems: 'start',
                  background: 'var(--color-bg-hover)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)'
                }}>
                  <strong style={{gridColumn: '1 / -1', color: 'var(--color-text-primary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                    {language === 'en' ? 'Citizen ID Information' : 'Thông tin Căn cước công dân'}
                  </strong>

                  <strong style={{color: 'var(--color-text-secondary)'}}>{language === 'en' ? 'ID Number' : 'Số CCCD'}:</strong>
                  <span className="font-mono">{renderValue(profile.citizenIDNumber || profile.identityCardNumber)}</span>

                  <strong style={{color: 'var(--color-text-secondary)'}}>{language === 'en' ? 'Full Name' : 'Họ và tên'}:</strong>
                  <span>{renderValue(profile.fullName)}</span>

                  <strong style={{color: 'var(--color-text-secondary)'}}>{language === 'en' ? 'Date of Birth' : 'Ngày sinh'}:</strong>
                  <span>{formatDate(profile.dob)}</span>

                  <strong style={{color: 'var(--color-text-secondary)'}}>{language === 'en' ? 'Gender' : 'Giới tính'}:</strong>
                  <span>{renderValue(profile.gender)}</span>

                  <strong style={{color: 'var(--color-text-secondary)'}}>{language === 'en' ? 'Permanent Residence' : 'Nơi thường trú'}:</strong>
                  <span>{renderValue(profile.permanentResidence)}</span>

                  <strong style={{color: 'var(--color-text-secondary)'}}>{language === 'en' ? 'Date of Issue' : 'Ngày cấp'}:</strong>
                  <span>{formatDate(profile.dateOfIssue)}</span>
                </div>
              )}

              {!isProfileLoading && profileError && (
                <p className="text-negative" style={{padding: '8px 0', fontSize: '13px'}}>
                  {language === 'en' ? 'Could not load citizen ID information.' : 'Không tải được thông tin CCCD.'}
                </p>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr',
                gap: '12px 16px',
                alignItems: 'start',
                background: 'var(--color-bg-hover)',
                padding: '20px',
                borderRadius: '12px'
              }}>
                <strong style={{gridColumn: '1 / -1', color: 'var(--color-text-primary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                  {language === 'en' ? 'Account Information' : 'Thông tin Tài khoản'}
                </strong>

                <strong style={{color: 'var(--color-text-secondary)'}}>ID:</strong>
                <span className="font-mono" style={{wordBreak: 'break-all'}}>{selectedUser.id}</span>

                <strong style={{color: 'var(--color-text-secondary)'}}>Email:</strong>
                <span style={{wordBreak: 'break-all'}}>{selectedUser.email}</span>

                <strong style={{color: 'var(--color-text-secondary)'}}>{language === 'en' ? 'Phone' : 'Số điện thoại'}:</strong>
                <span>{renderValue(selectedUser.phoneNumber)}</span>

                {!profile && (
                  <>
                    <strong style={{color: 'var(--color-text-secondary)'}}>{language === 'en' ? 'Full Name' : 'Họ và tên'}:</strong>
                    <span>{renderValue(selectedUser.profileFullName)}</span>

                    <strong style={{color: 'var(--color-text-secondary)'}}>{language === 'en' ? 'Date of Birth' : 'Ngày sinh'}:</strong>
                    <span>{formatDate(selectedUser.dob)}</span>

                    <strong style={{color: 'var(--color-text-secondary)'}}>{language === 'en' ? 'Gender' : 'Giới tính'}:</strong>
                    <span>{renderValue(selectedUser.profileGender)}</span>
                  </>
                )}

                <strong style={{color: 'var(--color-text-secondary)'}}>{language === 'en' ? 'Bio' : 'Tiểu sử'}:</strong>
                <span>{renderValue(profile?.bio ?? selectedUser.profileBio)}</span>

                <strong style={{color: 'var(--color-text-secondary)'}}>{language === 'en' ? 'Social Link' : 'Liên kết MXH'}:</strong>
                <span>
                  {(profile?.socialLink || selectedUser.profileSocialLink) ? (
                    <a href={profile?.socialLink || selectedUser.profileSocialLink || ''} target="_blank" rel="noreferrer" style={{color: 'var(--color-accent)', textDecoration: 'none'}}>
                      {profile?.socialLink || selectedUser.profileSocialLink}
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
