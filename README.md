# ☕ CaféBook — Ứng dụng đặt bàn & Quản lý thực đơn

## 👥 Nhóm 5 — K19-01
| Họ tên | MSSV |
|--------|------|
| Lê Đức Anh | 1971070002 |
| Trần Trường Thành | 1974010305 |

---

## 📁 Cấu trúc file
```
cafebook/
├── index.html      — Trang khách hàng (Menu, Đặt món, Đặt bàn, Thông báo)
├── admin.html      — Trang quản trị viên
├── style.css       — CSS đầy đủ (1500+ dòng, responsive 3 breakpoint)
├── utils.js        — Tiện ích: format, validate, AUTH, NOTIF, ANALYTICS, USERS, COUPONS
├── api.js          — Fetch API + .then/.catch + jQuery AJAX, CRUD MockAPI
├── main.js         — Logic trang khách (~935 dòng)
├── admin.js        — Logic trang admin, CRUD, Analytics, Coupon (~999 dòng)
├── menu.json       — Dữ liệu mẫu thực đơn (không hardcode, chỉ tham khảo)
├── qr-cafebook.png — Mã QR chuyển khoản thật
└── README.md       — Tài liệu này
```

---

## 🔑 Tài khoản demo
| Vai trò | Tên đăng nhập | Mật khẩu |
|---------|--------------|----------|
| Admin   | admin        | admin123 |
| Khách   | Tự đăng ký   | —        |

> Khách có thể **tự tạo tài khoản** bằng email, tên đăng nhập hoặc mã số SV

---

## 🌐 MockAPI Endpoints (3 resource)
| Resource | URL |
|----------|-----|
| Drinks   | https://69fd352130ad0a6fd1c09382.mockapi.io/api/v1/drinks |
| Tables   | https://69fd352130ad0a6fd1c09382.mockapi.io/api/v1/tables |
| Reservations | https://69fd35bc30ad0a6fd1c0972c.mockapi.io/api/v1/reservations |

---

## ✅ Yêu cầu kỹ thuật (đánh dấu hoàn thành)

### 1. JavaScript thuần
- ✅ Khai báo biến đúng kiểu: `var`, `string`, `number`, `array`, `object`
- ✅ Cấu trúc điều khiển: `if/else`, `for`, `while` (trong `clearAllErrors`)
- ✅ ≥ 3 hàm tự định nghĩa có tham số + return: `formatPrice`, `filterDrinkList`, `calcCartTotals`, `validateBooking`, `calcFinalTotals`
- ✅ Sự kiện DOM: `click`, `submit`, `input`, `change` (không dùng jQuery)
- ✅ Thao tác DOM: `getElementById`, `querySelector`, `innerHTML`, `classList`, `textContent`

### 2. JSON & Fetch API (Bất đồng bộ)
- ✅ CRUD đầy đủ GET/POST/PUT/DELETE với MockAPI.io
- ✅ `fetch()` + `Promise` `.then()/.catch()` (reservations, tables)
- ✅ `async/await` (drinks, tables CRUD)
- ✅ Parse & hiển thị JSON lên giao diện HTML
- ✅ Loading skeleton khi chờ API (8 card skeleton)
- ✅ Xử lý lỗi: toast thông báo khi API thất bại

### 3. Form Validation (JavaScript)
- ✅ Kiểm tra required fields (booking, login, register, order, drink CRUD)
- ✅ Validate: giá > 0, tên không rỗng, URL ảnh hợp lệ, email, SĐT VN
- ✅ Inline error ngay bên dưới từng trường (`cb-error-msg`)
- ✅ Ngăn submit khi không hợp lệ (`return` sớm)
- ✅ Reset form sau khi thêm/sửa thành công

### 4. jQuery
- ✅ Selector: `$('#id')`, `$('.class')`, `$(document)`, `$(window)`
- ✅ ≥ 2 sự kiện: `.on('click')`, `.on('input')`, `.on('change')`, `.on('scroll')`
- ✅ ≥ 2 hiệu ứng: `.fadeIn()`, `.slideDown()`, `.slideUp()`, `.hide()`, `.show()`
- ✅ jQuery AJAX: `$.ajax()` (GET reservations, PUT status), `$.get()` (drinks)
- ✅ DOM jQuery: `.append()`, `.html()`, `.val()`, `.attr()`, `.prop()`

### 5. Bootstrap 5
- ✅ Grid System: `container`, `row`, `col-6`, `col-md-4`, `col-lg-3`, v.v.
- ✅ ≥ 5 Utility Classes: `d-flex`, `gap-2`, `text-muted`, `fw-bold`, `shadow-sm`, `mb-3`, `py-5`, v.v.
- ✅ ≥ 3 Components: **Navbar**, **Modal** (7 modal), **Toast**, **Badge**, **Table**, **Form**, **Pagination**, **Card**
- ✅ Responsive đúng 3 breakpoint: mobile (<576px), tablet (576-991px), desktop (≥992px)

### 6. MockAPI.io
- ✅ ≥ 2 resource: `drinks`, `tables`, `reservations`
- ✅ Schema đầy đủ: id, name, price, image, category, description, status, v.v.
- ✅ Dữ liệu 100% từ API — không hardcode
- ✅ CRUD hoạt động qua Postman/REST client

### 7. Deploy Vercel
- ✅ Đẩy code lên GitHub (repo public)
- ✅ Kết nối GitHub → Vercel, Framework: **Other** (static)
- ✅ Cung cấp link demo Vercel khi nộp bài

---

## 🚀 Hướng dẫn chạy local
```bash
# Dùng VS Code Live Server hoặc:
npx serve .
# hoặc
python -m http.server 5500
```
> Mở `http://localhost:5500` — **không mở file:// trực tiếp** (CORS sẽ bị chặn)

## 🚀 Hướng dẫn deploy Vercel
1. Push toàn bộ folder lên GitHub (public repo)
2. Vào https://vercel.com → **Add New Project** → Import repo
3. Framework Preset: **Other**
4. Root Directory: `./` (hoặc folder chứa index.html)
5. Click **Deploy** → Lấy link gửi kèm khi nộp bài
6. **Quan trọng**: Upload `qr-cafebook.png` vào cùng folder với `index.html`

---

## 🎯 Tính năng nổi bật
| Tính năng | Mô tả |
|-----------|-------|
| 🔐 Đăng ký / Đăng nhập | Email, username, hoặc Mã SV |
| 🛒 Giỏ hàng | Thêm/xóa/sửa số lượng, tính thuế 2% |
| 📋 Đặt món 3 kiểu | Tại quán / Mang về / Đặt online |
| 💳 Thanh toán | Tiền mặt hoặc QR chuyển khoản (ảnh QR thật) |
| 🎟️ Mã giảm giá | Tạo/quản lý coupon, khách nhập mã khi thanh toán |
| 📅 Đặt bàn | Sơ đồ bàn trực quan, validate tối đa 10 khách |
| 🔔 Thông báo | Xác nhận đặt bàn, đơn hàng, khuyến mãi |
| 📊 Analytics | Top món bán chạy, doanh thu theo danh mục |
| 🔑 Admin CRUD | Thêm/sửa/xóa thực đơn, bàn, xác nhận đặt bàn |
| 📱 Responsive | Đẹp trên mobile, tablet, desktop |

---

*Made with ☕ by Nhóm 5 — K19-01 FIT-DNU*