/* ========== main.js — CaféBook (hoàn chỉnh, không lỗi) ========== */
/* YC1: JS thuần | YC2: Fetch .then/.catch | YC3: Validation | YC4: jQuery */

// ===== GLOBAL STATE =====
var allDrinks      = [];
var allTables      = [];
var cart           = [];
var orderCart      = [];
var selectedTable  = null;
var currentFilter  = 'all';
var orderCatFilter = 'all';
var modalDrink     = null;
var modalQty       = 1;
var currentUser    = null;
var orderType      = 'dine-in';
var payMethod      = 'cash';
var appliedCoupon  = null;
var loginRole      = 'guest';
var authMode       = 'login';
var BOOKING_DEPOSIT = 50000; // đ/bàn — tiền cọc giữ bàn qua QR (tuỳ chọn)

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  currentUser = AUTH.get();
  updateNavUser();

  // Set min booking date = today
  var bd = document.getElementById('bookDate');
  if (bd) bd.min = new Date().toISOString().split('T')[0];

  loadDrinks();
  loadTables();
  loadUserNotifications();
  updateNotifBadge();
  initPaymentUI();

  // ── Menu filter tabs (YC1: DOM click event) ──
  var filterTabs = document.getElementById('filterTabs');
  if (filterTabs) {
    filterTabs.addEventListener('click', function(e) {
      var btn = e.target.closest('.cb-filter-btn');
      if (!btn) return;
      document.querySelectorAll('#filterTabs .cb-filter-btn').forEach(function(b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderMenu(allDrinks);
    });
  }

  // ── Order category tabs (YC4: jQuery .on()) ──
  $('#orderCatTabs').on('click', '.cb-filter-btn', function() {
    $('#orderCatTabs .cb-filter-btn').removeClass('active');
    $(this).addClass('active');
    orderCatFilter = $(this).data('cat');
    renderOrderMenu(allDrinks);
  });

  // ── Search menu (YC1: input event) ──
  var si = document.getElementById('searchDrink');
  if (si) si.addEventListener('input', debounce(function() { renderMenu(allDrinks); }, 280));

  // ── Search order (YC4: jQuery) ──
  $('#orderSearchDrink').on('input', debounce(function() { renderOrderMenu(allDrinks); }, 280));

  // ── Login form submit (YC1: submit event) ──
  var lf = document.getElementById('loginForm');
  if (lf) lf.addEventListener('submit', handleLoginNew);

  // ── Register form submit ──
  var rf = document.getElementById('registerForm');
  if (rf) rf.addEventListener('submit', handleRegister);

  // ── Forgot password form submit ──
  var fpf = document.getElementById('forgotPasswordForm');
  if (fpf) fpf.addEventListener('submit', handleForgotPassword);

  // ── Booking form submit ──
  var bf = document.getElementById('bookingForm');
  if (bf) bf.addEventListener('submit', handleBooking);

  // ── Cart + Login buttons ──
  document.getElementById('cartBtn').addEventListener('click', openCart);
  document.getElementById('loginBtn').addEventListener('click', openLoginModal);

  // ── jQuery scroll effects (YC4) ──
  $(window).on('scroll', function() {
    $('.cb-navbar').toggleClass('cb-navbar-scrolled', $(this).scrollTop() > 60);
  });

  // ── Payment method radio change ──
  $(document).on('change', 'input[name="payMethod"]', function() {
    payMethod = $(this).val();
    if (payMethod === 'qr') {
      $('#qrPaymentBox').slideDown(300); // YC4: slideDown
    } else {
      $('#qrPaymentBox').slideUp(200);
    }
    updatePaymentUI();
    updateQrAmount();
  });

  // ── Coupon input uppercase ──
  var ci = document.getElementById('couponInput');
  if (ci) ci.addEventListener('input', function() {
    this.value = this.value.toUpperCase();
  });

  // ── Close mobile navbar on nav-link click ──
  document.querySelectorAll('.cb-nav-link').forEach(function(link) {
    link.addEventListener('click', function() {
      closeNavbar();
    });
  });

  // ── Close mobile navbar on click OUTSIDE ──
  document.addEventListener('click', function(e) {
    var navbar  = document.getElementById('mainNav');
    var toggler = document.querySelector('.navbar-toggler');
    if (!navbar || !navbar.classList.contains('show')) return;
    var clickedInsideNav     = navbar.contains(e.target);
    var clickedOnToggler     = toggler && toggler.contains(e.target);
    if (!clickedInsideNav && !clickedOnToggler) closeNavbar();
  });
});

// ===== PAYMENT UI INIT =====
function initPaymentUI() {
  // Set cash as active by default
  var cashOpt = document.getElementById('payOptCash');
  if (cashOpt) cashOpt.classList.add('cb-pay-active');
}

function updatePaymentUI() {
  document.querySelectorAll('.cb-payment-option').forEach(function(el) {
    el.classList.remove('cb-pay-active');
  });
  var target = payMethod === 'qr' ? document.getElementById('payOptQR') : document.getElementById('payOptCash');
  if (target) target.classList.add('cb-pay-active');
}

function selectPayMethod(method) {
  payMethod = method;
  // Update radio
  var radio = document.querySelector('input[name="payMethod"][value="' + method + '"]');
  if (radio) radio.checked = true;
  updatePaymentUI();
  if (method === 'qr') {
    $('#qrPaymentBox').slideDown(300);
    updateQrAmount();
  } else {
    $('#qrPaymentBox').slideUp(200);
  }
}

// ===== HELPERS =====
function closeNavbar() {
  var collapse = document.getElementById('mainNav');
  if (collapse && collapse.classList.contains('show')) {
    var bsCollapse = bootstrap.Collapse.getInstance(collapse);
    if (bsCollapse) bsCollapse.hide();
  }
}

// ===== NAV USER =====
function updateNavUser() {
  var btn = document.getElementById('loginBtn');
  if (!btn) return;
  if (currentUser) {
    btn.innerHTML = '<i class="bi bi-person-check-fill me-1"></i>' + currentUser.name;
    btn.onclick = showUserMenu;
  } else {
    btn.innerHTML = '<i class="bi bi-person-circle me-1"></i>Đăng nhập';
    btn.onclick = openLoginModal;
  }
}

