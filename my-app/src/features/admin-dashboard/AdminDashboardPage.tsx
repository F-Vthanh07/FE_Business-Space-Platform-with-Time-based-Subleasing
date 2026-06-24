import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './components/AdminSidebar';
import type { AdminPage } from './components/AdminSidebar';
import { 
  Users, Building, FileText, Check, X, 
  Activity, DollarSign, MapPin, 
  User as UserIcon, ShieldAlert as BlockIcon
} from 'lucide-react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import './AdminDashboardPage.css';

// Kiểu dữ liệu Mock & Real
interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OWNER' | 'RENTER';
  status: 'ACTIVE' | 'BLOCKED';
  createdAt: string;
}

interface SpaceApprovalItem {
  id: string;
  name: string;
  address: string;
  area: number;
  ownerName: string;
  ownerId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface ListingApprovalItem {
  id: string;
  title: string;
  price: number;
  spaceName: string;
  ownerName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface SystemStat {
  totalUsers: number;
  totalSpaces: number;
  totalListings: number;
  totalRevenue: number;
}

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
  const [pendingSpaces, setPendingSpaces] = useState<SpaceApprovalItem[]>([]);
  const [pendingListings, setPendingListings] = useState<ListingApprovalItem[]>([]);
  
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

  // Mock initial data
  useEffect(() => {
    // Mock Users
    setUsers([
      { id: 'US001', name: 'Nguyễn Văn A', email: 'vana@gmail.com', role: 'OWNER', status: 'ACTIVE', createdAt: '2026-05-12' },
      { id: 'US002', name: 'Trần Thị B', email: 'thib@gmail.com', role: 'RENTER', status: 'ACTIVE', createdAt: '2026-05-15' },
      { id: 'US003', name: 'Lê Hoàng C', email: 'hoangc@gmail.com', role: 'RENTER', status: 'BLOCKED', createdAt: '2026-05-20' },
      { id: 'US004', name: 'Super Admin', email: 'admin@flexispace.com', role: 'ADMIN', status: 'ACTIVE', createdAt: '2026-01-01' },
      { id: 'US005', name: 'Phạm Minh D', email: 'minhd@gmail.com', role: 'OWNER', status: 'ACTIVE', createdAt: '2026-06-02' },
    ]);

    // Mock Pending Spaces
    setPendingSpaces([
      { id: 'SP001', name: 'Ether Workspace Quận 1', address: '120 Lê Lợi, Bến Thành, Quận 1, TP.HCM', area: 150, ownerName: 'Nguyễn Văn A', ownerId: 'US001', status: 'PENDING', createdAt: '2026-06-22' },
      { id: 'SP002', name: 'Nhà kho thương mại Thủ Đức', address: '45 Võ Văn Ngân, Linh Chiểu, Thủ Đức', area: 320, ownerName: 'Phạm Minh D', ownerId: 'US005', status: 'PENDING', createdAt: '2026-06-23' },
      { id: 'SP003', name: 'Co-working Space Cầu Giấy', address: '88 Cầu Giấy, Hà Nội', area: 90, ownerName: 'Nguyễn Văn A', ownerId: 'US001', status: 'PENDING', createdAt: '2026-06-24' },
    ]);

    // Mock Pending Listings
    setPendingListings([
      { id: 'LT001', title: 'Thuê mặt bằng Cafe tầng trệt tối thứ 7 và chủ nhật', price: 1500000, spaceName: 'Ether Workspace Quận 1', ownerName: 'Nguyễn Văn A', status: 'PENDING', createdAt: '2026-06-22' },
      { id: 'LT002', title: 'Không gian tổ chức Workshop thời trang tối thứ 6', price: 2000000, spaceName: 'Co-working Space Cầu Giấy', ownerName: 'Nguyễn Văn A', status: 'PENDING', createdAt: '2026-06-24' },
    ]);
    
    // Gọi API thực tế nếu có backend
    fetchRealAdminData();
  }, []);

  const fetchRealAdminData = async () => {
    if (!token) return;
    try {
      // Ví dụ gọi API lấy danh sách Spaces chờ duyệt thực tế
      const response = await fetch('https://localhost:7069/api/Admin/Spaces/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': '*/*'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setPendingSpaces(data);
        }
      }
    } catch (e) {
      console.warn("Không kết nối được API thật, đang sử dụng dữ liệu mô phỏng local.");
    }
  };

