/* ========== utils.js ========== */
/* YC1: Khai báo biến đúng kiểu, hàm có tham số & return value */

// ---- Định dạng giá tiền VNĐ (string) ----
function formatPrice(price) {           // YC1: function có tham số, return string
  var n = Number(price);                // YC1: khai báo biến number
  if (isNaN(n)) return '0đ';           // YC1: if/else
  return n.toLocaleString('vi-VN') + 'đ';
}

// ---- Định dạng ngày (string → string) ----
function formatDate(s) {
  if (!s) return '';
  var d = new Date(s);
  return isNaN(d) ? s : d.toLocaleDateString('vi-VN', {day:'2-digit',month:'2-digit',year:'numeric'});
}

// ---- Tính tổng giỏ hàng (array → object) ----
function calcCartTotals(cartArray) {    // YC1: hàm có tham số array, return object
  var subtotal = 0;
  for (var i = 0; i < cartArray.length; i++) {  // YC1: vòng lặp for
    subtotal += Number(cartArray[i].price) * cartArray[i].qty;
  }
  var tax   = Math.round(subtotal * 0.02);
  var total = subtotal + tax;
  return { subtotal: subtotal, tax: tax, total: total }; // YC1: return object
}

// ---- Tìm kiếm trong mảng đồ uống (array, string → array) ----
function filterDrinkList(drinks, keyword, category) { // YC1: hàm 3 tham số
  var result = [];
  var kw = (keyword || '').toLowerCase();
  for (var i = 0; i < drinks.length; i++) { // YC1: for loop
    var d = drinks[i];
    var matchKw  = !kw || (d.name||'').toLowerCase().includes(kw) || (d.description||'').toLowerCase().includes(kw);
    var matchCat = !category || category === 'all' || (d.category||d.type||'') === category;
    if (matchKw && matchCat) result.push(d); // YC1: if
  }
  return result; // YC1: return array
}

// ---- Validate form booking (object → object) ----
function validateBooking(data) {        // YC1: hàm có tham số, return object
  var errors = {};
  if (!data.name || data.name.length < 2) errors.name = 'Họ tên phải có ít nhất 2 ký tự';
  if (!data.phone)                       errors.phone = 'Vui lòng nhập số điện thoại';
  else if (!isValidPhone(data.phone))    errors.phone = 'Số điện thoại không hợp lệ (VD: 0901234567)';
  if (data.email && !isValidEmail(data.email)) errors.email = 'Email không đúng định dạng';
  if (!data.date)                        errors.date  = 'Vui lòng chọn ngày';
  else {
    var today = new Date().toISOString().split('T')[0];
    if (data.date < today) errors.date = 'Ngày không được trong quá khứ'; // YC1: else
  }
  if (!data.time)                        errors.time  = 'Vui lòng chọn giờ';
  if (!data.guestCount || data.guestCount < 1) errors.guestCount = 'Số khách phải lớn hơn 0';
  else if (data.guestCount > 10)               errors.guestCount = 'Tối đa 10 khách mỗi bàn';
  if (!data.tableId)                     errors.table = 'Vui lòng chọn bàn trên sơ đồ';
  return errors; // YC1: return object
}

// ---- Toast notification ----
function showToast(msg, type) {
  type = type || 'success';
  var toast = document.getElementById('cbToast');
  var toastMsg = document.getElementById('cbToastMsg');
  if (!toast || !toastMsg) return;
  var icons  = { success:'✓', error:'✕', warning:'⚠' };
  var colors = { success:'#2d6a4f', error:'#c0392b', warning:'#e09f3e' };
  toast.style.background = colors[type] || colors.success;
  toastMsg.innerHTML = '<span style="margin-right:8px">' + (icons[type]||'ℹ') + '</span>' + msg;
  new bootstrap.Toast(toast, { delay:3000 }).show();
}

