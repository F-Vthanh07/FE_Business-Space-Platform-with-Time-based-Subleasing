import { API_BASE_URL } from '../../../config/api';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otpCode: string;
  newPassword: string;
}

export const requestPasswordReset = async (email: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/Auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', accept: '*/*' },
    body: JSON.stringify({ email } satisfies ForgotPasswordRequest),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Không thể gửi yêu cầu đặt lại mật khẩu.');
  }
};

export const resetPassword = async (
  email: string,
  otpCode: string,
  newPassword: string
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/Auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', accept: '*/*' },
    body: JSON.stringify({ email, otpCode, newPassword } satisfies ResetPasswordRequest),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Không thể đặt lại mật khẩu.');
  }
};