function showUserMenu() {
  if (confirm('Xin chào ' + currentUser.name + '!\n\nĐăng xuất khỏi tài khoản?')) {
    AUTH.logout();
    currentUser = null;
    updateNavUser();
    showToast('Đã đăng xuất', 'success');
    loadUserNotifications();
    updateNotifBadge();
  }
}

// ===== AUTH MODAL =====
function openLoginModal() {
  var modal = new bootstrap.Modal(document.getElementById('loginModal'));
  modal.show();
}

function showAuthMode(mode) {
  authMode = mode;
  if (mode === 'login') {
    $('#loginFormWrap').show();
    $('#registerFormWrap').addClass('d-none');
    $('#switchLogin').addClass('active');
    $('#switchRegister').removeClass('active');
  } else {
    $('#loginFormWrap').hide();
    $('#registerFormWrap').removeClass('d-none');
    $('#switchLogin').removeClass('active');
    $('#switchRegister').addClass('active');
    clearAllErrors(['regName','regEmail','regUsername','regPassword','regPasswordConfirm']);
    $('#registerError').addClass('d-none');
    $('#registerSuccess').addClass('d-none');
  }
}

function switchLoginTab(role) {
  loginRole = role;
  if (role === 'admin') {
    $('#guestLoginHint').addClass('d-none');
    $('#adminLoginHint').removeClass('d-none');
    $('#guestAuthTabs').fadeOut(200);
    $('#adminDemoHint').removeClass('d-none');
    $('#guestLoginLinks').addClass('d-none');
    $('#loginUsername').attr('placeholder', 'ADMIN');
    $('#loginBtnLabel').text('Đăng nhập Admin');
    if (authMode !== 'login') showAuthMode('login');
  } else {
    $('#guestLoginHint').removeClass('d-none');
    $('#adminLoginHint').addClass('d-none');
    $('#guestAuthTabs').fadeIn(200);
    $('#adminDemoHint').addClass('d-none');
    $('#guestLoginLinks').removeClass('d-none');
    $('#loginUsername').attr('placeholder', 'email@example.com hoặc mã SV');
    $('#loginBtnLabel').text('Đăng nhập');
  }
  document.getElementById('tabGuest').classList.toggle('active', role === 'guest');
  document.getElementById('tabAdmin').classList.toggle('active', role === 'admin');
  clearAllErrors(['loginUsername', 'loginPassword']);
  $('#loginError').addClass('d-none');
}

function handleLoginNew(e) {
  e.preventDefault();
  var u = document.getElementById('loginUsername').value.trim();
  var p = document.getElementById('loginPassword').value;
  clearAllErrors(['loginUsername', 'loginPassword']);
  $('#loginError').addClass('d-none');
  if (!u) { showError('loginUsername', 'Vui lòng nhập tên đăng nhập / email'); return; }
  if (!p) { showError('loginPassword', 'Vui lòng nhập mật khẩu'); return; }

  // YC4: jQuery .hide()/.show()
  $('#loginBtnText').hide();
  $('#loginBtnSpinner').show();

  setTimeout(function() {
    $('#loginBtnText').show();
    $('#loginBtnSpinner').hide();
    var user = USERS.login(u, p);
    if (!user) { $('#loginError').text('Sai thông tin đăng nhập').removeClass('d-none'); return; }
    if (loginRole === 'admin' && user.role !== 'admin') {
      $('#loginError').text('Tài khoản không có quyền admin').removeClass('d-none');
      return;
    }
    AUTH.save(user);
    currentUser = user;
    bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
    updateNavUser();
    if (user.role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      showToast('Chào mừng, ' + user.name + '! ☕', 'success');
      loadUserNotifications();
    }
  }, 600);
}

function handleRegister(e) {
  e.preventDefault();
  clearAllErrors(['regName','regEmail','regStd','regUsername','regPassword','regPasswordConfirm']);
  $('#registerError').addClass('d-none');
  var name  = document.getElementById('regName').value.trim();
  var email = document.getElementById('regEmail').value.trim();
  var uname = document.getElementById('regUsername').value.trim();
  var std   = document.getElementById('regStd').value.trim();
  var pwd   = document.getElementById('regPassword').value;
  var pwd2  = document.getElementById('regPasswordConfirm').value;
  var valid = true;

  // YC3: bắt buộc Họ tên + (Gmail hợp lệ HOẶC Mã số SV) để tạo tài khoản
  if (!name || name.length < 2) { showError('regName', 'Họ tên phải có ít nhất 2 ký tự'); valid = false; }

  var hasEmail = !!email;
  var hasStd   = !!std;
  if (!hasEmail && !hasStd) {
    showError('regEmail', 'Nhập Gmail hoặc Mã số SV để đăng ký');
    showError('regStd', 'Nhập Gmail hoặc Mã số SV để đăng ký');
    valid = false;
  } else {
    if (hasEmail && !isGmailAddress(email)) { showError('regEmail', 'Chỉ chấp nhận email @gmail.com'); valid = false; }
    if (hasStd && std.length < 4)           { showError('regStd', 'Mã số SV không hợp lệ'); valid = false; }
  }

  // Tên đăng nhập: nếu bỏ trống sẽ tự tạo từ email/mã SV
  if (!uname) {
    uname = (email ? email.split('@')[0] : std) || ('user' + genId().substr(0,4));
  } else if (uname.length < 3) {
    showError('regUsername', 'Tên đăng nhập ít nhất 3 ký tự'); valid = false;
  }

  if (!pwd || pwd.length < 6)         { showError('regPassword', 'Mật khẩu ít nhất 6 ký tự'); valid = false; }
  if (pwd !== pwd2)                   { showError('regPasswordConfirm', 'Mật khẩu xác nhận không khớp'); valid = false; }
  if (!valid) return;

  $('#registerBtnText').hide(); $('#registerBtnSpinner').show();
  setTimeout(function() {
    $('#registerBtnText').show(); $('#registerBtnSpinner').hide();
    var result = USERS.register({ name:name, email:email, username:uname, std:std, password:pwd });
    if (!result.ok) { $('#registerError').text(result.msg).removeClass('d-none'); return; }
    $('#registerSuccess').text('✓ Đăng ký thành công! Bạn có thể đăng nhập ngay bằng Gmail/Mã SV vừa tạo.').removeClass('d-none');
    document.getElementById('registerForm').reset();
    setTimeout(function() { showAuthMode('login'); }, 1500);
    showToast('Đăng ký thành công! Chào mừng ' + name, 'success');
  }, 700);
}

