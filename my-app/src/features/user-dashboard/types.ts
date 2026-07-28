/* eslint-disable @typescript-eslint/no-explicit-any */
export type UserPage =
  | 'overview'
  | 'spaces'
  | 'listings'
  | 'tenants'
  | 'calendar'
  | 'sublease-listings'
  | 'sub-tenants'
  | 'shared-spaces'    
  | 'analytics'
  | 'profile'
  | 'settings'
  | 'wallet'
  | 'wallet-deposit'
  | 'wallet-history'
  | 'booking-requests'
  | 'my-booking-requests'
  | 'change-password'
  | 'forgot-password'
  | 'contracts';

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

export interface ShareSpaceAmenity {
  amenityId: number;
  isIncluded: boolean;
  price: number;
}

export interface ShareAvailabilityTime {
  daysOfWeek: string[];
  specificdate: string;
  startTime: string;
  endTime: string;
  validFrom: string;
  validTo: string;
}

export interface ShareSpaceCategory {
  bussinessCategoryId: number;
  note: string;
}

export interface ShareListingPayload {
    spaceId: number;
    allowedStartTime: string;
    allowedEndTime: string;
    name: string;
    description: string;
    price: number;

    shareSpaceDetailMaxSubRenter: number;
    shareSpaceDetailIsOwner: boolean;
    shareSpaceDetailIsLegalCommitted: boolean;

    shareSpaceDetailShareSpaceAmenities: {
        amenityId: number;
        isIncluded: boolean;
        price: number;
    }[];

    shareSpaceDetailAvailabilitiesTimes: any[];

    shareSpaceDetailShareSpaceCategories: ShareSpaceCategory[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ShareListing extends ShareListingPayload {
  id: number;
  status?: 'published' | 'pending' | 'draft' | 'expired';
  location?: string;
  address?: string;
  listingPictures?: any[];
  views?: number;
  inquiries?: number;
  postedDate?: string;
}

