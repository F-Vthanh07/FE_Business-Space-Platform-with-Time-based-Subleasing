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

export interface ChangePasswordRequest {
  email: string;
  currentPassword: string;
  newPassword: string;
}

export const changePassword = async (
  email: string,
  currentPassword: string,
  newPassword: string,
  token?: string
): Promise<string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    accept: '*/*',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/Auth/change-password`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, currentPassword, newPassword } satisfies ChangePasswordRequest),
  });

  const rawText = (await response.text()).trim();

  let message = '';
  if (rawText) {
    try {
      const parsed = JSON.parse(rawText);
      if (typeof parsed === 'string') {
        message = parsed;
      } else if (parsed && typeof parsed === 'object') {
        message = parsed.message || parsed.detail || parsed.title || rawText;
      }
    } catch {
      message = rawText;
    }
  }

  if (!response.ok) {
    throw new Error(message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.');
  }

  return message || 'Đổi mật khẩu thành công.';
};

export interface UserProfileResponse {
  userId: string;
  userName: string;
  phoneNumber: string | null;
  email: string;
  role: string;
  userStatus: string;
  profileFullName: string | null;
  profileAvatarUrl: string | null;
  profileBio: string | null;
  profileSocialLink: string | null;
  profileGender: string | null;
}

export const fetchUserProfile = async (userId: string, token: string): Promise<UserProfileResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/User/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: '*/*',
    },
  });

  if (!response.ok) {
    throw new Error('Không thể lấy thông tin người dùng.');
  }

  const data: UserProfileResponse = await response.json();

  if (data) {
    if (data.userId) localStorage.setItem('current_user_id', data.userId);
    if (data.email) localStorage.setItem('portal_email', data.email);
    const displayName = data.profileFullName || data.userName;
    if (displayName) {
      localStorage.setItem('portal_user_name', displayName);
      localStorage.setItem('current_user_name', displayName);
    }
    if (data.phoneNumber) localStorage.setItem('portal_phone', data.phoneNumber);
    if (data.role) localStorage.setItem('portal_role', data.role.toLowerCase());
    if (data.userStatus) localStorage.setItem('portal_user_status', data.userStatus);
    localStorage.setItem('userprofile', JSON.stringify(data));
  }

  return data;
};