// ===== QUÊN MẬT KHẨU =====
function handleForgotPassword(e) {
  e.preventDefault();
  clearAllErrors(['fpIdentifier','fpPhone']);
  $('#forgotError').addClass('d-none');
  $('#forgotSuccess').addClass('d-none');
  var identifier = document.getElementById('fpIdentifier').value.trim();
  var phone      = document.getElementById('fpPhone').value.trim();
  var valid = true;
  if (!identifier) { showError('fpIdentifier', 'Nhập Gmail, tên đăng nhập hoặc mã SV'); valid = false; }
  if (!phone || !isValidPhone(phone)) { showError('fpPhone', 'Số điện thoại không hợp lệ'); valid = false; }
  if (!valid) return;

  var result = RESETREQ.create(identifier, phone);
  if (!result.ok) { $('#forgotError').text(result.msg).removeClass('d-none'); return; }

  $('#forgotSuccess').text('✓ Yêu cầu đã được gửi tới quản trị viên để xác minh. Bạn sẽ nhận mật khẩu mới qua Thông báo sau khi được duyệt.').removeClass('d-none');
  document.getElementById('forgotPasswordForm').reset();
  showToast('Đã gửi yêu cầu cấp lại mật khẩu tới Admin', 'success');
}

function openForgotPassword() {
  showAuthMode('login');
  bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
  var modal = new bootstrap.Modal(document.getElementById('forgotPasswordModal'));
  modal.show();
}

function toggleRegPwd() {
  var inp = document.getElementById('regPassword');
  var ic  = document.getElementById('regEyeIcon');
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  if (ic) { ic.classList.toggle('bi-eye'); ic.classList.toggle('bi-eye-slash'); }
}

// ===== LOAD DRINKS (YC2: Fetch .then/.catch) =====
function loadDrinks() {
  var skels = '';
  for (var s = 0; s < 8; s++) { // YC1: for loop
    skels += '<div class="col-6 col-md-4 col-lg-3"><div class="cb-card-skeleton"><div class="cb-skel-img"></div><div class="cb-skel-line w-75 mt-3"></div><div class="cb-skel-line w-50 mt-2"></div></div></div>';
  }
  document.getElementById('menuLoading').innerHTML = skels;
  document.getElementById('menuGrid').innerHTML = '';
  document.getElementById('menuError').classList.add('d-none');

  var ld = document.getElementById('orderMenuLoading');
  if (ld) ld.style.display = '';

  // YC2: .then / .catch
  getDrinks()
    .then(function(drinks) {
      allDrinks = drinks;
      document.getElementById('menuLoading').innerHTML = '';
      if (ld) ld.style.display = 'none';
      renderMenu(allDrinks);
      renderOrderMenu(allDrinks);
      populateOrderTableSelect();
    })
    .catch(function(err) {
      document.getElementById('menuLoading').innerHTML = '';
      if (ld) ld.style.display = 'none';
      document.getElementById('menuError').classList.remove('d-none');
      showToast('Không thể tải thực đơn. Kiểm tra kết nối!', 'error');
      console.error('loadDrinks error:', err);
    });
}

// ===== RENDER MENU (YC1: hàm có tham số, return) =====
function getCatIcon(cat) { // YC1: hàm có tham số, return string
  var icons = { 'Cà phê':'☕','Trà':'🍵','Sinh tố':'🥤','Nước ép':'🍊','Bánh':'🍰','Snack':'🍟' };
  return icons[cat] || '🥤';
}

function renderMenu(drinks) {
  var grid = document.getElementById('menuGrid'); // YC1: getElementById
  var search = (document.getElementById('searchDrink').value || '').toLowerCase();
  var filtered = filterDrinkList(drinks, search, currentFilter); // utils.js

  if (!filtered.length) {
    grid.innerHTML = '<div class="col-12 text-center py-5 text-muted"><i class="bi bi-cup-hot" style="font-size:2.5rem;opacity:.3"></i><p class="mt-2">Không tìm thấy đồ uống phù hợp</p></div>';
    return;
  }
  var html = '';
  for (var i = 0; i < filtered.length; i++) { // YC1: for loop
    var d = filtered[i];
    html += '<div class="col-6 col-md-4 col-lg-3 cb-fade-in">'
      + '<div class="cb-drink-card" onclick="openDrinkDetail(\'' + d.id + '\')">'
      + '<div class="cb-drink-img-wrap">'
      + '<img class="cb-drink-img" src="' + (d.image||d.imageUrl||'https://placehold.co/300x200/d8f3dc/2d6a4f?text=CaféBook') + '"'
      + ' alt="' + (d.name||'') + '" loading="lazy" onerror="this.src=\'https://placehold.co/300x200/d8f3dc/2d6a4f?text=CaféBook\'"/>'
      + '<span class="cb-drink-cat-overlay">' + getCatIcon(d.category||d.type||'') + ' ' + (d.category||d.type||'Đồ uống') + '</span>'
      + '</div><div class="cb-drink-body">'
      + '<div class="cb-drink-name">' + (d.name||'') + '</div>'
      + '<div class="cb-drink-desc">' + ((d.description||'Thức uống thơm ngon').slice(0,55)) + '...</div>'
      + '<div class="cb-drink-footer">'
      + '<span class="cb-drink-price">' + formatPrice(d.price) + '</span>'
      + '<button class="cb-drink-add" onclick="event.stopPropagation();quickAddToCart(\'' + d.id + '\')" aria-label="Thêm">'
      + '<i class="bi bi-plus"></i></button>'
      + '</div></div></div></div>';
  }
  grid.innerHTML = html; // YC1: innerHTML
}

