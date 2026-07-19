import type { WalletAccount } from '../types';
import { API_BASE_URL } from '../../../config/api';

export interface CreateDepositRequest {
  amount: number;
  returnUrl: string;
  cancelUrl: string;
}

export const fetchWalletAccount = async (token: string): Promise<WalletAccount> => {
  const response = await fetch(`${API_BASE_URL}/api/Wallet/own`, {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: '*/*',
    },
  });

  if (!response.ok) {
    throw new Error('Không thể tải thông tin ví. Vui lòng thử lại.');
  }

  return response.json();
};

export const createDepositTransaction = async (
  amount: number,
  token: string
): Promise<string> => {
  const body: CreateDepositRequest = {
    amount,
    returnUrl: `${window.location.origin}/payment/success`,
    cancelUrl: `${window.location.origin}/payment/failed`,
  };

  const response = await fetch(`${API_BASE_URL}/api/Transaction/create`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      accept: '*/*',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('Không thể tạo lệnh nạp tiền. Vui lòng thử lại.');
  }

  const raw = (await response.text()).trim();
  // Response body is either a bare URL string or a JSON-wrapped one — handle both.
  let checkoutUrl = raw;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') checkoutUrl = parsed;
    else checkoutUrl = parsed?.data || parsed?.checkoutUrl || parsed?.url || parsed?.paymentUrl;
  } catch {
    // not JSON — raw is already the plain URL string
  }

  if (!checkoutUrl || typeof checkoutUrl !== 'string' || !checkoutUrl.startsWith('http')) {
    throw new Error('Không nhận được đường dẫn thanh toán từ máy chủ.');
  }

  return checkoutUrl;
};
