import React, { useState, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import './Toast.css';

export interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  return { toast, showToast };
};

export const Toast: React.FC<{ toast: ToastState | null }> = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className={`app-toast ${toast.type}`}>
      {toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
      <span>{toast.message}</span>
    </div>
  );
};
