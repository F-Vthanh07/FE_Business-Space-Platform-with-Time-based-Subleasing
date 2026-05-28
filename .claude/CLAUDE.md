# CLAUDE.md - Bộ não dự án Capstone

Tài liệu này chứa các thông tin cốt lõi về dự án Capstone, các luồng nghiệp vụ chính, vai trò hệ thống, yêu cầu AI và kế hoạch triển khai nhằm giúp Claude (hoặc các AI assistant khác) nắm bắt bối cảnh dự án một cách nhanh nhất.

## 1. Thông tin chung dự án (Capstone Project Registration)
* **Tên dự án bằng tiếng Anh:** AI-powered Shared Business Space Platform with Time-based Subleasing
* **Tên dự án bằng tiếng Việt:** Nền tảng chia sẻ và cho thuê lại mặt bằng kinh doanh theo khung thời gian có tích hợp AI
* **Bối cảnh (Context):**
  * Nhu cầu mô hình kinh doanh nhỏ và linh hoạt (bán hàng online, dịch vụ cá nhân, ăn uống, bán lẻ ngắn hạn) ngày càng tăng cao. Tuy nhiên chi phí thuê mặt bằng cao, hợp đồng dài hạn, thiếu linh hoạt về thời gian là rào cản lớn.
  * Nhiều mặt bằng kinh doanh hiện tại (quán cà phê, cửa hàng bán lẻ, ki-ốt) chưa được khai thác hết công suất trong một số khung giờ nhất định, gây lãng phí tài nguyên.
  * Dự án phát triển nền tảng kết nối, cho phép chia sẻ, cho thuê lại mặt bằng linh hoạt theo khung giờ (time slots) giúp tối ưu tài nguyên và hỗ trợ khởi nghiệp quy mô nhỏ.

---

## 2. Yêu cầu chức năng (Functional Requirements)

### Luồng nghiệp vụ cốt lõi (Core Flows)
1. **Core Flow 1: Đăng tải và quản lý mặt bằng (Space Listing and Management)**
   * Chủ mặt bằng (Space Owner) tạo và quản lý thông tin mặt bằng (vị trí, diện tích, cơ sở vật chất, biểu giá, lịch trống theo khung giờ).
   * Cấu hình quyền cho phép thuê lại (subleasing permissions).
   * Admin kiểm duyệt thông tin trước khi hiển thị lên nền tảng.
2. **Core Flow 2: Thuê mặt bằng sơ cấp (Space Rental - Primary Rental)**
   * Người thuê sơ cấp (Primary Renter) tìm kiếm theo địa điểm, giá cả, thời gian và tiến hành đặt lịch + thanh toán. Hệ thống tạo primary booking.
3. **Core Flow 3: Cho thuê lại theo khung thời gian (Time-based Subleasing)**
   * Người thuê sơ cấp chia nhỏ thời gian thuê đã đặt thành các khung giờ nhỏ hơn để cho thuê lại, thiết lập giá và điều kiện cho từng slot.
   * Hệ thống kiểm tra hợp lệ của các slot thuê lại để tránh xung đột lịch trình.
4. **Core Flow 4: Thuê mặt bằng thứ cấp (Secondary Rental)**
   * Người thuê thứ cấp (Secondary Renter) tìm kiếm và đặt lịch các khung giờ trống được chia sẻ lại, tiến hành thanh toán để nhận quyền sử dụng ngắn hạn.
5. **Core Flow 5: Thanh toán và Hóa đơn (Payment and Billing)**
   * Hỗ trợ thanh toán trực tuyến, tự động xuất hóa đơn và xử lý chia sẻ doanh thu (revenue sharing) giữa các bên liên quan.
6. **Core Flow 6: Quản lý lịch trình & Xử lý xung đột (Scheduling and Conflict Management)**
   * Tự động kiểm tra và ngăn chặn các xung đột lịch đặt lịch nhiều cấp độ (multi-level bookings).
7. **Core Flow 7: Phân tích & Báo cáo (Analytics and Reporting)**
   * Cung cấp dashboard trực quan báo cáo doanh thu, tỷ lệ lấp đầy (occupancy rate) và xu hướng sử dụng cho các bên.

---

## 3. Tích hợp AI (AI Requirements)
* **Mục tiêu:** Tăng cường khả năng ra quyết định, tối ưu hóa tài nguyên và cải thiện trải nghiệm người dùng.
* **Ứng dụng cụ thể:**
  * Hệ thống gợi ý (Recommendation System) đề xuất mặt bằng và khung giờ phù hợp.
  * Dự báo nhu cầu (Demand Prediction) dựa trên dữ liệu lịch sử.
  * Chiến lược định giá động (Dynamic Pricing).
  * Phân tích sử dụng hỗ trợ ra quyết định kinh doanh.
* **Nguồn dữ liệu:** Lịch sử đặt lịch, dữ liệu giao dịch, thông tin mặt bằng và dữ liệu sử dụng theo khung giờ.

---

## 4. Nghiên cứu & Học tập (Research-Based Learning - RBL)
* **Chủ đề nghiên cứu:** Nền tảng kinh tế chia sẻ, Tối ưu hóa lập lịch (Scheduling optimization), Hệ thống gợi ý, Định giá động.
* **Phương pháp:** Đọc tài liệu nghiên cứu (literature review), Phân tích so sánh (comparative analysis), Đánh giá các giải pháp công nghệ.

---

## 5. Yêu cầu phi chức năng (Non-functional Requirements)
* Giao diện song ngữ: Tiếng Anh và Tiếng Việt.
* Thời gian phản hồi trung bình dưới 3 giây.
* Hệ thống xác thực bảo mật bằng JWT.
* Lưu trữ và hosting trên đám mây (Firebase / Microsoft Azure).
* Thiết kế Modular: tách biệt Web và Mobile.

---

## 6. Vai trò trong hệ thống (System Roles)
* **Admin:** Quản lý người dùng, duyệt tin đăng, đối soát giao dịch.
* **Space Owner (Chủ mặt bằng):** Đăng ký mặt bằng, cấu hình giá, khung giờ và quyền cho thuê lại.
* **Primary Renter (Người thuê sơ cấp):** Thuê từ chủ mặt bằng, chia nhỏ thời gian và cho thuê lại các khung giờ không sử dụng.
* **Secondary Renter (Người thuê thứ cấp):** Thuê lại ngắn hạn các khung giờ trống được chia nhỏ.
* **AI Assistant:** Gợi ý mặt bằng, dự đoán nhu cầu, đề xuất định giá động và phân tích.

---

## 7. Phân công công việc & Sản phẩm bàn giao (Proposed Tasks & Expected Deliverables)

### Phân công công việc (Proposed Tasks)
1. Phân tích hệ thống, thiết kế kiến trúc, phát triển API Backend.
2. Phát triển ứng dụng di động Flutter (giao diện, tìm kiếm, đặt lịch, thanh toán).
3. Phát triển ứng dụng Web Admin (ReactJS / ASP.NET, dashboard, quản lý).
4. Tích hợp AI (gợi ý, dự báo nhu cầu, định giá động, phân tích).
5. Kiểm thử, viết tài liệu, triển khai hệ thống và báo cáo tổng kết.

### Sản phẩm bàn giao (Expected Deliverables)
* Ứng dụng di động (Mobile App) cho Renters & Secondary Users.
* Hệ thống quản trị trên Web (Web Admin) cho Space Owners & Administrators.
* Hệ thống Backend API phục vụ đặt lịch, lập lịch và thanh toán.
* Module AI hỗ trợ gợi ý, dự báo và định giá.
