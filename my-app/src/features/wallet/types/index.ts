export type TransactionType = 'deposit' | 'payment' | 'payout' | 'refund';
export type TransactionStatus = 'success' | 'pending' | 'failed';
export type PaymentMethodId = 'vnpay' | 'momo' | 'stripe' | 'bank';

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number; // VND, always positive; sign is derived from `type`
  method: PaymentMethodId;
  note?: string;
  createdAt: string; // ISO date-time
}

export interface WalletSummary {
  walletId: string;
  balance: number;
  pendingBalance: number;
  totalDeposited: number;
  totalSpent: number;
  linkedAccount: string;
}

export interface PaymentMethodOption {
  id: PaymentMethodId;
  name: string;
  description: string;
}

export interface WalletOwnerUser {
  userId: string;
  phoneNumber: string | null;
  email: string | null;
  role: string;
  userStatus: string;
  profileFullName: string | null;
  profileAvatarUrl: string | null;
  profileBio: string | null;
  profileSocialLink: string | null;
  profileGender: string | null;
}

export interface WalletAccount {
  id: number;
  balance: number;
  user: WalletOwnerUser;
  name: string | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}
