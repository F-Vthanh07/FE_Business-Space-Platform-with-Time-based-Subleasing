import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './ConfirmModal.css';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

// Hook thay thế window.confirm bằng modal ở giữa màn hình, giữ nguyên cách dùng
// dạng Promise<boolean> để chỉ cần đổi "window.confirm(...)" -> "await confirm(...)".
export const useConfirm = () => {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    const opts: ConfirmOptions = typeof options === 'string' ? { message: options } : options;
    return new Promise<boolean>((resolve) => {
      setState({ ...opts, resolve });
    });
  }, []);

  const handleClose = (result: boolean) => {
    state?.resolve(result);
    setState(null);
  };

  const confirmModal = state
    ? createPortal(
        <div className="confirm-backdrop" onClick={() => handleClose(false)}>
          <div className="confirm-shell" onClick={(e) => e.stopPropagation()}>
            {state.title && <h3 className="confirm-title">{state.title}</h3>}
            <p className="confirm-message">{state.message}</p>
            <div className="confirm-actions">
              <button className="confirm-btn confirm-btn--cancel" onClick={() => handleClose(false)}>
                {state.cancelLabel || 'Hủy'}
              </button>
              <button
                className={`confirm-btn ${state.danger ? 'confirm-btn--danger' : 'confirm-btn--primary'}`}
                onClick={() => handleClose(true)}
              >
                {state.confirmLabel || 'Đồng ý'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return { confirm, confirmModal };
};
