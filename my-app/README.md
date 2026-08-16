# FlexiSpace — Web Frontend

Frontend (Web Admin & User Portal) của **FlexiSpace** — Nền tảng chia sẻ và cho thuê lại mặt bằng kinh doanh theo khung thời gian có tích hợp AI (*AI-powered Shared Business Space Platform with Time-based Subleasing*).

Ứng dụng phục vụ 3 vai trò chính: **Admin** (duyệt tin đăng, quản trị hệ thống), **Space Owner** (đăng mặt bằng, quản lý hợp đồng) và **Renter** (Primary/Secondary Renter — tìm kiếm, đặt lịch, cho thuê lại theo khung giờ).

---

## Tech Stack

| Nhóm | Công nghệ |
|---|---|
| Core | React 19, TypeScript, Vite |
| Routing | React Router DOM v7 |
| Forms & Validation | React Hook Form |
| Realtime | Microsoft SignalR (chat, thông báo) |
| Animation / UI | Framer Motion, GSAP, React Joyride, Lucide React, React Icons |
| Bản đồ & vị trí | MapLibre GL, React Map GL, Leaflet, React Leaflet |
| Canvas / xử lý ảnh | Konva, React Konva, React Dropzone |
| Biểu đồ | Recharts |
| Chống bot | Cloudflare Turnstile (`@marsidev/react-turnstile`) |
| Quét mã | `@zxing/browser`, `@zxing/library` |
| Khác | date-fns, react-hot-toast |
| Lint | ESLint + typescript-eslint |
| Deploy | Vercel |

Backend là .NET Core Web API (xem chi tiết endpoint tại `.claude/rules/api-reference.md`).

---

## Yêu cầu môi trường

- Node.js `>= 20`
- npm `>= 10`

---

## Cài đặt & chạy dự án

```bash
# 1. Cài dependencies
npm install

# 2. Tạo file môi trường
cp .env.example .env
```

Cấu hình `.env`:

```bash
# Local backend (dotnet run)
VITE_API_BASE_URL=https://localhost:7069

# Hoặc backend đã deploy
VITE_API_BASE_URL=https://flexi-space-capstone-project.onrender.com
```

```bash
# 3. Chạy dev server (mặc định http://localhost:5173)
npm run dev
```

### Các lệnh khác

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy dev server với HMR |
| `npm run build` | Type-check (`tsc -b`) và build production vào `dist/` |
| `npm run preview` | Chạy thử bản build production |
| `npm run lint` | Kiểm tra lỗi ESLint |

---

## Cấu trúc thư mục

Dự án tuân thủ **Feature-Driven Architecture** (chi tiết: `.claude/rules/architecture.md`). Không được làm phẳng cấu trúc — mọi logic riêng của một domain phải nằm trong `src/features/<feature-name>/`.

```text
src/
├── assets/            # Ảnh, icon, CSS/SCSS dùng chung
├── components/        # UI dùng chung toàn app (Header, MeshBackground, FloatingChat,...)
├── config/            # Cấu hình hệ thống, validate biến môi trường
├── context/           # React Context dùng chung (auth, theme,...)
├── features/          # CORE: Các module theo domain nghiệp vụ
│   ├── admin-dashboard/
│   ├── ai-image-editor/
│   ├── auth/                 # Login, Register, Forgot Password
│   ├── feed/                 # Listing feed, chi tiết bài đăng, hồ sơ công khai
│   ├── homepage/
│   ├── identity-verification/
│   ├── onboarding/
│   ├── shared/
│   ├── user-dashboard/       # Dashboard gộp Space Owner + Renter
│   └── wallet/                # Ví, kết quả thanh toán
├── routes/             # Định nghĩa ROUTES, ProtectedRoute
├── utils/              # Hàm tiện ích dùng chung
├── App.tsx             # Root component (Routes, Providers)
└── main.tsx            # Entry point
```

Mỗi feature nên có cấu trúc con: `api/`, `components/`, `hooks/`, `types/`, `utils/` và export công khai qua `index.ts` (Barrel pattern).

---

## Định tuyến & phân quyền

- Toàn bộ path được định nghĩa tập trung tại `src/routes/routes.ts` (hằng số `ROUTES`), tránh hardcode chuỗi path trong component.
- `ProtectedRoute` (`src/routes/ProtectedRoute.tsx`) kiểm soát truy cập theo `PortalRole`: `"admin"` hoặc `"user"`.
- Người dùng chưa chọn vai trò hoặc truy cập sai khu vực sẽ được điều hướng về `ROUTES.ACCESS_DENIED` / `ROUTES.HOME`.

| Route | Khu vực | Bảo vệ |
|---|---|---|
| `/` | Homepage | Public |
| `/feed`, `/listing/:id`, `/profile/:userId` | Duyệt bài đăng | Public |
| `/login`, `/register`, `/forgot-password` | Xác thực | Public |
| `/onboarding/profile` | Hoàn tất hồ sơ sau đăng ký | Public (post-register) |
| `/user/*` | Space Owner + Renter Dashboard | `role: user` |
| `/admin/*` | Admin Dashboard | `role: admin` |
| `/payment/success`, `/payment/failed` | Kết quả thanh toán | `role: user` |

---

## Quy ước code

- **API reference:** Mọi field, type, enum khi gọi API phải tham chiếu đúng theo `.claude/rules/api-reference.md` (bao gồm các typo cố ý như `bussinessCategoryId`).
- **Design system:** Giao diện tuân theo Dark Glassmorphism / Soft Neumorphism, không dùng icon/emoji trang trí — xem `.claude/rules/design.md`.
- **Database schema:** Tham chiếu `.claude/rules/database.md` khi làm việc với dữ liệu liên quan đến booking, listing, contract.

---

## Quy trình Git

- Luôn tạo nhánh mới từ `main` trước khi phát triển tính năng.
- Đặt tên nhánh theo format: `feature/ten-tinh-nang`, `bugfix/loi-can-sua`.
- Test local trước khi tạo Pull Request.

---

## Triển khai (Deployment)

Dự án được deploy trên **Vercel**, cấu hình rewrite SPA tại `vercel.json` (mọi route trả về `index.html`).
