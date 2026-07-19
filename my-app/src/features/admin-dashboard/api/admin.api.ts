import type { SpaceApprovalItem, AdminListingItem, BusinessCategory, UserAccount } from '../types';
import { API_BASE_URL } from '../../../config/api';

export const fetchUsers = async (token: string): Promise<any[]> => {
  const response = await fetch(`${API_BASE_URL}/api/User`, {
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
  const response = await fetch(`${API_BASE_URL}/api/User/status/${userId}?status=${status}`, {
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

export const fetchPendingSpaces = async (token: string): Promise<SpaceApprovalItem[]> => {
  const response = await fetch(`${API_BASE_URL}/api/Admin/Spaces/pending`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch pending spaces');
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

export const fetchListings = async (token: string): Promise<AdminListingItem[]> => {
  const response = await fetch(`${API_BASE_URL}/api/Listing/GetAll`, {
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

export const approveSpace = async (spaceId: string, token: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/Admin/Spaces/${spaceId}/approve`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to approve space');
  }
};

export const rejectSpace = async (spaceId: string, token: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/Admin/Spaces/${spaceId}/reject`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to reject space');
  }
};

export const approveListing = async (listingId: number, token: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/Listing/Status/${listingId}`, {
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
  const response = await fetch(`${API_BASE_URL}/api/Listing/Status/${listingId}`, {
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
  const response = await fetch(`${API_BASE_URL}/api/BussinessCategory/GetAll`, {
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
  const response = await fetch(`${API_BASE_URL}/api/BussinessCategory/Create`, {
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
  const response = await fetch(`${API_BASE_URL}/api/BussinessCategory/CreateList`, {
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
  const response = await fetch(`${API_BASE_URL}/api/BussinessCategory/Update${id}`, {
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
  const response = await fetch(`${API_BASE_URL}/api/BussinessCategory/Delete${id}`, {
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