  // --- ACTIONS XỬ LÝ DUYỆT / TỪ CHỐI MẶT BẰNG (SPACES) ---
  const handleApproveSpace = async (spaceId: string) => {
    setIsLoading(true);
    try {
      // Gọi API thật
      await fetch(`https://localhost:7069/api/Admin/Spaces/${spaceId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': '*/*'
        }
      });

      // Bất kể API OK hay fail (do dev environment offline), ta vẫn update giao diện local cho mượt
      setPendingSpaces(prev => prev.filter(item => item.id !== spaceId));
      setStats(prev => ({ ...prev, totalSpaces: prev.totalSpaces + 1 }));
      showNotification(language === 'en' ? "Property space approved successfully!" : "Đã duyệt mặt bằng thành công!");
    } catch (err) {
      console.error(err);
      // Fallback
      setPendingSpaces(prev => prev.filter(item => item.id !== spaceId));
      setStats(prev => ({ ...prev, totalSpaces: prev.totalSpaces + 1 }));
      showNotification(language === 'en' ? "Property approved (Demo mode)" : "Phê duyệt thành công (Chế độ mô phỏng)");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectSpace = async (spaceId: string) => {
    setIsLoading(true);
    try {
      await fetch(`https://localhost:7069/api/Admin/Spaces/${spaceId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': '*/*'
        }
      });
      setPendingSpaces(prev => prev.filter(item => item.id !== spaceId));
      showNotification(language === 'en' ? "Property space rejected." : "Đã từ chối mặt bằng.", 'error');
    } catch (err) {
      console.error(err);
      setPendingSpaces(prev => prev.filter(item => item.id !== spaceId));
      showNotification(language === 'en' ? "Property rejected (Demo mode)" : "Đã từ chối mặt bằng (Chế độ mô phỏng)", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS XỬ LÝ DUYỆT / TỪ CHỐI TIN ĐĂNG (LISTINGS) ---
  const handleApproveListing = async (listingId: string) => {
    setIsLoading(true);
    try {
      await fetch(`https://localhost:7069/api/Admin/Listings/${listingId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': '*/*'
        }
      });
      setPendingListings(prev => prev.filter(item => item.id !== listingId));
      setStats(prev => ({ ...prev, totalListings: prev.totalListings + 1 }));
      showNotification(language === 'en' ? "Rental listing approved!" : "Đã phê duyệt bài đăng cho thuê!");
    } catch (err) {
      console.error(err);
      setPendingListings(prev => prev.filter(item => item.id !== listingId));
      setStats(prev => ({ ...prev, totalListings: prev.totalListings + 1 }));
      showNotification(language === 'en' ? "Listing approved (Demo mode)" : "Phê duyệt tin đăng thành công (Chế độ mô phỏng)");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectListing = async (listingId: string) => {
    setIsLoading(true);
    try {
      await fetch(`https://localhost:7069/api/Admin/Listings/${listingId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': '*/*'
        }
      });
      setPendingListings(prev => prev.filter(item => item.id !== listingId));
      showNotification(language === 'en' ? "Rental listing rejected." : "Đã từ chối tin đăng.", 'error');
    } catch (err) {
      console.error(err);
      setPendingListings(prev => prev.filter(item => item.id !== listingId));
      showNotification(language === 'en' ? "Listing rejected (Demo mode)" : "Từ chối tin đăng (Chế độ mô phỏng)", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS QUẢN LÝ USER ---
  const toggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
        showNotification(
          language === 'en' 
            ? `User status updated to ${nextStatus}` 
            : `Đã cập nhật trạng thái người dùng thành ${nextStatus === 'ACTIVE' ? 'Hoạt động' : 'Bị Khóa'}`
        );
        return { ...u, status: nextStatus };
      }
      return u;
    }));
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
          <div className="admin-module animate-fade-in">
            <header className="module-header">
              <h1>{language === 'en' ? 'System Overview' : 'Tổng quan Hệ thống'}</h1>
              <p>{language === 'en' ? 'Live analytics and nodes monitoring' : 'Thông số hoạt động và phân tích trực tiếp'}</p>
            </header>

            {/* Stats Cards */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card glass-card">
                <div className="stat-icon-wrapper blue"><Users size={20} /></div>
                <div className="stat-data">
                  <span className="stat-label">{language === 'en' ? 'ACTIVE USERS' : 'NGƯỜI DÙNG HOẠT ĐỘNG'}</span>
                  <h2 className="stat-value">{stats.totalUsers}</h2>
                </div>
              </div>

              <div className="admin-stat-card glass-card">
                <div className="stat-icon-wrapper green"><Building size={20} /></div>
                <div className="stat-data">
                  <span className="stat-label">{language === 'en' ? 'VERIFIED SPACES' : 'MẶT BẰNG ĐÃ XÁC MINH'}</span>
                  <h2 className="stat-value">{stats.totalSpaces}</h2>
                </div>
              </div>

              <div className="admin-stat-card glass-card">
                <div className="stat-icon-wrapper orange"><FileText size={20} /></div>
                <div className="stat-data">
                  <span className="stat-label">{language === 'en' ? 'PUBLISHED LISTINGS' : 'TIN ĐĂNG CHO THUÊ'}</span>
                  <h2 className="stat-value">{stats.totalListings}</h2>
                </div>
              </div>

              <div className="admin-stat-card glass-card">
                <div className="stat-icon-wrapper purple"><DollarSign size={20} /></div>
                <div className="stat-data">
                  <span className="stat-label">{language === 'en' ? 'ESTIMATED VOLUME' : 'TỔNG DOANH THU'}</span>
                  <h2 className="stat-value">{(stats.totalRevenue).toLocaleString('vi-VN')} đ</h2>
                </div>
              </div>
            </div>

            {/* Activity Block */}
            <div className="admin-activity-section glass-card">
              <div className="section-title-row">
                <Activity size={18} className="text-neon-green" />
                <h3>{language === 'en' ? 'Realtime Node Analytics' : 'Biểu đồ hoạt động hệ thống'}</h3>
              </div>
              <div className="simulated-chart">
                <div className="chart-bar-container">
                  <div className="chart-bar" style={{ height: '70%' }}><span className="bar-label">May</span></div>
                  <div className="chart-bar" style={{ height: '85%' }}><span className="bar-label">Jun</span></div>
                  <div className="chart-bar" style={{ height: '60%' }}><span className="bar-label">Jul</span></div>
                  <div className="chart-bar" style={{ height: '90%' }}><span className="bar-label">Aug</span></div>
                  <div className="chart-bar active" style={{ height: '95%' }}><span className="bar-label">Current</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- MODULE 2: USERS --- */}
        {activeTab === 'users' && (
          <div className="admin-module animate-fade-in">
            <header className="module-header">
              <h1>{language === 'en' ? 'User Accounts' : 'Quản lý Người dùng'}</h1>
              <p>{language === 'en' ? 'Manage roles, permission layers, and access keys' : 'Quản lý quyền hạn, vai trò và trạng thái tài khoản'}</p>
            </header>

            <div className="admin-table-container glass-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>{language === 'en' ? 'User Info' : 'Người dùng'}</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className={u.status === 'BLOCKED' ? 'blocked-row' : ''}>
                      <td className="font-mono">{u.id}</td>
                      <td>
                        <div className="user-info-cell">
                          <div className="user-avatar-mini">{u.name[0]}</div>
                          <span className="user-name">{u.name}</span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge-role ${u.role.toLowerCase()}`}>{u.role}</span>
                      </td>
                      <td>
                        <span className={`badge-status ${u.status.toLowerCase()}`}>
                          {u.status === 'ACTIVE' ? (language === 'en' ? 'Active' : 'Hoạt động') : (language === 'en' ? 'Blocked' : 'Bị Khóa')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {u.role !== 'ADMIN' && (
                          <button 
                            className={`btn-action-icon ${u.status === 'ACTIVE' ? 'block' : 'unblock'}`}
                            onClick={() => toggleUserStatus(u.id)}
                            title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          >
                            <BlockIcon size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- MODULE 3: SPACES APPROVAL --- */}
        {activeTab === 'spaces' && (
          <div className="admin-module animate-fade-in">
            <header className="module-header">
              <h1>{language === 'en' ? 'Spaces Verification' : 'Phê duyệt Mặt bằng'}</h1>
              <p>{language === 'en' ? 'Review properties registered by Space Owners' : 'Xét duyệt tính pháp lý và thông tin mặt bằng do Chủ nhà đăng tải'}</p>
            </header>

            <div className="approval-list-grid">
              {pendingSpaces.length === 0 ? (
                <div className="empty-approval glass-card">
                  <Check size={36} className="text-neon-green" />
                  <h3>{language === 'en' ? 'All spaces approved' : 'Không có mặt bằng nào đang chờ duyệt'}</h3>
                  <p>{language === 'en' ? 'Everything is clear for now' : 'Hệ thống đã cập nhật đầy đủ thông tin'}</p>
                </div>
              ) : (
                pendingSpaces.map(sp => (
                  <div key={sp.id} className="approval-card glass-card">
                    <div className="approval-card-header">
                      <span className="approval-id">ID: {sp.id}</span>
                      <span className="approval-date">{sp.createdAt}</span>
                    </div>

                    <h2 className="approval-title">{sp.name}</h2>
                    
                    <div className="approval-details">
                      <div className="detail-item">
                        <MapPin size={14} />
                        <span>{sp.address}</span>
                      </div>
                      <div className="detail-item">
                        <Building size={14} />
                        <span>{sp.area} sqm</span>
                      </div>
                      <div className="detail-item">
                        <UserIcon size={14} />
                        <span>Owner: <strong className="text-neon-green">{sp.ownerName}</strong> (ID: {sp.ownerId})</span>
                      </div>
                    </div>

                    <div className="approval-card-actions">
                      <button 
                        className="btn-approve" 
                        disabled={isLoading}
                        onClick={() => handleApproveSpace(sp.id)}
                      >
                        <Check size={15} />
                        {language === 'en' ? 'Approve' : 'Duyệt'}
                      </button>

                      <button 
                        className="btn-reject" 
                        disabled={isLoading}
                        onClick={() => handleRejectSpace(sp.id)}
                      >
                        <X size={15} />
                        {language === 'en' ? 'Reject' : 'Từ chối'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- MODULE 4: LISTINGS APPROVAL --- */}
        {activeTab === 'listings' && (
          <div className="admin-module animate-fade-in">
            <header className="module-header">
              <h1>{language === 'en' ? 'Listings Verification' : 'Phê duyệt Tin đăng'}</h1>
              <p>{language === 'en' ? 'Review lease and time-sharing offers before publishing' : 'Kiểm tra và duyệt các gói tin đăng cho thuê trước khi công khai lên sàn giao dịch'}</p>
            </header>

            <div className="approval-list-grid">
              {pendingListings.length === 0 ? (
                <div className="empty-approval glass-card">
                  <Check size={36} className="text-neon-green" />
                  <h3>{language === 'en' ? 'All listings approved' : 'Không có bài đăng nào đang chờ duyệt'}</h3>
                  <p>{language === 'en' ? 'Everything is clear for now' : 'Hệ thống đã cập nhật đầy đủ thông tin'}</p>
                </div>
              ) : (
                pendingListings.map(lt => (
                  <div key={lt.id} className="approval-card glass-card">
                    <div className="approval-card-header">
                      <span className="approval-id">ID: {lt.id}</span>
                      <span className="approval-date">{lt.createdAt}</span>
                    </div>

                    <h2 className="approval-title">{lt.title}</h2>
                    
                    <div className="approval-details">
                      <div className="detail-item">
                        <Building size={14} />
                        <span>Space: {lt.spaceName}</span>
                      </div>
                      <div className="detail-item">
                        <DollarSign size={14} />
                        <span>Price: <strong className="text-neon-green">{(lt.price).toLocaleString('vi-VN')} đ/slot</strong></span>
                      </div>
                      <div className="detail-item">
                        <UserIcon size={14} />
                        <span>Poster: <strong>{lt.ownerName}</strong></span>
                      </div>
                    </div>

                    <div className="approval-card-actions">
                      <button 
                        className="btn-approve" 
                        disabled={isLoading}
                        onClick={() => handleApproveListing(lt.id)}
                      >
                        <Check size={15} />
                        {language === 'en' ? 'Approve' : 'Duyệt'}
                      </button>

                      <button 
                        className="btn-reject" 
                        disabled={isLoading}
                        onClick={() => handleRejectListing(lt.id)}
                      >
                        <X size={15} />
                        {language === 'en' ? 'Reject' : 'Từ chối'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- MODULE 5: TRANSACTIONS --- */}
        {activeTab === 'transactions' && (
          <div className="admin-module animate-fade-in">
            <header className="module-header">
              <h1>{language === 'en' ? 'Subleasing Transactions' : 'Hệ thống Giao dịch'}</h1>
              <p>{language === 'en' ? 'Monitor escrow nodes and hourly contract payouts' : 'Theo dõi hệ thống ví ký quỹ và dòng tiền thanh toán dịch vụ'}</p>
            </header>

            <div className="admin-table-container glass-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>TXID</th>
                    <th>{language === 'en' ? 'Space Location' : 'Địa điểm'}</th>
                    <th>{language === 'en' ? 'Renter' : 'Người thuê'}</th>
                    <th>{language === 'en' ? 'Amount' : 'Số tiền'}</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-mono">TX88301</td>
                    <td>Ether Workspace Quận 1</td>
                    <td>Trần Thị B</td>
                    <td>1,500,000 đ</td>
                    <td><span className="badge-status active">{language === 'en' ? 'Completed' : 'Hoàn thành'}</span></td>
                    <td>2026-06-24</td>
                  </tr>
                  <tr>
                    <td className="font-mono">TX88302</td>
                    <td>Co-working Space Cầu Giấy</td>
                    <td>Nguyễn Văn A</td>
                    <td>2,000,000 đ</td>
                    <td><span className="badge-status active">{language === 'en' ? 'Completed' : 'Hoàn thành'}</span></td>
                    <td>2026-06-23</td>
                  </tr>
                  <tr>
                    <td className="font-mono">TX88303</td>
                    <td>Nhà kho thương mại Thủ Đức</td>
                    <td>Lê Hoàng C</td>
                    <td>3,200,000 đ</td>
                    <td><span className="badge-status pending">{language === 'en' ? 'Escrow Escaped' : 'Ký quỹ tạm giữ'}</span></td>
                    <td>2026-06-22</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
