/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './components/AdminSidebar';
import { Check, X } from 'lucide-react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import './AdminDashboardPage.css';

// Types & API imports
import type { AdminPage, UserAccount, AdminListingItem, SystemStat, BusinessCategory, AdminWalletAccount, PriorityLevel } from './types';
import {
  fetchListings,
  approveListing,
  rejectListing,
  fetchBusinessCategories,
  createSingleCategory,
  createCategoryList,
  updateCategory,
  deleteCategory,
  fetchUsers,
  changeUserStatus,
  fetchAllWallets,
  fetchPriorityLevels,
  createPriorityLevel,
  updatePriorityLevel
} from './api/admin.api';

// Components imports
import { OverviewModule } from './components/OverviewModule';
import { UsersModule } from './components/UsersModule';
import { ListingsModule } from './components/ListingsModule';
import { CategoriesModule } from './components/CategoriesModule';
import { WalletsModule } from './components/WalletsModule';
import { PriorityLevelsModule } from './components/PriorityLevelsModule';

export const AdminDashboardPage: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { language } = useThemeLanguage();
  const [activeTab, setActiveTab] = useState<AdminPage>('overview');
  
  // States dữ liệu
  const [stats, setStats] = useState<SystemStat>({
    totalUsers: 142,
    totalSpaces: 56,
    totalListings: 43,
    totalRevenue: 245000000 // 245M VND
  });
  
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [listings, setListings] = useState<AdminListingItem[]>([]);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [wallets, setWallets] = useState<AdminWalletAccount[]>([]);
  const [priorityLevels, setPriorityLevels] = useState<PriorityLevel[]>([]);
  
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

  // Mock initial data as fallback
  useEffect(() => {
    // Mock Users
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsers([
      { id: 'US001', name: 'Nguyễn Văn A', email: 'vana@gmail.com', role: 'USER', status: 'Active', createdAt: '2026-05-12' },
      { id: 'US002', name: 'Trần Thị B', email: 'thib@gmail.com', role: 'USER', status: 'Active', createdAt: '2026-05-15' },
      { id: 'US003', name: 'Lê Hoàng C', email: 'hoangc@gmail.com', role: 'USER', status: 'Banned', createdAt: '2026-05-20' },
      { id: 'US004', name: 'Super Admin', email: 'admin@flexispace.com', role: 'ADMIN', status: 'Active', createdAt: '2026-01-01' },
      { id: 'US005', name: 'Phạm Minh D', email: 'minhd@gmail.com', role: 'USER', status: 'Active', createdAt: '2026-06-02' },
    ]);

    // Mock Listings
    setListings([
      {
        id: 1,
        spaceId: 1,
        creatorId: "01KVYGTNZFXSXTHQ5Q5DM0BC35",
        allowedStartTime: "0001-01-01",
        allowedEndTime: "0001-01-01",
        description: "Chia sẻ mặt bằng quán cafe buổi sáng. Vị trí góc ngã tư đông người qua lại, rất phù hợp bán đồ ăn sáng mang đi hoặc ăn tại chỗ.",
        listingType: "SharedSpace",
        status: "Pending",
        lessorName: "Nguyễn Văn A",
        spaceAddress: "123 Nguyễn Đình Chiểu, Phường Võ Thị Sáu",
        createdAt: "2026-06-25T11:40:32.55648",
        updatedAt: "0001-01-01T00:00:00",
        isDeleted: false,
        isActive: false,
        cancelReason: null,
        listingPictures: [
          "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
          "https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&q=80&w=400"
        ],
        shareSpaceDetailMaxSubRenter: 1,
        shareSpaceDetailIsOwner: false,
        shareSpaceDetailIsLegalCommitted: true,
        shareSpaceDetailLegalCommittedAt: "2026-06-25T11:40:32.556599",
        shareSpaceDetailShareSpaceAmenities: [
          { id: 1, amenityId: 1, shareSpaceDetailId: 1, isIncluded: true, price: 0 },
          { id: 2, amenityId: 2, shareSpaceDetailId: 1, isIncluded: false, price: 500000 }
        ],
        shareSpaceDetailAvailabilitiesTimes: [
          {
            id: 1,
            shareSpaceDetailId: 1,
            daysOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            specificdate: "0001-01-01",
            startTime: "05:30:00",
            endTime: "11:00:00",
            validFrom: "2026-07-01",
            validTo: "2026-12-31"
          }
        ],
        shareSpaceDetailShareSpaceCategories: [
          { id: 1, bussinessCategoryId: 1, shareSpaceDetailId: 1, note: "Chỉ ưu tiên bán thức ăn nhẹ, bánh mì, đồ ăn sáng không gây nhiều khói." }
        ]
      },
      {
        id: 2,
        spaceId: 2,
        creatorId: "01KVYGTNZFXSXTHQ5Q5DM0BC36",
        allowedStartTime: "0001-01-01",
        allowedEndTime: "0001-01-01",
        description: "Không gian tổ chức Workshop thời trang tối thứ 6. Mặt bằng rộng rãi, có hệ thống đèn chiếu sáng hiện đại, điều hòa công suất lớn.",
        listingType: "SharedSpace",
        status: "Pending",
        lessorName: "Phạm Minh D",
        spaceAddress: "88 Cầu Giấy, Hà Nội",
        createdAt: "2026-06-24T18:30:00",
        updatedAt: "0001-01-01T00:00:00",
        isDeleted: false,
        isActive: false,
        cancelReason: null,
        listingPictures: [
          "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800"
        ],
        shareSpaceDetailMaxSubRenter: 2,
        shareSpaceDetailIsOwner: true,
        shareSpaceDetailIsLegalCommitted: true,
        shareSpaceDetailLegalCommittedAt: "2026-06-24T18:30:00",
        shareSpaceDetailShareSpaceAmenities: [
          { id: 3, amenityId: 3, shareSpaceDetailId: 2, isIncluded: true, price: 0 }
        ],
        shareSpaceDetailAvailabilitiesTimes: [
          {
            id: 2,
            shareSpaceDetailId: 2,
            daysOfWeek: ["Friday"],
            specificdate: "0001-01-01",
            startTime: "18:00:00",
            endTime: "22:00:00",
            validFrom: "2026-07-01",
            validTo: "2026-12-31"
          }
        ],
        shareSpaceDetailShareSpaceCategories: [
          { id: 2, bussinessCategoryId: 2, shareSpaceDetailId: 2, note: "Phù hợp cho các hoạt động workshop, seminar nhỏ." }
        ]
      }
    ]);
    
    // Mock Business Categories
    setCategories([
      { id: 1, name: "Dịch vụ ăn uống", isActive: true, creatorId: "01KVYGTNZFXSXTHQ5Q5DM0BC35", createdAt: "2026-06-25T11:36:23.44544" },
      { id: 2, name: "Bán lẻ", isActive: true, creatorId: "01KVYGTNZFXSXTHQ5Q5DM0BC35", createdAt: "2026-06-25T11:36:23.445861" },
      { id: 3, name: "Bất động sản", isActive: false, creatorId: "01KVYGTNZFXSXTHQ5Q5DM0BC35", createdAt: "2026-06-25T11:36:23.445865" },
      { id: 4, name: "Công nghệ thông tin", isActive: true, creatorId: "01KVYGTNZFXSXTHQ5Q5DM0BC35", createdAt: "2026-06-25T11:36:23.445866" },
      { id: 5, name: "Dịch vụ làm đẹp và Spa", isActive: true, creatorId: "01KVYGTNZFXSXTHQ5Q5DM0BC35", createdAt: "2026-06-25T11:36:23.445868" },
      { id: 6, name: "Du lịch và Lữ hành", isActive: false, creatorId: "01KVYGTNZFXSXTHQ5Q5DM0BC35", createdAt: "2026-06-25T11:36:23.445869" },
      { id: 7, name: "Giáo dục và Đào tạo", isActive: true, creatorId: "01KVYGTNZFXSXTHQ5Q5DM0BC35", createdAt: "2026-06-25T11:36:23.445869" },
      { id: 8, name: "Vận tải và Logistics", isActive: true, creatorId: "01KVYGTNZFXSXTHQ5Q5DM0BC35", createdAt: "2026-06-25T11:36:23.44587" }
    ] as any);

    // Gọi API thực tế
    // eslint-disable-next-line react-hooks/immutability
    fetchRealAdminData();
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
      setStats(prev => ({ ...prev, totalUsers: mappedUsers.length }));
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
  };

  // --- ACTIONS XỬ LÝ DUYỆT / TỪ CHỐI TIN ĐĂNG (LISTINGS) ---
  const handleApproveListing = async (listingId: number) => {
    setIsLoading(true);
    try {
      await approveListing(listingId, token || '');
      setListings(prev => prev.map(item => item.id === listingId ? { ...item, status: 'Accepted' } : item));
      setStats(prev => ({ ...prev, totalListings: prev.totalListings + 1 }));
      showNotification(language === 'en' ? "Rental listing approved!" : "Đã phê duyệt bài đăng cho thuê!");
    } catch (err) {
      console.error(err);
      setListings(prev => prev.map(item => item.id === listingId ? { ...item, status: 'Accepted' } : item));
      setStats(prev => ({ ...prev, totalListings: prev.totalListings + 1 }));
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

  const handleBulkCreateCategories = async () => {
    setIsLoading(true);
    const defaultList = [
      { name: "Dịch vụ ăn uống", isActive: true },
      { name: "Bán lẻ", isActive: true },
      { name: "Bất động sản", isActive: false },
      { name: "Công nghệ thông tin", isActive: true },
      { name: "Dịch vụ làm đẹp và Spa", isActive: true },
      { name: "Du lịch và Lữ hành", isActive: false },
      { name: "Giáo dục và Đào tạo", isActive: true },
      { name: "Vận tải và Logistics", isActive: true }
    ];
    try {
      await createCategoryList(defaultList, token || '');
      showNotification(language === 'en' ? "Categories initialized successfully!" : "Đã khởi tạo danh sách ngành nghề thành công!");
      fetchRealAdminData();
    } catch (err) {
      console.error(err);
      // Fallback: overwrite categories state
      const mappedList: BusinessCategory[] = defaultList.map((c, idx) => ({
        id: idx + 1,
        name: c.name,
        isActive: c.isActive,
        createdBy: 'US004',
        createdAt: new Date().toISOString(),
        updatedBy: null,
        updatedAt: '0001-01-01T00:00:00'
      }));
      setCategories(mappedList);
      showNotification(language === 'en' ? "Categories initialized (Demo mode)" : "Khởi tạo danh sách thành công (Chế độ mô phỏng)");
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
          <OverviewModule stats={stats} listings={listings} language={language} />
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
          />
        )}

        {/* --- MODULE 4: WALLETS --- */}
        {activeTab === 'wallets' && (
          <WalletsModule wallets={wallets} language={language} />
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
            handleBulkCreateCategories={handleBulkCreateCategories}
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
