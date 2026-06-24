# API Reference - FlexiSpace (Business Space Platform)

Tài liệu này là nguồn tham chiếu chính xác duy nhất khi thực hiện bất kỳ tác vụ nào liên quan đến API trong dự án.
Được tổng hợp từ: Swagger JSON (`https://localhost:7069`) + Yêu cầu nghiệp vụ (`CLAUDE.md`) + Schema DB (`database.md`).

> **⚠️ Quy tắc bắt buộc:** Khi viết code gọi API, tạo TypeScript type, xử lý dữ liệu hay validate form — **PHẢI tham chiếu file này** để đảm bảo đúng tên field, kiểu dữ liệu và nghĩa của từng attribute.

---

## Thông tin kết nối (Base URL)

| Môi trường | Base URL                    |
|------------|-----------------------------|
| Local Dev  | `https://localhost:7069`    |
| API Docs   | `https://localhost:7069/swagger/index.html` |

### Xác thực (Authentication)
- Tất cả các API (trừ Auth) đều yêu cầu `Bearer Token` trong Header.
- Scheme: **HTTP Bearer JWT**
- Header: `Authorization: Bearer <access_token>`

---

## Enums (Các giá trị liệt kê cố định)

Các enum này được dùng xuyên suốt các API. **KHÔNG được dùng giá trị số nguyên thô — luôn dùng string name.**

| Enum | Các giá trị hợp lệ | Ngữ cảnh sử dụng |
|---|---|---|
| `ListingStatusEnum` | `"Pending"`, `"Accepted"`, `"Canceled"` | Trạng thái bài đăng cho thuê |
| `ListingType` | `"EntireSpace"`, `"SharedSpace"` | Loại bài đăng (toàn bộ mặt bằng hay thuê chia sẻ) |
| `PrimaryBookingRequestStatusEnum` | `"Pending"`, `"Negotiating"`, `"Approved"`, `"Rejected"`, `"Canceled"` | Trạng thái yêu cầu đặt lịch sơ cấp |
| `ContractStatusEnum` | `"Pending"`, `"Active"`, `"Expired"`, `"Cancelled"` | Trạng thái hợp đồng thuê |
| `DurationUnitEnum` | `"Days"`, `"Weeks"`, `"Months"`, `"Years"` | Đơn vị thời gian cho booking |
| `DayOfWeek` | `"Sunday"`, `"Monday"`, `"Tuesday"`, `"Wednesday"`, `"Thursday"`, `"Friday"`, `"Saturday"` | Ngày trong tuần cho khung giờ chia sẻ |

---

## Shared Sub-Models (Các model dùng chung)

### `AmenityVModel`
Tiện ích (Wifi, Điều hòa, Máy chiếu,...) khai báo khi tạo Space.
```json
{
  "name": "string",       // Tên tiện ích. Ví dụ: "Wifi", "Điều hòa"
  "quantity": 0,          // Số lượng (nullable int). Ví dụ: 2 máy chiếu
  "isActive": true        // Tiện ích có đang hoạt động không (nullable bool)
}
```

### `OperatingHourVmodel`
Khung giờ hoạt động của mặt bằng theo từng ngày trong tuần.
```json
{
  "dayOfWeek": 0,         // int32: 0=Sunday, 1=Monday, ..., 6=Saturday (theo .NET DayOfWeek)
  "openTime": "08:00:00", // Giờ mở cửa, format HH:mm:ss
  "closeTime": "22:00:00" // Giờ đóng cửa, format HH:mm:ss
}
```
> ⚠️ `dayOfWeek` là `int32`, KHÔNG phải string — dù DB lưu int, cần map đúng (0=CN, 1=T2,...).

### `SpaceAllowedCategoryVModel`
Ngành nghề được chủ mặt bằng cho phép hoạt động (ví dụ: Cà phê, Co-working).
```json
{
  "bussinessCategoryId": 0  // int64 — ID của BusinessCategory (nullable)
}
```
> ⚠️ Typo cố định trong API: `bussiness` (2 chữ s) — KHÔNG sửa thành `business`.

