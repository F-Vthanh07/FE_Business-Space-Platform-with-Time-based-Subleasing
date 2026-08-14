/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AdminListingItem, BusinessCategory, AdminWalletAccount, PriorityLevel, AdminSpaceItem, ListingReportItem, ListingReportDetail, AdminContractItem, AdminDashboardStats, AdminUserProfile } from '../types';

export type PriorityLevelType = 'Listing' | 'Banner';

export interface PriorityLevelPayload {
  name: string;
  description: string;
  price: number;
  durationInDays: number;
  durationForBanner: number;
  type: PriorityLevelType;
  isActive: boolean;
}

const normalizePriorityLevelType = (type?: string | null): PriorityLevelType => {
  return String(type || '').toLowerCase() === 'banner' ? 'Banner' : 'Listing';
};

const normalizePriorityLevel = (item: PriorityLevel): PriorityLevel => ({
  ...item,
  type: normalizePriorityLevelType(item.type),
});

export const fetchUsers = async (token: string): Promise<any[]> => {
  const response = await fetch('https://flexi-space-capstone-project.onrender.com/api/User', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  const data = await response.json();
  return Array.isArray(data) ? data : (data?.data || data?.items || []);
};

export const changeUserStatus = async (userId: string, status: string, token: string): Promise<void> => {
  const response = await fetch(`https://flexi-space-capstone-project.onrender.com/api/User/status/${userId}?status=${status}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to update user status');
  }
};

export const fetchListings = async (token: string): Promise<AdminListingItem[]> => {
  const response = await fetch('https://flexi-space-capstone-project.onrender.com/api/Listing/GetAll', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch listings');
  }
  const data = await response.json();
  return Array.isArray(data) ? data : (data?.data || data?.items || []);
};

export const approveListing = async (listingId: number, token: string): Promise<void> => {
  const response = await fetch(`https://flexi-space-capstone-project.onrender.com/api/Listing/Status/${listingId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'accept': '*/*'
    },
    body: JSON.stringify({
      status: 'Accepted',
      cancelReason: null
    })
  });
  if (!response.ok) {
    throw new Error('Failed to approve listing');
  }
};

export const rejectListing = async (listingId: number, cancelReason: string, token: string): Promise<void> => {
  const response = await fetch(`https://flexi-space-capstone-project.onrender.com/api/Listing/Status/${listingId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'accept': '*/*'
    },
    body: JSON.stringify({
      status: 'Canceled',
      cancelReason
    })
  });
  if (!response.ok) {
    throw new Error('Failed to reject listing');
  }
};

export const fetchBusinessCategories = async (token: string): Promise<BusinessCategory[]> => {
  const response = await fetch('https://flexi-space-capstone-project.onrender.com/api/BussinessCategory/GetAll', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch business categories');
  }
  const data = await response.json();
  return Array.isArray(data) ? data : (data?.data || data?.items || []);
};

export const createSingleCategory = async (name: string, isActive: boolean, token: string): Promise<void> => {
  const response = await fetch('https://flexi-space-capstone-project.onrender.com/api/BussinessCategory/Create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'accept': '*/*'
    },
    body: JSON.stringify({ name, isActive })
  });
  if (!response.ok) {
    throw new Error('Failed to create category');
  }
};

export const createCategoryList = async (categories: Array<{ name: string; isActive: boolean }>, token: string): Promise<void> => {
  const response = await fetch('https://flexi-space-capstone-project.onrender.com/api/BussinessCategory/CreateList', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'accept': '*/*'
    },
    body: JSON.stringify({ categories })
  });
  if (!response.ok) {
    throw new Error('Failed to create category list');
  }
};

export const updateCategory = async (id: number, name: string, isActive: boolean, token: string): Promise<void> => {
  const response = await fetch(`https://flexi-space-capstone-project.onrender.com/api/BussinessCategory/Update${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'accept': '*/*'
    },
    body: JSON.stringify({ name, isActive })
  });
  if (!response.ok) {
    throw new Error('Failed to update category');
  }
};

