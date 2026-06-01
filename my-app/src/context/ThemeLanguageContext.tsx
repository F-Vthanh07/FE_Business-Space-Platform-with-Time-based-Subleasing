import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'vi';
export type Theme = 'light' | 'dark';

interface Translations {
  [key: string]: {
    en: string;
    vi: string;
  };
}

const translations: Translations = {
  // Homepage Landing
  'home.navFeatures': { en: 'Features', vi: 'Tính năng' },
  'home.navExplore': { en: 'Explore', vi: 'Khám phá' },
  'home.navPricing': { en: 'Pricing', vi: 'Bảng giá' },
  'home.navHowItWorks': { en: 'How it works', vi: 'Cách hoạt động' },
  'home.navLaunch': { en: 'Login', vi: 'Đăng nhập' },

  'home.heroTag': { en: '✦ THE FUTURE OF RETAIL SPACES', vi: '✦ TƯƠNG LAI CỦA MẶT BẰNG BÁN LẺ' },
  'home.heroTitleMain': { en: 'Spatial Fluidity.', vi: 'Mặt bằng linh hoạt.' },
  'home.heroTitleSub': { en: 'Hourly Subleasing.', vi: 'Cho thuê theo giờ.' },
  'home.heroDesc': {
    en: 'Tether unused retail hours to ambitious brands. Register spaces, allocate slots, and rent securely.',
    vi: 'Kết nối khung giờ trống của cửa hàng với các nhãn hàng. Đăng ký mặt bằng, chia slot và thuê lại an toàn.'
  },
  'home.heroBtnDemo': { en: 'Launch App', vi: 'Khởi chạy App' },
  'home.heroBtnExplore': { en: 'Browse Venues →', vi: 'Duyệt mặt bằng →' },

  'home.statOccupancy': { en: 'Average Occupancy', vi: 'Tỷ lệ lấp đầy TB' },
  'home.statSlots': { en: 'Hourly Slots Booked', vi: 'Slot giờ đã đặt' },
  'home.statSpaces': { en: 'Verified Venues', vi: 'Mặt bằng xác minh' },

  'home.featTitle': { en: 'Engineered for Spatial Flexibility', vi: 'Thiết kế cho sự linh hoạt không gian' },
  'home.featSub': { en: 'Discover how EtherSpace simplifies sharing and subleasing.', vi: 'Khám phá cách EtherSpace tối ưu hóa việc chia sẻ mặt bằng kinh doanh.' },

  'home.feat1Title': { en: 'Hourly Scheduling', vi: 'Lịch trình theo giờ' },
  'home.feat1Desc': { en: 'Divide daily operational hours into micro-slots, allowing multiple business models in a single location.', vi: 'Chia nhỏ khung giờ hoạt động hàng ngày thành các slot nhỏ, hỗ trợ nhiều mô hình kinh doanh trên một mặt bằng.' },

  'home.feat2Title': { en: 'AI Conflict Protection', vi: 'Kiểm duyệt xung đột AI' },
  'home.feat2Desc': { en: 'Our intelligent collision checker auto-reviews sublease slots against primary leases to prevent schedule clashes.', vi: 'Hệ thống tự động rà soát lịch thuê lại so với lịch thuê gốc để đảm bảo không xảy ra chồng chéo lịch trình.' },

  'home.feat3Title': { en: 'Secure Transactions', vi: 'Thanh toán an toàn' },
  'home.feat3Desc': { en: 'Automatic transaction coding, digital invoices, and secure escrow protect both owners and renters.', vi: 'Mã hóa giao dịch tự động, xuất hóa đơn VAT điện tử và ví ký quỹ đảm bảo quyền lợi cho cả hai bên.' },

  'home.feat4Title': { en: 'Multi-Role Dashboards', vi: 'Dashboard đa vai trò' },
  'home.feat4Desc': { en: 'Tailored consoles for space owners to track monthly income, and renters to manage subleasing operations.', vi: 'Bảng quản trị chuyên sâu dành cho Chủ mặt bằng theo dõi doanh thu và Người thuê chính quản lý cho thuê lại.' },

  'home.howTitle': { en: 'Fluid Subleasing in 3 Steps', vi: 'Quy trình hoạt động 3 bước' },
  'home.howOwner': { en: 'For Owners', vi: 'Dành cho Chủ mặt bằng' },
  'home.howRenter': { en: 'For Renters', vi: 'Dành cho Khách thuê chính' },

  'home.step1OwnerTitle': { en: '1. Register Assets', vi: '1. Đăng ký tài sản' },
  'home.step1OwnerDesc': { en: 'Declare physical attributes, dimensions, and operational schedules.', vi: 'Khai báo thông số vật lý, diện tích và khung giờ hoạt động.' },
  'home.step2OwnerTitle': { en: '2. Publish Listing', vi: '2. Đăng tin cho thuê' },
  'home.step2OwnerDesc': { en: 'Create long-term contract offers to attract primary renters.', vi: 'Tạo đề xuất hợp đồng dài hạn để tìm kiếm khách thuê chính.' },
  'home.step3OwnerTitle': { en: '3. Collect Rent', vi: '3. Nhận tiền hàng tháng' },
  'home.step3OwnerDesc': { en: 'Track contracts, invoices, and receive recurring bank payouts.', vi: 'Theo dõi hợp đồng, hóa đơn và nhận tiền thuê định kỳ.' },

  'home.step1RenterTitle': { en: '1. Secure Location', vi: '1. Thuê mặt bằng gốc' },
  'home.step1RenterDesc': { en: 'Sign monthly contract with the landlord through our vetted listings.', vi: 'Ký hợp đồng thuê tháng với chủ nhà thông qua tin đăng xác minh.' },
  'home.step2RenterTitle': { en: '2. Create Time Slots', vi: '2. Thiết lập slot giờ' },
  'home.step2RenterDesc': { en: 'Slice idle hours of the retail storefront into rentable slots.', vi: 'Chia nhỏ các khung giờ không sử dụng của mặt bằng thành slot cho thuê.' },
  'home.step3RenterTitle': { en: '3. Host Sub-tenants', vi: '3. Đón tiếp khách thuê phụ' },
  'home.step3RenterDesc': { en: 'Approve requests, gather subleasing yields, and lower overheads.', vi: 'Duyệt yêu cầu thuê phụ, thu hồi chi phí mặt bằng và tối ưu hóa.' },

  'home.exploreTitle': { en: 'Explore Premium Hubs', vi: 'Khám phá không gian nổi bật' },
  'home.exploreSub': { en: 'Premium retail venues configured for time sharing.', vi: 'Mặt bằng kinh doanh cao cấp đã cấu hình chia sẻ khung giờ.' },
  'home.footerText': { en: 'Hourly retail space sharing platform. Made with spatial fluid principles.', vi: 'Nền tảng chia sẻ mặt bằng kinh doanh theo khung giờ. Thiết kế theo phong cách trực quan.' },

  // Role Selector
  'app.tagline': {
    en: 'Hourly retail space sharing platform',
    vi: 'Nền tảng chia sẻ mặt bằng kinh doanh theo khung giờ',
  },
  'app.selectRole': {
    en: 'Select a portal role console:',
    vi: 'Chọn cổng điều khiển vai trò:',
  },
  'app.ownerTitle': {
    en: 'Space Owner',
    vi: 'Chủ mặt bằng',
  },
  'app.ownerDesc': {
    en: 'Register spaces, manage rental listings, and track monthly tenants.',
    vi: 'Đăng ký mặt bằng, quản lý bài đăng cho thuê và theo dõi người thuê hàng tháng',
  },
  'app.ownerBtn': {
    en: 'Enter Dashboard →',
    vi: 'Vào Dashboard →',
  },
  'app.ownerBadge1': {
    en: 'Spaces Management',
    vi: 'Quản lý mặt bằng',
  },
  'app.ownerBadge2': {
    en: 'Listings',
    vi: 'Bài đăng',
  },
  'app.ownerBadge3': {
    en: 'Tenants',
    vi: 'Người thuê',
  },
  'app.renterTitle': {
    en: 'Primary Tenant',
    vi: 'Người thuê chính',
  },
  'app.renterDesc': {
    en: 'Manage sublease slots, sharing schedules, and subtenant listings.',
    vi: 'Quản lý slot cho thuê lại, lịch chia sẻ khung giờ và bài đăng cho thuê phụ',
  },
  'app.renterBtn': {
    en: 'Enter Dashboard →',
    vi: 'Vào Dashboard →',
  },
  'app.renterBadge1': {
    en: 'Slot Calendar',
    vi: 'Lịch slot',
  },
  'app.renterBadge2': {
    en: 'Subleasing',
    vi: 'Cho thuê lại',
  },
  'app.renterBadge3': {
    en: 'Sub-tenants',
    vi: 'Người thuê phụ',
  },
  'app.demoNote': {
    en: '✦ Secure Space Management Portal',
    vi: '✦ Cổng quản lý mặt bằng kinh doanh bảo mật',
  },

  // Header
  'header.exploreAssets': {
    en: 'Explore assets...',
    vi: 'Tìm kiếm mặt bằng...',
  },
  'header.notifications': {
    en: 'Notifications',
    vi: 'Thông báo',
  },
  'header.settings': {
    en: 'Settings',
    vi: 'Cài đặt',
  },
  'header.overview': {
    en: 'OVERVIEW',
    vi: 'TỔNG QUAN',
  },
  'header.analytics': {
    en: 'ANALYTICS',
    vi: 'PHÂN TÍCH',
  },
  'header.reports': {
    en: 'REPORTS',
    vi: 'BÁO CÁO',
  },

  // Sidebar Common & Specific
  'sidebar.dashboard': {
    en: 'Dashboard',
    vi: 'Dashboard',
  },
  'sidebar.dashboardSub': {
    en: 'Overview',
    vi: 'Tổng quan',
  },
  'sidebar.assets': {
    en: 'Assets',
    vi: 'Assets',
  },
  'sidebar.assetsSub': {
    en: 'Spaces',
    vi: 'Mặt bằng',
  },
  'sidebar.market': {
    en: 'Market',
    vi: 'Market',
  },
  'sidebar.marketSub': {
    en: 'Listings',
    vi: 'Bài đăng',
  },
  'sidebar.exchange': {
    en: 'Exchange',
    vi: 'Exchange',
  },
  'sidebar.exchangeSub': {
    en: 'Tenants',
    vi: 'Người thuê',
  },
  'sidebar.wallet': {
    en: 'Wallet',
    vi: 'Wallet',
  },
  'sidebar.walletSub': {
    en: 'Analytics',
    vi: 'Phân tích',
  },
  'sidebar.settings': {
    en: 'Settings',
    vi: 'Settings',
  },
  'sidebar.settingsSub': {
    en: 'Settings',
    vi: 'Cài đặt',
  },
  'sidebar.newTransaction': {
    en: 'NEW SPACE',
    vi: 'MẶT BẰNG MỚI',
  },
  'sidebar.newTransactionRenter': {
    en: 'NEW SLOT',
    vi: 'TẠO SLOT MỚI',
  },
  'sidebar.logout': {
    en: 'Logout',
    vi: 'Đăng xuất',
  },
  'sidebar.languageNetwork': {
    en: 'Language / Network',
    vi: 'Ngôn ngữ / Mạng',
  },
  'sidebar.renterRoleBadge': {
    en: 'Primary Tenant',
    vi: 'Người thuê chính',
  },
  'sidebar.calendarSub': {
    en: 'Slot Calendar',
    vi: 'Lịch slot',
  },
  'sidebar.subleaseSub': {
    en: 'Sublease',
    vi: 'Cho thuê lại',
  },
  'sidebar.subTenantsSub': {
    en: 'Sub-tenants',
    vi: 'Người thuê phụ',
  },

  // Owner Overview Dashboard
  'overview.portfolioArchitecture': {
    en: 'PORTFOLIO ARCHITECTURE',
    vi: 'CẤU TRÚC DANH MỤC',
  },
  'overview.tactileAtmosphere': {
    en: 'The Tactile Atmosphere.',
    vi: 'Không Gian Trực Quan.',
  },
  'overview.tactileDesc': {
    en: 'High-fidelity asset management rendered in editorial layers. Observe the market fluctuations within a physical digital substrate.',
    vi: 'Hệ thống quản lý tài sản trực quan với các lớp biên tập cao cấp. Theo dõi những biến động thị trường trên nền tảng kỹ thuật số.',
  },
  'overview.totalLiquidity': {
    en: 'MONTHLY ESTIMATE',
    vi: 'ƯỚC TÍNH DOANH THU',
  },
  'overview.activeStakes': {
    en: 'ACTIVE SPACES',
    vi: 'MẶT BẰNG HOẠT ĐỘNG',
  },
  'overview.processing': {
    en: 'Processing',
    vi: 'Đang xử lý',
  },
  'overview.marketSentiment': {
    en: 'Market Sentiment',
    vi: 'Xu Hướng Thị Trường',
  },
  'overview.liveFlow': {
    en: 'LIVE FLOW',
    vi: 'DÒNG DỮ LIỆU TRỰC TIẾP',
  },
  'overview.vault': {
    en: 'CONTRACT',
    vi: 'HỢP ĐỒNG',
  },
  'overview.secured': {
    en: 'Linked / Signed',
    vi: 'Liên kết / Đã ký',
  },
  'overview.gasFee': {
    en: 'SERVICE FEE',
    vi: 'PHÍ DỊCH VỤ',
  },
  'overview.manageTeam': {
    en: 'MANAGE STAFF',
    vi: 'QUẢN LÝ NHÂN VIÊN',
  },
  'overview.alphaInsights': {
    en: 'Optimization Insights',
    vi: 'Phân Tích Xu Hướng',
  },
  'overview.alphaInsightsDesc': {
    en: 'Weekend slots from 9:00 - 12:00 have the highest occupancy rate (95%). Consider optimizing rental prices for these hours.',
    vi: 'Các khung giờ từ 9:00 - 12:00 ngày cuối tuần đang có tỷ lệ lấp đầy cao nhất (95%). Hãy tối ưu hóa giá thuê cho các khung giờ này.',
  },
  'overview.readReport': {
    en: 'VIEW DETAILS',
    vi: 'XEM CHI TIẾT',
  },
  'overview.upgradeToElite': {
    en: 'Upgrade Membership',
    vi: 'Nâng cấp Hội Viên',
  },
  'overview.unlockAdvancedNodes': {
    en: 'UNLOCK EXCLUSIVE FEATURES',
    vi: 'MỞ KHÓA TÍNH NĂNG ĐẶC QUYỀN',
  },

  // Renter Overview Dashboard
  'overview.subleaseArchitecture': {
    en: 'SUBLEASE ARCHITECTURE',
    vi: 'CẤU TRÚC CHO THUÊ LẠI',
  },
  'overview.subleaseDesc': {
    en: 'High-fidelity subleasing management rendered in editorial layers. Optimize your unused time slots and maximize spatial efficiency.',
    vi: 'Hệ thống quản lý cho thuê lại thời gian thực chất lượng cao. Tối ưu hóa các khung giờ trống và tối đa hóa hiệu suất sử dụng mặt bằng.',
  },
  'overview.subleaseRevenue': {
    en: 'SUBLEASE REVENUE',
    vi: 'DOANH THU CHO THUÊ LẠI',
  },
  'overview.activeSlots': {
    en: 'ACTIVE SLOTS',
    vi: 'SLOT ĐANG HOẠT ĐỘNG',
  },
  'overview.subleaseSentiment': {
    en: 'Sublease Sentiment',
    vi: 'Xu Hướng Cho Thuê Lại',
  },

  // Owner Spaces
  'spaces.mySpaces': {
    en: 'My Spaces',
    vi: 'Mặt bằng của tôi',
  },
  'spaces.spacesSubtitle': {
    en: 'Register and manage physical spaces before creating rental listings',
    vi: 'Đăng ký và quản lý các mặt bằng vật lý trước khi tạo bài đăng cho thuê',
  },
  'spaces.registerNewSpace': {
    en: 'Register New Space',
    vi: 'Đăng ký mặt bằng mới',
  },
  'spaces.searchSpacePlaceholder': {
    en: 'Search space name, address...',
    vi: 'Tìm kiếm tên, địa chỉ mặt bằng...',
  },
  'spaces.totalSpacesCount': {
    en: 'Total: {count} spaces',
    vi: 'Tổng số: {count} mặt bằng',
  },
  'spaces.physicalSpace': {
    en: 'Physical Space',
    vi: 'Mặt bằng vật lý',
  },
  'spaces.statusActive': {
    en: 'Active',
    vi: 'Đang hoạt động',
  },
  'spaces.statusPending': {
    en: 'Pending',
    vi: 'Chờ duyệt',
  },
  'spaces.amenities': {
    en: 'Amenities:',
    vi: 'Tiện ích:',
  },
  'spaces.allowedModels': {
    en: 'Allowed models:',
    vi: 'Mô hình cho phép:',
  },
  'spaces.noAmenities': {
    en: 'No amenities available',
    vi: 'Không có tiện ích nào',
  },
  'spaces.notConfigured': {
    en: 'Not configured',
    vi: 'Chưa cấu hình',
  },
  'spaces.edit': {
    en: 'Edit',
    vi: 'Sửa',
  },
  'spaces.delete': {
    en: 'Delete',
    vi: 'Xóa',
  },
  'spaces.confirmDeleteSpace': {
    en: 'Are you sure you want to delete this space?',
    vi: 'Bạn có chắc chắn muốn xóa mặt bằng này không?',
  },

  // Space Form (modal)
  'spaceForm.editSpace': {
    en: 'Edit Space',
    vi: 'Chỉnh sửa mặt bằng',
  },
  'spaceForm.registerSpace': {
    en: 'Register New Space',
    vi: 'Đăng ký mặt bằng mới',
  },
  'spaceForm.spaceFormSubtitle': {
    en: 'Declare physical asset information to search for tenants',
    vi: 'Khai báo thông tin tài sản vật lý để tìm kiếm khách thuê',
  },
  'spaceForm.formSectionBasic': {
    en: '1. Basic Info (Space Table)',
    vi: '1. Thông tin cơ bản (Space Table)',
  },
  'spaceForm.formLabelSpaceName': {
    en: 'Space / Venue Name',
    vi: 'Tên mặt bằng / Không gian',
  },
  'spaceForm.formPlaceholderSpaceName': {
    en: 'e.g., Le Loi Co-working Space',
    vi: 'Ví dụ: Không gian Co-working Lê Lợi',
  },
  'spaceForm.formLabelAddress': {
    en: 'Address',
    vi: 'Địa chỉ',
  },
  'spaceForm.formPlaceholderAddress': {
    en: 'e.g., 120 Le Loi, District 1, HCMC',
    vi: 'Ví dụ: 120 Lê Lợi, Quận 1, TP.HCM',
  },
  'spaceForm.formLabelArea': {
    en: 'Area (sqm)',
    vi: 'Diện tích (m²)',
  },
  'spaceForm.formPlaceholderArea': {
    en: 'e.g., 45',
    vi: 'Ví dụ: 45',
  },
  'spaceForm.formSectionAmenities': {
    en: '2. Available Amenities (Amenity Table)',
    vi: '2. Tiện ích có sẵn (Amenity Table)',
  },
  'spaceForm.formSectionCategories': {
    en: '3. Allowed Categories (Category Table)',
    vi: '3. Ngành nghề cho phép (Category Table)',
  },
  'spaceForm.formSectionOperating': {
    en: '4. Operating Hours (OperatingHour Table)',
    vi: '4. Giờ hoạt động (OperatingHour Table)',
  },
  'spaceForm.formOperatingSubtitle': {
    en: 'Select active weekdays and adjust opening/closing hours',
    vi: 'Chọn các ngày trong tuần hoạt động và điều chỉnh giờ đóng/mở cửa',
  },
  'spaceForm.formTimeSeparator': {
    en: '-',
    vi: '-',
  },
  'spaceForm.cancel': {
    en: 'Cancel',
    vi: 'Hủy',
  },
  'spaceForm.saveSpaceInfo': {
    en: 'Save Space Info',
    vi: 'Lưu thông tin mặt bằng',
  },
  'spaceForm.fillAllFields': {
    en: 'Please fill in all basic fields!',
    vi: 'Vui lòng điền đầy đủ các trường thông tin cơ bản!',
  },

  // Owner Listings
  'listings.rentalListings': {
    en: 'Rental Listings',
    vi: 'Bài đăng cho thuê mặt bằng',
  },
  'listings.listingsSubtitle': {
    en: 'Manage all of your retail space rental listings',
    vi: 'Quản lý tất cả các bài đăng cho thuê mặt bằng của bạn',
  },
  'listings.createNewListing': {
    en: 'Create New Listing',
    vi: 'Tạo bài đăng mới',
  },
  'listings.totalListings': {
    en: 'Total Listings',
    vi: 'Tổng bài đăng',
  },
  'listings.published': {
    en: 'Published',
    vi: 'Đã đăng',
  },
  'listings.pending': {
    en: 'Pending',
    vi: 'Chờ duyệt',
  },
  'listings.draft': {
    en: 'Draft',
    vi: 'Bản nháp',
  },
  'listings.expired': {
    en: 'Expired',
    vi: 'Hết hạn',
  },
  'listings.searchListingPlaceholder': {
    en: 'Search listings, locations...',
    vi: 'Tìm kiếm bài đăng, địa điểm...',
  },
  'listings.all': {
    en: 'All',
    vi: 'Tất cả',
  },
  'listings.views': {
    en: '{count} views',
    vi: '{count} lượt xem',
  },
  'listings.inquiries': {
    en: '{count} inquiries',
    vi: '{count} yêu cầu',
  },
  'listings.subleaseBadge': {
    en: 'Subleasing Allowed',
    vi: 'Cho thuê lại',
  },
  'listings.postedOn': {
    en: 'Posted on {date}',
    vi: 'Đăng ngày {date}',
  },

  // Owner Tenants
  'tenants.monthlyTenants': {
    en: 'Monthly Tenants',
    vi: 'Người thuê hàng tháng',
  },
  'tenants.tenantsSubtitle': {
    en: 'Manage tenancy contracts and payment statuses',
    vi: 'Quản lý hợp đồng thuê và trạng thái thanh toán',
  },
  'tenants.exportReport': {
    en: 'Export Report',
    vi: 'Xuất báo cáo',
  },
  'tenants.addTenant': {
    en: 'Add Tenant',
    vi: 'Thêm người thuê',
  },
  'tenants.current': {
    en: 'Current',
    vi: 'Hiện tại',
  },
  'tenants.revenueThisMonth': {
    en: 'Revenue This Month',
    vi: 'Doanh thu tháng này',
  },
  'tenants.fromAllContracts': {
    en: 'From all contracts',
    vi: 'Từ tất cả hợp đồng',
  },
  'tenants.paid': {
    en: 'Paid',
    vi: 'Đã thanh toán',
  },
  'tenants.pendingPayment': {
    en: 'Pending Payment',
    vi: 'Chờ thanh toán',
  },
  'tenants.overdue': {
    en: 'Overdue',
    vi: 'Quá hạn',
  },
  'tenants.needAction': {
    en: 'needs attention',
    vi: 'cần xử lý',
  },
  'tenants.searchTenantPlaceholder': {
    en: 'Search tenants, spaces...',
    vi: 'Tìm kiếm người thuê, mặt bằng...',
  },
  'tenants.contractProgress': {
    en: 'Contract Progress',
    vi: 'Tiến độ hợp đồng',
  },
  'tenants.remainingMonths': {
    en: '{rem}/{total} months remaining',
    vi: 'Còn {rem}/{total} tháng',
  },
  'tenants.contractStart': {
    en: 'Start: {date}',
    vi: 'Bắt đầu: {date}',
  },
  'tenants.contractEnd': {
    en: 'End: {date}',
    vi: 'Kết thúc: {date}',
  },
  'tenants.monthlyRent': {
    en: 'Monthly Rent',
    vi: 'Tiền thuê / tháng',
  },
  'tenants.addressLabel': {
    en: 'Address',
    vi: 'Địa chỉ',
  },
  'tenants.paymentSchedule': {
    en: 'Payment Schedule',
    vi: 'Lịch thanh toán',
  },
  'tenants.contract': {
    en: 'Contract',
    vi: 'Hợp đồng',
  },

  // Renter Calendar
  'renter.subleaseCalendarTitle': {
    en: 'Sublease Slot Calendar',
    vi: 'Quản lý lịch slot cho thuê lại',
  },
  'renter.subleaseCalendarSubtitle': {
    en: 'View and manage all time slots you have shared for sub-tenants',
    vi: 'Xem và quản lý tất cả các khung giờ bạn đã chia sẻ cho người thuê phụ',
  },
  'renter.subleaseListingsTitle': {
    en: 'Sublease Listings',
    vi: 'Bài đăng cho thuê lại mặt bằng',
  },
  'renter.subleaseListingsSubtitle': {
    en: 'Manage time slots you share for sub-tenants',
    vi: 'Quản lý các slot thời gian bạn chia sẻ cho người thuê phụ',
  },
  'renter.subTenantsTitle': {
    en: 'Manage Sub-tenants',
    vi: 'Quản lý người thuê phụ',
  },
  'renter.subTenantsSubtitle': {
    en: 'View list, approve subleasing requests, and manage contacts of sub-tenants',
    vi: 'Xem danh sách, kiểm duyệt yêu cầu thuê slot và quản lý liên hệ của các người thuê thứ cấp',
  },
  'renter.addSlot': {
    en: 'Add Slot',
    vi: 'Thêm slot',
  },
  'renter.noSlotThisDay': {
    en: 'No slots available on this day',
    vi: 'Không có slot nào vào ngày này',
  },
  'renter.pressAddSlotInstruction': {
    en: 'Click "+ Add Slot" to create subleasing time slots',
    vi: 'Nhấn "+ Thêm slot" để tạo khung giờ cho thuê lại',
  },
  'renter.priceSlot': {
    en: 'Slot Price:',
    vi: 'Giá slot:',
  },
  'renter.bookThisSlot': {
    en: 'Book This Slot',
    vi: 'Đặt slot này',
  },
  'renter.conflictWarning': {
    en: 'Schedule conflict! Immediate attention required.',
    vi: 'Xung đột lịch! Cần xử lý ngay.',
  },
  'renter.bookedStatus': {
    en: 'Booked',
    vi: 'Đã đặt',
  },
  'renter.availableStatus': {
    en: 'Available',
    vi: 'Trống',
  },
  'renter.conflictStatus': {
    en: 'Conflict',
    vi: 'Xung đột',
  },
  'renter.pendingStatus': {
    en: 'Pending',
    vi: 'Chờ duyệt',
  },
  'renter.subleaseRevenueShort': {
    en: 'Est. Revenue',
    vi: 'Doanh thu dự kiến',
  },
  'renter.emptySubleaseFilter': {
    en: 'No matching sublease slots found',
    vi: 'Không tìm thấy slot nào phù hợp',
  },
  'renter.emptySubtenantFilter': {
    en: 'No matching sub-tenants found',
    vi: 'Không tìm thấy người thuê phụ nào phù hợp',
  },

  // Renter Sub-tenants
  'subtenants.totalSubtenants': {
    en: 'Total Sub-tenants',
    vi: 'Tổng khách thuê',
  },
  'subtenants.activeStatusSubtenants': {
    en: 'Active',
    vi: 'Đang hoạt động',
  },
  'subtenants.pendingStatusSubtenants': {
    en: 'Pending approval',
    vi: 'Chờ duyệt',
  },
  'subtenants.revenueEarned': {
    en: 'Earned Revenue',
    vi: 'Doanh thu thu về',
  },
  'subtenants.searchSubtenantPlaceholder': {
    en: 'Search name, phone, or space...',
    vi: 'Tìm theo tên, SĐT, hoặc mặt bằng...',
  },
  'subtenants.allSubtenantsTab': {
    en: 'All',
    vi: 'Tất cả',
  },
  'subtenants.activeSubtenantsTab': {
    en: 'Active',
    vi: 'Đang thuê',
  },
  'subtenants.pendingSubtenantsTab': {
    en: 'Pending Approval',
    vi: 'Yêu cầu chờ duyệt',
  },
  'subtenants.costPaid': {
    en: 'Subleasing Price:',
    vi: 'Chi phí thanh toán:',
  },
  'subtenants.approveLease': {
    en: 'Approve Lease',
    vi: 'Duyệt thuê',
  },
  'subtenants.rejectLease': {
    en: 'Reject',
    vi: 'Từ chối',
  },
  'subtenants.contactLabel': {
    en: 'Contact',
    vi: 'Liên hệ',
  },
  'subtenants.cancelSubleaseSlot': {
    en: 'Cancel Lease',
    vi: 'Hủy slot thuê',
  },
  'subtenants.subtenantRole': {
    en: 'Sub-tenant',
    vi: 'Người thuê phụ',
  },
  'subtenants.confirmCancelLease': {
    en: 'Are you sure you want to cancel the sublease slot for {name}?',
    vi: 'Bạn có chắc chắn muốn hủy slot thuê của {name}?',
  },

  // Sublease Slot Form (modal)
  'subleaseForm.createSubleaseSlot': {
    en: 'Create Sublease Slot',
    vi: 'Tạo Slot Cho Thuê Lại',
  },
  'subleaseForm.subleaseSlotSubtitle': {
    en: 'Declare vacant slots from primary lease to share',
    vi: 'Khai báo slot rảnh từ hợp đồng thuê chính để chia sẻ lại',
  },
  'subleaseForm.primaryContractTitle': {
    en: 'Linked Primary Tenancy Contract (PrimaryBooking Table)',
    vi: 'Hợp đồng thuê chính liên kết (PrimaryBooking Table)',
  },
  'subleaseForm.selectPrimaryContract': {
    en: 'Select Primary Tenancy Contract',
    vi: 'Chọn hợp đồng thuê sơ cấp',
  },
  'subleaseForm.listingSlotDetails': {
    en: 'Listing Slot Details (ListingSlot Table)',
    vi: 'Chi tiết Slot đăng ký (ListingSlot Table)',
  },
  'subleaseForm.formLabelDate': {
    en: 'Leasing Date',
    vi: 'Ngày cho thuê',
  },
  'subleaseForm.formLabelPriceProposed': {
    en: 'Proposed Price (VND/slot)',
    vi: 'Giá đề xuất (đ/slot)',
  },
  'subleaseForm.formLabelStartTime': {
    en: 'Start Time',
    vi: 'Giờ bắt đầu',
  },
  'subleaseForm.formLabelEndTime': {
    en: 'End Time',
    vi: 'Giờ kết thúc',
  },
  'subleaseForm.formLabelSession': {
    en: 'Session',
    vi: 'Buổi',
  },
  'subleaseForm.formLabelSlotType': {
    en: 'Slot Lease Type',
    vi: 'Loại slot cho thuê',
  },
  'subleaseForm.sessionMorning': {
    en: 'Morning',
    vi: 'Sáng',
  },
  'subleaseForm.sessionAfternoon': {
    en: 'Afternoon',
    vi: 'Chiều',
  },
  'subleaseForm.sessionEvening': {
    en: 'Evening',
    vi: 'Tối',
  },
  'subleaseForm.sessionFullDay': {
    en: 'Full Day',
    vi: 'Cả ngày',
  },
  'subleaseForm.slotTypeFixed': {
    en: 'Fixed',
    vi: 'Cố định',
  },
  'subleaseForm.slotTypeFlexible': {
    en: 'Flexible',
    vi: 'Linh hoạt',
  },
  'subleaseForm.subleaseAIBanner': {
    en: 'AI engine automatically reviews schedule conflicts against primary tenancy.',
    vi: 'Hệ thống AI sẽ tự động kiểm duyệt xung đột lịch trình so với lịch thuê gốc.',
  },
  'subleaseForm.createSubleaseSlotBtn': {
    en: 'Create Sublease Slot',
    vi: 'Tạo slot cho thuê lại',
  },
  'subleaseForm.fillAllFieldsGeneric': {
    en: 'Please fill in all required information!',
    vi: 'Vui lòng điền đầy đủ các thông tin!',
  },

  // Sub-booking Form (modal)
  'subbookingForm.subBookingTitle': {
    en: 'Book Secondary Slot (SubBooking)',
    vi: 'Đặt lịch Slot thứ cấp (SubBooking)',
  },
  'subbookingForm.subBookingSubtitle': {
    en: 'Simulated subtenant action for booking and paying for vacant slot',
    vi: 'Mô phỏng thao tác của Người thuê phụ đặt và thanh toán slot trống',
  },
  'subbookingForm.formSectionBookingTime': {
    en: '1. Rental Time Slot (BookingTime Table)',
    vi: '1. Khung giờ thuê (BookingTime Table)',
  },
  'subbookingForm.formLabelBookingDate': {
    en: 'Rental Date:',
    vi: 'Ngày thuê:',
  },
  'subbookingForm.formLabelBookingTime': {
    en: 'Time:',
    vi: 'Thời gian:',
  },
  'subbookingForm.formLabelBookingPrice': {
    en: 'Rental Price:',
    vi: 'Giá thuê:',
  },
  'subbookingForm.formSectionSubBooking': {
    en: '2. Booker Information (SubBooking Table)',
    vi: '2. Thông tin người đặt (SubBooking Table)',
  },
  'subbookingForm.formLabelTenantFullName': {
    en: 'Full Name of Subtenant',
    vi: 'Họ và tên người thuê phụ',
  },
  'subbookingForm.formPlaceholderTenantFullName': {
    en: 'e.g., Nguyen Van Hai',
    vi: 'Ví dụ: Nguyễn Văn Hải',
  },
  'subbookingForm.formSectionTransaction': {
    en: '3. Payment & Transactions (Transaction Table)',
    vi: '3. Thanh toán & Giao dịch (Transaction Table)',
  },
  'subbookingForm.formLabelPaymentMethod': {
    en: 'Payment Method',
    vi: 'Phương thức thanh toán',
  },
  'subbookingForm.formPaymentVNPay': {
    en: 'VNPay Gateway (Local Bank Card)',
    vi: 'Cổng VNPay (Thẻ ngân hàng nội địa)',
  },
  'subbookingForm.formPaymentMoMo': {
    en: 'MoMo E-Wallet',
    vi: 'Ví điện tử MoMo',
  },
  'subbookingForm.formPaymentStripe': {
    en: 'Stripe Gateway (International Credit Card)',
    vi: 'Cổng Stripe (Thẻ tín dụng Quốc tế)',
  },
  'subbookingForm.formPaymentWallet': {
    en: 'EtherSpace Account Wallet',
    vi: 'Ví tài khoản EtherSpace',
  },
  'subbookingForm.formTransactionBanner': {
    en: 'System automatically generates transaction code and electronic VAT invoice upon payment.',
    vi: 'Hệ thống sẽ tạo mã giao dịch tự động và xuất hóa đơn VAT điện tử ngay khi thanh toán.',
  },
  'subbookingForm.formConfirmPayment': {
    en: 'Confirm & Pay',
    vi: 'Xác nhận & Thanh toán',
  },
  'subbookingForm.formTenantNameAlert': {
    en: 'Please input the sub-tenant name!',
    vi: 'Vui lòng nhập tên người thuê phụ!',
  },

  // Amenities & Categories
  'amenity.wifi': { en: 'High-speed Wifi', vi: 'Wifi Tốc độ cao' },
  'amenity.ac': { en: 'Air conditioning', vi: 'Điều hòa nhiệt độ' },
  'amenity.parking': { en: 'Free Parking', vi: 'Bãi đỗ xe miễn phí' },
  'amenity.wc': { en: 'Private Toilet', vi: 'Nhà vệ sinh riêng' },
  'amenity.projector': { en: 'Projector / TV', vi: 'Máy chiếu / Tivi' },
  'amenity.sound': { en: 'Sound System', vi: 'Hệ thống âm thanh' },
  'category.retail': { en: 'Retail Store', vi: 'Cửa hàng bán lẻ' },
  'category.cafe': { en: 'Cafe / F&B', vi: 'Quán cà phê / F&B' },
  'category.office': { en: 'Small Office / Co-working', vi: 'Văn phòng nhỏ / Co-working' },
  'category.kiosk': { en: 'Food Kiosk', vi: 'Ki-ốt ẩm thực' },

  // Sublease Listings
  'subleaseListings.totalSlots': {
    en: 'Total Slots Published',
    vi: 'Tổng slot đã đăng',
  },
  'subleaseListings.booked': {
    en: 'Booked',
    vi: 'Đã đặt',
  },
  'subleaseListings.vacant': {
    en: 'Vacant',
    vi: 'Còn trống',
  },
  'subleaseListings.estRevenue': {
    en: 'Est. Revenue',
    vi: 'Doanh thu dự kiến',
  },
  'subleaseListings.searchPlaceholder': {
    en: 'Search slot, description...',
    vi: 'Tìm kiếm slot, mô tả...',
  },
  'subleaseListings.tableSpaceTime': {
    en: 'Space & Time',
    vi: 'Mặt bằng & Thời gian',
  },
  'subleaseListings.tablePrice': {
    en: 'Slot Price',
    vi: 'Giá slot',
  },
  'subleaseListings.tableViews': {
    en: 'Views',
    vi: 'Lượt xem',
  },
  'subleaseListings.tableInquiries': {
    en: 'Inquiries',
    vi: 'Số yêu cầu',
  },
  'subleaseListings.tableSubTenant': {
    en: 'Sub-tenant',
    vi: 'Người thuê phụ',
  },
  'subleaseListings.tableStatus': {
    en: 'Status',
    vi: 'Trạng thái',
  },
  'subleaseListings.tableActions': {
    en: 'Actions',
    vi: 'Thao tác',
  },
  'subleaseListings.desc1': {
    en: 'Morning lease, suitable for online sales, breakfast.',
    vi: 'Thuê theo buổi sáng, phù hợp bán hàng online, ăn sáng.',
  },
  'subleaseListings.desc2': {
    en: 'Afternoon lease, great location with front street access.',
    vi: 'Thuê theo buổi chiều, vị trí đẹp mặt tiền đường lớn.',
  },
  'subleaseListings.desc3': {
    en: 'Morning slot available, discount price.',
    vi: 'Slot buổi sáng còn trống, giá ưu đãi.',
  },
  'subleaseListings.desc4': {
    en: 'Waiting for confirmation from sub-tenant.',
    vi: 'Đang chờ xác nhận từ người thuê phụ.',
  },
  'subleaseListings.desc5': {
    en: 'Morning slot available on May 30.',
    vi: 'Slot buổi sáng còn trống ngày 30/05.',
  },
  'subleaseListings.desc6': {
    en: 'Full day slot expired.',
    vi: 'Slot cả ngày đã hết hạn.',
  },
  'subleaseListings.leLoiSpace': {
    en: 'Le Loi Dist 1 Space',
    vi: 'Mặt bằng Lê Lợi Q1',
  },
  'common.view': {
    en: 'View',
    vi: 'Xem',
  },
  'common.edit': {
    en: 'Edit',
    vi: 'Sửa',
  },
  'common.delete': {
    en: 'Delete',
    vi: 'Xóa',
  },

  // Common/Other
  'common.comingSoon': {
    en: 'Coming Soon',
    vi: 'Sắp ra mắt',
  },
  'common.featureUnderDev': {
    en: 'Feature Under Development',
    vi: 'Tính năng đang phát triển',
  },
  'common.featureUnderDevDesc': {
    en: 'This functionality will be updated soon.',
    vi: 'Chức năng này sẽ sớm được cập nhật.',
  },
  'common.vietnamese': {
    en: 'Vietnamese',
    vi: 'Tiếng Việt',
  },
  'common.english': {
    en: 'English',
    vi: 'Tiếng Anh',
  },
  'common.themeLight': {
    en: 'Light Theme',
    vi: 'Giao diện Sáng',
  },
  'common.themeDark': {
    en: 'Dark Theme',
    vi: 'Giao diện Tối',
  },
  // Auth Page
  'auth.title': { en: 'EtherSpace Console', vi: 'Bảng Điều Khiển EtherSpace' },
  'auth.subtitle': { en: 'Secure Access Gateway', vi: 'Cổng Kết Nối Hệ Thống Bảo Mật' },
  'auth.loginTab': { en: 'LOGIN', vi: 'ĐĂNG NHẬP' },
  'auth.registerTab': { en: 'REGISTER', vi: 'ĐĂNG KÝ' },
  'auth.emailLabel': { en: 'EMAIL ADDRESS', vi: 'ĐỊA CHỈ EMAIL' },
  'auth.emailPlaceholder': { en: 'e.g., operator@etherspace.io', vi: 'Ví dụ: operator@etherspace.io' },
  'auth.passwordLabel': { en: 'PASSWORD', vi: 'MẬT KHẨU' },
  'auth.passwordPlaceholder': { en: 'Enter credentials', vi: 'Nhập mật khẩu' },
  'auth.confirmPasswordLabel': { en: 'CONFIRM PASSWORD', vi: 'XÁC NHẬN MẬT KHẨU' },
  'auth.confirmPasswordPlaceholder': { en: 'Re-type password', vi: 'Nhập lại mật khẩu' },
  'auth.roleLabel': { en: 'SYSTEM NODE ROLE', vi: 'VAI TRÒ NÚT HỆ THỐNG' },
  'auth.submitLogin': { en: 'Login', vi: 'Đăng Nhập' },
  'auth.submitRegister': { en: 'Register', vi: 'Đăng Ký' },
  'auth.orDivider': { en: 'OR', vi: 'HOẶC' },
  'auth.googleLogin': { en: 'Continue with Google', vi: 'Tiếp tục với Google' },
  'auth.googleRegister': { en: 'Sign up with Google', vi: 'Đăng ký với Google' },
  'auth.switchRegisterText': { en: 'Need an access node? Register here', vi: 'Cần tạo tài khoản? Đăng ký tại đây' },
  'auth.switchLoginText': { en: 'Already have a node? Login here', vi: 'Đã có tài khoản? Đăng nhập tại đây' },
  'auth.validationFill': { en: 'Please fill all credential fields!', vi: 'Vui lòng điền đầy đủ thông tin!' },
  'auth.validationMatch': { en: 'Passwords do not match!', vi: 'Mật khẩu xác nhận không trùng khớp!' },
  'auth.simulating': { en: 'ESTABLISHING SECURE CONNECTION...', vi: 'ĐANG THIẾT LẬP KẾT NỐI BẢO MẬT...' },
  'auth.loadingWallet': { en: 'SYNCING ESCROW WALLET SEGMENTS...', vi: 'ĐANG ĐỒNG BỘ LUỒNG VÍ KÝ QUỸ...' },
  'auth.authorized': { en: 'SESSION AUTHORIZED. REDIRECTING...', vi: 'PHIÊN TRUY CẬP HỢP LỆ. ĐANG CHUYỂN HƯỚNG...' },
};

interface ThemeLanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  toggleTheme: () => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const ThemeLanguageContext = createContext<ThemeLanguageContextType | undefined>(undefined);

export const ThemeLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'vi';
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as Theme) || 'dark';
  });

  useEffect(() => {
    // Sync theme class to html/body elements
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.remove('light-theme');
      root.setAttribute('data-theme', 'dark');
    }
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app-language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const t = (key: string, replacements?: Record<string, string | number>): string => {
    const item = translations[key];
    if (!item) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    let val = item[language];
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, String(v));
      });
    }
    return val;
  };

  return (
    <ThemeLanguageContext.Provider value={{ language, setLanguage, theme, toggleTheme, t }}>
      {children}
    </ThemeLanguageContext.Provider>
  );
};

export const useThemeLanguage = () => {
  const context = useContext(ThemeLanguageContext);
  if (context === undefined) {
    throw new Error('useThemeLanguage must be used within a ThemeLanguageProvider');
  }
  return context;
};