### `ShareSpaceAmenitiesRequest`
Tiện ích trong một bài đăng SharedSpace — xác định tiện ích nào được bao gồm và có tính phí riêng không.
```json
{
  "amenityId": 0,       // int64 — ID của tiện ích
  "isIncluded": true,   // bool — Có được bao gồm trong giá thuê không
  "price": 0            // double — Phí bổ sung nếu không included, 0 nếu included
}
```

### `ShareSpaceCategoryRequest`
Danh mục ngành nghề phù hợp với shared space listing.
```json
{
  "bussinessCategoryId": 0, // int64 — ID ngành nghề
  "note": "string"          // Ghi chú thêm về yêu cầu ngành nghề (nullable)
}
```

### `AvailabilitiesTimeRequest`
Khung giờ và ngày mà shared space listing có thể được thuê lại.
```json
{
  "daysOfWeek": ["Sunday"],    // Mảng DayOfWeek — các ngày trong tuần lặp lại (nullable)
  "specificdate": "2026-06-24", // Ngày cụ thể, format yyyy-MM-dd (nullable) — dùng khi không lặp lại
  "startTime": "08:00:00",     // Giờ bắt đầu có thể thuê, format HH:mm:ss (nullable)
  "endTime": "17:00:00",       // Giờ kết thúc có thể thuê, format HH:mm:ss (nullable)
  "validFrom": "2026-06-01",   // Ngày hiệu lực bắt đầu, format yyyy-MM-dd (nullable)
  "validTo": "2026-12-31"      // Ngày hiệu lực kết thúc, format yyyy-MM-dd (nullable)
}
```
> `daysOfWeek` và `specificdate` thường dùng một trong hai: lặp theo tuần hoặc ngày cụ thể.

---

## API Endpoints

---

## 🔑 Auth — Xác thực người dùng

**Nghiệp vụ:** Đăng ký tài khoản mới, đăng nhập và xác minh OTP. Hệ thống dùng JWT Bearer. Có tích hợp Cloudflare Turnstile để chống bot.

---

### `POST /api/Auth/register` — Đăng ký tài khoản

**Nghiệp vụ:** Tạo tài khoản mới cho người dùng (Owner, Renter). Backend sẽ gửi OTP để verify email.

**Request Body:**
```json
{
  "email": "string",          // Email đăng nhập — unique, dùng làm username
  "password": "string",       // Mật khẩu — sẽ được hash phía backend
  "dob": "2000-01-01T00:00:00.000Z", // Ngày sinh — ISO 8601 date-time
  "phoneNumber": "string",    // Số điện thoại liên hệ
  "name": "string",           // Họ và tên đầy đủ
  "turnstileToken": "string"  // Token từ Cloudflare Turnstile widget (chống bot)
}
```

**Response:** `200 OK` — Tài khoản tạo thành công, OTP được gửi về email.

---

### `POST /api/Auth/login` — Đăng nhập

**Nghiệp vụ:** Đăng nhập bằng email/password, nhận lại JWT access token để gọi các API khác.

**Request Body:**
```json
{
  "email": "string",          // Email đã đăng ký
  "password": "string",       // Mật khẩu
  "turnstileToken": "string"  // Token Cloudflare Turnstile
}
```

**Response:** `200 OK` — Trả về JWT token.

---

### `POST /api/Auth/verify-otp` — Xác minh OTP

**Nghiệp vụ:** Xác minh mã OTP được gửi về email sau khi đăng ký, để kích hoạt tài khoản.

**Request Body:**
```json
{
  "email": "string",    // Email cần xác minh
  "otpCode": "string"   // Mã OTP nhận qua email (thường 6 chữ số)
}
```

**Response:** `200 OK` — Tài khoản được kích hoạt.

---

## 🏢 BussinessCategory — Danh mục ngành nghề

**Nghiệp vụ:** Quản lý các danh mục ngành nghề kinh doanh (Cà phê, Co-working, Thời trang, Kiosk ăn uống,...). Dùng để phân loại mặt bằng và lọc khi tìm kiếm.

