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

export interface AdminListingItem {
  id: number;
  spaceId: number;
  creatorId: string;
  name?: string | null;
  allowedStartTime: string;
  allowedEndTime: string;
  description: string;
  listingType: string;
  status: string; // "Pending" | "Approved" | "Rejected" | "Expired"
  lessorName: string;
  spaceAddress: string;
  spaceLatitude?: number;
  spaceLongitude?: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  isActive: boolean;
  cancelReason: string | null;
  listingPictures: unknown[];
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

export interface BusinessCategory {
  id: number;
  isActive: boolean;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string;
}

export interface AdminWalletOwner {
  userId: string;
  userName: string | null;
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

export interface AdminWalletAccount {
  id: number;
  balance: number;
  user: AdminWalletOwner;
  name: string | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface PriorityLevel {
  id: number;
  price: number;
  isActive: boolean;
  name: string;
  description?: string | null;
  durationInDays?: number | null;
  durationForBanner?: number | null;
  type?: 'Listing' | 'Banner' | string | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string;
}

export interface AdminSpaceItem {
  id: number;
  ownerId: string;
  name: string;
  address: string;
  city: string;
  area: number;
  isActive: boolean;
  amenities?: Array<{ name: string; quantity: number | null; isActive: boolean | null }>;

  spaceAllowedCategories?: Array<{ bussinessCategoryId: number }>;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string | null;
  updatedAt?: string;
}

export interface ListingReportItem {
  listingId: number;
  reportCount: number;
  isBanned: boolean;
  listingStatus: string;
  listingDescription: string;
}

export interface ListingReportReasonBreakdown {
  reason: string;
  count: number;
}

export interface ListingReportDetail {
  listingId: number;
  totalReportCount: number;
  reasonBreakdown: ListingReportReasonBreakdown[];
}

export interface AdminUserProfile {
  userId: string;
  citizenIDNumber: string | null;
  identityCardNumber: string | null;
  fullName: string | null;
  gender: string | null;
  dob: string | null;
  permanentResidence: string | null;
  dateOfIssue: string | null;
  isVerified: boolean;
  avatarUrl: string | null;
  bio: string | null;
  socialLink: string | null;
}

export interface AdminDashboardStats {
  totalWalletBalance: number;
  totalDeposited?: number;
  totalSpent: number;
  totalListingSpent: number;
  totalAiImageSpent: number;
  totalListingCount: number;
  totalAiImageCount: number;
}

export type { AdminPage };
