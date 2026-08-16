/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AdminSidebar } from './components/AdminSidebar';
import { Check, X } from 'lucide-react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import './AdminDashboardPage.css';

// Types & API imports
import type { AdminPage, UserAccount, AdminListingItem, BusinessCategory, AdminWalletAccount, PriorityLevel, AdminSpaceItem, ListingReportItem, AdminDashboardStats } from './types';
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
  fetchPriorityLevelById,
  createPriorityLevel,
  updatePriorityLevel,
  deletePriorityLevel,
  createAdminBanner,
  fetchAdminBanners,
  updateAdminBanner,
  deleteAdminBanner,
  uploadBannerPictures,
  fetchAllSpaces,
  fetchListingReports,
  softDeleteListing,
  fetchSoftDeletedListings,
  restoreListing,
  fetchDashboardStats
} from './api/admin.api';
import type { AdminBannerItem, CreateAdminBannerPayload, PriorityLevelPayload } from './api/admin.api';

// Components imports
import { OverviewModule } from './components/OverviewModule';
import { UsersModule } from './components/UsersModule';
import { ListingsModule } from './components/ListingsModule';
import { CategoriesModule } from './components/CategoriesModule';
import { WalletsModule } from './components/WalletsModule';
import { PriorityLevelsModule } from './components/PriorityLevelsModule';
import { SpacesModule } from './components/SpacesModule';

const VALID_ADMIN_PAGES: AdminPage[] = ['overview', 'users', 'listings', 'wallets', 'priorityLevels', 'categories', 'spaces'];