> ⚠️ Typo cố định trong toàn bộ codebase: `Bussiness` (2 chữ s). KHÔNG sửa.

---

### `GET /api/BussinessCategory/GetAll` — Lấy danh sách ngành nghề

**Query Parameters:**
| Param | Type | Ý nghĩa |
|---|---|---|
| `Name` | string | Lọc theo tên ngành nghề |
| `CreatedBy` | string | Lọc theo người tạo |
| `CreatedAt` | date-time | Lọc theo ngày tạo |
| `UpdatedBy` | string | Lọc theo người cập nhật |
| `UpdatedAt` | date-time | Lọc theo ngày cập nhật |

**Response:** `200 OK` — Mảng các danh mục ngành nghề.

---

### `POST /api/BussinessCategory/Create` — Tạo ngành nghề mới

**Request Body:**
```json
{
  "name": "string",     // Tên ngành nghề. Ví dụ: "Cà phê & Đồ uống"
  "isActive": true      // Có đang hoạt động trên hệ thống không (nullable bool)
}
```

**Response:** `200 OK`

---

### `GET /api/BussinessCategory/GetById{id}` — Lấy theo ID

**Path Params:** `id` (int64, required)
**Response:** `200 OK`

---

### `PUT /api/BussinessCategory/Update{id}` — Cập nhật ngành nghề

**Path Params:** `id` (int64, required)

**Request Body:** Giống `Create`.
```json
{
  "name": "string",
  "isActive": true
}
```

**Response:** `200 OK`

---

### `DELETE /api/BussinessCategory/Delete{id}` — Xóa ngành nghề

**Path Params:** `id` (int64, required)
**Response:** `200 OK`

---

## 📜 Contract — Hợp đồng thuê mặt bằng

**Nghiệp vụ:** Quản lý hợp đồng chính thức giữa chủ mặt bằng (Lessor) và người thuê sơ cấp (Lessee). Hợp đồng được tạo sau khi BookingRequest được Approved. Lưu thông tin pháp lý (CMND/CCCD), thời hạn, giá thuê, đặt cọc.

---

### `POST /api/Contract/Create` — Tạo hợp đồng

**Request Body:**
```json
{
  "spaceId": 0,                           // int64 — ID mặt bằng được thuê
  "primaryBookingRequestId": 0,           // int64 — ID BookingRequest đã được Approved trước đó
  "lessorNumberCard": "string",           // CMND/CCCD của chủ mặt bằng (Lessor)
  "lesseeNumberCard": "string",           // CMND/CCCD của người thuê (Lessee)
  "description": "string",               // Mô tả điều khoản hợp đồng (nullable)
  "acreage": 0,                           // double — Diện tích thuê (m²)
  "duration": 0,                          // int32 — Thời hạn hợp đồng (số đơn vị)
  "startDate": "2026-06-24T00:00:00.000Z", // Ngày bắt đầu hiệu lực hợp đồng
  "endDate": "2026-12-24T00:00:00.000Z",   // Ngày kết thúc hợp đồng
  "depositAmount": 0,                     // double — Số tiền đặt cọc
  "price": 0,                             // double — Giá thuê (theo tháng hoặc thỏa thuận)
  "status": "Pending"                     // ContractStatusEnum: "Pending"|"Active"|"Expired"|"Cancelled"
}
```

**Lưu ý nghiệp vụ:**
- `primaryBookingRequestId` phải là một BookingRequest có `status = "Approved"`.
- `duration` không có unit riêng — đơn vị được hiểu ngầm từ hợp đồng (thường là tháng).

---

### `GET /api/Contract/GetAll` — Lấy danh sách hợp đồng

**Query Parameters:**
| Param | Type | Ý nghĩa |
|---|---|---|
| `LessorId` | string | Lọc theo ID chủ mặt bằng |
| `LesseeId` | string | Lọc theo ID người thuê |
| `SpaceId` | int64 | Lọc theo mặt bằng |
| `Status` | int32 | Lọc theo trạng thái (dùng số nguyên tại đây, khác với các API khác) |

