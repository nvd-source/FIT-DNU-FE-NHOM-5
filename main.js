/* ========== main.js ========== */
/* YC1: JS thuần – biến, hàm, vòng lặp, DOM, sự kiện */
/* YC2: Fetch API + Promise | YC3: Form Validation | YC4: jQuery */

// ===== STATE VARIABLES (YC1: khai báo biến đúng kiểu) =====
var allDrinks     = [];   // array
var allTables     = [];   // array
var cart          = [];   // array
var orderCart     = [];   // array
var selectedTable = null; // object | null
var currentFilter = 'all';  // string
var orderCatFilter= 'all';  // string
var modalDrink    = null; // object | null
var modalQty      = 1;    // number
var currentUser   = null; // object | null
var orderType     = 'dine-in'; // string
var payMethod     = 'cash';    // string

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  currentUser = AUTH.get();
  updateNavUser();

  // Set min date
  var bd = document.getElementById('bookDate');
  if (bd) bd.min = new Date().toISOString().split('T')[0];

  loadDrinks();
  loadTables();
  loadUserNotifications();
  updateNotifBadge();

  // Filter tabs – menu (YC1: DOM event click, không dùng jQuery)
  var filterTabs = document.getElementById('filterTabs');
  if (filterTabs) {
    filterTabs.addEventListener('click', function(e) {
      var btn = e.target.closest('.cb-filter-btn');
      if (!btn) return;
      document.querySelectorAll('#filterTabs .cb-filter-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderMenu(allDrinks);
    });
  }

  // Filter tabs – order section (YC4: jQuery .on())
  $('#orderCatTabs').on('click', '.cb-filter-btn', function() {
    $('#orderCatTabs .cb-filter-btn').removeClass('active');
    $(this).addClass('active');
    orderCatFilter = $(this).data('cat');
    renderOrderMenu(allDrinks);
  });

  // Search menu (YC1: input event)
  var si = document.getElementById('searchDrink');
  if (si) si.addEventListener('input', debounce(function() { renderMenu(allDrinks); }, 280));

  // Search order (YC4: jQuery .on())
  $('#orderSearchDrink').on('input', debounce(function() { renderOrderMenu(allDrinks); }, 280));

  // Login form (YC1: submit event)
  var lf = document.getElementById('loginForm');
  if (lf) lf.addEventListener('submit', handleLogin);

  // Booking form (YC1: submit event)
  var bf = document.getElementById('bookingForm');
  if (bf) bf.addEventListener('submit', handleBooking);

  // Cart button (YC1: click event)
  document.getElementById('cartBtn').addEventListener('click', openCart);
  document.getElementById('loginBtn').addEventListener('click', openLoginModal);

  // jQuery scroll effect (YC4: sự kiện jQuery)
  $(window).on('scroll', function() {
    $('.cb-navbar').toggleClass('cb-navbar-scrolled', $(this).scrollTop() > 60);
  });

  // jQuery: ẩn/hiện QR khi chọn phương thức thanh toán (YC4: .on())
  $('input[name="payMethod"]').on('change', function() {
    if ($(this).val() === 'qr') {
      $('#qrPaymentBox').slideDown(300); // YC4: slideDown
    } else {
      $('#qrPaymentBox').slideUp(200); // YC4: slideUp
    }
    payMethod = $(this).val();
    updateQrAmount();
  });
});

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
    AUTH.logout(); currentUser = null; updateNavUser();
    showToast('Đã đăng xuất', 'success'); loadUserNotifications(); updateNotifBadge();
  }
}

// ===== LOGIN =====
function openLoginModal() { new bootstrap.Modal(document.getElementById('loginModal')).show(); }

var loginRole = 'guest';
function switchLoginTab(role) {
  loginRole = role;
  // YC4: jQuery .attr(), .toggleClass()
  $('#loginUsername').attr('placeholder', role === 'admin' ? 'admin' : 'guest');
  $('#loginPassword').attr('placeholder', role === 'admin' ? 'admin123' : 'guest123');
  $('#tabGuest').toggleClass('active', role === 'guest');
  $('#tabAdmin').toggleClass('active', role === 'admin');

  // Hiển thị hint tương ứng (YC4: .toggleClass)
  $('#guestLoginHint').toggleClass('d-none', role !== 'guest');
  $('#adminLoginHint').toggleClass('d-none', role !== 'admin');

  // Cập nhật label nút
  $('#loginBtnLabel').text(role === 'admin' ? 'Đăng nhập Admin' : 'Đăng nhập');

  // Xóa form và lỗi
  $('#loginUsername, #loginPassword').val('');
  clearAllErrors(['loginUsername', 'loginPassword']);
  $('#loginError').addClass('d-none');
}