export const deleteCategory = async (id: number, token: string): Promise<void> => {
  const response = await fetch(`https://flexi-space-capstone-project.onrender.com/api/BussinessCategory/Delete${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to delete category');
  }
};

export const fetchAllWallets = async (token: string): Promise<AdminWalletAccount[]> => {
  const response = await fetch('https://flexi-space-capstone-project.onrender.com/api/Wallet', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch wallets');
  }
  const data = await response.json();
  return Array.isArray(data) ? data : (data?.data || data?.items || []);
};

export const fetchPriorityLevels = async (token: string): Promise<PriorityLevel[]> => {
  const response = await fetch('https://flexi-space-capstone-project.onrender.com/api/PriorityLevel/GetAll', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch priority levels');
  }
  const data = await response.json();
  const safeData: PriorityLevel[] = Array.isArray(data) ? data : (data?.data || data?.items || []);
  return safeData
    .map(normalizePriorityLevel)
    .sort((a, b) => a.id - b.id);
};

export const fetchPriorityLevelById = async (id: number, token: string): Promise<PriorityLevel> => {
  const response = await fetch(`https://flexi-space-capstone-project.onrender.com/api/PriorityLevel/GetById${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch priority level');
  }
  const data = await response.json();
  return normalizePriorityLevel(data);
};

export const createPriorityLevel = async (payload: PriorityLevelPayload, token: string): Promise<void> => {
  const response = await fetch('https://flexi-space-capstone-project.onrender.com/api/PriorityLevel/Create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'accept': '*/*'
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error('Failed to create priority level');
  }
};

export const deletePriorityLevel = async (id: number, token: string): Promise<void> => {
  const response = await fetch(`https://flexi-space-capstone-project.onrender.com/api/PriorityLevel/Delete${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to delete priority level');
  }
};

export const updateWalletBalance = async (userId: string, amountToAdd: number, token: string): Promise<void> => {
  const response = await fetch(`https://flexi-space-capstone-project.onrender.com/api/Wallet/update-balance/${userId}?uBalance=${amountToAdd}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to update wallet balance');
  }
};

export const updatePriorityLevel = async (id: number, payload: PriorityLevelPayload, token: string): Promise<void> => {
  const response = await fetch(`https://flexi-space-capstone-project.onrender.com/api/PriorityLevel/Update${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'accept': '*/*'
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error('Failed to update priority level');
  }
};

export const fetchAllSpaces = async (token: string): Promise<AdminSpaceItem[]> => {
  const response = await fetch('https://flexi-space-capstone-project.onrender.com/api/Space/GetAll', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch spaces');
  }
  const data = await response.json();
  return Array.isArray(data) ? data : (data?.data || data?.items || []);
};

export const fetchListingReports = async (token: string): Promise<ListingReportItem[]> => {
  const response = await fetch('https://flexi-space-capstone-project.onrender.com/api/Listing/Reports/Admin', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch listing reports');
  }
  const data = await response.json();
  return Array.isArray(data) ? data : (data?.data || data?.items || []);
};

export const fetchListingReportDetail = async (listingId: number, token: string): Promise<ListingReportDetail> => {
  const response = await fetch(`https://flexi-space-capstone-project.onrender.com/api/Listing/Reports/Admin/Detail/${listingId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch listing report detail');
  }
  return response.json();
};

export const softDeleteListing = async (listingId: number, token: string): Promise<void> => {
  const response = await fetch(`https://flexi-space-capstone-project.onrender.com/api/Listing/SoftDelete/${listingId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to soft delete listing');
  }
};

export const fetchSoftDeletedListings = async (listingType: 'EntireSpace' | 'SharedSpace', token: string): Promise<AdminListingItem[]> => {
  const response = await fetch(`https://flexi-space-capstone-project.onrender.com/api/Listing/SoftDeleted?listingType=${listingType}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch soft deleted listings');
  }
  const data = await response.json();
  return Array.isArray(data) ? data : (data?.data || data?.items || []);
};

export const restoreListing = async (listingId: number, token: string): Promise<void> => {
  const response = await fetch(`https://flexi-space-capstone-project.onrender.com/api/Listing/Restore/${listingId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to restore listing');
  }
};

export const fetchUserProfile = async (userId: string, token: string): Promise<AdminUserProfile> => {
  const response = await fetch(`https://flexi-space-capstone-project.onrender.com/api/Profile/user/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return response.json();
};

export const fetchDashboardStats = async (token: string): Promise<AdminDashboardStats> => {
  const response = await fetch('https://flexi-space-capstone-project.onrender.com/api/Dashboard/stats', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }
  return response.json();
};

export const fetchAllContracts = async (token: string): Promise<AdminContractItem[]> => {
  const response = await fetch('https://flexi-space-capstone-project.onrender.com/api/Contract/GetAll', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch contracts');
  }
  const data = await response.json();
  return Array.isArray(data) ? data : (data?.data || data?.items || []);
};