---

### `GET /api/Contract/GetById/{id}` — Lấy theo ID

**Path Params:** `id` (int64, required)

---

### `PUT /api/Contract/Update/{id}` — Cập nhật hợp đồng

**Path Params:** `id` (int64, required)
**Request Body:** Giống `Create`.

---

### `DELETE /api/Contract/Delete/{id}` — Xóa hợp đồng

**Path Params:** `id` (int64, required)

---

## 💬 Conversation & Message — Tin nhắn

**Nghiệp vụ:** Hệ thống nhắn tin nội bộ giữa Lessor và Lessee để thương lượng điều khoản thuê. Hỗ trợ real-time qua SignalR/WebSocket.

---

### `POST /api/Conversation/Create` — Tạo cuộc hội thoại

**Query Parameters:**
| Param | Type | Ý nghĩa |
|---|---|---|
| `lessorId` | string | UserID của chủ mặt bằng |
| `lesseeId` | string | UserID của người thuê |

**Response:** `200 OK` — Trả về Conversation mới hoặc cuộc hội thoại đã có sẵn.

---

### `GET /api/Message/GetMessageHistory` — Lấy lịch sử tin nhắn

**Query Parameters:**
| Param | Type | Ý nghĩa |
|---|---|---|
| `conversationId` | string | ID cuộc hội thoại cần lấy lịch sử |
| `timeBefore` | date-time | Cursor phân trang — lấy tin nhắn trước thời điểm này (cursor-based pagination) |
| `limit` | int32 | Số lượng tin nhắn tối đa cần lấy |

---

### `POST /api/TestChat/test-send` — Gửi tin nhắn test

**Query Parameters:**
| Param | Type | Ý nghĩa |
|---|---|---|
| `SenderId` | string | UserID người gửi |
| `ReceiverId` | string | UserID người nhận |
| `ConversationId` | string | ID cuộc hội thoại |
| `Content` | string | Nội dung tin nhắn |

> ⚠️ Đây là endpoint test — không dùng trong production.

---

## 📋 Listing — Bài đăng cho thuê mặt bằng

**Nghiệp vụ:** Quản lý bài đăng cho thuê. Có 2 loại:
- **EntireSpace (Toàn bộ):** Chủ mặt bằng đăng cho thuê toàn bộ không gian theo kỳ hạn dài.
- **SharedSpace (Chia sẻ):** Primary Renter chia nhỏ thời gian đã thuê thành các slot nhỏ hơn để cho thuê lại (Core Flow 3 - Subleasing).

Bài đăng cần được Admin duyệt (`status: Pending → Accepted`) mới hiển thị công khai.

---

### `POST /api/Listing/Create` — Tạo bài đăng toàn bộ mặt bằng (EntireSpace)

**Nghiệp vụ:** Space Owner đăng bài để tìm Primary Renter thuê dài hạn.

**Request Body:**
```json
{
  "spaceId": 0,                             // int64 — ID mặt bằng được đăng
  "allowedStartTime": "2026-06-24T00:00:00.000Z", // Thời điểm bắt đầu cho phép thuê
  "allowedEndTime": "2026-12-31T00:00:00.000Z",   // Thời điểm kết thúc cho phép thuê
  "description": "string",                 // Mô tả bài đăng (nullable)
  "price": 0,                               // double — Giá thuê (đơn vị theo thỏa thuận)
  "listingPictures": ["string"]             // Mảng URL ảnh minh họa mặt bằng (nullable)
}
```

---

### `POST /api/Listing/CreateShareListing` — Tạo bài đăng chia sẻ (SharedSpace / Subleasing)

**Nghiệp vụ:** Primary Renter tạo bài đăng cho thuê lại theo khung giờ — đây là Core Feature chính của hệ thống.

