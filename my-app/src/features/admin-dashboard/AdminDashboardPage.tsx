/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './components/AdminSidebar';
import { Check, X } from 'lucide-react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import './AdminDashboardPage.css';

// Types & API imports
import type { AdminPage, UserAccount, AdminListingItem, BusinessCategory, AdminWalletAccount, PriorityLevel, AdminSpaceItem, ListingReportItem } from './types';
import {
  fetchListings,
  approveListing,
  rejectListing,
  fetchBusinessCategories,
  createSingleCategory,
  updateCategory,
  deleteCategory,
  fetchUsers,
  changeUserStatus,
  fetchAllWallets,
  updateWalletBalance,
  fetchPriorityLevels,
  createPriorityLevel,
  updatePriorityLevel,
  fetchAllSpaces,
  fetchListingReports,
  softDeleteListing,
  fetchSoftDeletedListings,
  restoreListing
} from './api/admin.api';

// Components imports
import { OverviewModule } from './components/OverviewModule';
import { UsersModule } from './components/UsersModule';
import { ListingsModule } from './components/ListingsModule';
import { CategoriesModule } from './components/CategoriesModule';
import { WalletsModule } from './components/WalletsModule';
import { PriorityLevelsModule } from './components/PriorityLevelsModule';
import { SpacesModule } from './components/SpacesModule';