// ===== ORDER MENU =====
function renderOrderMenu(drinks) {
  var list = document.getElementById('orderMenuList');
  if (!list) return;
  var search = ($('#orderSearchDrink').val() || '').toLowerCase();
  var filtered = filterDrinkList(drinks, search, orderCatFilter);
  if (!filtered.length) {
    $('#orderMenuList').html('<div class="text-center text-muted py-3 small">Không tìm thấy món</div>'); // YC4
    return;
  }
  var html = '';
  for (var i = 0; i < filtered.length; i++) { // YC1: for
    var d = filtered[i];
    html += '<div class="cb-order-menu-item">'
      + '<img src="' + (d.image||d.imageUrl||'https://placehold.co/48x48/d8f3dc/2d6a4f?text=☕') + '"'
      + ' alt="' + (d.name||'') + '" class="cb-order-thumb" loading="lazy"'
      + ' onerror="this.src=\'https://placehold.co/48x48/d8f3dc/2d6a4f?text=CF\'"/>'
      + '<div class="cb-order-item-info"><div class="fw-500 small">' + (d.name||'') + '</div>'
      + '<div class="small text-muted">' + (d.category||d.type||'') + '</div></div>'
      + '<div class="cb-order-item-price">' + formatPrice(d.price) + '</div>'
      + '<button class="cb-drink-add" onclick="addToOrderCart(\'' + d.id + '\')" aria-label="Thêm"><i class="bi bi-plus"></i></button>'
      + '</div>';
  }
  $('#orderMenuList').html(html); // YC4: .html()
}