**Request Body:**
```json
{
  "spaceId": 0,
  "allowedStartTime": "2026-06-24T00:00:00.000Z",
  "allowedEndTime": "2026-12-31T00:00:00.000Z",
  "description": "string",
  "price": 0,                               // Giá thuê cơ bản
  "listingPictures": ["string"],
  "shareSpaceDetailMaxSubRenter": 0,        // int32 — Số người thuê phụ tối đa cùng lúc
  "shareSpaceDetailShareSpaceAmenities": [  // Tiện ích nào được bao gồm trong giá
    {
      "amenityId": 0,
      "isIncluded": true,
      "price": 0
    }
  ],
  "shareSpaceDetailAvailabilitiesTimes": [  // Các khung giờ có thể được thuê lại
    {
      "daysOfWeek": ["Monday"],             // Lặp lại hàng tuần vào các ngày này
      "specificdate": null,                 // Hoặc ngày cụ thể (chọn 1 trong 2)
      "startTime": "08:00:00",
      "endTime": "17:00:00",
      "validFrom": "2026-07-01",            // Từ ngày nào thì hiệu lực
      "validTo": "2026-12-31"               // Đến ngày nào thì hết hiệu lực
    }
  ],
  "shareSpaceDetailShareSpaceCategories": [ // Ngành nghề phù hợp với share listing này
    {
      "bussinessCategoryId": 0,
      "note": "string"
    }
  ]
}
```

**Lưu ý nghiệp vụ:**
- `shareSpaceDetailMaxSubRenter`: Giới hạn xung đột lịch — hệ thống sẽ từ chối booking mới nếu vượt quá số này trong cùng một slot.
- Các `availabilitiesTimes` phải nằm trong phạm vi thời gian của `PrimaryBooking` tương ứng.

---

### `GET /api/Listing/GetAll` — Lấy danh sách bài đăng

**Query Parameters:**
| Param | Type | Ý nghĩa |
|---|---|---|
| `status` | `ListingStatusEnum` | Lọc theo trạng thái: `"Pending"`, `"Accepted"`, `"Canceled"` |
| `listingType` | `ListingType` | Lọc theo loại: `"EntireSpace"`, `"SharedSpace"` |

---

### `GET /api/Listing/GetById/{id}` — Lấy chi tiết bài đăng

**Path Params:** `id` (int64, required)

---

### `PUT /api/Listing/Update/{id}` — Cập nhật bài đăng EntireSpace

**Path Params:** `id` (int64, required)
**Request Body:** Giống `Create` (ListingRequest).

---

### `PUT /api/Listing/UpdateShareListing/{id}` — Cập nhật bài đăng SharedSpace

**Path Params:** `id` (int64, required)
**Request Body:** Giống `CreateShareListing` (SharedListingRequest).

---

### `PATCH /api/Listing/Status/{id}` — Cập nhật trạng thái bài đăng

**Nghiệp vụ:** Admin dùng để duyệt (`Pending → Accepted`) hoặc từ chối (`Pending → Canceled`) bài đăng.

**Path Params:** `id` (int64, required)

**Request Body:**
```json
{
  "status": "Accepted",         // ListingStatusEnum: "Pending"|"Accepted"|"Canceled"
  "cancelReason": "string"      // Lý do hủy — bắt buộc khi status = "Canceled" (nullable)
}
```

---

### `DELETE /api/Listing/Delete/{id}` — Xóa cứng bài đăng

**Path Params:** `id` (int64, required)

---

### `DELETE /api/Listing/SoftDelete/{id}` — Xóa mềm bài đăng

**Path Params:** `id` (int64, required)
**Lưu ý:** Soft delete giữ data trong DB nhưng ẩn khỏi giao diện.

---

## 📅 PrimaryBookingRequest — Yêu cầu đặt lịch sơ cấp

**Nghiệp vụ:** Primary Renter gửi yêu cầu thuê mặt bằng tới Space Owner. Luồng trạng thái:
`Pending → Negotiating → Approved → (Contract Created)` hoặc `Pending → Rejected/Canceled`

