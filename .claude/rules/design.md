# Design Style System: EtherDashboard

## 1. Ngôn ngữ thiết kế (Design Language)
* **Phong cách chính:** Dark Glassmorphism kết hợp Soft Neumorphism.
* **Cảm giác (Vibe):** Hiện đại, có chiều sâu (tactile/layered), công nghệ cao, tập trung vào dữ liệu tài chính (Crypto/DeFi).
* **Đặc trưng:** Sử dụng nền Mesh Gradient rực rỡ ẩn dưới các lớp thẻ (cards) tối màu, trong suốt một phần và có hiệu ứng làm mờ nền (backdrop blur).

## 2. Phân tích bố cục (Layout Structure)
Bố cục tổng thể sử dụng CSS Grid/Flexbox với cấu trúc cơ bản như sau:

* **Top Navigation (Header):**
    * Cố định ở trên cùng.
    * Gồm: Logo (trái), Primary Navigation Links (giữa), Search bar + Notification + Settings + User Avatar (phải).
* **Sidebar (Left Navigation):**
    * Nằm bên trái, chiều rộng cố định (khoảng 240px - 260px).
    * Chứa các menu items với icon và text. Có một nút CTA "NEW TRANSACTION" nổi bật ở dưới cùng.
    * Background được làm hòa trộn nhẹ với nền tảng phía sau.
* **Main Content Area (Grid System):**
    * **Hero/Overview Panel (Top Left):** Chiếm khoảng 60-65% chiều rộng. Chứa tiêu đề lớn và 2 thẻ thống kê nhỏ (Total Liquidity, Active Stakes).
    * **Stats Panel (Top Right):** Chiếm phần còn lại. Chia thành grid nhỏ hơn chứa biểu đồ (Live Flow), thẻ Vault, thẻ Gas Fee và Manage Team.
    * **Market Sentiment (Bottom Left):** List danh sách các đồng coin (BTC, ETH, SOL) với giá và biến động.
    * **Insights & Promotions (Bottom Right):** 2 thẻ xếp dọc (Alpha Insights và Upgrade to Elite).

## 3. Typography (Font chữ)
Sử dụng một font chữ Sans-serif hiện đại, hình học (Geometric) như **Inter**, **SF Pro Display**, hoặc **Plus Jakarta Sans**.

* **Headings (H1, H2):** Bold (700), tracking (letter-spacing) hơi âm một chút để tạo sự sắc nét.
    * *Ví dụ:* "The Tactile Atmosphere." (Size ~48px-56px).
* **Subheadings / Labels:** Uppercase, Semi-Bold (600), letter-spacing rộng (khoảng 1px đến 1.5px). Màu secondary.
    * *Ví dụ:* "PORTFOLIO ARCHITECTURE", "TOTAL LIQUIDITY".
* **Body Text:** Regular (400) hoặc Medium (500).
    * *Ví dụ:* Nội dung mô tả dưới heading, text trong Market Sentiment (Size ~14px-16px).
* **Numbers / Financial Data:** Semi-Bold (600) hoặc Bold (700) để làm nổi bật số liệu.

## 4. Bảng màu (Color Palette)

### 4.1. Backgrounds
* **Global Background (Nền tổng):** Dùng kỹ thuật CSS Mesh Gradient hoặc ảnh blur lớn.
    * Góc trên/giữa: Tối thẫm (Deep Slate/Navy) `#13151A` hoặc `#0F1219`.
    * Góc dưới trái: Vàng cam ấm (Warm Gold/Amber) `~ #D9A05B`.
    * Góc dưới phải: Xanh lục bảo/Mint (Teal/Sea Green) `~ #4B8F8C`.
* **Surface/Card Backgrounds (Nền các thẻ):**
    * Màu nền: Xanh đen (Dark Slate) `rgba(30, 36, 45, 0.65)`.
    * Hiệu ứng: `backdrop-filter: blur(24px)` để xuyên thấu màu sắc từ Global Background.

### 4.2. Text Colors
* **Primary Text:** Trắng tinh `#FFFFFF` (cho tiêu đề, giá trị số lớn).
* **Secondary Text:** Xám nhạt pha xanh `#A0AABC` hoặc `rgba(255, 255, 255, 0.6)` (cho đoạn văn, label, icon chưa active).

