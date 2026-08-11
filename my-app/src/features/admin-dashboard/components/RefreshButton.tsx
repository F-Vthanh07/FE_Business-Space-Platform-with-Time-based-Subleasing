import React from 'react';
import { RefreshCw } from 'lucide-react';

interface RefreshButtonProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
  language: 'en' | 'vi';
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({ onRefresh, isRefreshing, language }) => (
  <button
    type="button"
    className="btn-icon admin-refresh-btn"
    onClick={onRefresh}
    disabled={isRefreshing}
    title={language === 'en' ? 'Refresh' : 'Làm mới'}
  >
    <RefreshCw size={16} className={isRefreshing ? 'spin' : ''} />
  </button>
);