Khi Approved, hệ thống sẽ tạo Contract và bắt đầu tính hiệu lực thuê.

---

### `POST /api/PrimaryBookingRequest/Create` — Gửi yêu cầu đặt lịch

**Request Body:**
```json
{
  "listingId": 0,                             // int64 — ID bài đăng muốn thuê
  "offeredPrice": 0,                          // double — Giá đề xuất của renter (nullable, để thương lượng)
  "duration": 0,                              // int32 — Thời hạn thuê (số đơn vị)
  "durationUnit": "Days",                     // DurationUnitEnum: "Days"|"Weeks"|"Months"|"Years"
  "purpose": "string",                        // Mục đích sử dụng mặt bằng (nullable)
  "note": "string",                           // Ghi chú thêm cho chủ mặt bằng (nullable)
  "expectedStartDate": "2026-07-01T00:00:00.000Z" // Ngày dự kiến bắt đầu thuê
}
```

**Lưu ý nghiệp vụ:**
- `offeredPrice` cho phép renter đặt giá đề xuất khác với giá niêm yết — phục vụ tính năng thương lượng (`Negotiating` status).
- `duration` + `durationUnit` xác định thời hạn thuê: ví dụ `3 Months` = thuê 3 tháng.

---

### `GET /api/PrimaryBookingRequest/GetAll` — Lấy danh sách yêu cầu đặt lịch

**Query Parameters:**
| Param | Type | Ý nghĩa |
|---|---|---|
| `status` | `PrimaryBookingRequestStatusEnum` | Lọc theo trạng thái |

---

### `GET /api/PrimaryBookingRequest/GetById/{id}` — Lấy theo ID

**Path Params:** `id` (int64, required)

---

### `PUT /api/PrimaryBookingRequest/Update/{id}` — Cập nhật yêu cầu

**Path Params:** `id` (int64, required)
**Request Body:** Giống `Create` (BookingRequest).

---

### `PATCH /api/PrimaryBookingRequest/Status/{id}` — Cập nhật trạng thái yêu cầu

**Nghiệp vụ:** Space Owner dùng để phê duyệt, từ chối, hoặc đàm phán với Renter.

**Path Params:** `id` (int64, required)

**Request Body:**
```json
{
  "status": "Approved",          // PrimaryBookingRequestStatusEnum
  "cancelReason": "string"       // Lý do từ chối/hủy (nullable, chỉ cần khi Rejected/Canceled)
}
```

---

### `DELETE /api/PrimaryBookingRequest/Delete/{id}` — Xóa yêu cầu

**Path Params:** `id` (int64, required)

---

## 🏡 Space — Mặt bằng

**Nghiệp vụ:** Space Owner đăng ký và quản lý thông tin mặt bằng của họ. Mặt bằng là đối tượng cốt lõi — tất cả Listing, Contract, Booking đều gắn với một Space.

---

### `GET /api/Space/GetAll` — Lấy danh sách mặt bằng

**Query Parameters:**
| Param | Type | Ý nghĩa |
|---|---|---|
| `OwnerId` | string | Lọc theo chủ sở hữu (UserID) |
| `Address` | string | Lọc theo địa chỉ (tìm kiếm text) |
| `City` | string | Lọc theo thành phố |
| `Area` | double | Lọc theo diện tích (m²) |
| `Name` | string | Lọc theo tên mặt bằng |
| `CreatedBy` | string | Người tạo |
| `CreatedAt` | date-time | Ngày tạo |
| `UpdatedBy` | string | Người cập nhật |
| `UpdatedAt` | date-time | Ngày cập nhật |

---

### `GET /api/Space/GetAddress` — Lấy danh sách địa chỉ (tỉnh/huyện)

**Nghiệp vụ:** Lấy danh sách tỉnh/thành phố và quận/huyện để hiển thị dropdown khi tạo Space.

**Query Parameters:**
| Param | Type | Ý nghĩa |
|---|---|---|
| `provinceCode` | string | Mã tỉnh/thành phố |
| `districtCode` | string | Mã quận/huyện (cần `provinceCode` trước) |