// ---- Validate helpers ----
function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /^https?:\/\/.+/i.test(url);
}
function isValidPhone(phone) {
  return /^(0[35789])[0-9]{8}$/.test(phone.trim());
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
// Họ tên chỉ được chứa chữ cái (kể cả có dấu tiếng Việt) và khoảng trắng
function isValidName(name) {
  return /^[a-zA-ZÀ-ỹ]+(\s[a-zA-ZÀ-ỹ]+)*$/.test((name||'').trim());
}

// ---- Inline error helpers ----
function showError(fieldId, msg) {
  var el = document.getElementById('err-' + fieldId);
  if (el) el.textContent = msg;
  var inp = document.getElementById(fieldId);
  if (inp) inp.classList.add('is-invalid'); // YC1: classList
}
function clearError(fieldId) {
  var el = document.getElementById('err-' + fieldId);
  if (el) el.textContent = '';
  var inp = document.getElementById(fieldId);
  if (inp) inp.classList.remove('is-invalid');
}
function clearAllErrors(fields) {
  var i = 0;
  while (i < fields.length) { clearError(fields[i]); i++; } // YC1: while loop
}

// ---- Helpers ----
function genId() { return Math.random().toString(36).substr(2, 9).toUpperCase(); }
function debounce(fn, delay) {
  var t;
  return function() {
    var args = arguments, ctx = this;
    clearTimeout(t);
    t = setTimeout(function() { fn.apply(ctx, args); }, delay);
  };
}

// ---- Xử lý lỗi ảnh QR: KHÔNG thay bằng QR tự sinh giả, chỉ cảnh báo ----
function handleQrImgError(img) {
  img.onerror = null;
  img.style.display = 'none';
  if (img.nextElementSibling && img.nextElementSibling.classList && img.nextElementSibling.classList.contains('cb-qr-error-msg')) return;
  var warn = document.createElement('div');
  warn.className = 'cb-qr-error-msg small text-danger text-center mt-2';
  warn.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i>Không tải được ảnh QR chuyển khoản. Vui lòng thanh toán tiền mặt hoặc liên hệ quầy thu ngân.';
  img.parentNode.insertBefore(warn, img.nextSibling);
}

// ---- Toggle password ----
function togglePwd() {
  var inp = document.getElementById('loginPassword');
  var ic  = document.getElementById('eyeIcon');
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  if (ic) { ic.classList.toggle('bi-eye'); ic.classList.toggle('bi-eye-slash'); }
}
function toggleAdminPwd() {
  var inp = document.getElementById('adminPass');
  var ic  = document.getElementById('adminEyeIcon');
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  if (ic) { ic.classList.toggle('bi-eye'); ic.classList.toggle('bi-eye-slash'); }
}

// ---- AUTH ----
var AUTH = {
  users: [
    { username:'guest', password:'guest123', role:'guest', name:'Khách hàng' },
    { username:'admin', password:'admin123', role:'admin', name:'Quản trị viên' }
  ],
  login: function(u, p) { return this.users.find(function(x){ return x.username===u && x.password===p; }) || null; },
  save:  function(u) { sessionStorage.setItem('cbUser', JSON.stringify(u)); },
  get:   function() { try { return JSON.parse(sessionStorage.getItem('cbUser')); } catch(e) { return null; } },
  logout:function() { sessionStorage.removeItem('cbUser'); },
  isAdmin:function() { var u = this.get(); return u && u.role === 'admin'; }
};

// ---- NOTIF store (localStorage) ----
var NOTIF = {
  key: 'cbNotifications',
  getAll: function() { try { return JSON.parse(localStorage.getItem(this.key)) || []; } catch(e) { return []; } },
  add: function(item) {
    var list = this.getAll();
    list.unshift(Object.assign({}, item, { id:genId(), createdAt:new Date().toISOString(), read:false }));
    localStorage.setItem(this.key, JSON.stringify(list.slice(0, 50)));
  },
  markRead: function(id) {
    var list = this.getAll().map(function(n){ return n.id===id ? Object.assign({},n,{read:true}) : n; });
    localStorage.setItem(this.key, JSON.stringify(list));
  },
  clear: function() { localStorage.removeItem(this.key); }
};

// ---- ANALYTICS store ----
var ANALYTICS = {
  key: 'cbOrderAnalytics',
  getAll: function() { try { return JSON.parse(localStorage.getItem(this.key)) || []; } catch(e) { return []; } },
  addOrder: function(items) {
    var all = this.getAll();
    for (var i = 0; i < items.length; i++) {  // YC1: for loop
      var item = items[i];
      var ex = null;
      for (var j = 0; j < all.length; j++) { if (all[j].id === item.id) { ex = all[j]; break; } }
      if (ex) { ex.count += item.qty; ex.revenue += Number(item.price) * item.qty; }
      else all.push({ id:item.id, name:item.name, category:item.category||item.type||'', count:item.qty, revenue:Number(item.price)*item.qty });
    }
    localStorage.setItem(this.key, JSON.stringify(all));
  },
  clear: function() { localStorage.removeItem(this.key); }
};
// ============================================================
// USER STORE – đăng ký / đăng nhập bằng email hoặc STD/tên
// ============================================================
var TAX_RATE = 0.02; // 2%

var USERS = {
  key: 'cbRegisteredUsers',
  // Tài khoản admin mặc định (không lưu localStorage)
  defaults: [
    { id:'admin-001', username:'ADMIN', password:'123456', role:'admin', name:'Quản trị viên', email:'admin@cafebook.vn', phone:'', createdAt:'' }
  ],
  getAll: function() {
    try { return JSON.parse(localStorage.getItem(this.key)) || []; } catch(e) { return []; }
  },
  saveAll: function(list) {
    localStorage.setItem(this.key, JSON.stringify(list));
  },
  // Đăng ký tài khoản mới
  register: function(data) {
    // data: { name, username, email, phone, password }
    var list = this.getAll();
    // Kiểm tra trùng username, email hoặc số điện thoại
    var dup = list.find(function(u) {
      return u.username.toLowerCase() === (data.username||'').toLowerCase()
        || (data.email && u.email.toLowerCase() === data.email.toLowerCase())
        || (data.phone && u.phone === data.phone);
    });
    if (dup) return { ok: false, msg: 'Tên đăng nhập, email hoặc số điện thoại đã được sử dụng!' };
    var newUser = {
      id: 'u-' + genId(),
      username: data.username,
      password: data.password,
      role: 'guest',
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      createdAt: new Date().toISOString()
    };
    list.push(newUser);
    this.saveAll(list);
    return { ok: true, user: newUser };
  },
  // Đăng nhập (không phân biệt hoa/thường với username/email/số điện thoại)
  login: function(usernameOrEmail, password) {
    var key = (usernameOrEmail || '').trim().toLowerCase();
    // Kiểm tra admin mặc định
    for (var i = 0; i < this.defaults.length; i++) {
      var d = this.defaults[i];
      if (((d.username||'').toLowerCase() === key || (d.email||'').toLowerCase() === key) && d.password === password) return d;
    }
    // Kiểm tra user đã đăng ký
    var list = this.getAll();
    for (var j = 0; j < list.length; j++) {
      var u = list[j];
      if (((u.username||'').toLowerCase() === key || (u.email||'').toLowerCase() === key || (u.phone && u.phone === key)) && u.password === password) return u;
    }
    return null;
  },
  // Cấp lại mật khẩu cho 1 user theo id (dùng nội bộ khi cần, không còn luồng "quên mật khẩu" ở giao diện)
  resetPassword: function(userId, newPassword) {
    var list = this.getAll();
    var u = list.find(function(x){ return x.id === userId; });
    if (!u) return false;
    u.password = newPassword;
    this.saveAll(list);
    return true;
  },
  // Tìm user theo username/email/số điện thoại (không phân biệt hoa thường)
  findByIdentifier: function(identifier) {
    var key = (identifier || '').trim().toLowerCase();
    var list = this.getAll();
    return list.find(function(u) {
      return (u.username||'').toLowerCase() === key || (u.email||'').toLowerCase() === key || (u.phone && u.phone === key);
    }) || null;
  }
};

// ---- Kiểm tra email Gmail ----
function isGmailAddress(email) {
  return /^[^\s@]+@gmail\.com$/i.test((email||'').trim());
}

// ============================================================
// COUPON STORE – quản lý mã giảm giá
// Ưu đãi chỉ áp dụng cho tài khoản khách đã đăng ký & đăng nhập,
// và mỗi mã chỉ được dùng TỐI ĐA 1 LẦN / 1 tài khoản khách.
// ============================================================
var COUPONS = {
  key: 'cbCoupons',
  getAll: function() {
    try {
      var stored = JSON.parse(localStorage.getItem(this.key)) || [];
      // Gộp mặc định
      var defaults = [
        { code:'CAFEBOOK20', discount:20, type:'percent', minOrder:50000, maxUse:100, used:0, active:true, desc:'Giảm 20% cho đơn từ 50.000đ', createdAt:'2025-01-01' },
        { code:'WELCOME10',  discount:10, type:'percent', minOrder:0,     maxUse:50,  used:0, active:true, desc:'Chào mừng khách mới – giảm 10%', createdAt:'2025-01-01' }
      ];
      // Merge – ưu tiên localStorage
      defaults.forEach(function(dc) {
        if (!stored.find(function(s){ return s.code === dc.code; })) stored.unshift(dc);
      });
      return stored;
    } catch(e) { return []; }
  },
  saveAll: function(list) {
    localStorage.setItem(this.key, JSON.stringify(list));
  },
  // Tìm coupon hợp lệ. userId bắt buộc — chỉ tài khoản khách đã đăng nhập mới dùng được,
  // và mỗi tài khoản chỉ được dùng 1 mã này đúng 1 lần.
  validate: function(code, subtotal, userId) {
    if (!userId) return { ok: false, msg: 'Vui lòng đăng nhập tài khoản khách để dùng mã giảm giá' };
    var list = this.getAll();
    var c = list.find(function(x){ return x.code === (code||'').toUpperCase().trim(); });
    if (!c)            return { ok: false, msg: 'Mã giảm giá không tồn tại' };
    if (!c.active)     return { ok: false, msg: 'Mã giảm giá đã bị vô hiệu hoá' };
    if (c.maxUse && c.used >= c.maxUse) return { ok: false, msg: 'Mã giảm giá đã hết lượt sử dụng' };
    var usedBy = c.usedBy || [];
    if (usedBy.indexOf(userId) !== -1) return { ok: false, msg: 'Tài khoản của bạn đã sử dụng mã này rồi (chỉ 1 lần/tài khoản)' };
    if (c.minOrder && subtotal < c.minOrder) return { ok: false, msg: 'Đơn hàng tối thiểu ' + formatPrice(c.minOrder) + ' để dùng mã này' };
    // Tính giá trị giảm
    var discountAmt = 0;
    if (c.type === 'percent') discountAmt = Math.round(subtotal * c.discount / 100);
    else discountAmt = Number(c.discount);
    return { ok: true, coupon: c, discountAmt: discountAmt };
  },
  // Ghi nhận sử dụng — lưu lại userId để đảm bảo mỗi tài khoản chỉ dùng 1 lần
  markUsed: function(code, userId) {
    var list = this.getAll();
    var c = list.find(function(x){ return x.code === (code||'').toUpperCase().trim(); });
    if (!c) return;
    c.used = (c.used||0) + 1;
    if (userId) {
      c.usedBy = c.usedBy || [];
      if (c.usedBy.indexOf(userId) === -1) c.usedBy.push(userId);
    }
    this.saveAll(list);
  },
  // Thêm coupon mới (admin)
  add: function(data) {
    var list = this.getAll();
    if (list.find(function(x){ return x.code === data.code; })) return { ok:false, msg:'Mã đã tồn tại' };
    list.push(Object.assign({}, data, { used:0, usedBy:[], createdAt: new Date().toISOString().split('T')[0] }));
    this.saveAll(list);
    return { ok:true };
  },
  // Cập nhật trạng thái (admin)
  toggle: function(code) {
    var list = this.getAll();
    var c = list.find(function(x){ return x.code === code; });
    if (c) { c.active = !c.active; this.saveAll(list); return c.active; }
    return false;
  },
  // Xoá coupon
  remove: function(code) {
    var list = this.getAll().filter(function(x){ return x.code !== code; });
    this.saveAll(list);
  }
};