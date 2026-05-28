# Mặc định Công nghệ (Tech Defaults)

Tài liệu này quy định các công nghệ, thư viện, quy chuẩn lập trình và cấu trúc mặc định của mã nguồn trong hệ thống EtherDashboard / Capstone Project.

## 1. Công nghệ áp dụng (Applied Technology Stack)

* **Mobile App (Renters & Secondary Users):**
  * Framework: Flutter (hỗ trợ cả Android & iOS)
* **Web Admin (Space Owners & Administrators):**
  * Framework: ReactJS / NextJS / ASP.NET MVC
* **Backend API:**
  * Framework: Node.js (Express) hoặc .NET Core API
* **Database (Cơ sở dữ liệu):**
  * PostgreSQL / MySQL / Firebase
* **AI Integration (Tích hợp Trí tuệ nhân tạo):**
  * OpenAI API, Mô hình Gợi ý (Recommendation Models), Dự báo chuỗi thời gian (Time-series Prediction)
* **Maps & Location Services (Bản đồ & Định vị):**
  * Google Maps API / Mapbox
* **Payment Integration (Tổng thanh toán):**
  * VNPay / Stripe
* **Cloud Deployment & Hosting:**
  * Microsoft Azure / Firebase
* **Version Control (Quản lý phiên bản):**
  * GitHub

## 2. Tiêu chuẩn và Kiến trúc (Architecture & Coding Standards)

* **Thiết kế Modular (Modular Design):** Tách biệt rõ ràng giữa Web Admin và Mobile App để đảm bảo khả năng mở rộng (scalability) và bảo mật (security).
* **Bảo mật (Security):** Hệ thống xác thực bảo mật bằng Token JWT (JWT-secured authentication).
* **Quản lý dữ liệu:** Đảm bảo toàn vẹn dữ liệu khi đặt lịch ở nhiều cấp độ (multi-level bookings) và quản lý xung đột lịch trình tự động.
* **Thời gian phản hồi:** Thời gian phản hồi trung bình của API phải đạt dưới 3 giây.
* **Đa ngôn ngữ (Bilingual):** Hỗ trợ song ngữ Tiếng Việt & Tiếng Anh trên giao diện người dùng.