---

### `POST /api/Space/Create` — Tạo mặt bằng mới

**Nghiệp vụ:** Space Owner đăng ký mặt bằng lần đầu. Kèm theo tiện ích, giờ hoạt động và ngành nghề được phép.

**Request Body:**
```json
{
  "name": "string",            // Tên mặt bằng. Ví dụ: "Mặt bằng số 3 Nguyễn Huệ"
  "address": "string",         // Địa chỉ chi tiết (số nhà, đường, phường)
  "city": "string",            // Thành phố/Tỉnh
  "area": 0,                   // double — Diện tích (m²)
  "isActive": true,            // bool — Mặt bằng có đang hoạt động không
  "amenities": [               // Danh sách tiện ích có tại mặt bằng
    {
      "name": "Wifi",
      "quantity": 1,
      "isActive": true
    }
  ],
  "operatingHours": [          // Lịch hoạt động theo từng ngày trong tuần
    {
      "dayOfWeek": 1,          // 1 = Thứ Hai
      "openTime": "08:00:00",
      "closeTime": "22:00:00"
    }
  ],
  "spaceAllowedCategories": [  // Các ngành nghề được phép hoạt động tại đây
    {
      "bussinessCategoryId": 0
    }
  ]
}
```

---

### `GET /api/Space/GetById{id}` — Lấy chi tiết mặt bằng

**Path Params:** `id` (int64, required)

---

### `PUT /api/Space/Update{id}` — Cập nhật mặt bằng

**Path Params:** `id` (int64, required)
**Request Body:** Giống `Create` (CreateSpaceRQ).

---

### `DELETE /api/Space/Delete{id}` — Xóa mặt bằng

**Path Params:** `id` (int64, required)

---

## TypeScript Interfaces (Dùng trong Frontend)

Đây là các type/interface TypeScript tương ứng để dùng khi code. Giữ đúng tên field.

