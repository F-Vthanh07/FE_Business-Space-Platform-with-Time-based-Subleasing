import React from 'react';
import { ShieldAlert as BlockIcon } from 'lucide-react';
import type { UserAccount } from '../types';

interface UsersModuleProps {
  users: UserAccount[];
  toggleUserStatus: (userId: string) => void;
  language: 'en' | 'vi';
}

export const UsersModule: React.FC<UsersModuleProps> = ({ users, toggleUserStatus, language }) => {
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
              <th>ID</th>
              <th>{language === 'en' ? 'User Info' : 'Người dùng'}</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className={u.status === 'BLOCKED' ? 'blocked-row' : ''}>
                <td className="font-mono">{u.id}</td>
                <td>
                  <div className="user-info-cell">
                    <div className="user-avatar-mini">{u.name[0]}</div>
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
                  {u.role !== 'ADMIN' && (
                    <button 
                      className={`btn-action-icon ${u.status === 'ACTIVE' ? 'block' : 'unblock'}`}
                      onClick={() => toggleUserStatus(u.id)}
                      title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                    >
                      <BlockIcon size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
