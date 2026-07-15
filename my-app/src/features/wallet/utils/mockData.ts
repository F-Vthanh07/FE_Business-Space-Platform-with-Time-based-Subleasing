import type { WalletSummary, WalletTransaction, PaymentMethodOption } from '../types';

export const mockWalletSummary: WalletSummary = {
  walletId: 'WAL-88213-ND',
  balance: 4250000,
  pendingBalance: 350000,
  totalDeposited: 18500000,
  totalSpent: 14250000,
  linkedAccount: 'nguyenduyanhh2020@gmail.com',
};

export const mockTransactions: WalletTransaction[] = [
  { id: 'TXN-00931', type: 'deposit', status: 'success', amount: 2000000, method: 'vnpay', note: 'Nạp tiền vào ví', createdAt: '2026-07-14T09:24:00Z' },
  { id: 'TXN-00930', type: 'payment', status: 'success', amount: 500000, method: 'bank', note: 'Thanh toán khung giờ Lê Lợi Q1', createdAt: '2026-07-13T15:10:00Z' },
  { id: 'TXN-00929', type: 'payout', status: 'pending', amount: 1200000, method: 'bank', note: 'Chi trả doanh thu cho thuê lại', createdAt: '2026-07-12T11:02:00Z' },
  { id: 'TXN-00928', type: 'deposit', status: 'failed', amount: 1000000, method: 'momo', note: 'Nạp tiền vào ví', createdAt: '2026-07-11T18:47:00Z' },
  { id: 'TXN-00927', type: 'refund', status: 'success', amount: 250000, method: 'vnpay', note: 'Hoàn tiền hủy lịch', createdAt: '2026-07-09T08:30:00Z' },
  { id: 'TXN-00926', type: 'payment', status: 'success', amount: 900000, method: 'stripe', note: 'Thanh toán hợp đồng thuê Quang Trung', createdAt: '2026-07-05T13:15:00Z' },
  { id: 'TXN-00925', type: 'deposit', status: 'success', amount: 3000000, method: 'vnpay', note: 'Nạp tiền vào ví', createdAt: '2026-06-29T10:05:00Z' },
];

export const paymentMethods: PaymentMethodOption[] = [
  { id: 'vnpay', name: 'VNPay', description: 'ATM / Internet Banking / QR Code' },
  { id: 'momo', name: 'MoMo', description: 'Ví điện tử MoMo' },
  { id: 'stripe', name: 'Stripe', description: 'Thẻ quốc tế Visa / Mastercard' },
  { id: 'bank', name: 'Bank Transfer', description: 'Chuyển khoản ngân hàng trực tiếp' },
];

export const quickAmounts = [100000, 200000, 500000, 1000000, 2000000, 5000000];