function handleLogin(e) {
  e.preventDefault();
  var u = document.getElementById('loginUsername').value.trim(); // YC1: string
  var p = document.getElementById('loginPassword').value;
  clearAllErrors(['loginUsername', 'loginPassword']);
  document.getElementById('loginError').classList.add('d-none');
  var valid = true; // YC1: boolean
  if (!u) { showError('loginUsername', 'Vui lòng nhập tên đăng nhập'); valid = false; }
  if (!p) { showError('loginPassword', 'Vui lòng nhập mật khẩu'); valid = false; }
  if (!valid) return; // YC3: ngăn submit khi không hợp lệ

  // YC4: jQuery .html(), .show()/.hide()
  $('#loginBtnText').hide(); $('#loginBtnSpinner').show();

  setTimeout(function() {
    $('#loginBtnText').show(); $('#loginBtnSpinner').hide();
    var user = AUTH.login(u, p);
    if (!user) { $('#loginError').text('Sai tên đăng nhập hoặc mật khẩu').removeClass('d-none'); return; }

    // FIX: Kiểm tra cross-role — admin tab chỉ cho admin, guest tab chỉ cho guest
    if (loginRole === 'admin' && user.role !== 'admin') {
      $('#loginError').text('Tài khoản này không có quyền quản trị').removeClass('d-none');
      return;
    }
    if (loginRole === 'guest' && user.role === 'admin') {
      $('#loginError').text('Đây là tài khoản admin — vui lòng chuyển sang tab "Quản trị viên"').removeClass('d-none');
      return;
    }

    AUTH.save(user); currentUser = user;
    bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
    updateNavUser();
    if (user.role === 'admin') { window.location.href = 'admin.html'; }
    else { showToast('Chào mừng, ' + user.name + '! ☕', 'success'); loadUserNotifications(); }
  }, 700);
}

// ===== LOAD DRINKS (YC2: Fetch API + loading) =====
function loadDrinks() {
  // Skeleton loading (YC2)
  var skels = '';
  for (var s = 0; s < 8; s++) { // YC1: for loop
    skels += '<div class="col-6 col-md-4 col-lg-3"><div class="cb-card-skeleton"><div class="cb-skel-img"></div><div class="cb-skel-line w-75 mt-3"></div><div class="cb-skel-line w-50 mt-2"></div></div></div>';
  }
  document.getElementById('menuLoading').innerHTML = skels; // YC1: innerHTML
  document.getElementById('menuGrid').innerHTML = '';
  document.getElementById('menuError').classList.add('d-none');
  document.getElementById('orderMenuLoading').style.display = '';

  // YC2: getDrinks dùng .then/.catch (qua apiFetchPromise trong api.js)
  getDrinks()
    .then(function(drinks) {
      allDrinks = drinks;
      document.getElementById('menuLoading').innerHTML = ''; // YC1: DOM xóa
      document.getElementById('orderMenuLoading').style.display = 'none';
      renderMenu(allDrinks);
      renderOrderMenu(allDrinks);
      populateOrderTableSelect();
    })
    .catch(function(err) { // YC2: .catch xử lý lỗi
      document.getElementById('menuLoading').innerHTML = '';
      document.getElementById('orderMenuLoading').style.display = 'none';
      document.getElementById('menuError').classList.remove('d-none'); // YC1: classList
      showToast('Không thể tải thực đơn. Kiểm tra kết nối!', 'error');
      console.error('loadDrinks error:', err);
    });
}