// ===== ORDER TYPE =====
function setOrderType(type, btn) {
  orderType = type;
  document.querySelectorAll('.cb-order-type-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  var labels = { 'dine-in':'Tại quán', 'takeaway':'Mang về', 'online':'Đặt online' };
  document.getElementById('orderTypeBadge').textContent = labels[type] || type;
  if (type === 'dine-in') {
    $('#dineInFields').slideDown(200);
    $('#deliveryFields').slideUp(200);
    $('#addressField').addClass('d-none');
  } else {
    $('#dineInFields').slideUp(200);
    $('#deliveryFields').slideDown(200);
    if (type === 'online') $('#addressField').slideDown(200);
    else $('#addressField').slideUp(200);
  }
}

// ===== ORDER CART =====
function addToOrderCart(id) {
  var d = null;
  for (var i = 0; i < allDrinks.length; i++) {
    if (String(allDrinks[i].id) === String(id)) { d = allDrinks[i]; break; }
  }
  if (!d) return;
  var ex = null;
  for (var j = 0; j < orderCart.length; j++) {
    if (orderCart[j].id === d.id) { ex = orderCart[j]; break; }
  }
  if (ex) ex.qty += 1; else orderCart.push(Object.assign({}, d, { qty:1 }));
  renderReceipt();
  showToast('+ ' + d.name, 'success');
}

function updateOrderQty(id, delta) {
  for (var i = 0; i < orderCart.length; i++) {
    if (orderCart[i].id === id) {
      orderCart[i].qty = Math.max(0, orderCart[i].qty + delta);
      if (orderCart[i].qty === 0) orderCart.splice(i, 1);
      break;
    }
  }
  renderReceipt();
  updateQrAmount();
}

// ===== COUPON =====
function applyCoupon() {
  var code = (document.getElementById('couponInput').value || '').toUpperCase().trim();
  var errEl = document.getElementById('err-coupon');
  if (errEl) errEl.textContent = '';
  $('#couponSuccess').addClass('d-none');
  if (!code) { if(errEl) errEl.textContent = 'Vui lòng nhập mã giảm giá'; return; }
  if (!orderCart.length) { if(errEl) errEl.textContent = 'Vui lòng chọn món trước khi áp mã'; return; }
  var totals = calcCartTotals(orderCart);
  var result = COUPONS.validate(code, totals.subtotal);
  if (!result.ok) {
    document.getElementById('err-coupon').textContent = result.msg;
    appliedCoupon = null;
    renderReceipt();
    return;
  }
  appliedCoupon = { code:code, coupon:result.coupon, discountAmt:result.discountAmt };
  var label = result.coupon.type === 'percent' ? result.coupon.discount + '%' : formatPrice(result.coupon.discount);
  $('#couponSuccess').text('✓ Giảm ' + label + ' — tiết kiệm ' + formatPrice(result.discountAmt)).removeClass('d-none');
  $('#removeCouponBtn').removeClass('d-none');
  var ci = document.getElementById('couponInput');
  if (ci) ci.disabled = true;
  renderReceipt();
  showToast('Áp dụng mã ' + code + ' thành công!', 'success');
}

function removeCoupon() {
  appliedCoupon = null;
  var ci = document.getElementById('couponInput');
  if (ci) { ci.value = ''; ci.disabled = false; ci.focus(); }
  var errEl = document.getElementById('err-coupon');
  if (errEl) errEl.textContent = '';
  $('#couponSuccess').addClass('d-none').text('');
  $('#removeCouponBtn').addClass('d-none');
  renderReceipt();
  showToast('Đã xóa mã giảm giá', 'warning');
}

function calcFinalTotals(cartArr) { // YC1: hàm có tham số, return object
  var totals = calcCartTotals(cartArr); // utils.js – tax 2%
  var discount = appliedCoupon ? appliedCoupon.discountAmt : 0;
  var grandTotal = Math.max(0, totals.total - discount);
  return { subtotal:totals.subtotal, tax:totals.tax, discount:discount, total:grandTotal };
}

// ===== RENDER RECEIPT =====
function renderReceipt() {
  var container = document.getElementById('receiptItems');
  var totalEl   = document.getElementById('receiptTotal');
  if (!orderCart.length) {
    container.innerHTML = '<div class="text-center py-4 text-muted"><i class="bi bi-bag" style="font-size:2rem;opacity:.3"></i><p class="mt-2 small">Chưa có món — chọn từ danh sách bên trái</p></div>';
    if (totalEl) totalEl.style.display = 'none';
    return;
  }
  var html = '';
  for (var i = 0; i < orderCart.length; i++) { // YC1: for loop
    var item = orderCart[i];
    html += '<div class="cb-receipt-item">'
      + '<img src="' + (item.image||item.imageUrl||'https://placehold.co/40x40/d8f3dc/2d6a4f?text=☕') + '" class="cb-receipt-thumb"'
      + ' onerror="this.src=\'https://placehold.co/40x40/d8f3dc/2d6a4f?text=CF\'"/>'
      + '<div style="flex:1"><div class="small fw-500">' + item.name + '</div>'
      + '<div class="small text-muted">' + formatPrice(item.price) + ' × ' + item.qty + '</div>'
      + '<div class="d-flex align-items-center gap-2 mt-1">'
      + '<div class="cb-qty-sm" onclick="updateOrderQty(\'' + item.id + '\',-1)"><i class="bi bi-dash"></i></div>'
      + '<span class="small fw-600">' + item.qty + '</span>'
      + '<div class="cb-qty-sm" onclick="updateOrderQty(\'' + item.id + '\',1)"><i class="bi bi-plus"></i></div>'
      + '</div></div>'
      + '<div class="fw-600 small cb-text-green">' + formatPrice(Number(item.price)*item.qty) + '</div>'
      + '</div>';
  }
  container.innerHTML = html; // YC1: innerHTML

  var totals = calcFinalTotals(orderCart);
  // YC1: querySelector, DOM
  document.getElementById('receiptSubtotal').textContent    = formatPrice(totals.subtotal);
  document.getElementById('receiptTax').textContent         = formatPrice(totals.tax);
  document.getElementById('receiptGrandTotal').textContent  = formatPrice(totals.total);

  var discRow = document.getElementById('receiptDiscountRow');
  if (discRow) {
    if (totals.discount > 0) {
      discRow.style.display = '';
      var discEl = document.getElementById('receiptDiscountAmt');
      if (discEl) discEl.textContent = '-' + formatPrice(totals.discount);
    } else {
      discRow.style.display = 'none';
    }
  }
  if (totalEl) totalEl.style.display = '';
  updateQrAmount();
}

function updateQrAmount() {
  var totals = calcFinalTotals(orderCart);
  var el = document.getElementById('qrAmount');
  if (el) el.textContent = formatPrice(totals.total);
  var noteEl = document.getElementById('qrTransferNote');
  if (noteEl) {
    var user = AUTH.get();
    var uname = user ? user.name.toUpperCase().replace(/\s+/g,' ').trim() : 'KHACH';
    noteEl.textContent = 'CAFEBOOK ' + uname;
  }
  // Update dynamic QR src if using API-generated QR (fallback only)
  // Primary QR is always the static PNG file
}

// ===== PLACE ORDER (YC2: POST .then/.catch) =====
function placeOrder() {
  var errEl = document.getElementById('err-order');
  errEl.textContent = '';
  if (!orderCart.length) { errEl.textContent = 'Vui lòng chọn ít nhất 1 món'; return; }

  var payload = {
    orderType: orderType,
    payMethod: payMethod,
    items: orderCart.map(function(i) {
      return { id:i.id, name:i.name, price:i.price, qty:i.qty, category:i.category||i.type||'' };
    }),
    note:   document.getElementById('orderNote').value.trim(),
    status: 'pending', type: 'order',
    createdAt: new Date().toISOString()
  };

  // YC3: Form validation
  clearAllErrors(['orderDeliveryName','orderDeliveryPhone','orderAddress']);
  if (orderType === 'dine-in') {
    payload.guestName = document.getElementById('orderGuestName').value.trim() || 'Khách';
    var tbl = document.getElementById('orderTableSelect').value;
    payload.tableId = tbl;
    payload.tableName = (function() {
      for (var i=0;i<allTables.length;i++) {
        if (String(allTables[i].id)===tbl) return allTables[i].name||'Bàn '+tbl;
      }
      return tbl||'Chưa chọn bàn';
    })();
  } else {
    var dname  = document.getElementById('orderDeliveryName').value.trim();
    var dphone = document.getElementById('orderDeliveryPhone').value.trim();
    var valid  = true;
    if (!dname)               { showError('orderDeliveryName','Vui lòng nhập họ tên'); valid=false; }
    if (!dphone)              { showError('orderDeliveryPhone','Vui lòng nhập SĐT'); valid=false; }
    else if (!isValidPhone(dphone)) { showError('orderDeliveryPhone','Số điện thoại không hợp lệ'); valid=false; }
    if (orderType === 'online') {
      var addr = document.getElementById('orderAddress').value.trim();
      if (!addr) { showError('orderAddress','Vui lòng nhập địa chỉ giao hàng'); valid=false; }
      else payload.address = addr;
    }
    if (!valid) return; // YC3: ngăn submit
    payload.guestName = dname; payload.phone = dphone;
  }

  var totals = calcFinalTotals(orderCart);
  payload.subtotal = totals.subtotal;
  payload.tax      = totals.tax;
  payload.discount = totals.discount;
  payload.total    = totals.total;
  if (appliedCoupon) payload.couponCode = appliedCoupon.code;

  // Loading (YC2)
  $('#placeOrderText').hide(); $('#placeOrderSpinner').show();
  document.getElementById('placeOrderBtn').disabled = true;

  // YC2: POST với .then/.catch
  createReservation(payload)
    .then(function(result) {
      var typeLabel = { 'dine-in':'Tại quán','takeaway':'Mang về','online':'Đặt online' }[orderType];
      var payLabel  = payMethod === 'qr' ? '💳 Quét QR' : '💵 Tiền mặt';

      document.getElementById('orderSuccessMsg').textContent = 'Đơn hàng đang được chuẩn bị. Cảm ơn bạn!';
      document.getElementById('orderRef').innerHTML =
        '<p class="mb-1"><strong>Mã đơn:</strong> #' + (result.id||genId()) + '</p>'
        + '<p class="mb-1"><strong>Hình thức:</strong> ' + typeLabel + '</p>'
        + '<p class="mb-1"><strong>Thanh toán:</strong> ' + payLabel + '</p>'
        + (totals.discount>0 ? '<p class="mb-1"><strong>Giảm giá:</strong> <span class="cb-text-green">-' + formatPrice(totals.discount) + (payload.couponCode?' ('+payload.couponCode+')':'') + '</span></p>' : '')
        + '<p class="mb-0"><strong>Tổng tiền:</strong> <span class="cb-text-green fw-bold">' + formatPrice(totals.total) + '</span></p>';

      document.getElementById('orderQrAmt').textContent = formatPrice(totals.total);
      document.getElementById('orderQrConfirmTitle').innerHTML = payMethod === 'qr'
        ? '<i class="bi bi-qr-code me-1"></i>Vui lòng quét mã để hoàn tất thanh toán'
        : '<i class="bi bi-qr-code me-1"></i>Đã chọn tiền mặt — có thể chuyển khoản thêm nếu muốn';

      new bootstrap.Modal(document.getElementById('orderSuccessModal')).show();
      NOTIF.add({ type:'order', title:'Đặt hàng thành công! (#'+(result.id||'')+')',
        message:orderCart.length+' món · '+typeLabel+' · '+payLabel+' · '+formatPrice(totals.total), icon:'bi-bag-check' });
      ANALYTICS.addOrder(payload.items);

      if (appliedCoupon) {
        COUPONS.markUsed(appliedCoupon.code);
        removeCoupon();
      }

      updateNotifBadge();
      loadUserNotifications();
      orderCart = [];
      renderReceipt();
      document.getElementById('orderNote').value = '';
    })
    .catch(function(err) {
      showToast('Đặt hàng thất bại. Vui lòng thử lại!', 'error');
      console.error(err);
    })
    .finally(function() {
      $('#placeOrderText').show(); $('#placeOrderSpinner').hide();
      document.getElementById('placeOrderBtn').disabled = false;
    });
}

// ===== CART SIDEBAR =====
function quickAddToCart(id) {
  for (var i = 0; i < allDrinks.length; i++) {
    if (String(allDrinks[i].id) === String(id)) { addToCart(allDrinks[i], 1); return; }
  }
}

function addToCart(drink, qty) {
  qty = qty || 1;
  var ex = null;
  for (var i=0;i<cart.length;i++) { if (cart[i].id===drink.id) { ex=cart[i]; break; } }
  if (ex) ex.qty += qty; else cart.push(Object.assign({}, drink, { qty:qty }));
  updateCartUI();
  showToast('+ ' + drink.name, 'success');
  var badge = document.getElementById('cartCount');
  $(badge).addClass('pop'); // YC4: jQuery
  setTimeout(function(){ $(badge).removeClass('pop'); }, 400);
}

function removeFromCart(id) {
  cart = cart.filter(function(i) { return i.id !== id; });
  updateCartUI();
}

function updateCartQty(id, delta) {
  for (var i=0;i<cart.length;i++) {
    if (cart[i].id===id) { cart[i].qty = Math.max(1, cart[i].qty+delta); break; }
  }
  updateCartUI();
}

function clearCart() { cart = []; updateCartUI(); showToast('Đã xóa giỏ hàng','success'); }

function goToOrder() {
  closeCart();
  orderCart = cart.map(function(i) { return Object.assign({},i); });
  cart = []; updateCartUI();
  renderReceipt();
  document.getElementById('order-section').scrollIntoView({behavior:'smooth'});
}

function updateCartUI() {
  var count = 0;
  for (var i=0;i<cart.length;i++) count += cart[i].qty; // YC1: for
  document.getElementById('cartCount').textContent = count; // YC1: DOM
  var totals = calcCartTotals(cart);
  var se = document.getElementById('cartSubtotal'); if(se) se.textContent=formatPrice(totals.subtotal);
  var te = document.getElementById('cartTaxAmt');   if(te) te.textContent=formatPrice(totals.tax);
  var ge = document.getElementById('cartTotal');    if(ge) ge.textContent=formatPrice(totals.total);
  var fe = document.getElementById('cartFooter');   if(fe) fe.style.display=cart.length?'':'none';

  var body = document.getElementById('cartItems');
  if (!body) return;
  if (!cart.length) {
    body.innerHTML='<div class="text-center py-5 text-muted"><i class="bi bi-bag-x" style="font-size:2.5rem;opacity:.3"></i><p class="mt-2">Giỏ hàng trống</p></div>';
    return;
  }
  var html = '';
  for (var j=0;j<cart.length;j++) { // YC1: for loop
    var item = cart[j];
    html += '<div class="cb-cart-item">'
      +'<img class="cb-cart-thumb" src="'+(item.image||item.imageUrl||'https://placehold.co/52x52/d8f3dc/2d6a4f?text=☕')+'" loading="lazy"'
      +' onerror="this.src=\'https://placehold.co/52x52/d8f3dc/2d6a4f?text=CF\'"/>'
      +'<div style="flex:1"><div class="cb-cart-item-name">'+item.name+'</div>'
      +'<div class="cb-cart-item-price">'+formatPrice(Number(item.price)*item.qty)+'</div>'
      +'<div class="cb-cart-qty">'
      +'<div class="cb-qty-sm" onclick="updateCartQty(\''+item.id+'\',-1)"><i class="bi bi-dash"></i></div>'
      +'<span style="font-size:.9rem;font-weight:600">'+item.qty+'</span>'
      +'<div class="cb-qty-sm" onclick="updateCartQty(\''+item.id+'\',1)"><i class="bi bi-plus"></i></div>'
      +'</div></div>'
      +'<span class="cb-cart-remove" onclick="removeFromCart(\''+item.id+'\')"><i class="bi bi-trash3"></i></span>'
      +'</div>';
  }
  body.innerHTML = html; // YC1: innerHTML
}

function openCart()  {
  document.getElementById('cartSidebar').classList.add('open');
  document.getElementById('cartOverlay').classList.add('active');
}
function closeCart() {
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('active');
}

// ===== DRINK DETAIL MODAL =====
function openDrinkDetail(id) {
  var d = null;
  for (var i=0;i<allDrinks.length;i++) { if(String(allDrinks[i].id)===String(id)){d=allDrinks[i];break;} }
  if (!d) return;
  modalDrink = d; modalQty = 1;
  // YC1: DOM
  document.getElementById('drinkModalName').textContent  = d.name||'';
  document.getElementById('drinkModalImg').src           = d.image||d.imageUrl||'https://placehold.co/300x200/d8f3dc/2d6a4f?text=CaféBook';
  document.getElementById('drinkModalDesc').textContent  = d.description||'Thức uống thơm ngon tại CaféBook';
  document.getElementById('drinkModalPrice').textContent = formatPrice(d.price);
  document.getElementById('drinkModalCat').textContent   = d.category||d.type||'Đồ uống';
  document.getElementById('modalQty').textContent        = '1';
  new bootstrap.Modal(document.getElementById('drinkModal')).show();
}

function changeQty(delta) {
  modalQty = Math.max(1, modalQty+delta);
  document.getElementById('modalQty').textContent = modalQty;
}
function addToCartFromModal() {
  if (!modalDrink) return;
  addToCart(modalDrink, modalQty);
  bootstrap.Modal.getInstance(document.getElementById('drinkModal')).hide();
}
function addToOrderFromModal() {
  if (!modalDrink) return;
  for (var i=0;i<modalQty;i++) addToOrderCart(modalDrink.id);
  document.getElementById('order-section').scrollIntoView({behavior:'smooth'});
}

// ===== TABLES (YC2: GET .then/.catch) =====
function loadTables() {
  document.getElementById('tablesLoading').style.display='';
  document.getElementById('tablesGrid').innerHTML='';
  getTables()
    .then(function(tables) {
      allTables = tables;
      document.getElementById('tablesLoading').style.display='none';
      renderTables(allTables);
      populateOrderTableSelect();
    })
    .catch(function() {
      document.getElementById('tablesLoading').style.display='none';
      document.getElementById('tablesGrid').innerHTML='<div class="col-12 text-center text-muted py-3">Không thể tải bàn. <span style="cursor:pointer;text-decoration:underline" onclick="loadTables()">Thử lại</span></div>';
    });
}

function populateOrderTableSelect() {
  var sel = document.getElementById('orderTableSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Chọn bàn --</option>';
  for (var i=0;i<allTables.length;i++) { // YC1: for
    var t = allTables[i];
    if ((t.status||'available')==='available') {
      // YC4: .append()
      $('#orderTableSelect').append('<option value="'+t.id+'">'+(t.name||'Bàn '+t.id)+' ('+( t.capacity||2)+' khách)</option>');
    }
  }
}

function renderTables(tables) {
  var grid = document.getElementById('tablesGrid');
  if (!tables||!tables.length) { grid.innerHTML='<div class="col-12 text-center text-muted py-3">Chưa có bàn nào.</div>'; return; }
  var icons  = {available:'bi-chair',reserved:'bi-calendar-check',occupied:'bi-person-fill'};
  var labels = {available:'Còn trống',reserved:'Đã đặt',occupied:'Đang dùng'};
  var html = '';
  for (var i=0;i<tables.length;i++) { // YC1: for loop
    var t = tables[i];
    var st = (t.status||'available').toLowerCase();
    var isSel = selectedTable && selectedTable.id===t.id;
    html += '<div class="col-6 col-md-4 col-lg-3">'
      +'<div class="cb-table-card status-'+st+(isSel?' selected':'')+'"'
      +(st==='available'?' onclick="selectTable(\''+t.id+'\')" style="cursor:pointer"':' style="opacity:.65;cursor:not-allowed"')+'>'
      +'<div class="cb-table-icon '+st+'"><i class="bi '+(icons[st]||'bi-chair')+'"></i></div>'
      +'<div class="cb-table-name">'+(t.name||'Bàn '+t.id)+'</div>'
      +'<div class="cb-table-cap"><i class="bi bi-people me-1"></i>'+(t.capacity||2)+' khách · '+(t.zone||'Indoor')+'</div>'
      +'<div class="cb-table-status-label status-label-'+st+'">'+(labels[st]||st)+'</div>'
      +(isSel?'<div class="cb-table-selected-mark"><i class="bi bi-check-circle-fill"></i></div>':'')
      +'</div></div>';
  }
  grid.innerHTML = html; // YC1: innerHTML
}

function selectTable(id) {
  for (var i=0;i<allTables.length;i++) {
    if (String(allTables[i].id)===String(id)) { selectedTable=allTables[i]; break; }
  }
  if (!selectedTable) return;
  renderTables(allTables);
  document.getElementById('selectedTableDisplay').value = (selectedTable.name||'Bàn '+selectedTable.id)+' ('+(selectedTable.capacity||2)+' khách)';
  clearError('table');
  showToast('Đã chọn '+(selectedTable.name||'Bàn '+selectedTable.id), 'success');
  if (window.innerWidth<992) document.getElementById('bookingForm').scrollIntoView({behavior:'smooth'});
}

// ===== BOOKING (YC3: validate + YC2: POST) =====
function handleBooking(e) {
  e.preventDefault();
  var data = {
    name:       document.getElementById('guestName').value.trim(),
    phone:      document.getElementById('guestPhone').value.trim(),
    email:      document.getElementById('guestEmail').value.trim(),
    date:       document.getElementById('bookDate').value,
    time:       document.getElementById('bookTime').value,
    guestCount: Number(document.getElementById('guestCount').value),
    tableId:    selectedTable ? selectedTable.id : null
  };
  var errors = validateBooking(data); // utils.js – YC3
  clearAllErrors(['guestName','guestPhone','guestEmail','bookDate','bookTime','guestCount','table']);

  // YC3: hiển thị lỗi inline từng trường
  var hasError = false;
  if (errors.name)       { showError('guestName',  errors.name);  hasError=true; }
  if (errors.phone)      { showError('guestPhone',  errors.phone); hasError=true; }
  if (errors.email)      { showError('guestEmail',  errors.email); hasError=true; }
  if (errors.date)       { showError('bookDate',    errors.date);  hasError=true; }
  if (errors.time)       { showError('bookTime',    errors.time);  hasError=true; }
  if (errors.guestCount) { showError('guestCount',  errors.guestCount); hasError=true; }
  if (errors.table)      { showError('table',       errors.table); hasError=true; }
  if (hasError) return; // YC3: ngăn submit

  if (selectedTable && selectedTable.capacity && data.guestCount > Number(selectedTable.capacity)) {
    showError('guestCount', 'Bàn này chỉ chứa tối đa '+selectedTable.capacity+' khách');
    return;
  }

  var payload = {
    guestName:  data.name, phone:data.phone, email:data.email,
    tableId:    selectedTable.id, tableName:selectedTable.name||'Bàn '+selectedTable.id,
    date:data.date, time:data.time, guestCount:data.guestCount,
    note:document.getElementById('bookNote').value.trim(),
    status:'pending', type:'reservation', createdAt:new Date().toISOString()
  };

  $('#bookingBtnText').hide(); $('#bookingBtnSpinner').show();
  document.getElementById('submitBookingBtn').disabled = true;

  createReservation(payload)
    .then(function(result) {
      // YC3: reset form sau khi thành công
      document.getElementById('bookingForm').reset();
      document.getElementById('selectedTableDisplay').value = '';
      selectedTable = null; renderTables(allTables);
      document.getElementById('bookingSuccessMsg').textContent =
        'Cảm ơn '+payload.guestName+'! Đặt bàn đang chờ xác nhận từ quán.';
      document.getElementById('bookingRef').innerHTML =
        '<p class="mb-1"><strong>Mã đặt bàn:</strong> #'+(result.id||genId())+'</p>'
        +'<p class="mb-1"><strong>Bàn:</strong> '+payload.tableName+'</p>'
        +'<p class="mb-1"><strong>Thời gian:</strong> '+formatDate(payload.date)+' lúc '+payload.time+'</p>'
        +'<p class="mb-0"><strong>Số khách:</strong> '+payload.guestCount+'</p>';
      document.getElementById('bookingQrAmt').textContent = formatPrice(BOOKING_DEPOSIT);
      document.getElementById('bookingQrNote').textContent = 'COC ' + payload.tableName + '-' + payload.phone;
      new bootstrap.Modal(document.getElementById('bookingSuccessModal')).show();
      NOTIF.add({type:'booking',title:'Đặt bàn thành công!',
        message:'Bàn '+payload.tableName+' lúc '+payload.time+' ngày '+formatDate(payload.date)+'. Chờ xác nhận.'});
      updateNotifBadge(); loadUserNotifications();
      showToast('Đặt bàn thành công! Vui lòng chờ xác nhận.','success');
    })
    .catch(function() { showToast('Đặt bàn thất bại. Vui lòng thử lại!','error'); })
    .finally(function() {
      $('#bookingBtnText').show(); $('#bookingBtnSpinner').hide();
      document.getElementById('submitBookingBtn').disabled = false;
    });
}

// ===== NOTIFICATIONS =====
function updateNotifBadge() {
  var count = 0;
  var list = NOTIF.getAll();
  for (var i=0;i<list.length;i++) { if (!list[i].read) count++; } // YC1: for
  var badge = document.getElementById('notifBadge');
  if (!badge) return;
  badge.textContent = count;
  // YC4: jQuery .show()/.hide()
  if (count > 0) $(badge).show().removeClass('d-none');
  else $(badge).hide();
}

function clearNotifications() {
  NOTIF.clear();
  loadUserNotifications();
  updateNotifBadge();
  showToast('Đã xóa thông báo','success');
}

function loadUserNotifications() {
  var container = document.getElementById('userNotifications');
  if (!container) return;
  var list = NOTIF.getAll();
  if (!list.length) {
    // YC4: jQuery .html() + .fadeIn()
    $(container).html('<div class="cb-notify-empty text-center py-5 text-muted">'
      +'<i class="bi bi-bell-slash" style="font-size:2.5rem;opacity:.35"></i>'
      +'<p class="mt-2">Chưa có thông báo.<br><small>Đặt bàn hoặc đặt món để nhận thông báo.</small></p>'
      +'</div>').hide().fadeIn(300);
    return;
  }
  var typeMap = {
    booking:{ cls:'cb-notify-confirm', badge:'<span class="badge bg-success">Đặt bàn</span>' },
    order:  { cls:'cb-notify-promo',   badge:'<span class="badge bg-warning text-dark">Đơn hàng</span>' },
    promo:  { cls:'cb-notify-promo',   badge:'<span class="badge bg-warning text-dark">Khuyến mãi</span>' },
    info:   { cls:'cb-notify-info',    badge:'<span class="badge bg-info text-dark">Thông tin</span>' }
  };
  var html = '';
  for (var i=0;i<list.length;i++) { // YC1: for
    var n = list[i];
    var t = typeMap[n.type]||typeMap.info;
    var time = n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : '';
    html += '<div class="cb-notify-item '+t.cls+(n.read?'':' cb-notify-unread')+'">'
      +'<div class="d-flex justify-content-between align-items-start gap-2"><strong class="small">'+n.title+'</strong>'+t.badge+'</div>'
      +'<p class="small text-muted mb-0 mt-1">'+n.message+'</p>'
      +(time?'<p class="small text-muted mb-0 mt-1 opacity-75"><i class="bi bi-clock me-1"></i>'+time+'</p>':'')
      +'</div>';
  }
  // YC4: .html() + .slideDown()
  $(container).html(html).hide().slideDown(250);
}