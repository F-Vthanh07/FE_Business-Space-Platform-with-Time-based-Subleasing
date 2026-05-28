# Sơ đồ Cơ sở Dữ liệu (Database Schema)

Dưới đây là chi tiết các bảng, trường thông tin và mối quan hệ trong cơ sở dữ liệu của dự án **EtherDashboard** (Nền tảng chia sẻ và cho thuê lại mặt bằng kinh doanh theo khung thời gian có tích hợp AI), được xây dựng dựa trên sơ đồ thiết kế ERD.

---

## 1. Danh sách các Bảng & Định nghĩa Trường (Tables & Fields)

### 1.1. User (Người dùng)
Lưu trữ thông tin tài khoản đăng nhập của tất cả các vai trò trong hệ thống (Admin, Space Owner, Primary Renter, Secondary Renter).
* `UserID` (varchar, PK) - Mã định danh duy nhất của người dùng.
* `Email` (varchar) - Email đăng nhập.
* `PasswordHash` (varchar) - Mật khẩu đã mã hóa.
* `SystemRole` (varchar) - Vai trò trong hệ thống (`Admin`, `Owner`, `PrimaryRenter`, `SecondaryRenter`).

### 1.2. Profile (Thông tin cá nhân)
Thông tin chi tiết về người dùng.
* `UserID` (varchar, PK, FK -> User.UserID)
* `ProfileID` (varchar, PK)
* `FullName` (varchar) - Họ và tên đầy đủ.
* `PhoneNumber` (varchar) - Số điện thoại liên hệ.

### 1.3. Notification (Thông báo)
Quản lý thông báo gửi đến người dùng.
* `UserID` (varchar, PK, FK -> User.UserID)
* `NotificationID` (varchar, PK)
* `Title` (varchar) - Tiêu đề thông báo.
* `Content` (varchar) - Nội dung chi tiết.
* `IsRead` (boolean) - Trạng thái đã đọc.

### 1.4. SubscriptionPlan (Gói dịch vụ hệ thống)
Gói đăng ký thành viên cho chủ sở hữu hoặc người thuê để sử dụng nền tảng.
* `PlanID` (varchar, PK)
* `PlanName` (varchar) - Tên gói (ví dụ: Free, Premium, Enterprise).
* `Price` (decimal) - Giá gói.
* `DurationDays` (int) - Thời hạn sử dụng (ngày).

### 1.5. UserSubscription (Đăng ký của người dùng)
* `PlanID` (varchar, PK, FK -> SubscriptionPlan.PlanID)
* `UserID` (varchar, PK, FK -> User.UserID)
* `UserSubID` (varchar, PK)
* `StartDate` (datetime) - Ngày bắt đầu.
* `EndDate` (datetime) - Ngày kết thúc.
* `Status` (varchar) - Trạng thái (`Active`, `Expired`, `Cancelled`).

### 1.6. Space (Mặt bằng)
Thông tin về không gian/mặt bằng được đăng ký bởi Space Owner.
* `SpaceID` (varchar, PK)
* `OwnerID` (varchar, FK -> User.UserID) - Chủ sở hữu mặt bằng.
* `Name` (varchar) - Tên mặt bằng/không gian.
* `Address` (varchar) - Địa chỉ chi tiết.
* `Area` (decimal) - Diện tích (m²).

### 1.7. Amenity (Tiện ích)
* `AmenityID` (varchar, PK)
* `Name` (varchar) - Tên tiện ích (ví dụ: Wifi, Điều hòa, Bãi đỗ xe, WC riêng, Máy chiếu).

### 1.8. SpaceAmenity (Tiện ích của mặt bằng)
Bảng trung gian thể hiện các tiện ích có sẵn tại một mặt bằng cụ thể.
* `AmenityID` (varchar, PK, FK -> Amenity.AmenityID)
* `SpaceID` (varchar, PK, FK -> Space.SpaceID)

### 1.9. OperatingHour (Khung giờ hoạt động)
Thời gian hoạt động trong tuần của mặt bằng.
* `SpaceID` (varchar, PK, FK -> Space.SpaceID)
* `OpHourID` (varchar, PK)
* `DayOfWeek` (int) - Ngày trong tuần (1: Chủ Nhật, 2: Thứ Hai, ..., 7: Thứ Bảy).
* `OpenTime` (time) - Giờ mở cửa.
* `CloseTime` (time) - Giờ đóng cửa.

### 1.10. BusinessCategory (Danh mục ngành nghề)
* `CategoryID` (varchar, PK)
* `Name` (varchar) - Tên danh mục (ví dụ: Cà phê, Thời trang, Co-working, Kiosk thức ăn).

### 1.11. SpaceAllowedCategory (Ngành nghề được phép tại mặt bằng)
Các danh mục kinh doanh được chủ mặt bằng cho phép hoạt động.
* `CategoryID` (varchar, PK, FK -> BusinessCategory.CategoryID)
* `SpaceID` (varchar, PK, FK -> Space.SpaceID)

### 1.12. Listing (Bài đăng cho thuê)
Thông tin bài đăng cho thuê mặt bằng sơ cấp (từ Owner) hoặc cho thuê lại (từ Primary Renter).
* `PrimaryBookingID` (varchar, PK, FK -> PrimaryBooking.PrimaryBookingID) - Có thể null nếu là bài đăng sơ cấp trực tiếp của Owner, hoặc có giá trị nếu là bài đăng cho thuê lại của Primary Renter.
* `SpaceID` (varchar, PK, FK -> Space.SpaceID)
* `ListingID` (varchar, PK)
* `CreatorID` (varchar, FK -> User.UserID) - Người tạo bài đăng.
* `Status` (varchar) - Trạng thái bài đăng (`published`, `pending`, `draft`, `expired`).
* `AllowedStartTime` (time) - Giờ bắt đầu cho phép thuê.
* `AllowedEndTime` (time) - Giờ kết thúc cho phép thuê.
* `HourlyRate` (decimal) - Giá thuê theo giờ.