// ===== RENDER MENU (YC1: hàm có tham số, return) =====
function renderMenu(drinks) {
  var grid = document.getElementById('menuGrid'); // YC1: getElementById
  var search = (document.getElementById('searchDrink').value || '').toLowerCase();
  // Dùng hàm filterDrinkList từ utils.js (YC1: gọi hàm có tham số, return)
  var filtered = filterDrinkList(drinks, search, currentFilter);

  if (!filtered.length) {
    grid.innerHTML = '<div class="col-12 text-center py-5 text-muted"><i class="bi bi-cup-hot" style="font-size:2.5rem;opacity:.3"></i><p class="mt-2">Không tìm thấy đồ uống phù hợp</p></div>';
    return;
  }
  // YC1: for loop tạo HTML
  var html = '';
  for (var i = 0; i < filtered.length; i++) {
    var d = filtered[i];
    var catIcon = getCatIcon(d.category || d.type || '');
    html += '<div class="col-6 col-md-4 col-lg-3">'
      + '<div class="cb-drink-card" onclick="openDrinkDetail(\'' + d.id + '\')">'
      + '<div class="cb-drink-img-wrap">'
      + '<img class="cb-drink-img" src="' + (d.image||d.imageUrl||'https://placehold.co/300x200/d8f3dc/2d6a4f?text=CaféBook') + '" alt="' + (d.name||'') + '" onerror="this.src=\'https://placehold.co/300x200/d8f3dc/2d6a4f?text=CaféBook\'"/>'
      + '<span class="cb-drink-cat-overlay">' + catIcon + ' ' + (d.category||d.type||'Đồ uống') + '</span>'
      + '</div>'
      + '<div class="cb-drink-body">'
      + '<div class="cb-drink-name">' + (d.name||'') + '</div>'
      + '<div class="cb-drink-desc">' + ((d.description||'Thức uống thơm ngon').slice(0,55)) + '...</div>'
      + '<div class="cb-drink-footer">'
      + '<span class="cb-drink-price">' + formatPrice(d.price) + '</span>'
      + '<button class="cb-drink-add" onclick="event.stopPropagation();quickAddToCart(\'' + d.id + '\')"><i class="bi bi-plus"></i></button>'
      + '</div></div></div></div>';
  }
  grid.innerHTML = html; // YC1: innerHTML
}

// Icon theo danh mục (YC1: hàm có tham số, return string)
function getCatIcon(cat) {
  var icons = { 'Cà phê':'☕', 'Trà':'🍵', 'Sinh tố':'🥤', 'Nước ép':'🍊', 'Bánh':'🍰', 'Snack':'🍟' };
  return icons[cat] || '🥤';
}

// ===== ORDER MENU =====
function renderOrderMenu(drinks) {
  var list = document.getElementById('orderMenuList');
  if (!list) return;
  var search = ($('#orderSearchDrink').val() || '').toLowerCase();
  var filtered = filterDrinkList(drinks, search, orderCatFilter);

  if (!filtered.length) {
    // YC4: jQuery .html()
    $('#orderMenuList').html('<div class="text-center text-muted py-3 small">Không tìm thấy món</div>');
    return;
  }
  var html = '';
  for (var i = 0; i < filtered.length; i++) { // YC1: for loop
    var d = filtered[i];
    html += '<div class="cb-order-menu-item">'
      + '<img src="' + (d.image||d.imageUrl||'https://placehold.co/48x48/d8f3dc/2d6a4f?text=☕') + '" alt="' + (d.name||'') + '" class="cb-order-thumb" onerror="this.src=\'https://placehold.co/48x48/d8f3dc/2d6a4f?text=CF\'"/>'
      + '<div class="cb-order-item-info"><div class="fw-500 small">' + (d.name||'') + '</div><div class="small text-muted">' + (d.category||d.type||'') + '</div></div>'
      + '<div class="cb-order-item-price">' + formatPrice(d.price) + '</div>'
      + '<button class="cb-drink-add" onclick="addToOrderCart(\'' + d.id + '\')"><i class="bi bi-plus"></i></button>'
      + '</div>';
  }
  $('#orderMenuList').html(html); // YC4: .html()
}

