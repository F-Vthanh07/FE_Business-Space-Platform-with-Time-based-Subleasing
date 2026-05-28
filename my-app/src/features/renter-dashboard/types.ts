export type RenterPage =
  | 'overview'
  | 'calendar'
  | 'sublease-listings'
  | 'sub-tenants'
  | 'analytics'
  | 'settings';

export interface SubSlot {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  tenantName: string;
  tenantInitials: string;
  status: 'booked' | 'available' | 'conflict' | 'pending';
  price: string;
  spaceId: string;
}

export interface MockSpace {
  id: string;
  name: string;
  type: string;
  size: string;
}

