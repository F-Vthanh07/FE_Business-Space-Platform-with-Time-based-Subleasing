// src/features/homepage/components/homeData.ts

export const mockListings = [
  { 
    id: 'FS1', 
    name: 'Cho Thuê Mặt Bằng Kinh Doanh Đường Lê Lợi, Quận 1', 
    loc: 'Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM', 
    area: '65 m²', 
    type: 'Mặt bằng',
    tags: ['Concept Store', 'Showroom'], 
    price: '45.000.000',
    period: 'đ/tháng',
    description: 'Mặt bằng trống suốt 1 trệt 1 lầu, mặt tiền 5m cực đẹp ngay phố đi bộ. Lề đường rộng rãi để xe thoải mái. Thích hợp mở showroom, quán cafe thương hiệu lớn, thời trang cao cấp. Bàn giao ngay trong tuần.',
    images: [
      'https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=300&q=80'
    ],
    agent: { name: 'Châu Chế Minh Thành', posted: 'Đăng 2 giờ trước', phone: '0938 774 ***', avatar: 'C' }
  },
  { 
    id: 'AR2', 
    name: 'Mặt Bằng Thảo Điền Cực Chill Làm Art Gallery', 
    loc: 'Nguyễn Văn Hưởng, Thảo Điền, Quận 2, TP.HCM', 
    area: '45 m²', 
    type: 'Mặt bằng',
    tags: ['Art Gallery', 'Workshop'], 
    price: '38.000.000',
    period: 'đ/tháng',
    description: 'Khu vực tập trung nhiều expat, thiết kế cửa kính full trần. Có sẵn hệ thống đèn tracklight chiếu tranh, sàn gỗ cao cấp. Thích hợp làm studio, gallery hoặc văn phòng sáng tạo.',
    images: [
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&w=300&q=80'
    ],
    agent: { name: 'Lê Văn Tú', posted: 'Đăng 1 ngày trước', phone: '0815 777 ***', avatar: 'T' }
  },
  { 
    id: 'TC3', 
    name: 'Cho Thuê Kiosk Ngay Chợ Đêm Gò Vấp Dân Cư Đông Đúc', 
    loc: 'Quang Trung, P.10, Gò Vấp, TP.HCM', 
    area: '15 m²', 
    type: 'Kiot',
    tags: ['F&B', 'Takeaway'], 
    price: '12.000.000',
    period: 'đ/tháng',
    description: 'Kiosk đã setup sẵn quầy pha chế inox, bồn rửa, hệ thống thoát nước chuẩn F&B. Khu vực cổng chính chợ đêm siêu đông khách. Phù hợp bán trà sữa, đồ ăn vặt. Hợp đồng dài hạn.',
    images: [
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=300&q=80'
    ],
    agent: { name: 'Nguyễn Phúc Điền', posted: 'Đăng 3 ngày trước', phone: '0902 668 ***', avatar: 'Đ' }
  },
  { 
    id: 'PN4', 
    name: 'Văn Phòng Nhỏ Xinh Phan Xích Long Phú Nhuận', 
    loc: 'Phan Xích Long, Phú Nhuận, TP.HCM', 
    area: '35 m²', 
    type: 'Văn phòng',
    tags: ['Office', 'Studio'], 
    price: '8.500.000',
    period: 'đ/tháng',
    description: 'Nằm trong tòa nhà văn phòng hiện đại, có thang máy, bảo vệ 24/7. Phòng góc 2 mặt kính sáng sủa, view nhìn ra khu Phan Xích Long sầm uất. Bao phí quản lý và tiền nước.',
    images: [
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=80'
    ],
    agent: { name: 'Trần Công Thành', posted: 'Đăng 1 tuần trước', phone: '0912 345 ***', avatar: 'T' }
  },
  { 
    id: 'Q75', 
    name: 'Shophouse Scenic Valley View Sông Siêu Đẹp', 
    loc: 'Tôn Dật Tiên, Tân Phú, Quận 7, TP.HCM', 
    area: '120 m²', 
    type: 'Shophouse',
    tags: ['Premium', 'F&B'], 
    price: '85.000.000',
    period: 'đ/tháng',
    description: 'Shophouse lô góc 2 mặt tiền, view trực diện hồ Bán Nguyệt. Trần cao 6m có thể làm lửng. Nằm trong khu chung cư cao cấp Scenic Valley, tệp khách hàng sẵn có thu nhập cao. Bàn giao thô.',
    images: [
      'https://images.unsplash.com/photo-1556761175-5973dc0f32b7?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&w=300&q=80'
    ],
    agent: { name: 'Ms Lê Hương', posted: 'Đăng hôm nay', phone: '0988 111 ***', avatar: 'H' }
  },
  { 
    id: 'BT6', 
    name: 'Mặt Tiền Bình Thạnh Dân Cư Qua Lại Tấp Nập', 
    loc: 'Bạch Đằng, Phường 15, Bình Thạnh, TP.HCM', 
    area: '50 m²', 
    type: 'Mặt bằng',
    tags: ['Retail', 'High Traffic'], 
    price: '22.000.000',
    period: 'đ/tháng',
    description: 'Nhà cấp 4 nguyên căn mặt tiền đường Bạch Đằng, lề đường 3m. Tuyến đường huyết mạch nối Quận 1 và Thủ Đức. Nhà mới sửa chữa, hệ thống điện nước mới 100%. Nhận nhà kinh doanh ngay.',
    images: [
      'https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=300&q=80'
    ],
    agent: { name: 'Ngọc Thúy', posted: 'Đăng 4 ngày trước', phone: '0977 222 ***', avatar: 'T' }
  }
];