### 1.13. ListingSlot (Khung giờ chia nhỏ của bài đăng)
Các slot cụ thể được chia sẻ/cho thuê trong bài đăng.
* `ListingID` (varchar, PK, FK -> Listing.ListingID)
* `SlotID` (varchar, PK)
* `StartTime` (time) - Giờ bắt đầu slot.
* `EndTime` (time) - Giờ kết thúc slot.
* `Day` (varchar) - Thứ trong tuần hoặc ngày cụ thể.
* `Session` (varchar) - Buổi hoạt động (`Sáng`, `Chiều`, `Tối`).
* `Type` (varchar) - Loại slot (`Cố định`, `Linh hoạt`).
* `Price` (decimal) - Giá riêng cho slot này (nếu khác giá chung).

### 1.14. PrimaryBooking (Đặt lịch sơ cấp)
Hợp đồng thuê mặt bằng chính thức giữa Owner và Primary Renter.
* `SpaceID` (varchar, PK, FK -> Space.SpaceID)
* `PrimaryBookingID` (varchar, PK)
* `LessorID` (varchar, FK -> User.UserID) - Người cho thuê (thường là Owner).
* `LesseeID` (varchar, FK -> User.UserID) - Người thuê chính (Primary Renter).
* `StartDate` (datetime) - Ngày bắt đầu hợp đồng.
* `EndDate` (datetime) - Ngày kết thúc hợp đồng.
* `Status` (varchar) - Trạng thái (`Active`, `Completed`, `Terminated`, `Pending`).

### 1.15. Schedule (Lịch trình của Booking)
* `PrimaryBookingID` (varchar, PK, FK -> PrimaryBooking.PrimaryBookingID)
* `ScheduleID` (varchar, PK)

### 1.16. SubBooking (Đặt lịch thứ cấp)
Người thuê thứ cấp (Secondary Renter) đặt lại các slot trống từ người thuê chính.
* `ScheduleID` (varchar, PK, FK -> Schedule.ScheduleID)
* `PrimaryBookingID` (varchar, PK, FK -> PrimaryBooking.PrimaryBookingID)
* `SubBookingID` (varchar, PK)
* `LessorID` (varchar, FK -> User.UserID) - Người cho thuê lại (Primary Renter).
* `LesseeID` (varchar, FK -> User.UserID) - Người thuê phụ (Secondary Renter).
* `TotalAmount` (decimal) - Tổng tiền thuê.
* `Status` (varchar) - Trạng thái đặt lịch (`Approved`, `Pending`, `Rejected`, `Cancelled`).

### 1.17. BookingTime (Thời gian thuê thực tế của SubBooking)
Chi tiết các ngày và khung giờ thuê của SubBooking.
* `SubBookingID` (varchar, PK, FK -> SubBooking.SubBookingID)
* `BookingTimeID` (varchar, PK)
* `RentDate` (date) - Ngày thuê cụ thể.
* `StartTime` (time) - Giờ bắt đầu thuê.
* `EndTime` (time) - Giờ kết thúc thuê.

### 1.18. Review (Đánh giá)
* `SubBookingID` (varchar, PK, FK -> SubBooking.SubBookingID)
* `PrimaryBookingID` (varchar, PK, FK -> PrimaryBooking.PrimaryBookingID)
* `ReviewID` (varchar, PK)
* `ReviewerID` (varchar, FK -> User.UserID)
* `TargetUserID` (varchar, FK -> User.UserID)
* `Rating` (int) - Đánh giá số sao (1-5).

### 1.19. Transaction (Giao dịch tài chính)
* `SubBookingID` (varchar, PK, FK -> SubBooking.SubBookingID)
* `PrimaryBookingID` (varchar, PK, FK -> PrimaryBooking.PrimaryBookingID)
* `UserSubID` (varchar, PK, FK -> UserSubscription.UserSubID)
* `TransactionID` (varchar, PK)
* `SenderID` (varchar, FK -> User.UserID)
* `ReceiverID` (varchar, FK -> User.UserID)
* `Amount` (decimal) - Số tiền giao dịch.
* `Status` (varchar) - Trạng thái (`Success`, `Pending`, `Failed`).

---

## 2. Mối quan hệ chính (Key Relationships)

1. **User - Profile**: Quan hệ 1 - 1. Mỗi User có một Profile chi tiết.
2. **Space - OperatingHour & Amenity & AllowedCategory**: Một mặt bằng sở hữu nhiều khung giờ hoạt động, nhiều tiện ích đi kèm và cho phép nhiều ngành nghề kinh doanh đăng ký.
3. **Space - Listing - PrimaryBooking**:
   * Chủ sở hữu đăng ký `Space`.
   * Tạo `Listing` để tìm kiếm người thuê.
   * Khi hoàn tất, tạo `PrimaryBooking` cho `Primary Renter`.
4. **PrimaryBooking - Schedule - SubBooking - BookingTime**:
   * `PrimaryBooking` sở hữu một `Schedule` làm việc.
   * `Primary Renter` chia sẻ các khoảng thời gian trống thông qua bài đăng cho thuê lại.
   * `Secondary Renter` thực hiện đặt lịch tạo thành `SubBooking` với các `BookingTime` cụ thể nằm trong phạm vi của `PrimaryBooking`.
