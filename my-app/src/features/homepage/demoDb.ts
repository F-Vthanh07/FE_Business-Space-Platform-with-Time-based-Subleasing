export interface MockSlot {
  time: string;
  nameEn: string;
  nameVi: string;
  status: 'booked' | 'available' | 'conflict';
  descEn: string;
  descVi: string;
  priceEn: string;
  priceVi: string;
  badgeEn: string;
  badgeVi: string;
}

export interface MockVenue {
  id: string;
  nameEn: string;
  nameVi: string;
  locationEn: string;
  locationVi: string;
  typeEn: string;
  typeVi: string;
  category: 'fashion' | 'cafe' | 'art' | 'tech';
  area: string;
  occupancy: string;
  priceEn: string;
  priceVi: string;
  icon: string;
  morningShiftEn: string;
  morningShiftVi: string;
  eveningShiftEn: string;
  eveningShiftVi: string;
  slots: MockSlot[];
}

export const mockVenues: MockVenue[] = [
  {
    id: 'd1-fashion',
    nameEn: 'District 1 Retail Hub',
    nameVi: 'Không Gian Thời Trang Quận 1',
    locationEn: 'Dong Khoi St, District 1, HCMC',
    locationVi: 'Đường Đồng Khởi, Quận 1, TP.HCM',
    typeEn: 'Concept Store & Showroom',
    typeVi: 'Cửa hàng ý tưởng & Trưng bày',
    category: 'fashion',
    area: '65 sqm',
    occupancy: '92%',
    priceEn: '450k/hr',
    priceVi: '450k/giờ',
    icon: 'FS',
    morningShiftEn: 'Morning Cafe Slot (08:00-12:00)',
    morningShiftVi: 'Cà phê sáng Pop-up (08:00-12:00)',
    eveningShiftEn: 'Fashion Boutique Slot (13:00-21:00)',
    eveningShiftVi: 'Cửa hàng Thời trang (13:00-21:00)',
    slots: [
      {
        time: '08:00 - 12:00',
        nameEn: 'Morning Specialty Cafe Pop-up',
        nameVi: 'Quầy Cà Phê Đặc Sản Sáng',
        status: 'booked',
        descEn: 'Operated by Sunrise Coffee. High morning foot-traffic and takeaway coffee cup revenues.',
        descVi: 'Đang vận hành bởi Sunrise Coffee. Lượng khách mua mang đi buổi sáng đông đúc và mang lại doanh thu cao.',
        priceEn: '350,000 VND / hr',
        priceVi: '350.000 đ / giờ',
        badgeEn: 'Booked',
        badgeVi: 'Đã thuê'
      },
      {
        time: '13:00 - 17:00',
        nameEn: 'Afternoon Accessories pop-up',
        nameVi: 'Khung Giờ Trưng Bày Phụ Kiện Chiều',
        status: 'available',
        descEn: 'Vacant afternoon slot! Ideal for designer leathergoods, fashion items, and pop-up boutiques.',
        descVi: 'Khung giờ trống! Lý tưởng cho trưng bày túi xách thiết kế, phụ kiện thời trang, hoặc quần áo cao cấp.',
        priceEn: '400,000 VND / hr',
        priceVi: '400.000 đ / giờ',
        badgeEn: 'Available',
        badgeVi: 'Còn trống'
      },
      {
        time: '18:00 - 22:00',
        nameEn: 'Evening Designer Showcase',
        nameVi: 'Studio Trình Diễn Thời Trang Tối',
        status: 'booked',
        descEn: 'Occupied by Noir Threads. Prime evening shopping window with aesthetic product lighting.',
        descVi: 'Được đặt bởi nhãn hàng Noir Threads. Khung giờ mua sắm vàng buổi tối với đèn trang trí bắt mắt.',
        priceEn: '550,000 VND / hr',
        priceVi: '550.000 đ / giờ',
        badgeEn: 'Booked',
        badgeVi: 'Đã thuê'
      }
    ]
  },
  {
    id: 'thaodien-art',
    nameEn: 'Thao Dien Creative Box',
    nameVi: 'Hộp Sáng Tạo Thảo Điền',
    locationEn: 'Nguyen Van Huong St, Thao Dien, District 2, HCMC',
    locationVi: 'Đường Nguyễn Văn Hưởng, Thảo Điền, Quận 2, TP.HCM',
    typeEn: 'Art Gallery & Workshop Hub',
    typeVi: 'Triển lãm & Không gian Workshop',
    category: 'art',
    area: '45 sqm',
    occupancy: '85%',
    priceEn: '380k/hr',
    priceVi: '380k/giờ',
    icon: 'AR',
    morningShiftEn: 'Florist Design Shift (09:00-13:00)',
    morningShiftVi: 'Cắm hoa nghệ thuật (09:00-13:00)',
    eveningShiftEn: 'Oil Painting Workshop (14:00-22:00)',
    eveningShiftVi: 'Lớp học Vẽ tranh dầu (14:00-22:00)',
    slots: [
      {
        time: '08:00 - 12:00',
        nameEn: 'Morning Florist Design Studio',
        nameVi: 'Studio Sáng Tạo Hoa Tươi Sáng',
        status: 'booked',
        descEn: 'Operated by Bloom Flowers. Beautiful light morning atmosphere for custom bouquet designs.',
        descVi: 'Đang hoạt động bởi Bloom Flowers. Không khí sáng sớm ngập tràn ánh nắng tự nhiên thích hợp gói hoa.',
        priceEn: '320,000 VND / hr',
        priceVi: '320.000 đ / giờ',
        badgeEn: 'Booked',
        badgeVi: 'Đã thuê'
      },
      {
        time: '13:00 - 17:00',
        nameEn: 'Afternoon Oil Painting Workshop',
        nameVi: 'Lớp Học Vẽ Tranh Sơn Dầu Chiều',
        status: 'booked',
        descEn: 'Hosted by Creative Guild. Interactive group workshops focusing on visual painting.',
        descVi: 'Tổ chức bởi Câu lạc bộ Mỹ thuật. Buổi workshop nhóm hướng dẫn vẽ tranh nghệ thuật.',
        priceEn: '380,000 VND / hr',
        priceVi: '380.000 đ / giờ',
        badgeEn: 'Booked',
        badgeVi: 'Đã thuê'
      },
      {
        time: '18:00 - 22:00',
        nameEn: 'Evening Acoustic / Poetry slot',
        nameVi: 'Khung Giờ Đêm Nhạc Acoustic / Đọc Thơ',
        status: 'available',
        descEn: 'Vacant evening slot! Perfect for local acoustic acts, poetry gatherings, or small private workshops.',
        descVi: 'Khung giờ trống buổi tối! Phù hợp cho biểu diễn ca nhạc acoustic nhỏ, các buổi ngâm thơ, họp mặt câu lạc bộ.',
        priceEn: '450,000 VND / hr',
        priceVi: '450.000 đ / giờ',
        badgeEn: 'Available',
        badgeVi: 'Còn trống'
      }
    ]
  },
  {
    id: 'leloi-showroom',
    nameEn: 'Le Loi Smart Showroom',
    nameVi: 'Showroom Cao Cấp Lê Lợi',
    locationEn: 'Le Loi Blvd, District 1, HCMC',
    locationVi: 'Đại lộ Lê Lợi, Quận 1, TP.HCM',
    typeEn: 'Interactive Product Lounge',
    typeVi: 'Showroom Công nghệ & Trải nghiệm',
    category: 'tech',
    area: '80 sqm',
    occupancy: '95%',
    priceEn: '600k/hr',
    priceVi: '600k/giờ',
    icon: 'TC',
    morningShiftEn: 'Gadget Showcase Shift (08:00-13:00)',
    morningShiftVi: 'Trưng bày Công nghệ (08:00-13:00)',
    eveningShiftEn: 'Networking Product Launch (14:00-21:00)',
    eveningShiftVi: 'Sự kiện Giao lưu & Ra mắt (14:00-21:00)',
    slots: [
      {
        time: '08:00 - 12:00',
        nameEn: 'Morning Smart Gadgets Expo',
        nameVi: 'Khung Giờ Trải Nghiệm Thiết Bị Số Sáng',
        status: 'available',
        descEn: 'Vacant morning slot! Configured for visual technology setups, phone launchers, or VR experiences.',
        descVi: 'Khung giờ trống buổi sáng! Đã bố trí tủ kính trưng bày và máy chiếu công nghệ cao, lý tưởng cho pop-up VR.',
        priceEn: '500,000 VND / hr',
        priceVi: '500.000 đ / giờ',
        badgeEn: 'Available',
        badgeVi: 'Còn trống'
      },
      {
        time: '13:00 - 17:00',
        nameEn: 'Afternoon Accessories Hub',
        nameVi: 'Quầy Trưng Bày Phụ Kiện Thông Minh',
        status: 'booked',
        descEn: 'Operated by AlphaTech. Showcasing premium mechanical keyboards and computer peripherals.',
        descVi: 'Đang vận hành bởi AlphaTech. Nơi giới thiệu bàn phím cơ cao cấp và thiết bị công nghệ hỗ trợ làm việc.',
        priceEn: '580,000 VND / hr',
        priceVi: '580.000 đ / giờ',
        badgeEn: 'Booked',
        badgeVi: 'Đã thuê'
      },
      {
        time: '18:00 - 22:00',
        nameEn: 'Evening Founders Networking',
        nameVi: 'Buổi Giao Lưu Doanh Nghiệp Khởi Nghiệp Tối',
        status: 'booked',
        descEn: 'Hosted by Startup Hub. High-profile panel discussions and technical networking.',
        descVi: 'Tổ chức bởi Startup Hub. Các buổi tọa đàm công nghệ và chia sẻ kinh nghiệm khởi nghiệp.',
        priceEn: '700,000 VND / hr',
        priceVi: '700.000 đ / giờ',
        badgeEn: 'Booked',
        badgeVi: 'Đã thuê'
      }
    ]
  }
];