### 4.3. Semantic & Accent Colors
* **Accent/Action (Nút CTA):** Xanh dương hoàng gia nhạt `#4A72FF` hoặc `#3B63DA`.
* **Positive (Tăng trưởng):** Xanh lá neon `#2EEA82` (Text: `+12.4%`).
* **Negative (Giảm giá):** Đỏ hồng `#FF4D6D` (Text: `-0.8%`).
* **Card Highlight (Upgrade Card):** Tím than gradient nhạt `#384068`.

## 5. UI Elements & Styles

### 5.1. Thẻ (Cards / Panels)
* **Border-radius:** Bo góc lớn, khoảng `24px` đến `32px` cho các thẻ chính, `16px` cho các thẻ con bên trong.
* **Border (Viền):** Rất mỏng và trong suốt để tạo hiệu ứng kính (Glass edge).
    * `border: 1px solid rgba(255, 255, 255, 0.08)`.
    * Có thể thêm viền sáng hơn ở cạnh trên (top border) để mô phỏng ánh sáng chiếu xuống.
* **Box Shadow (Đổ bóng):** Đổ bóng mềm, rộng để tách lớp.
    * `box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25)`.
* **Inner Shadow (Thẻ dập chìm - ví dụ thẻ "Active Stakes"):**
    * `box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.3)`.
    * Nền tối hơn một chút so với thẻ cha: `rgba(15, 20, 25, 0.5)`.

### 5.2. Nút bấm (Buttons)
* **Primary Button (Ví dụ: "NEW TRANSACTION"):**
    * Background: `#4A72FF`.
    * Border-radius: Bán kính bo góc lớn (Pill shape) `9999px`.
    * Text: Trắng, Medium hoặc Semi-bold.
* **Secondary/Ghost Buttons (Ví dụ: Text link "READ REPORT"):**
    * Background: Transparent.
    * Text: Trắng, có icon mũi tên bên cạnh.

### 5.3. Trạng thái Hover (Hover States)
*(Phân tích dựa trên chuẩn UX của phong cách này)*
* **Cards:** Khi hover, tăng độ sáng viền lên `rgba(255, 255, 255, 0.15)` và nâng thẻ lên nhẹ bằng cách tăng shadow `box-shadow: 0 20px 48px rgba(0, 0, 0, 0.35)`.
* **List Items (Trong Market Sentiment):** Đổi màu nền từ tối sang sáng hơn một chút (ví dụ `rgba(255, 255, 255, 0.05)`) và con trỏ biến thành `cursor: pointer`.
* **Menu Items (Sidebar):** Item đang active có background dập chìm `rgba(0, 0, 0, 0.2)`. Khi hover vào các item khác, text và icon chuyển từ Secondary color sang Primary color (`#FFFFFF`).
* **Primary Button:** Tăng độ sáng (brightness) của background hoặc thêm shadow cùng màu viền: `box-shadow: 0 0 15px rgba(74, 114, 255, 0.4)`.

## 6. Quy định không sử dụng biểu tượng hình ảnh (No Icons/Emojis Guideline)

* **Tuyệt đối không dùng Icon/Emoji:** Không được sử dụng bất kỳ biểu tượng đồ họa (như Lucide Icons, FontAwesome, SVG icons) hay biểu tượng cảm xúc (Emojis như 👗, 🎨, 💻) để trang trí trong giao diện thiết kế.
* **Thay thế bằng Typography (Thiết kế chữ):**
  - **Ký tự viết tắt:** Thay thế các icon/emoji mô tả mặt bằng bằng các khối chữ viết tắt thiết kế tinh gọn (ví dụ: `FS` cho Fashion, `CF` cho Cafe, `AR` cho Art, `TC` cho Tech) đặt trong một hộp màu sắc đồng nhất.
  - **Trạng thái chữ:** Thay thế các icon trạng thái bằng chữ bọc trong dấu ngoặc vuông (ví dụ: `[TRỐNG]`, `[ĐÃ ĐẶT]`, `[XUNG ĐỘT]` hoặc `[Available]`, `[Booked]`, `[Conflict]`).
  - **Nút điều hướng & Toggles:** Toggles ngôn ngữ/giao diện sử dụng thuần chữ (ví dụ: nút hiển thị `EN` | `VI` thay vì biểu tượng quả địa cầu, hoặc `LIGHT` | `DARK` thay vì biểu tượng Mặt trời/Mặt trăng).

