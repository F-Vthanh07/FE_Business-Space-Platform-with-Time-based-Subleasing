import React from 'react';
import { Check, X, MapPin, Building, User as UserIcon } from 'lucide-react';
import type { SpaceApprovalItem } from '../types';

interface SpacesModuleProps {
  pendingSpaces: SpaceApprovalItem[];
  handleApproveSpace: (spaceId: string) => void;
  handleRejectSpace: (spaceId: string) => void;
  isLoading: boolean;
  language: 'en' | 'vi';
}

export const SpacesModule: React.FC<SpacesModuleProps> = ({
  pendingSpaces,
  handleApproveSpace,
  handleRejectSpace,
  isLoading,
  language,
}) => {
  return (
    <div className="admin-module animate-fade-in">
      <header className="module-header">
        <h1>{language === 'en' ? 'Spaces Verification' : 'Phê duyệt Mặt bằng'}</h1>
        <p>{language === 'en' ? 'Review properties registered by Space Owners' : 'Xét duyệt tính pháp lý và thông tin mặt bằng do Chủ nhà đăng tải'}</p>
      </header>

      <div className="approval-list-grid">
        {pendingSpaces.length === 0 ? (
          <div className="empty-approval glass-card">
            <Check size={36} className="text-neon-green" />
            <h3>{language === 'en' ? 'All spaces approved' : 'Không có mặt bằng nào đang chờ duyệt'}</h3>
            <p>{language === 'en' ? 'Everything is clear for now' : 'Hệ thống đã cập nhật đầy đủ thông tin'}</p>
          </div>
        ) : (
          pendingSpaces.map(sp => (
            <div key={sp.id} className="approval-card glass-card">
              <div className="approval-card-header">
                <span className="approval-id">ID: {sp.id}</span>
                <span className="approval-date">{sp.createdAt}</span>
              </div>

              <h2 className="approval-title">{sp.name}</h2>
              
              <div className="approval-details">
                <div className="detail-item">
                  <MapPin size={14} />
                  <span>{sp.address}</span>
                </div>
                <div className="detail-item">
                  <Building size={14} />
                  <span>{sp.area} sqm</span>
                </div>
                <div className="detail-item">
                  <UserIcon size={14} />
                  <span>Owner: <strong className="text-neon-green">{sp.ownerName}</strong> (ID: {sp.ownerId})</span>
                </div>
              </div>

              <div className="approval-card-actions">
                <button 
                  className="btn-approve" 
                  disabled={isLoading}
                  onClick={() => handleApproveSpace(sp.id)}
                >
                  <Check size={15} />
                  {language === 'en' ? 'Approve' : 'Duyệt'}
                </button>

                <button 
                  className="btn-reject" 
                  disabled={isLoading}
                  onClick={() => handleRejectSpace(sp.id)}
                >
                  <X size={15} />
                  {language === 'en' ? 'Reject' : 'Từ chối'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