export const AdminDashboardPage: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { language } = useThemeLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  // Derive active tab from URL, e.g. /admin/listings -> listings
  const pathParts = location.pathname.split('/');
  const pathTab = pathParts[2] as AdminPage | undefined;
  const activeTab: AdminPage = pathTab && VALID_ADMIN_PAGES.includes(pathTab) ? pathTab : 'overview';

  const goToTab = (tab: AdminPage) => navigate(tab === 'overview' ? '/admin' : `/admin/${tab}`);

  // States dữ liệu
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [listings, setListings] = useState<AdminListingItem[]>([]);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [wallets, setWallets] = useState<AdminWalletAccount[]>([]);
  const [priorityLevels, setPriorityLevels] = useState<PriorityLevel[]>([]);
  const [adminBanners, setAdminBanners] = useState<AdminBannerItem[]>([]);
  const [spaces, setSpaces] = useState<AdminSpaceItem[]>([]);
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats | null>(null);
  const [listingReports, setListingReports] = useState<ListingReportItem[]>([]);
  const [deletedListings, setDeletedListings] = useState<AdminListingItem[]>([]);
  const [deletedListingType, setDeletedListingType] = useState<'EntireSpace' | 'SharedSpace'>('EntireSpace');
  const [isLoadingDeleted, setIsLoadingDeleted] = useState(false);
  
  // Loading & Notification states
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
      console.warn("Không kết nối được API thật cho Listings.", e);
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
      const bannersData = await fetchAdminBanners(token);
      setAdminBanners(bannersData);
    } catch (e) {
      console.warn("Không kết nối được API thật cho Admin Banners.", e);
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

    try {
      const statsData = await fetchDashboardStats(token);
      setDashboardStats(statsData);
    } catch (e) {
      console.warn("Không kết nối được API thật cho Dashboard Stats.", e);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchRealAdminData();
      if (activeTab === 'listings') {
        await fetchDeletedListings(deletedListingType);
      }
    } finally {
      setIsRefreshing(false);
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
      showNotification(language === 'en' ? "Failed to restore listing. Please try again." : "Khôi phục tin đăng thất bại. Vui lòng thử lại.", 'error');
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
      fetchRealAdminData();
    } catch (err) {
      console.error(err);
      showNotification(language === 'en' ? "Failed to approve listing. Please try again." : "Phê duyệt tin đăng thất bại. Vui lòng thử lại.", 'error');
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
      fetchRealAdminData();
    } catch (err) {
      console.error(err);
      showNotification(language === 'en' ? "Failed to reject listing. Please try again." : "Từ chối tin đăng thất bại. Vui lòng thử lại.", 'error');
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
      fetchRealAdminData();
    } catch (err) {
      console.error(err);
      showNotification(language === 'en' ? "Failed to delete listing. Please try again." : "Xóa tin đăng thất bại. Vui lòng thử lại.", 'error');
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
      fetchRealAdminData();
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
      showNotification(language === 'en' ? "Failed to create category. Please try again." : "Tạo ngành nghề thất bại. Vui lòng thử lại.", 'error');
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
      showNotification(language === 'en' ? "Failed to update category. Please try again." : "Cập nhật ngành nghề thất bại. Vui lòng thử lại.", 'error');
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
      showNotification(language === 'en' ? "Failed to delete category. Please try again." : "Xóa ngành nghề thất bại. Vui lòng thử lại.", 'error');
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
      showNotification(language === 'en' ? "Failed to add funds. Please try again." : "Cộng tiền vào ví thất bại. Vui lòng thử lại.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS QUẢN LÝ GÓI GIÁ ĐĂNG BÀI (PRIORITY LEVELS) ---
  const handleCreatePriorityLevel = async (payload: PriorityLevelPayload) => {
    setIsLoading(true);
    try {
      await createPriorityLevel(payload, token || '');
      showNotification(language === 'en' ? "Priority package created successfully!" : "Đã tạo gói giá đăng bài thành công!");
      fetchRealAdminData();
    } catch (err) {
      console.error(err);
      showNotification(language === 'en' ? "Failed to create priority package. Please try again." : "Tạo gói giá đăng bài thất bại. Vui lòng thử lại.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePriorityLevel = async (id: number, payload: PriorityLevelPayload) => {
    setIsLoading(true);
    try {
      await updatePriorityLevel(id, payload, token || '');
      showNotification(language === 'en' ? "Priority package updated successfully!" : "Đã cập nhật gói giá đăng bài thành công!");
      fetchRealAdminData();
    } catch (err) {
      console.error(err);
      showNotification(language === 'en' ? "Failed to update priority package. Please try again." : "Cập nhật gói giá đăng bài thất bại. Vui lòng thử lại.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetPriorityLevelById = async (id: number) => {
    return fetchPriorityLevelById(id, token || '');
  };

  const handleDeletePriorityLevel = async (id: number) => {
    setIsLoading(true);
    try {
      await deletePriorityLevel(id, token || '');
      showNotification(language === 'en' ? "Priority package deleted successfully!" : "Đã xóa gói ưu tiên thành công!");
      fetchRealAdminData();
    } catch (err) {
      console.error(err);
      showNotification(language === 'en' ? "Failed to delete priority package. Please try again." : "Xóa gói ưu tiên thất bại. Vui lòng thử lại.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const extractCreatedId = (value: unknown): number | null => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    if (value && typeof value === 'object') {
      const record = value as Record<string, any>;
      const candidate = record.id ?? record.bannerId ?? record.data?.id ?? record.data?.bannerId;
      const parsed = Number(candidate);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const handleCreateAdminBanner = async (
    payload: CreateAdminBannerPayload,
    durationInDays: number,
    files: File[]
  ) => {
    setIsLoading(true);
    try {
      const created = await createAdminBanner(payload, durationInDays, token || '');
      const bannerId = extractCreatedId(created);
      if (!bannerId) {
        throw new Error('Cannot read created banner id');
      }
      if (files.length > 0) {
        await uploadBannerPictures(bannerId, files, token || '');
      }
      showNotification(language === 'en' ? "Platform banner created successfully!" : "Đã tạo banner quảng cáo nền tảng thành công!");
      fetchRealAdminData();
    } catch (err) {
      console.error(err);
      showNotification(language === 'en' ? "Failed to create platform banner. Please try again." : "Tạo banner quảng cáo thất bại. Vui lòng thử lại.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAdminBanner = async (
    id: number,
    payload: CreateAdminBannerPayload,
    durationInDays: number,
    files: File[]
  ) => {
    setIsLoading(true);
    try {
      await updateAdminBanner(id, payload, durationInDays, token || '');
      if (files.length > 0) {
        await uploadBannerPictures(id, files, token || '');
      }
      showNotification(language === 'en' ? "Platform banner updated successfully!" : "Đã cập nhật banner quảng cáo thành công!");
      fetchRealAdminData();
    } catch (err) {
      console.error(err);
      showNotification(language === 'en' ? "Failed to update platform banner. Please try again." : "Cập nhật banner quảng cáo thất bại. Vui lòng thử lại.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAdminBanner = async (id: number) => {
    setIsLoading(true);
    try {
      await deleteAdminBanner(id, token || '');
      setAdminBanners(prev => prev.filter(item => item.id !== id));
      showNotification(language === 'en' ? "Platform banner deleted successfully!" : "Đã xóa banner quảng cáo thành công!");
      fetchRealAdminData();
    } catch (err) {
      console.error(err);
      showNotification(language === 'en' ? "Failed to delete platform banner. Please try again." : "Xóa banner quảng cáo thất bại. Vui lòng thử lại.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar */}
      <AdminSidebar
        activePage={activeTab}
        onNavigate={goToTab}
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
            stats={dashboardStats}
            language={language}
            onNavigateToListingReports={() => navigate('/admin/listings?tab=reports')}
            onNavigateToUsers={() => goToTab('users')}
            onNavigateToSpaces={() => goToTab('spaces')}
            onNavigateToListings={() => goToTab('listings')}
            onNavigateToWallets={() => goToTab('wallets')}
            onNavigateToPriorityLevels={() => goToTab('priorityLevels')}
            onNavigateToCategories={() => goToTab('categories')}
            onRefresh={handleManualRefresh}
            isRefreshing={isRefreshing}
          />
        )}

        {/* --- MODULE 2: USERS --- */}
        {activeTab === 'users' && (
          <UsersModule users={users} updateUserStatus={updateUserStatus} language={language} onRefresh={handleManualRefresh} isRefreshing={isRefreshing} />
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
            initialTab={new URLSearchParams(location.search).get('tab') === 'reports' ? 'reports' : undefined}
            onRefresh={handleManualRefresh}
            isRefreshing={isRefreshing}
          />
        )}

        {/* --- MODULE 7: SPACES --- */}
        {activeTab === 'spaces' && (
          <SpacesModule spaces={spaces} users={users} listings={listings} language={language} onRefresh={handleManualRefresh} isRefreshing={isRefreshing} />
        )}

        {/* --- MODULE 4: WALLETS --- */}
        {activeTab === 'wallets' && (
          <WalletsModule wallets={wallets} language={language} handleUpdateWalletBalance={handleUpdateWalletBalance} isLoading={isLoading} onRefresh={handleManualRefresh} isRefreshing={isRefreshing} />
        )}

        {/* --- MODULE 5: PRIORITY LEVELS (LISTING PACKAGES) --- */}
        {activeTab === 'priorityLevels' && (
          <PriorityLevelsModule
            priorityLevels={priorityLevels}
            adminBanners={adminBanners}
            handleGetPriorityLevelById={handleGetPriorityLevelById}
            handleCreatePriorityLevel={handleCreatePriorityLevel}
            handleUpdatePriorityLevel={handleUpdatePriorityLevel}
            handleDeletePriorityLevel={handleDeletePriorityLevel}
            handleCreateAdminBanner={handleCreateAdminBanner}
            handleUpdateAdminBanner={handleUpdateAdminBanner}
            handleDeleteAdminBanner={handleDeleteAdminBanner}
            isLoading={isLoading}
            language={language}
            onRefresh={handleManualRefresh}
            isRefreshing={isRefreshing}
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
            onRefresh={handleManualRefresh}
            isRefreshing={isRefreshing}
          />
        )}

      </main>
    </div>
  );
};