// ===== ORDER TYPE =====
function setOrderType(type, btn) {
  orderType = type;
  document.querySelectorAll('.cb-order-type-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  var labels = { 'dine-in':'Tại quán', 'takeaway':'Mang về', 'online':'Đặt online' };
  document.getElementById('orderTypeBadge').textContent = labels[type] || type;

  if (type === 'dine-in') {
    $('#dineInFields').slideDown(200); // YC4: slideDown
    $('#deliveryFields').slideUp(200);
    // FIX: dùng slideUp thay vì addClass('d-none') để tránh lần sau slideDown bị chặn bởi !important
    $('#addressField').slideUp(200);
  } else {
    $('#dineInFields').slideUp(200);
    // FIX: phải removeClass('d-none') trước slideDown vì Bootstrap d-none có display:none !important
    $('#deliveryFields').removeClass('d-none').slideDown(200);
    if (type === 'online') {
      $('#addressField').removeClass('d-none').slideDown(200);
    } else {
      $('#addressField').slideUp(200);
    }
  }
  // Cập nhật QR nếu đang chọn QR
  if (payMethod === 'qr') updateQrAmount();
}

// ===== PAYMENT METHOD =====
function selectPayMethod(method) {
  payMethod = method;
  document.querySelectorAll('.cb-payment-option').forEach(function(el) { el.classList.remove('cb-pay-active'); });
  var opt = method === 'cash' ? document.getElementById('payOptCash') : document.getElementById('payOptQR');
  if (opt) opt.classList.add('cb-pay-active');
  if (method === 'qr') { $('#qrPaymentBox').slideDown(300); updateQrAmount(); }
  else $('#qrPaymentBox').slideUp(200);
}

function updateQrAmount() {
  var totals = calcCartTotals(orderCart);
  var el = document.getElementById('qrAmount');
  if (el) el.textContent = formatPrice(totals.total);
}

// ===== ORDER CART =====
function addToOrderCart(id) {
  var d = null;
  for (var i = 0; i < allDrinks.length; i++) { // YC1: for loop
    if (String(allDrinks[i].id) === String(id)) { d = allDrinks[i]; break; }
  }
  if (!d) return;
  var ex = null;
  for (var j = 0; j < orderCart.length; j++) {
    if (orderCart[j].id === d.id) { ex = orderCart[j]; break; }
  }
  if (ex) ex.qty += 1; else orderCart.push(Object.assign({}, d, { qty:1 }));
  renderReceipt();
  showToast('Thêm ' + d.name, 'success');
}

function updateOrderQty(id, delta) {
  for (var i = 0; i < orderCart.length; i++) { // YC1: for
    if (orderCart[i].id === id) {
      orderCart[i].qty = Math.max(0, orderCart[i].qty + delta);
      if (orderCart[i].qty === 0) { orderCart.splice(i, 1); }
      break;
    }
  }
  renderReceipt();
  updateQrAmount();
}

function renderReceipt() {
  var container = document.getElementById('receiptItems');
  var totalEl   = document.getElementById('receiptTotal');
  if (!orderCart.length) {
    container.innerHTML = '<div class="text-center py-4 text-muted"><i class="bi bi-bag" style="font-size:2rem;opacity:.3"></i><p class="mt-2 small">Chưa có món nào</p></div>';
    if (totalEl) totalEl.style.display = 'none';
    return;
  }
  var html = '';
  for (var i = 0; i < orderCart.length; i++) { // YC1: for loop
    var item = orderCart[i];
    html += '<div class="cb-receipt-item">'
      + '<img src="' + (item.image||item.imageUrl||'https://placehold.co/40x40/d8f3dc/2d6a4f?text=☕') + '" class="cb-receipt-thumb" onerror="this.src=\'https://placehold.co/40x40/d8f3dc/2d6a4f?text=CF\'"/>'
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
  // YC1: innerHTML
  container.innerHTML = html;
  var totals = calcCartTotals(orderCart); // dùng hàm từ utils.js
  document.getElementById('receiptSubtotal').textContent = formatPrice(totals.subtotal);
  document.getElementById('receiptTax').textContent      = formatPrice(totals.tax);
  document.getElementById('receiptGrandTotal').textContent = formatPrice(totals.total);
  if (totalEl) totalEl.style.display = '';
  updateQrAmount();
}

// ===== PLACE ORDER (YC2: POST tới API) =====
function placeOrder() {
  var errEl = document.getElementById('err-order');
  errEl.textContent = '';
  if (!orderCart.length) { errEl.textContent = 'Vui lòng chọn ít nhất 1 món'; return; }

  var payload = {
    orderType: orderType,
    payMethod: payMethod, // string
    items: orderCart.map(function(i) { return { id:i.id, name:i.name, price:i.price, qty:i.qty, category:i.category||i.type||'' }; }),
    note:  document.getElementById('orderNote').value.trim(),
    status:'pending', type:'order', createdAt: new Date().toISOString()
  };

  // Validate theo loại đơn (YC3: Form Validation)
  if (orderType === 'dine-in') {
    payload.guestName = document.getElementById('orderGuestName').value.trim() || 'Khách';
    var tbl = document.getElementById('orderTableSelect').value;
    payload.tableId   = tbl;
    payload.tableName = tbl ? (function() {
      for (var i=0;i<allTables.length;i++) { if (String(allTables[i].id)===tbl) return allTables[i].name||'Bàn '+tbl; }
      return tbl;
    })() : 'Chưa chọn bàn';
  } else {
    var name  = document.getElementById('orderDeliveryName').value.trim();
    var phone = document.getElementById('orderDeliveryPhone').value.trim();
    clearAllErrors(['orderDeliveryName','orderDeliveryPhone','orderAddress']);
    var valid = true;
    if (!name)                  { showError('orderDeliveryName','Vui lòng nhập họ tên'); valid=false; }
    if (!phone)                 { showError('orderDeliveryPhone','Vui lòng nhập SĐT'); valid=false; }
    else if (!isValidPhone(phone)) { showError('orderDeliveryPhone','Số điện thoại không hợp lệ'); valid=false; }
    if (orderType==='online') {
      var addr = document.getElementById('orderAddress').value.trim();
      if (!addr) { showError('orderAddress','Vui lòng nhập địa chỉ'); valid=false; }
      else payload.address = addr;
    }
    if (!valid) return; // YC3
    payload.guestName = name; payload.phone = phone;
  }

  var totals = calcCartTotals(orderCart);
  payload.subtotal = totals.subtotal; payload.tax = totals.tax; payload.total = totals.total;

  // Loading state (YC2)
  $('#placeOrderText').hide(); $('#placeOrderSpinner').show();
  document.getElementById('placeOrderBtn').disabled = true;

  // YC2: POST dùng .then/.catch
  createReservation(payload)
    .then(function(result) {
      var typeLabel = { 'dine-in':'Tại quán', 'takeaway':'Mang về', 'online':'Đặt online' }[orderType];
      var payLabel  = payMethod === 'qr' ? 'Quét QR' : 'Tiền mặt';
      document.getElementById('orderSuccessMsg').textContent = 'Đơn hàng đang được chuẩn bị. Cảm ơn bạn!';
      document.getElementById('orderRef').innerHTML =
        '<p class="mb-1"><strong>Mã đơn:</strong> #' + (result.id||genId()) + '</p>'
        + '<p class="mb-1"><strong>Hình thức:</strong> ' + typeLabel + '</p>'
        + '<p class="mb-1"><strong>Thanh toán:</strong> ' + payLabel + '</p>'
        + '<p class="mb-0"><strong>Tổng tiền:</strong> <span class="cb-text-green fw-bold">' + formatPrice(payload.total) + '</span></p>';

      // Hiện QR nếu chọn QR
      if (payMethod === 'qr') {
        $('#orderQrConfirm').slideDown(300); // YC4
        document.getElementById('orderQrAmt').textContent = formatPrice(payload.total);
      } else {
        $('#orderQrConfirm').hide();
      }

      new bootstrap.Modal(document.getElementById('orderSuccessModal')).show();
      NOTIF.add({ type:'order', title:'Đặt hàng thành công! (#'+(result.id||'')+')', message: orderCart.length + ' món · ' + typeLabel + ' · ' + payLabel + ' · ' + formatPrice(payload.total), icon:'bi-bag-check' });
      ANALYTICS.addOrder(payload.items);
      updateNotifBadge(); loadUserNotifications();
      orderCart = []; renderReceipt();
      document.getElementById('orderNote').value = '';
    })
    .catch(function(err) { // YC2: .catch
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
  showToast('Đã thêm ' + drink.name + ' ☕', 'success');
  // YC4: jQuery animation
  var badge = document.getElementById('cartCount');
  $(badge).addClass('pop');
  setTimeout(function(){ $(badge).removeClass('pop'); }, 400);
}

function removeFromCart(id) {
  cart = cart.filter(function(i) { return i.id !== id; });
  updateCartUI();
}

function updateCartQty(id, delta) {
  for (var i=0;i<cart.length;i++) {
    if (cart[i].id === id) { cart[i].qty = Math.max(1, cart[i].qty + delta); break; }
  }
  updateCartUI();
}

function clearCart() { cart = []; updateCartUI(); showToast('Đã xóa giỏ hàng', 'success'); }

function goToOrder() {
  closeCart();
  orderCart = cart.map(function(i) { return Object.assign({}, i); });
  cart = []; updateCartUI();
  renderReceipt();
  document.getElementById('order-section').scrollIntoView({ behavior:'smooth' });
}

function updateCartUI() {
  var count = 0;
  for (var i=0;i<cart.length;i++) count += cart[i].qty; // YC1: for loop
  document.getElementById('cartCount').textContent = count; // YC1: DOM

  var totals = calcCartTotals(cart); // dùng hàm utils.js
  var se = document.getElementById('cartSubtotal'); if(se) se.textContent = formatPrice(totals.subtotal);
  var te = document.getElementById('cartTaxAmt');   if(te) te.textContent = formatPrice(totals.tax);
  var ge = document.getElementById('cartTotal');    if(ge) ge.textContent = formatPrice(totals.total);
  var fe = document.getElementById('cartFooter');   if(fe) fe.style.display = cart.length ? '' : 'none';

  var body = document.getElementById('cartItems');
  if (!body) return;
  if (!cart.length) {
    body.innerHTML = '<div class="text-center py-5 text-muted"><i class="bi bi-bag-x" style="font-size:2.5rem;opacity:.3"></i><p class="mt-2">Giỏ hàng trống</p></div>';
    return;
  }
  var html = '';
  for (var j=0;j<cart.length;j++) { // YC1: for loop
    var item = cart[j];
    html += '<div class="cb-cart-item">'
      + '<img class="cb-cart-thumb" src="' + (item.image||item.imageUrl||'https://placehold.co/52x52/d8f3dc/2d6a4f?text=☕') + '" alt="' + item.name + '" onerror="this.src=\'https://placehold.co/52x52/d8f3dc/2d6a4f?text=CF\'"/>'
      + '<div style="flex:1"><div class="cb-cart-item-name">' + item.name + '</div>'
      + '<div class="cb-cart-item-price">' + formatPrice(Number(item.price)*item.qty) + '</div>'
      + '<div class="cb-cart-qty">'
      + '<div class="cb-qty-sm" onclick="updateCartQty(\'' + item.id + '\',-1)"><i class="bi bi-dash"></i></div>'
      + '<span style="font-size:.9rem;font-weight:600">' + item.qty + '</span>'
      + '<div class="cb-qty-sm" onclick="updateCartQty(\'' + item.id + '\',1)"><i class="bi bi-plus"></i></div>'
      + '</div></div>'
      + '<span class="cb-cart-remove" onclick="removeFromCart(\'' + item.id + '\')"><i class="bi bi-trash3"></i></span>'
      + '</div>';
  }
  body.innerHTML = html; // YC1: innerHTML
}

function openCart()  { document.getElementById('cartSidebar').classList.add('open'); document.getElementById('cartOverlay').classList.add('active'); }
function closeCart() { document.getElementById('cartSidebar').classList.remove('open'); document.getElementById('cartOverlay').classList.remove('active'); }

// ===== DRINK DETAIL MODAL =====
function openDrinkDetail(id) {
  var d = null;
  for (var i=0;i<allDrinks.length;i++) { if (String(allDrinks[i].id)===String(id)) { d=allDrinks[i]; break; } }
  if (!d) return;
  modalDrink = d; modalQty = 1;
  // YC1: DOM thao tác
  document.getElementById('drinkModalName').textContent  = d.name || '';
  document.getElementById('drinkModalImg').src           = d.image || d.imageUrl || 'https://placehold.co/300x200/d8f3dc/2d6a4f?text=CaféBook';
  document.getElementById('drinkModalDesc').textContent  = d.description || 'Thức uống thơm ngon tại CaféBook';
  document.getElementById('drinkModalPrice').textContent = formatPrice(d.price);
  document.getElementById('drinkModalCat').textContent   = d.category || d.type || 'Đồ uống';
  document.getElementById('modalQty').textContent        = '1';
  new bootstrap.Modal(document.getElementById('drinkModal')).show();
}
function changeQty(delta) { modalQty = Math.max(1, modalQty + delta); document.getElementById('modalQty').textContent = modalQty; }
function addToCartFromModal() { if (!modalDrink) return; addToCart(modalDrink, modalQty); bootstrap.Modal.getInstance(document.getElementById('drinkModal')).hide(); }
function addToOrderFromModal() { if (!modalDrink) return; for (var i=0;i<modalQty;i++) addToOrderCart(modalDrink.id); document.getElementById('order-section').scrollIntoView({behavior:'smooth'}); }

// ===== TABLES (YC2: GET) =====
function loadTables() {
  document.getElementById('tablesLoading').style.display = '';
  document.getElementById('tablesGrid').innerHTML = '';
  getTables() // YC2: .then/.catch
    .then(function(tables) {
      allTables = tables;
      document.getElementById('tablesLoading').style.display = 'none';
      renderTables(allTables);
      populateOrderTableSelect();
    })
    .catch(function() {
      document.getElementById('tablesLoading').style.display = 'none';
      document.getElementById('tablesGrid').innerHTML = '<div class="col-12 text-center text-muted py-3"><p>Không thể tải bàn. <span class="text-decoration-underline" style="cursor:pointer" onclick="loadTables()">Thử lại</span></p></div>';
    });
}

function populateOrderTableSelect() {
  var sel = document.getElementById('orderTableSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Chọn bàn --</option>';
  for (var i=0;i<allTables.length;i++) { // YC1: for
    var t = allTables[i];
    if ((t.status||'available') === 'available') {
      // YC4: jQuery .append()
      $('#orderTableSelect').append('<option value="' + t.id + '">' + (t.name||'Bàn '+t.id) + ' (' + (t.capacity||2) + ' khách)</option>');
    }
  }
}

function renderTables(tables) {
  var grid = document.getElementById('tablesGrid');
  if (!tables || !tables.length) { grid.innerHTML = '<div class="col-12 text-center text-muted py-3">Chưa có bàn nào.</div>'; return; }
  var icons  = { available:'bi-chair', reserved:'bi-calendar-check', occupied:'bi-person-fill' };
  var labels = { available:'Còn trống', reserved:'Đã đặt', occupied:'Đang dùng' };
  var html = '';
  for (var i=0;i<tables.length;i++) { // YC1: for loop
    var t = tables[i];
    var st = (t.status||'available').toLowerCase();
    var isSel = selectedTable && selectedTable.id === t.id;
    html += '<div class="col-6 col-md-4 col-lg-3">'
      + '<div class="cb-table-card status-' + st + (isSel?' selected':'') + '"'
      + (st==='available' ? ' onclick="selectTable(\'' + t.id + '\')" style="cursor:pointer"' : ' style="opacity:.65;cursor:not-allowed"') + '>'
      + '<div class="cb-table-icon ' + st + '"><i class="bi ' + (icons[st]||'bi-chair') + '"></i></div>'
      + '<div class="cb-table-name">' + (t.name||'Bàn '+t.id) + '</div>'
      + '<div class="cb-table-cap"><i class="bi bi-people me-1"></i>' + (t.capacity||2) + ' khách · ' + (t.zone||'Indoor') + '</div>'
      + '<div class="cb-table-status-label status-label-' + st + '">' + (labels[st]||st) + '</div>'
      + (isSel ? '<div class="cb-table-selected-mark"><i class="bi bi-check-circle-fill"></i></div>' : '')
      + '</div></div>';
  }
  grid.innerHTML = html; // YC1: innerHTML
}

function selectTable(id) {
  for (var i=0;i<allTables.length;i++) {
    if (String(allTables[i].id)===String(id)) { selectedTable=allTables[i]; break; }
  }
  if (!selectedTable) return;
  renderTables(allTables);
  document.getElementById('selectedTableDisplay').value = (selectedTable.name||'Bàn '+selectedTable.id) + ' (' + (selectedTable.capacity||2) + ' khách)';
  clearError('table');
  showToast('Đã chọn ' + (selectedTable.name||'Bàn '+selectedTable.id), 'success');
  if (window.innerWidth < 992) document.getElementById('bookingForm').scrollIntoView({ behavior:'smooth' });
}

// ===== BOOKING (YC3: validate + YC2: POST) =====
function handleBooking(e) {
  e.preventDefault();
  // YC3: dùng hàm validateBooking từ utils.js (return object lỗi)
  var data = {
    name:       document.getElementById('guestName').value.trim(),
    phone:      document.getElementById('guestPhone').value.trim(),
    email:      document.getElementById('guestEmail').value.trim(),
    date:       document.getElementById('bookDate').value,
    time:       document.getElementById('bookTime').value,
    guestCount: Number(document.getElementById('guestCount').value),
    tableId:    selectedTable ? selectedTable.id : null
  };
  var errors = validateBooking(data); // YC1: hàm có tham số, return object
  clearAllErrors(['guestName','guestPhone','guestEmail','bookDate','bookTime','guestCount','table']);

  // YC3: hiển thị lỗi inline
  if (errors.name)       showError('guestName',  errors.name);
  if (errors.phone)      showError('guestPhone',  errors.phone);
  if (errors.email)      showError('guestEmail',  errors.email);
  if (errors.date)       showError('bookDate',    errors.date);
  if (errors.time)       showError('bookTime',    errors.time);
  if (errors.guestCount) showError('guestCount',  errors.guestCount);
  if (errors.table)      showError('table',       errors.table);

  if (Object.keys(errors).length > 0) return; // YC3: ngăn submit

  // Validate sức chứa bàn
  if (selectedTable && selectedTable.capacity && data.guestCount > Number(selectedTable.capacity)) {
    showError('guestCount', 'Bàn này chỉ chứa tối đa ' + selectedTable.capacity + ' khách');
    return;
  }

  var payload = {
    guestName:  data.name, phone: data.phone, email: data.email,
    tableId:    selectedTable.id, tableName: selectedTable.name||'Bàn '+selectedTable.id,
    date: data.date, time: data.time, guestCount: data.guestCount,
    note: document.getElementById('bookNote').value.trim(),
    status:'pending', type:'reservation', createdAt: new Date().toISOString()
  };

  // Loading (YC2)
  $('#bookingBtnText').hide(); $('#bookingBtnSpinner').show();
  document.getElementById('submitBookingBtn').disabled = true;

  // YC2: POST .then/.catch
  createReservation(payload)
    .then(function(result) {
      // YC3: reset form sau khi thành công
      document.getElementById('bookingForm').reset();
      document.getElementById('selectedTableDisplay').value = '';
      selectedTable = null; renderTables(allTables);
      document.getElementById('bookingSuccessMsg').textContent = 'Cảm ơn ' + payload.guestName + '! Đặt bàn đang chờ xác nhận từ quán.';
      // YC1: innerHTML
      document.getElementById('bookingRef').innerHTML =
        '<p class="mb-1"><strong>Mã đặt bàn:</strong> #' + (result.id||genId()) + '</p>'
        + '<p class="mb-1"><strong>Bàn:</strong> ' + payload.tableName + '</p>'
        + '<p class="mb-1"><strong>Thời gian:</strong> ' + formatDate(payload.date) + ' lúc ' + payload.time + '</p>'
        + '<p class="mb-0"><strong>Số khách:</strong> ' + payload.guestCount + '</p>';
      new bootstrap.Modal(document.getElementById('bookingSuccessModal')).show();
      NOTIF.add({ type:'booking', title:'Đặt bàn thành công!', message:'Bàn ' + payload.tableName + ' lúc ' + payload.time + ' ngày ' + formatDate(payload.date) + '. Chờ xác nhận.' });
      updateNotifBadge(); loadUserNotifications();
      showToast('Đặt bàn thành công! Vui lòng chờ xác nhận.', 'success');
    })
    .catch(function() { showToast('Đặt bàn thất bại. Vui lòng thử lại!', 'error'); })
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
  count > 0 ? $(badge).show() : $(badge).hide();
}

function clearNotifications() {
  NOTIF.clear(); loadUserNotifications(); updateNotifBadge();
  showToast('Đã xóa thông báo', 'success');
}

function loadUserNotifications() {
  var container = document.getElementById('userNotifications');
  if (!container) return;
  var list = NOTIF.getAll();
  if (!list.length) {
    // YC4: jQuery .html() + .fadeIn()
    $(container).html('<div class="cb-notify-empty text-center py-5 text-muted"><i class="bi bi-bell-slash" style="font-size:2.5rem;opacity:.35"></i><p class="mt-2">Chưa có thông báo.<br><small>Đặt bàn hoặc đặt món để nhận thông báo.</small></p></div>').hide().fadeIn(300);
    return;
  }
  var typeMap = {
    booking: { cls:'cb-notify-confirm', badge:'<span class="badge bg-success">Đặt bàn</span>' },
    order:   { cls:'cb-notify-promo',   badge:'<span class="badge bg-warning text-dark">Đơn hàng</span>' },
    promo:   { cls:'cb-notify-promo',   badge:'<span class="badge bg-warning text-dark">Khuyến mãi</span>' },
    info:    { cls:'cb-notify-info',    badge:'<span class="badge bg-info text-dark">Thông tin</span>' }
  };
  var html = '';
  for (var i=0;i<list.length;i++) { // YC1: for
    var n = list[i];
    var t = typeMap[n.type] || typeMap.info;
    var time = n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : '';
    html += '<div class="cb-notify-item ' + t.cls + (n.read?'':' cb-notify-unread') + '">'
      + '<div class="d-flex justify-content-between align-items-start gap-2"><strong class="small">' + n.title + '</strong>' + t.badge + '</div>'
      + '<p class="small text-muted mb-0 mt-1">' + n.message + '</p>'
      + (time ? '<p class="small text-muted mb-0 mt-1 opacity-75"><i class="bi bi-clock me-1"></i>' + time + '</p>' : '')
      + '</div>';
  }
  // YC4: jQuery .html() + .slideDown()
  $(container).html(html).hide().slideDown(250);
}