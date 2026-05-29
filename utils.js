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
  var tax   = Math.round(subtotal * 0.1);
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