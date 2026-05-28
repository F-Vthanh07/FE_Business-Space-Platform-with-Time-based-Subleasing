# Frontend Architecture & AI Coding Guidelines

## 1. Triết lý cốt lõi (Core Philosophy)
Dự án này tuân thủ nghiêm ngặt mô hình **Kiến trúc hướng tính năng (Feature-Driven Architecture)** (lấy cảm hứng từ Feature-Sliced Design). Mục tiêu nhằm tối đa hóa khả năng bảo trì, khả năng mở rộng và gom cụm mã nguồn theo tính năng (code colocation).

**Hướng dẫn dành cho AI (AI Instructions):**
- KHÔNG BAO GIỜ làm phẳng cấu trúc thư mục (flat structure).
- LUÔN LUÔN đặt logic cụ thể của từng domain bên trong thư mục `src/features/`.
- Các trang (Pages) phải giữ ở mức tối giản (chỉ đóng vai trò là Điều phối viên - Orchestrators).
- Thực thi ranh giới nghiêm ngặt giữa các thành phần bằng cách sử dụng mẫu Barrel (`index.ts`).

---

## 2. Cấu trúc cây thư mục (Directory Tree Structure)

```text
src/
├── assets/             # Static assets (images, vectors, global CSS/SCSS)
├── components/         # Global Shared UI (Dumb/Presentational components ONLY)
├── config/             # Environment validation, system-wide configurations
├── features/           # CORE: Domain-driven modules
│   ├── [feature-name]/ # e.g., auth, users, products, dashboard
│   │   ├── api/        # API calls specific to this feature
│   │   ├── components/ # Feature-scoped UI components
│   │   ├── hooks/      # Feature-scoped custom hooks (Business logic)
│   │   ├── types/      # Feature-scoped TypeScript definitions
│   │   ├── utils/      # Feature-scoped helper functions
│   │   └── index.ts    # PUBLIC API: Export ONLY what is needed outside
├── hooks/              # Global custom hooks (e.g., useTheme, useWindowSize)
├── layouts/            # Page layouts (e.g., MainLayout, AuthLayout)
├── lib/                # 3rd-party library configurations (Axios instance, QueryClient)
├── pages/              # Route components (Grouped by domain)
│   ├── [domain]/       # e.g., auth/LoginPage.tsx, dashboard/OverviewPage.tsx
│   └── index.ts        # Barrel export for router consumption
├── routes/             # Routing configuration (React Router / Lazy loading)
├── store/              # Global Client State (Zustand/Redux) - UI state ONLY
├── types/              # Global TypeScript definitions (e.g., BaseApiResponse)
├── utils/              # Global pure helper functions (Formatters, Regex)
├── App.tsx             # Root Component (Providers, Error Boundaries)
└── main.tsx            # DOM Entry Point
```