// Helper để code định dạng type cho currentPricing tránh lỗi TypeScript
export type PricingTier = {
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  btn: string;
  popular: boolean;
};

export const pricingTiers: Record<string, PricingTier[]> = {
  en: [
    {
      name: 'Starter',
      price: 'Free',
      period: 'for trial',
      desc: 'Ideal for trying out the hourly subleasing model.',
      features: [
        'Register up to 1 physical space',
        'Basic hourly calendar scheduler',
        'Manual sub-tenant validation',
        'Standard platform transaction fee (5%)'
      ],
      btn: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Professional',
      price: '1,200,000 VND',
      period: '/ month',
      desc: 'Perfect for primary tenants actively optimizing store hours.',
      features: [
        'Unlimited registered spaces',
        'AI Conflict check & calendar auto-review',
        'Digital contract & automated VAT billing',
        'Reduced platform transaction fee (2.5%)',
        'Priority customer support 24/7'
      ],
      btn: 'Go Pro Now',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom Pricing',
      period: '',
      desc: 'For commercial developers and large-scale coworking chains.',
      features: [
        'Bulk asset API registration',
        'Custom white-label sublease widgets',
        'Escrow custom configurations',
        'Dedicated account manager',
        '0% platform transaction fee options'
      ],
      btn: 'Contact Sales',
      popular: false
    }
  ],
  vi: [
    {
      name: 'Cơ Bản',
      price: 'Miễn Phí',
      period: 'trải nghiệm',
      desc: 'Dành cho việc thử nghiệm mô hình chia sẻ theo giờ.',
      features: [
        'Đăng ký tối đa 1 mặt bằng vật lý',
        'Lịch chia slot theo giờ cơ bản',
        'Kiểm duyệt người thuê thủ công',
        'Phí giao dịch tiêu chuẩn (5%)'
      ],
      btn: 'Bắt Đầu Trải Nghiệm',
      popular: false
    },
    {
      name: 'Chuyên Nghiệp',
      price: '1.200.000 đ',
      period: '/ tháng',
      desc: 'Phù hợp nhất cho Khách thuê chính tối ưu hóa giờ mở cửa.',
      features: [
        'Không giới hạn số lượng mặt bằng',
        'Hệ thống AI tự động rà soát lịch chống xung đột',
        'Hợp đồng số hóa & hóa đơn VAT tự động',
        'Giảm phí giao dịch nền tảng (còn 2.5%)',
        'Hỗ trợ kỹ thuật ưu tiên 24/7'
      ],
      btn: 'Nâng Cấp Pro Ngay',
      popular: true
    },
    {
      name: 'Doanh Nghiệp',
      price: 'Liên Hệ',
      period: '',
      desc: 'Dành cho các chủ đầu tư tòa nhà hoặc chuỗi không gian lớn.',
      features: [
        'Đăng ký hàng loạt mặt bằng qua API',
        'Giao diện Widget cho thuê riêng (White-label)',
        'Tùy chỉnh luồng ví ký quỹ giao dịch',
        'Quản lý tài khoản chuyên trách riêng',
        'Hỗ trợ mức phí giao dịch nền tảng 0%'
      ],
      btn: 'Liên Hệ Đội Ngũ',
      popular: false
    }
  ]
};