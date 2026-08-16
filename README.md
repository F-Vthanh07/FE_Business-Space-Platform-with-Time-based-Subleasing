# FlexiSpace — Business Space Platform with Time-based Subleasing

**Nền tảng chia sẻ và cho thuê lại mặt bằng kinh doanh theo khung thời gian có tích hợp AI**
*(AI-powered Shared Business Space Platform with Time-based Subleasing)*

Đồ án tốt nghiệp (Capstone Project) xây dựng nền tảng kết nối chủ mặt bằng, người thuê sơ cấp và người thuê thứ cấp — cho phép chia sẻ, cho thuê lại mặt bằng kinh doanh linh hoạt theo khung giờ (time slots), tối ưu tài nguyên và hỗ trợ khởi nghiệp quy mô nhỏ.

---

## Bối cảnh

- Mô hình kinh doanh nhỏ, linh hoạt (bán hàng online, dịch vụ cá nhân, ăn uống, bán lẻ ngắn hạn) ngày càng phổ biến, nhưng chi phí thuê mặt bằng cao và hợp đồng dài hạn là rào cản lớn.
- Nhiều mặt bằng (quán cà phê, cửa hàng bán lẻ, ki-ốt) chưa được khai thác hết công suất ở một số khung giờ nhất định, gây lãng phí.
- FlexiSpace kết nối cung — cầu theo khung giờ, giúp tối ưu hoá tài nguyên mặt bằng và giảm rào cản gia nhập cho người kinh doanh nhỏ.

---

## Vai trò hệ thống (System Roles)

| Vai trò | Mô tả |
|---|---|
| **Admin** | Quản lý người dùng, duyệt tin đăng, đối soát giao dịch |
| **Space Owner** | Đăng ký mặt bằng, cấu hình giá, khung giờ và quyền cho thuê lại |
| **Primary Renter** | Thuê từ chủ mặt bằng, chia nhỏ thời gian và cho thuê lại các khung giờ không sử dụng |
| **Secondary Renter** | Thuê lại ngắn hạn các khung giờ trống được chia sẻ lại |
| **AI Assistant** | Gợi ý mặt bằng, dự đoán nhu cầu, đề xuất định giá động và phân tích |

---

## Luồng nghiệp vụ cốt lõi (Core Flows)

1. **Đăng tải và quản lý mặt bằng** — Space Owner tạo/quản lý mặt bằng; Admin kiểm duyệt trước khi hiển thị.
2. **Thuê mặt bằng sơ cấp** — Primary Renter tìm kiếm, đặt lịch và thanh toán để tạo primary booking.
3. **Cho thuê lại theo khung thời gian (Subleasing)** — Primary Renter chia nhỏ thời gian đã thuê thành các slot để cho thuê lại.
4. **Thuê mặt bằng thứ cấp** — Secondary Renter đặt lịch các khung giờ trống được chia sẻ.
5. **Thanh toán & Hóa đơn** — Thanh toán trực tuyến, xuất hóa đơn tự động, chia sẻ doanh thu giữa các bên.
6. **Quản lý lịch trình & Xử lý xung đột** — Tự động kiểm tra, ngăn chặn xung đột lịch đặt nhiều cấp độ.
7. **Phân tích & Báo cáo** — Dashboard doanh thu, tỷ lệ lấp đầy (occupancy rate), xu hướng sử dụng.

Chi tiết đầy đủ: [`.claude/CLAUDE.md`](.claude/CLAUDE.md)

---

## Cấu trúc Repository

```text
.
├── .claude/            # Tài liệu bối cảnh dự án & rule cho AI assistant
│   ├── CLAUDE.md            # Tổng quan dự án, nghiệp vụ, vai trò
│   └── rules/
│       ├── api-reference.md   # API contract (endpoints, DTOs, enums)
│       ├── architecture.md    # Kiến trúc Frontend (Feature-Driven)
│       ├── database.md        # Sơ đồ cơ sở dữ liệu (ERD)
│       ├── design.md          # Design system (Dark Glassmorphism)
│       ├── tech-defaults.md   # Tech stack mặc định toàn dự án
│       └── workflow.md        # Quy trình Git & Code Review
└── my-app/             # Web Frontend (React + TypeScript + Vite)
```

---

## Tech Stack tổng quan

| Thành phần | Công nghệ |
|---|---|
| Mobile App (Renters) | Flutter |
| Web Frontend (Owner/Admin) | React, TypeScript, Vite — xem [`my-app/`](my-app) |
| Backend API | .NET Core Web API |
| Database | PostgreSQL / MySQL / Firebase |
| AI Integration | OpenAI API, Recommendation Models, Time-series Prediction |
| Bản đồ & vị trí | Google Maps API / Mapbox |
| Thanh toán | VNPay / Stripe |
| Hosting | Microsoft Azure / Firebase / Vercel |

Chi tiết: [`.claude/rules/tech-defaults.md`](.claude/rules/tech-defaults.md)

---

## Bắt đầu nhanh (Frontend)

```bash
cd my-app
npm install
cp .env.example .env
npm run dev
```

Hướng dẫn cài đặt, cấu trúc thư mục và quy ước code đầy đủ: **[my-app/README.md](my-app/README.md)**

---

## Quy trình Git

- Luôn tạo nhánh mới từ `main` trước khi phát triển tính năng.
- Đặt tên nhánh theo format: `feature/ten-tinh-nang`, `bugfix/loi-can-sua`.
- Test local trước khi tạo Pull Request.

Chi tiết: [`.claude/rules/workflow.md`](.claude/rules/workflow.md)

---

## Yêu cầu phi chức năng

- Giao diện song ngữ: Tiếng Anh và Tiếng Việt.
- Thời gian phản hồi trung bình dưới 3 giây.
- Xác thực bảo mật bằng JWT.
- Lưu trữ và hosting trên đám mây (Firebase / Microsoft Azure).
- Thiết kế Modular: tách biệt Web và Mobile.