```typescript
// ===== ENUMS =====
export type ListingStatusEnum = "Pending" | "Accepted" | "Canceled";
export type ListingType = "EntireSpace" | "SharedSpace";
export type PrimaryBookingRequestStatusEnum = "Pending" | "Negotiating" | "Approved" | "Rejected" | "Canceled";
export type ContractStatusEnum = "Pending" | "Active" | "Expired" | "Cancelled"; // Cancelled có 2 chữ l
export type DurationUnitEnum = "Days" | "Weeks" | "Months" | "Years";
export type DayOfWeek = "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";

// ===== AUTH =====
export interface RegisterRequest {
  email?: string | null;
  password?: string | null;
  dob: string; // ISO date-time
  phoneNumber?: string | null;
  name?: string | null;
  turnstileToken?: string | null;
}

export interface LoginRequest {
  email?: string | null;
  password?: string | null;
  turnstileToken?: string | null;
}

export interface VerifyOtpRequest {
  email?: string | null;
  otpCode?: string | null;
}

// ===== BUSINESS CATEGORY =====
export interface CreateBussinessCategory {  // ⚠️ double-s typo là cố ý
  name?: string | null;
  isActive?: boolean | null;
}

// ===== SPACE =====
export interface AmenityVModel {
  name?: string | null;
  quantity?: number | null;
  isActive?: boolean | null;
}

export interface OperatingHourVmodel {
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  openTime: string;  // "HH:mm:ss"
  closeTime: string; // "HH:mm:ss"
}

export interface SpaceAllowedCategoryVModel {
  bussinessCategoryId?: number | null; // int64
}

export interface CreateSpaceRQ {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  area: number;
  isActive: boolean;
  amenities?: AmenityVModel[] | null;
  operatingHours?: OperatingHourVmodel[] | null;
  spaceAllowedCategories?: SpaceAllowedCategoryVModel[] | null;
}

// ===== LISTING =====
export interface ListingRequest {
  spaceId: number;
  allowedStartTime: string; // ISO date-time
  allowedEndTime: string;   // ISO date-time
  description?: string | null;
  price: number;
  listingPictures?: string[] | null;
}

export interface ListingStatusRequest {
  status: ListingStatusEnum;
  cancelReason?: string | null;
}

export interface ShareSpaceAmenitiesRequest {
  amenityId: number;
  isIncluded: boolean;
  price: number;
}

export interface ShareSpaceCategoryRequest {
  bussinessCategoryId: number;
  note?: string | null;
}

export interface AvailabilitiesTimeRequest {
  daysOfWeek?: DayOfWeek[] | null;
  specificdate?: string | null; // "yyyy-MM-dd"
  startTime?: string | null;    // "HH:mm:ss"
  endTime?: string | null;      // "HH:mm:ss"
  validFrom?: string | null;    // "yyyy-MM-dd"
  validTo?: string | null;      // "yyyy-MM-dd"
}

export interface SharedListingRequest {
  spaceId: number;
  allowedStartTime: string;
  allowedEndTime: string;
  description?: string | null;
  price: number;
  listingPictures?: string[] | null;
  shareSpaceDetailMaxSubRenter: number;
  shareSpaceDetailShareSpaceAmenities?: ShareSpaceAmenitiesRequest[] | null;
  shareSpaceDetailAvailabilitiesTimes?: AvailabilitiesTimeRequest[] | null;
  shareSpaceDetailShareSpaceCategories?: ShareSpaceCategoryRequest[] | null;
}

// ===== BOOKING =====
export interface BookingRequest {
  listingId: number;
  offeredPrice?: number | null;
  duration: number;
  durationUnit: DurationUnitEnum;
  purpose?: string | null;
  note?: string | null;
  expectedStartDate: string; // ISO date-time
}

export interface BookingStatusRequest {
  status: PrimaryBookingRequestStatusEnum;
  cancelReason?: string | null;
}

// ===== CONTRACT =====
export interface ContractRequest {
  spaceId: number;
  primaryBookingRequestId: number;
  lessorNumberCard?: string | null;
  lesseeNumberCard?: string | null;
  description?: string | null;
  acreage: number;
  duration: number;
  startDate: string; // ISO date-time
  endDate: string;   // ISO date-time
  depositAmount: number;
  price: number;
  status: ContractStatusEnum;
}
```

---

## Ghi chú quan trọng (Critical Notes)

1. **Typo `Bussiness`:** Toàn bộ codebase dùng `bussinessCategoryId`, `BussinessCategory` với 2 chữ `s`. **KHÔNG sửa** — sửa sẽ gây lỗi API.
2. **`dayOfWeek` là `int32`:** Khi gửi lên API `OperatingHourVmodel`, dùng số (0-6), không phải string. Khi dùng trong `AvailabilitiesTimeRequest`, `daysOfWeek` lại là mảng string `DayOfWeek`.
3. **Date formats:**
   - `date-time` fields: ISO 8601 — `"2026-06-24T00:00:00.000Z"`
   - `date` fields: `"2026-06-24"`
   - `time` fields: `"08:00:00"`
4. **Soft vs Hard Delete:** `Listing` có cả hai — `/SoftDelete/{id}` (ẩn) và `/Delete/{id}` (xóa cứng).
5. **ContractStatusEnum:** Dùng `"Cancelled"` (2 chữ `l`) — khác với `"Canceled"` (1 chữ `l`) ở ListingStatus và BookingStatus.
6. **`offeredPrice` nullable:** Cho phép null khi renter chấp nhận giá niêm yết mà không thương lượng.
7. **Phân quyền theo nghiệp vụ** (frontend phải guard đúng):
   - `Space/Create`: Chỉ `Space Owner`
   - `Listing/Create`: `Space Owner` (EntireSpace) hoặc `Primary Renter` (SharedSpace)
   - `PrimaryBookingRequest/Create`: `Primary Renter`
   - `PrimaryBookingRequest/Status`: `Space Owner` (duyệt/từ chối)
   - `Listing/Status`: `Admin` (duyệt bài đăng)