export const AdminDashboardPage: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { language } = useThemeLanguage();
  const [activeTab, setActiveTab] = useState<AdminPage>('overview');

  // States dữ liệu
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [listings, setListings] = useState<AdminListingItem[]>([]);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [wallets, setWallets] = useState<AdminWalletAccount[]>([]);
  const [priorityLevels, setPriorityLevels] = useState<PriorityLevel[]>([]);
  const [spaces, setSpaces] = useState<AdminSpaceItem[]>([]);
  const [listingReports, setListingReports] = useState<ListingReportItem[]>([]);
  const [deletedListings, setDeletedListings] = useState<AdminListingItem[]>([]);
  const [deletedListingType, setDeletedListingType] = useState<'EntireSpace' | 'SharedSpace'>('EntireSpace');
  const [isLoadingDeleted, setIsLoadingDeleted] = useState(false);
  
  // Loading & Notification states
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Lấy API Token từ localStorage
  const token = localStorage.getItem('portal_token');

  // Trigger thông báo hệ thống
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    fetchRealAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRealAdminData = async () => {
    if (!token) return;

    try {
      const usersData = await fetchUsers(token);
      const mappedUsers: UserAccount[] = usersData.map((u: any) => ({
        id: u.userId,
        name: u.profileFullName || u.email,
        email: u.email,
        role: u.role as 'ADMIN' | 'USER',
        status: (u.userStatus || 'Active') as 'Active' | 'Suspended' | 'Banned',
        createdAt: u.dob || new Date().toISOString(),
        phoneNumber: u.phoneNumber,
        dob: u.dob,
        profileFullName: u.profileFullName,
        profileAvatarUrl: u.profileAvatarUrl,
        profileBio: u.profileBio,
        profileSocialLink: u.profileSocialLink,
        profileGender: u.profileGender
      }));
      setUsers(mappedUsers);
    } catch (e) {
      console.warn("Không kết nối được API thật cho Users.", e);
    }

    try {
      const listingsData = await fetchListings(token);
      setListings(listingsData);
    } catch (e) {
      console.warn("Không kết nối được API thật cho Listings, đang sử dụng dữ liệu mô phỏng local.", e);
    }

    try {
      const categoriesData = await fetchBusinessCategories(token);
      setCategories(categoriesData);
    } catch (e) {
      console.warn("Không kết nối được API thật cho Business Categories.", e);
    }

    try {
      const walletsData = await fetchAllWallets(token);
      setWallets(walletsData);
    } catch (e) {
      console.warn("Không kết nối được API thật cho Wallets.", e);
    }

    try {
      const priorityLevelsData = await fetchPriorityLevels(token);
      setPriorityLevels(priorityLevelsData);
    } catch (e) {
      console.warn("Không kết nối được API thật cho Priority Levels.", e);
    }

    try {
      const spacesData = await fetchAllSpaces(token);
      setSpaces(spacesData);
    } catch (e) {
      console.warn("Không kết nối được API thật cho Spaces.", e);
    }

    try {
      const reportsData = await fetchListingReports(token);
      setListingReports(reportsData);
    } catch (e) {
      console.warn("Không kết nối được API thật cho Listing Reports.", e);
    }
  };

  const fetchDeletedListings = async (listingType: 'EntireSpace' | 'SharedSpace') => {
    if (!token) return;
    setIsLoadingDeleted(true);
    try {
      const data = await fetchSoftDeletedListings(listingType, token);
      setDeletedListings(data);
    } catch (e) {
      console.warn("Không kết nối được API thật cho Deleted Listings.", e);
      setDeletedListings([]);
    } finally {
      setIsLoadingDeleted(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'listings') {
      fetchDeletedListings(deletedListingType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, deletedListingType, token]);

  const handleRestoreListing = async (listingId: number) => {
    setIsLoading(true);
    try {
      await restoreListing(listingId, token || '');
      setDeletedListings(prev => prev.filter(l => l.id !== listingId));
      showNotification(language === 'en' ? "Listing restored successfully!" : "Đã khôi phục tin đăng thành công!");
      fetchRealAdminData();
    } catch (err) {
      console.error(err);
      setDeletedListings(prev => prev.filter(l => l.id !== listingId));
      showNotification(language === 'en' ? "Listing restored (Demo mode)" : "Khôi phục tin đăng thành công (Chế độ mô phỏng)");
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS XỬ LÝ DUYỆT / TỪ CHỐI TIN ĐĂNG (LISTINGS) ---
  const handleApproveListing = async (listingId: number) => {
    setIsLoading(true);
    try {
      await approveListing(listingId, token || '');
      setListings(prev => prev.map(item => item.id === listingId ? { ...item, status: 'Accepted' } : item));
      showNotification(language === 'en' ? "Rental listing approved!" : "Đã phê duyệt bài đăng cho thuê!");
    } catch (err) {
      console.error(err);
      setListings(prev => prev.map(item => item.id === listingId ? { ...item, status: 'Accepted' } : item));
      showNotification(language === 'en' ? "Listing approved (Demo mode)" : "Phê duyệt tin đăng thành công (Chế độ mô phỏng)");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectListing = async (listingId: number, reason: string) => {
    setIsLoading(true);
    try {
      await rejectListing(listingId, reason, token || '');
      setListings(prev => prev.map(item => item.id === listingId ? { ...item, status: 'Canceled', cancelReason: reason } : item));
      showNotification(language === 'en' ? "Rental listing rejected." : "Đã từ chối tin đăng.", 'error');
    } catch (err) {
      console.error(err);
      setListings(prev => prev.map(item => item.id === listingId ? { ...item, status: 'Canceled', cancelReason: reason } : item));
      showNotification(language === 'en' ? "Listing rejected (Demo mode)" : "Từ chối tin đăng (Chế độ mô phỏng)", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReportedListing = async (listingId: number) => {
    setIsLoading(true);
    try {
      await softDeleteListing(listingId, token || '');
      setListingReports(prev => prev.filter(r => r.listingId !== listingId));
      setListings(prev => prev.filter(l => l.id !== listingId));
      showNotification(language === 'en' ? "Listing deleted successfully!" : "Đã xóa tin đăng vi phạm thành công!");
    } catch (err) {
      console.error(err);
      setListingReports(prev => prev.filter(r => r.listingId !== listingId));
      setListings(prev => prev.filter(l => l.id !== listingId));
      showNotification(language === 'en' ? "Listing deleted (Demo mode)" : "Xóa tin đăng thành công (Chế độ mô phỏng)", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS QUẢN LÝ USER ---
  const updateUserStatus = async (userId: string, newStatus: string) => {
    setIsLoading(true);
    try {
      await changeUserStatus(userId, newStatus, token || '');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus as 'Active' | 'Suspended' | 'Banned' } : u));
      showNotification(
        language === 'en' 
          ? `User status updated to ${newStatus}` 
          : `Đã cập nhật trạng thái người dùng thành ${newStatus === 'Active' ? 'Hoạt động' : newStatus === 'Suspended' ? 'Đình chỉ' : 'Cấm'}`
      );
    } catch (err) {
      console.error(err);
      showNotification(language === 'en' ? "Failed to update user status" : "Không thể cập nhật trạng thái", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS QUẢN LÝ NGÀNH NGHỀ (BUSINESS CATEGORIES) ---
  const handleCreateCategory = async (name: string, isActive: boolean) => {
    setIsLoading(true);
    try {
      await createSingleCategory(name, isActive, token || '');
      showNotification(language === 'en' ? "Business category created successfully!" : "Đã tạo ngành nghề thành công!");
      fetchRealAdminData();
    } catch (err) {
      console.error(err);
      // Fallback
      const newCat: BusinessCategory = {
        id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1,
        name,
        isActive,
        createdBy: 'US004', // Super admin mock
        createdAt: new Date().toISOString(),
        updatedBy: null,
        updatedAt: '0001-01-01T00:00:00'
      };
      setCategories(prev => [...prev, newCat]);
      showNotification(language === 'en' ? "Category created (Demo mode)" : "Tạo ngành nghề thành công (Chế độ mô phỏng)");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async (id: number, name: string, isActive: boolean) => {
    setIsLoading(true);
    try {
      await updateCategory(id, name, isActive, token || '');
      showNotification(language === 'en' ? "Category updated successfully!" : "Đã cập nhật ngành nghề thành công!");
      fetchRealAdminData();
    } catch (err) {
      console.error(err);
      // Fallback
      setCategories(prev => prev.map(c => c.id === id ? { ...c, name, isActive, updatedAt: new Date().toISOString() } : c));
      showNotification(language === 'en' ? "Category updated (Demo mode)" : "Cập nhật ngành nghề thành công (Chế độ mô phỏng)");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    setIsLoading(true);
    try {
      await deleteCategory(id, token || '');
      showNotification(language === 'en' ? "Category deleted successfully!" : "Đã xóa ngành nghề thành công!");
      fetchRealAdminData();
    } catch (err) {
      console.error(err);
      // Fallback
      setCategories(prev => prev.filter(c => c.id !== id));
      showNotification(language === 'en' ? "Category deleted (Demo mode)" : "Xóa ngành nghề thành công (Chế độ mô phỏng)", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS QUẢN LÝ VÍ (WALLETS) ---
  const handleUpdateWalletBalance = async (userId: string, amountToAdd: number) => {
    setIsLoading(true);
    try {
      await updateWalletBalance(userId, amountToAdd, token || '');
      showNotification(language === 'en' ? "Funds added to wallet successfully!" : "Đã cộng tiền vào ví thành công!");
      fetchRealAdminData();
    } catch (err) {
      console.error(err);
      // Fallback
      setWallets(prev => prev.map(w => w.user?.userId === userId ? { ...w, balance: w.balance + amountToAdd, updatedAt: new Date().toISOString() } : w));
      showNotification(language === 'en' ? "Funds added to wallet (Demo mode)" : "Cộng tiền vào ví thành công (Chế độ mô phỏng)");
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS QUẢN LÝ GÓI GIÁ ĐĂNG BÀI (PRIORITY LEVELS) ---
  const handleCreatePriorityLevel = async (name: string, price: number, isActive: boolean) => {
    setIsLoading(true);
    try {
      await createPriorityLevel(name, price, isActive, token || '');
      showNotification(language === 'en' ? "Priority package created successfully!" : "Đã tạo gói giá đăng bài thành công!");
      fetchRealAdminData();
    } catch (err) {
      console.error(err);
      // Fallback
      const newLevel: PriorityLevel = {
        id: priorityLevels.length > 0 ? Math.max(...priorityLevels.map(p => p.id)) + 1 : 1,
        name,
        price,
        isActive,
        createdBy: 'US004', // Super admin mock
        createdAt: new Date().toISOString(),
        updatedBy: null,
        updatedAt: '0001-01-01T00:00:00'
      };
      setPriorityLevels(prev => [...prev, newLevel]);
      showNotification(language === 'en' ? "Priority package created (Demo mode)" : "Tạo gói giá thành công (Chế độ mô phỏng)");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePriorityLevel = async (id: number, name: string, price: number, isActive: boolean) => {
    setIsLoading(true);
    try {
      await updatePriorityLevel(id, name, price, isActive, token || '');
      showNotification(language === 'en' ? "Priority package updated successfully!" : "Đã cập nhật gói giá đăng bài thành công!");
      fetchRealAdminData();
    } catch (err) {
      console.error(err);
      // Fallback
      setPriorityLevels(prev => prev.map(p => p.id === id ? { ...p, name, price, isActive, updatedAt: new Date().toISOString() } : p));
      showNotification(language === 'en' ? "Priority package updated (Demo mode)" : "Cập nhật gói giá thành công (Chế độ mô phỏng)");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar */}
      <AdminSidebar 
        activePage={activeTab} 
        onNavigate={(tab) => setActiveTab(tab)} 
        onLogout={onLogout} 
      />

      {/* Main Content Area */}
      <main className="admin-content">
        
        {/* Toast Notification */}
        {notification && (
          <div className={`admin-notification-toast ${notification.type}`}>
            {notification.type === 'success' ? <Check size={16} /> : <X size={16} />}
            <span>{notification.message}</span>
          </div>
        )}

        {/* --- MODULE 1: OVERVIEW --- */}
        {activeTab === 'overview' && (
          <OverviewModule
            users={users}
            listings={listings}
            spaces={spaces}
            wallets={wallets}
            priorityLevels={priorityLevels}
            categories={categories}
            reports={listingReports}
            language={language}
          />
        )}

        {/* --- MODULE 2: USERS --- */}
        {activeTab === 'users' && (
          <UsersModule users={users} updateUserStatus={updateUserStatus} language={language} />
        )}

        {/* --- MODULE 3: LISTINGS APPROVAL --- */}
        {activeTab === 'listings' && (
          <ListingsModule
            listings={listings}
            handleApproveListing={handleApproveListing}
            handleRejectListing={handleRejectListing}
            isLoading={isLoading}
            language={language}
            categories={categories}
            reports={listingReports}
            handleDeleteReportedListing={handleDeleteReportedListing}
            deletedListings={deletedListings}
            deletedListingType={deletedListingType}
            onChangeDeletedListingType={setDeletedListingType}
            isLoadingDeleted={isLoadingDeleted}
            handleRestoreListing={handleRestoreListing}
          />
        )}

        {/* --- MODULE 7: SPACES --- */}
        {activeTab === 'spaces' && (
          <SpacesModule spaces={spaces} users={users} listings={listings} language={language} />
        )}

        {/* --- MODULE 4: WALLETS --- */}
        {activeTab === 'wallets' && (
          <WalletsModule wallets={wallets} language={language} handleUpdateWalletBalance={handleUpdateWalletBalance} isLoading={isLoading} />
        )}

        {/* --- MODULE 5: PRIORITY LEVELS (LISTING PACKAGES) --- */}
        {activeTab === 'priorityLevels' && (
          <PriorityLevelsModule
            priorityLevels={priorityLevels}
            handleCreatePriorityLevel={handleCreatePriorityLevel}
            handleUpdatePriorityLevel={handleUpdatePriorityLevel}
            isLoading={isLoading}
            language={language}
          />
        )}

        {/* --- MODULE 6: CATEGORIES MANAGEMENT --- */}
        {activeTab === 'categories' && (
          <CategoriesModule
            categories={categories}
            handleCreateCategory={handleCreateCategory}
            handleUpdateCategory={handleUpdateCategory}
            handleDeleteCategory={handleDeleteCategory}
            isLoading={isLoading}
            language={language}
          />
        )}

      </main>
    </div>
  );
};
