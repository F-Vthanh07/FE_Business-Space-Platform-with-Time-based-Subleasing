import type { AdminPage } from '../components/AdminSidebar';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  status: 'Active' | 'Suspended' | 'Banned';
  createdAt: string;
  phoneNumber?: string | null;
  dob?: string | null;
  profileFullName?: string | null;
  profileAvatarUrl?: string | null;
  profileBio?: string | null;
  profileSocialLink?: string | null;
  profileGender?: string | null;
}

export interface SpaceApprovalItem {
  id: string;
  name: string;
  address: string;
  area: number;
  ownerName: string;
  ownerId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface AdminListingItem {
  id: number;
  spaceId: number;
  creatorId: string;
  allowedStartTime: string;
  allowedEndTime: string;
  description: string;
  listingType: string;
  status: string; // "Pending" | "Approved" | "Rejected" | "Expired"
  lessorName: string;
  spaceAddress: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  isActive: boolean;
  cancelReason: string | null;
  listingPictures: string[];
  shareSpaceDetailMaxSubRenter?: number;
  shareSpaceDetailIsOwner?: boolean;
  shareSpaceDetailIsLegalCommitted?: boolean;
  shareSpaceDetailLegalCommittedAt?: string;
  shareSpaceDetailShareSpaceAmenities?: Array<{
    id: number;
    amenityId: number;
    shareSpaceDetailId: number;
    isIncluded: boolean;
    price: number;
  }>;
  shareSpaceDetailAvailabilitiesTimes?: Array<{
    id: number;
    shareSpaceDetailId: number;
    daysOfWeek: string[];
    specificdate: string;
    startTime: string;
    endTime: string;
    validFrom: string;
    validTo: string;
  }>;
  shareSpaceDetailShareSpaceCategories?: Array<{
    id: number;
    bussinessCategoryId: number;
    shareSpaceDetailId: number;
    note: string;
  }>;
  price?: number;
}

export interface SystemStat {
  totalUsers: number;
  totalSpaces: number;
  totalListings: number;
  totalRevenue: number;
}

export interface BusinessCategory {
  id: number;
  isActive: boolean;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string;
}

export type { AdminPage };
