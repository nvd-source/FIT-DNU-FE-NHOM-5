/* ========== admin.js — CaféBook Admin (hoàn chỉnh) ========== */
/* YC1: JS thuần | YC2: Fetch + Promise | YC3: Validate | YC4: jQuery */

var adminDrinks       = [];
var adminTables       = [];
var adminReservations = [];
var filteredReservations = [];
var editDrinkId  = null;
var editTableId  = null;
var currentPage  = 1;
var PAGE_SIZE    = 10;
var sidebarOpen  = false;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  checkAdminAuth();
  updateAdminClock();
  setInterval(updateAdminClock, 1000);

  document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);

  // YC4: jQuery live events
  $(document).on('input', '#adminSearchDrink', debounce(filterDrinksTable, 280));
  $(document).on('change','#adminFilterCat', filterDrinksTable);

  // Image preview in drink modal
  $(document).on('input', '#drinkImage', function() {
    var url = $(this).val().trim();
    var wrap = document.getElementById('drinkImgPreviewWrap');
    var img  = document.getElementById('drinkImgPreview');
    if (url && isValidImageUrl(url)) {
      if (img) img.src = url;
      if (wrap) wrap.style.display = '';
    } else {
      if (wrap) wrap.style.display = 'none';
    }
  });

  // Coupon code uppercase
  $(document).on('input', '#cpnCode', function() {
    this.value = this.value.toUpperCase();
  });

  document.getElementById('notifyForm').addEventListener('submit', handleNotifySubmit);

  // Close sidebar when clicking overlay
  var overlay = document.getElementById('adminSidebarOverlay');
  if (overlay) overlay.addEventListener('click', closeSidebar);
});

// ===== AUTH =====
function checkAdminAuth() {
  var user = AUTH.get();
  if (user && user.role === 'admin') {
    showDashboard(user);
  } else {
    document.getElementById('adminLoginScreen').style.display = '';
    document.getElementById('adminDashboard').classList.add('d-none');
  }
}

function updateAdminClock() {
  var el = document.getElementById('adminTime');
  if (el) el.textContent = new Date().toLocaleString('vi-VN');
}

function handleAdminLogin(e) {
  e.preventDefault();
  var u = document.getElementById('adminUser').value.trim();
  var p = document.getElementById('adminPass').value;
  clearAllErrors(['adminUser','adminPass']);
  document.getElementById('adminLoginError').classList.add('d-none');
  var valid = true;
  if (!u) { showError('adminUser','Vui lòng nhập tên đăng nhập'); valid=false; }
  if (!p) { showError('adminPass','Vui lòng nhập mật khẩu'); valid=false; }
  if (!valid) return;
  var user = USERS.login(u, p);
  if (!user || user.role !== 'admin') {
    document.getElementById('adminLoginError').textContent = 'Sai thông tin hoặc không có quyền admin.';
    document.getElementById('adminLoginError').classList.remove('d-none');
    return;
  }
  AUTH.save(user);
  showDashboard(user);
}

function showDashboard(user) {
  document.getElementById('adminLoginScreen').style.display = 'none';
  document.getElementById('adminDashboard').classList.remove('d-none');
  if (user) {
    var words = (user.name||'Admin').split(' ');
    var initials = '';
    for (var w=0;w<words.length&&initials.length<2;w++) initials += words[w][0]||'';
    var av = document.getElementById('adminAvatarText');
    if (av) av.textContent = initials.toUpperCase();
    var nd = document.getElementById('adminNameDisplay');
    if (nd) nd.textContent = user.name || 'Admin';
  }
  loadDashboard();
}

function adminLogout() { AUTH.logout(); window.location.reload(); }

// ===== SIDEBAR =====
function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  var sb  = document.getElementById('adminSidebar');
  var ov  = document.getElementById('adminSidebarOverlay');
  if (sb) sb.classList.toggle('open', sidebarOpen);
  if (ov) ov.classList.toggle('active', sidebarOpen);
}
function closeSidebar() {
  sidebarOpen = false;
  var sb = document.getElementById('adminSidebar');
  var ov = document.getElementById('adminSidebarOverlay');
  if (sb) sb.classList.remove('open');
  if (ov) ov.classList.remove('active');
}

// ===== PAGE NAVIGATION =====
function showPage(page) {
  // YC1: querySelectorAll, classList
  document.querySelectorAll('.cb-page').forEach(function(p) { p.classList.add('d-none'); });
  document.querySelectorAll('.cb-admin-nav-item').forEach(function(i) { i.classList.remove('active'); });

  var pg = document.getElementById('page-' + page);
  if (pg) pg.classList.remove('d-none');

  var nav = document.querySelector('[data-page="' + page + '"]');
  if (nav) nav.classList.add('active');

  var titles = {
    dashboard:'Dashboard', analytics:'Phân tích bán hàng',
    drinks:'Quản lý thực đơn', tables:'Quản lý bàn',
    reservations:'Đặt bàn & Đơn hàng',
    coupons:'Mã giảm giá', notifications:'Gửi thông báo'
  };
  var ptEl = document.getElementById('pageTitle');
  if (ptEl) ptEl.textContent = titles[page] || page;

  if (page === 'drinks')       loadAdminDrinks();
  if (page === 'tables')       loadAdminTables();
  if (page === 'reservations') loadAdminReservations();
  if (page === 'analytics')    loadAnalytics();
  if (page === 'coupons')      loadCoupons();

  // Close sidebar on mobile after nav
  if (window.innerWidth < 992) closeSidebar();

  // Fade-in animation
  if (pg) {
    pg.style.opacity = '0';
    setTimeout(function() {
      pg.style.transition = 'opacity .22s ease';
      pg.style.opacity = '1';
    }, 10);
  }
}

// ===== DASHBOARD =====
function loadDashboard() {
  // YC2: Promise.all + .then/.catch
  Promise.all([getDrinks(), getReservations()])
    .then(function(results) {
      var drinks       = results[0];
      var reservations = results[1];
      adminDrinks       = drinks;
      adminReservations = reservations;

      var pending   = 0; var confirmed = 0;
      for (var i=0;i<reservations.length;i++) { // YC1: for loop
        if (reservations[i].status==='pending')   pending++;
        if (reservations[i].status==='confirmed') confirmed++;
      }

      // YC1: getElementById + DOM
      document.getElementById('stat-total').textContent     = reservations.length;
      document.getElementById('stat-pending').textContent   = pending;
      document.getElementById('stat-confirmed').textContent = confirmed;
      document.getElementById('stat-drinks').textContent    = drinks.length;
      document.getElementById('pendingCount').textContent   = pending;
      renderRecentReservations(reservations.slice(0,5));
      renderTopDrinksWidget();
    })
    .catch(function() { showToast('Không thể tải dashboard','error'); });
}

function renderRecentReservations(list) {
  var c = document.getElementById('recentReservations');
  if (!list || !list.length) {
    c.innerHTML = '<p class="text-muted text-center py-3">Chưa có đơn nào.</p>';
    return;
  }
  var html = '<div class="table-responsive"><table class="table cb-table mb-0"><thead><tr>'
    +'<th>Khách hàng</th><th>Loại</th><th>Bàn / Địa chỉ</th><th>Thời gian</th><th>Tổng tiền</th><th>Trạng thái</th>'
    +'</tr></thead><tbody>';
  for (var i=0;i<list.length;i++) { // YC1: for loop
    var r = list[i];
    html += '<tr>'
      +'<td><strong>'+( r.guestName||'—')+'</strong><br><small class="text-muted">'+(r.phone||'')+'</small></td>'
      +'<td>'+typeBadge(r.type||r.orderType)+'</td>'
      +'<td>'+(r.tableName||r.address||r.tableId||'—')+'</td>'
      +'<td><small>'+formatDate(r.date||r.createdAt)+'<br>'+(r.time||'')+'</small></td>'
      +'<td class="fw-500 cb-text-green">'+(r.total?formatPrice(r.total):'—')+'</td>'
      +'<td>'+statusBadge(r.status)+'</td>'
      +'</tr>';
  }
  html += '</tbody></table></div>';
  c.innerHTML = html; // YC1: innerHTML
}

function renderTopDrinksWidget() {
  var top = ANALYTICS.getAll().sort(function(a,b){ return b.count - a.count; }).slice(0,5);
  var c   = document.getElementById('topDrinksWidget');
  if (!top.length) {
    c.innerHTML = '<p class="text-muted small text-center py-2">Chưa có dữ liệu bán hàng.<br><small>Khi khách đặt món sẽ tích lũy tại đây.</small></p>';
    return;
  }
  var max  = top[0].count || 1;
  var html = '';
  for (var i=0;i<top.length;i++) { // YC1: for
    var item = top[i];
    var pct  = Math.round(item.count / max * 100);
    html += '<div class="mb-3">'
      +'<div class="d-flex justify-content-between small mb-1">'
      +'<span class="fw-500">'+(i+1)+'. '+item.name+'</span>'
      +'<span class="text-muted">'+item.count+' lượt</span>'
      +'</div>'
      +'<div class="cb-progress-bar"><div class="cb-progress-fill" style="width:'+pct+'%"></div></div>'
      +'</div>';
  }
  c.innerHTML = html;
}

// ===== ANALYTICS =====
function loadAnalytics() {
  Promise.all([getReservations(), getDrinks()])
    .then(function(res) {
      var reservations = res[0];
      adminDrinks      = res[1];
      var analytics    = ANALYTICS.getAll();

      var totalRevenue = 0; var orderCount = 0;
      for (var i=0;i<reservations.length;i++) { // YC1: for
        totalRevenue += Number(reservations[i].total)||0;
        if (reservations[i].type==='order'||reservations[i].orderType) orderCount++;
      }
      var totalItems = 0;
      for (var j=0;j<analytics.length;j++) totalItems += analytics[j].count;
      var avgOrder = orderCount ? Math.round(totalRevenue / orderCount) : 0;

      document.getElementById('an-revenue').textContent = formatPrice(totalRevenue);
      document.getElementById('an-orders').textContent  = orderCount;
      document.getElementById('an-items').textContent   = totalItems;
      document.getElementById('an-avg').textContent     = formatPrice(avgOrder);

      renderAnalyticsTable(analytics, totalItems);
      renderCategoryChart(analytics);
      renderOrderTypeChart(reservations);
    })
    .catch(function() { showToast('Không thể tải analytics','error'); });
}

function renderAnalyticsTable(analytics, totalItems) {
  var sorted = analytics.slice().sort(function(a,b){ return b.count-a.count; });
  var tbody  = document.getElementById('analyticsTableBody');
  if (!sorted.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Chưa có dữ liệu bán hàng.<br><small>Khi khách đặt món, dữ liệu sẽ tích lũy tại đây.</small></td></tr>';
    return;
  }
  var medals = ['🥇','🥈','🥉'];
  var html   = '';
  for (var i=0;i<sorted.length;i++) { // YC1: for
    var item = sorted[i];
    var pct  = totalItems ? Math.round(item.count/totalItems*100) : 0;
    html += '<tr>'
      +'<td>'+(medals[i]||'#'+(i+1))+'</td>'
      +'<td class="fw-500">'+item.name+'</td>'
      +'<td><span class="badge bg-light text-dark border">'+(item.category||'—')+'</span></td>'
      +'<td><span class="fw-bold">'+item.count+'</span></td>'
      +'<td class="cb-text-green fw-500">'+formatPrice(item.revenue||0)+'</td>'
      +'<td><div class="d-flex align-items-center gap-2">'
      +'<div class="cb-progress-bar flex-grow-1"><div class="cb-progress-fill" style="width:'+pct+'%"></div></div>'
      +'<span class="small text-muted">'+pct+'%</span></div></td>'
      +'</tr>';
  }
  tbody.innerHTML = html;
}

function renderCategoryChart(analytics) {
  var cats   = {};
  for (var i=0;i<analytics.length;i++) { // YC1: for
    var cat  = analytics[i].category || 'Khác';
    cats[cat] = (cats[cat]||0) + analytics[i].revenue;
  }
  var total  = 0;
  var keys   = Object.keys(cats);
  for (var j=0;j<keys.length;j++) total += cats[keys[j]];
  if (!total) total = 1;
  var colors = ['#2d6a4f','#40916c','#74c69d','#e09f3e','#d95f3b'];
  var el     = document.getElementById('categoryChart');
  if (!keys.length) { el.innerHTML='<p class="text-muted small text-center py-2">Chưa có dữ liệu</p>'; return; }
  var html   = '';
  for (var k=0;k<keys.length;k++) {
    var pct = Math.round(cats[keys[k]]/total*100);
    html += '<div class="mb-3"><div class="d-flex justify-content-between small mb-1">'
      +'<span style="color:'+colors[k%colors.length]+'" class="fw-500">'+keys[k]+'</span>'
      +'<span class="text-muted">'+formatPrice(cats[keys[k]])+' ('+pct+'%)</span></div>'
      +'<div class="cb-progress-bar"><div class="cb-progress-fill" style="width:'+pct+'%;background:'+colors[k%colors.length]+'"></div></div></div>';
  }
  el.innerHTML = html;
}

function renderOrderTypeChart(reservations) {
  var types  = { reservation:0, order:0 };
  for (var i=0;i<reservations.length;i++) { // YC1: for
    var t = reservations[i].type || 'reservation';
    if (t!=='reservation' && t!=='order') t='reservation';
    types[t]++;
  }
  var total  = types.reservation + types.order || 1;
  var labels = { reservation:'Đặt bàn', order:'Đặt món' };
  var colors = { reservation:'#2d6a4f', order:'#e09f3e' };
  var el     = document.getElementById('orderTypeChart');
  var html   = '';
  var keys   = ['reservation','order'];
  for (var k=0;k<keys.length;k++) {
    var key = keys[k];
    var pct = Math.round(types[key]/total*100);
    html += '<div class="mb-3"><div class="d-flex justify-content-between small mb-1">'
      +'<span style="color:'+colors[key]+'" class="fw-500">'+labels[key]+'</span>'
      +'<span class="text-muted">'+types[key]+' ('+pct+'%)</span></div>'
      +'<div class="cb-progress-bar"><div class="cb-progress-fill" style="width:'+pct+'%;background:'+colors[key]+'"></div></div></div>';
  }
  el.innerHTML = html;
}

// ===== DRINKS CRUD =====
function loadAdminDrinks() {
  $('#drinksLoading').removeClass('d-none');
  // YC4: jQuery .html()
  $('#drinksTableBody').html('');
  // YC2: getDrinks + .then/.catch
  getDrinks()
    .then(function(drinks) {
      adminDrinks = drinks;
      $('#drinksLoading').addClass('d-none');
      renderDrinksTable(adminDrinks);
    })
    .catch(function() {
      $('#drinksLoading').addClass('d-none');
      showToast('Không thể tải thực đơn','error');
    });
}

function renderDrinksTable(drinks) {
  var tbody = document.getElementById('drinksTableBody');
  if (!drinks || !drinks.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Chưa có món nào.</td></tr>';
    return;
  }
  var html = '';
  for (var i=0;i<drinks.length;i++) { // YC1: for loop
    var d = drinks[i];
    html += '<tr>'
      +'<td><img class="cb-admin-thumb" src="'+(d.image||d.imageUrl||'https://placehold.co/48/d8f3dc/2d6a4f?text=☕')+'"'
      +' loading="lazy" onerror="this.src=\'https://placehold.co/48x48/d8f3dc/2d6a4f?text=CF\'"/></td>'
      +'<td><strong>'+(d.name||'—')+'</strong></td>'
      +'<td><span class="badge bg-light text-dark border">'+(d.category||d.type||'—')+'</span></td>'
      +'<td class="fw-500 cb-text-green">'+formatPrice(d.price)+'</td>'
      +'<td style="max-width:180px"><small class="text-muted">'+((d.description||'').slice(0,60))+((d.description||'').length>60?'…':'')+'</small></td>'
      +'<td class="text-nowrap">'
      +'<button class="btn btn-sm btn-outline-success me-1" onclick="openDrinkModal(\''+d.id+'\')" title="Sửa"><i class="bi bi-pencil"></i></button>'
      +'<button class="btn btn-sm btn-outline-danger" onclick="confirmDelete(\'drink\',\''+d.id+'\',\''+((d.name||'').replace(/'/g,''))+'\')"><i class="bi bi-trash3"></i></button>'
      +'</td></tr>';
  }
  tbody.innerHTML = html; // YC1: innerHTML
}

function filterDrinksTable() {
  var search = ($('#adminSearchDrink').val()||'').toLowerCase();
  var cat    = $('#adminFilterCat').val()||'';
  var filtered = adminDrinks.slice();
  if (search) filtered = filtered.filter(function(d){ return (d.name||'').toLowerCase().includes(search)||(d.description||'').toLowerCase().includes(search); });
  if (cat)    filtered = filtered.filter(function(d){ return (d.category||d.type||'')===cat; });
  renderDrinksTable(filtered);
}

function openDrinkModal(id) {
  editDrinkId = id || null;
  clearAllErrors(['drinkName','drinkPrice','drinkCategory','drinkImage']);
  var wrap = document.getElementById('drinkImgPreviewWrap');
  if (wrap) wrap.style.display='none';
  if (id) {
    var d = null;
    for (var i=0;i<adminDrinks.length;i++) { if(String(adminDrinks[i].id)===String(id)){d=adminDrinks[i];break;} }
    if (!d) return;
    document.getElementById('drinkModalTitle').textContent = 'Sửa món';
    // YC4: jQuery .val()
    $('#drinkId').val(d.id);
    $('#drinkName').val(d.name||'');
    $('#drinkPrice').val(d.price||'');
    $('#drinkCategory').val(d.category||d.type||'');
    $('#drinkImage').val(d.image||d.imageUrl||'');
    $('#drinkDesc').val(d.description||'');
    var img  = document.getElementById('drinkImgPreview');
    if ((d.image||d.imageUrl) && wrap && img) { img.src = d.image||d.imageUrl; wrap.style.display=''; }
  } else {
    document.getElementById('drinkModalTitle').textContent = 'Thêm món mới';
    document.getElementById('drinkForm').reset();
  }
  new bootstrap.Modal(document.getElementById('drinkEditModal')).show();
}

function validateDrinkForm() { // YC3
  clearAllErrors(['drinkName','drinkPrice','drinkCategory','drinkImage']);
  var valid = true;
  var name  = document.getElementById('drinkName').value.trim();
  var price = Number(document.getElementById('drinkPrice').value);
  var cat   = document.getElementById('drinkCategory').value;
  var img   = document.getElementById('drinkImage').value.trim();
  if (!name)              { showError('drinkName','Tên món không được để trống'); valid=false; }
  if (!price||price<=0)   { showError('drinkPrice','Giá phải lớn hơn 0'); valid=false; }
  if (!cat)               { showError('drinkCategory','Vui lòng chọn danh mục'); valid=false; }
  if (!img)               { showError('drinkImage','URL ảnh không được để trống'); valid=false; }
  else if (!isValidImageUrl(img)) { showError('drinkImage','URL ảnh không hợp lệ (phải bắt đầu https://)'); valid=false; }
  return valid;
}

function saveDrink() {
  if (!validateDrinkForm()) return;
  var data = {
    name:        document.getElementById('drinkName').value.trim(),
    price:       Number(document.getElementById('drinkPrice').value),
    category:    document.getElementById('drinkCategory').value,
    image:       document.getElementById('drinkImage').value.trim(),
    description: document.getElementById('drinkDesc').value.trim()
  };
  // YC4: jQuery show/hide
  $('#saveDrinkText').hide(); $('#saveDrinkSpinner').show();
  $('#saveDrinkBtn').prop('disabled', true);

  var promise = editDrinkId ? updateDrink(editDrinkId, data) : createDrink(data);
  promise
    .then(function() {
      showToast(editDrinkId ? 'Cập nhật món thành công!' : 'Thêm món mới thành công!', 'success');
      bootstrap.Modal.getInstance(document.getElementById('drinkEditModal')).hide();
      document.getElementById('drinkForm').reset(); // YC3: reset form
      loadAdminDrinks();
      loadDashboard();
    })
    .catch(function() { showToast('Lưu thất bại. Vui lòng thử lại!','error'); })
    .finally(function() {
      $('#saveDrinkText').show(); $('#saveDrinkSpinner').hide();
      $('#saveDrinkBtn').prop('disabled', false);
    });
}

// ===== TABLES CRUD =====
function loadAdminTables() {
  $('#adminTablesLoading').show();
  $('#adminTablesGrid').html('');
  getTables()
    .then(function(tables) {
      adminTables = tables;
      $('#adminTablesLoading').hide();
      renderAdminTables(tables);
      // Stats
      var av=0, re=0, oc=0;
      for (var i=0;i<tables.length;i++) { // YC1: for
        var st = (tables[i].status||'available').toLowerCase();
        if (st==='available') av++;
        else if (st==='reserved') re++;
        else oc++;
      }
      var sa = document.getElementById('tableStatAvail');    if(sa) sa.textContent=av;
      var sr = document.getElementById('tableStatReserved'); if(sr) sr.textContent=re;
      var so = document.getElementById('tableStatOccupied'); if(so) so.textContent=oc;
    })
    .catch(function() {
      $('#adminTablesLoading').hide();
      showToast('Không thể tải bàn','error');
    });
}

function renderAdminTables(tables) {
  var grid = document.getElementById('adminTablesGrid');
  if (!tables || !tables.length) {
    grid.innerHTML = '<div class="col-12 text-center text-muted py-4">Chưa có bàn nào.</div>';
    return;
  }
  var smap = { available:['cb-status-confirmed','Còn trống'], reserved:['cb-status-pending','Đã đặt'], occupied:['cb-status-cancelled','Đang dùng'] };
  var imap = { available:'bi-chair', reserved:'bi-calendar-check', occupied:'bi-person-fill' };
  var html = '';
  for (var i=0;i<tables.length;i++) { // YC1: for loop
    var t  = tables[i];
    var st = (t.status||'available').toLowerCase();
    var sm = smap[st] || smap.available;
    html += '<div class="col-6 col-md-4 col-lg-3">'
      +'<div class="cb-admin-card text-center p-3">'
      +'<div style="font-size:2rem;color:var(--green-main)" class="mb-2"><i class="bi '+(imap[st]||'bi-chair')+'"></i></div>'
      +'<div class="fw-600">'+(t.name||'Bàn '+t.id)+'</div>'
      +'<div class="text-muted small mb-2"><i class="bi bi-people me-1"></i>'+(t.capacity||2)+' khách · '+(t.zone||'Indoor')+'</div>'
      +'<span class="cb-status '+sm[0]+' d-block mb-2">'+sm[1]+'</span>'
      +'<div class="d-flex gap-2 justify-content-center flex-wrap mb-2">'
      +'<select class="form-select form-select-sm cb-input" style="width:auto;font-size:.75rem" onchange="quickUpdateTableStatus(\''+t.id+'\',this.value)">'
      +'<option value="available"'+(st==='available'?' selected':'')+'>Còn trống</option>'
      +'<option value="reserved"'+(st==='reserved'?' selected':'')+'>Đã đặt</option>'
      +'<option value="occupied"'+(st==='occupied'?' selected':'')+'>Đang dùng</option>'
      +'</select></div>'
      +'<div class="d-flex gap-2 justify-content-center">'
      +'<button class="btn btn-sm btn-outline-success" onclick="openTableModal(\''+t.id+'\')" title="Sửa"><i class="bi bi-pencil"></i></button>'
      +'<button class="btn btn-sm btn-outline-danger" onclick="confirmDelete(\'table\',\''+t.id+'\',\''+((t.name||'Bàn').replace(/'/g,''))+'\')" title="Xóa"><i class="bi bi-trash3"></i></button>'
      +'</div></div></div>';
  }
  grid.innerHTML = html;
}

function quickUpdateTableStatus(id, status) {
  updateTable(id, { status:status })
    .then(function() { showToast('Cập nhật bàn thành công','success'); loadAdminTables(); })
    .catch(function() { showToast('Cập nhật thất bại','error'); });
}

function openTableModal(id) {
  editTableId = id || null;
  clearAllErrors(['tableName','tableCapacity']);
  if (id) {
    var t = null;
    for (var i=0;i<adminTables.length;i++) { if(String(adminTables[i].id)===String(id)){t=adminTables[i];break;} }
    if (!t) return;
    document.getElementById('tableModalTitle').textContent = 'Sửa bàn';
    $('#tableId').val(t.id);
    $('#tableName').val(t.name||'');
    $('#tableCapacity').val(t.capacity||'');
    $('#tableStatus').val(t.status||'available');
    $('#tableZone').val(t.zone||'Indoor');
  } else {
    document.getElementById('tableModalTitle').textContent = 'Thêm bàn mới';
    document.getElementById('tableForm').reset();
  }
  new bootstrap.Modal(document.getElementById('tableEditModal')).show();
}

function saveTable() {
  clearAllErrors(['tableName','tableCapacity']);
  var name = document.getElementById('tableName').value.trim();
  var cap  = Number(document.getElementById('tableCapacity').value);
  var valid = true;
  if (!name)           { showError('tableName','Tên bàn không được để trống'); valid=false; }
  if (!cap||cap<1)     { showError('tableCapacity','Sức chứa phải lớn hơn 0'); valid=false; }
  else if (cap>10)     { showError('tableCapacity','Tối đa 10 khách mỗi bàn'); valid=false; }
  if (!valid) return;
  var data = {
    name:     name, capacity:cap,
    status:   document.getElementById('tableStatus').value,
    zone:     document.getElementById('tableZone').value
  };
  var promise = editTableId ? updateTable(editTableId, data) : createTable(data);
  promise
    .then(function() {
      showToast(editTableId ? 'Cập nhật bàn thành công!' : 'Thêm bàn thành công!','success');
      bootstrap.Modal.getInstance(document.getElementById('tableEditModal')).hide();
      document.getElementById('tableForm').reset();
      loadAdminTables();
    })
    .catch(function() { showToast('Lưu thất bại','error'); });
}

// ===== RESERVATIONS =====
function loadAdminReservations() {
  $('#reservLoading').show();
  $('#reservTableBody').html('');
  // YC4: jQuery AJAX (jqGetReservations)
  jqGetReservations(
    function(data) {
      adminReservations    = data;
      filteredReservations = data;
      $('#reservLoading').hide();
      renderReservationsTable(paginate(filteredReservations, 1));
      renderPagination(filteredReservations.length);
      updatePendingBadge();
    },
    function() {
      $('#reservLoading').hide();
      showToast('Không thể tải danh sách đặt bàn','error');
    }
  );
}

function filterReservations() {
  var type   = document.getElementById('filterType').value;
  var status = document.getElementById('filterStatus').value;
  filteredReservations = adminReservations.filter(function(r) {
    var rtype  = r.type || 'reservation';
    var tMatch = !type   || rtype === type;
    var sMatch = !status || r.status === status;
    return tMatch && sMatch;
  });
  currentPage = 1;
  renderReservationsTable(paginate(filteredReservations, 1));
  renderPagination(filteredReservations.length);
}

function paginate(list, page) {
  var start = (page-1)*PAGE_SIZE;
  return list.slice(start, start+PAGE_SIZE);
}

function renderPagination(total) {
  var pages = Math.ceil(total / PAGE_SIZE);
  var c     = document.getElementById('reservPagination');
  if (!c || pages<=1) { if(c) c.innerHTML=''; return; }
  var html = '<nav><ul class="pagination pagination-sm">';
  html += '<li class="page-item'+(currentPage===1?' disabled':'')+'"><button class="page-link" onclick="goPage('+(currentPage-1)+')">‹</button></li>';
  for (var i=1;i<=pages;i++) { // YC1: for
    html += '<li class="page-item'+(i===currentPage?' active':'')+'"><button class="page-link" onclick="goPage('+i+')">'+i+'</button></li>';
  }
  html += '<li class="page-item'+(currentPage===pages?' disabled':'')+'"><button class="page-link" onclick="goPage('+(currentPage+1)+')">›</button></li>';
  html += '</ul></nav>';
  c.innerHTML = html;
}

function goPage(page) {
  var pages = Math.ceil(filteredReservations.length / PAGE_SIZE);
  if (page<1||page>pages) return;
  currentPage = page;
  renderReservationsTable(paginate(filteredReservations, page));
  renderPagination(filteredReservations.length);
}

function renderReservationsTable(list) {
  var tbody = document.getElementById('reservTableBody');
  if (!list || !list.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">Không có đơn nào.</td></tr>';
    return;
  }
  var html = '';
  for (var i=0;i<list.length;i++) { // YC1: for loop
    var r     = list[i];
    var rtype = r.type || 'reservation';
    var detail = rtype==='order' ? (r.items?r.items.length+' món':'—') : (r.guestCount||'—')+' khách';
    html += '<tr>'
      +'<td class="text-muted small">#'+(r.id||'—')+'</td>'
      +'<td>'+typeBadge(rtype)+'</td>'
      +'<td><strong>'+(r.guestName||'—')+'</strong><br><small class="text-muted">'+(r.phone||'')+'</small></td>'
      +'<td><small>'+detail+'</small>'+(r.note?'<br><small class="text-muted"><i class="bi bi-chat-dots me-1"></i>'+r.note.slice(0,30)+'</small>':'')+'</td>'
      +'<td><small>'+(r.tableName||r.address||r.tableId||'—')+'</small></td>'
      +'<td class="text-nowrap"><small>'+formatDate(r.date||r.createdAt)+'<br>'+(r.time||'')+'</small></td>'
      +'<td class="fw-500 text-nowrap'+(r.total?' cb-text-green':'')+'">'+( r.total?formatPrice(r.total):'—')+'</td>'
      +'<td>'+statusBadge(r.status)+'</td>'
      +'<td class="text-nowrap">'
      +'<button class="btn btn-sm btn-outline-secondary me-1" onclick="showReservDetail(\''+r.id+'\')" title="Chi tiết"><i class="bi bi-eye"></i></button>'
      +(r.status==='pending'
        ?'<button class="btn btn-sm btn-success me-1" onclick="changeReservStatus(\''+r.id+'\',\'confirmed\')" title="Xác nhận"><i class="bi bi-check-lg"></i></button>'
        +'<button class="btn btn-sm btn-warning me-1" onclick="changeReservStatus(\''+r.id+'\',\'cancelled\')" title="Hủy"><i class="bi bi-x-lg"></i></button>'
        :'')
      +'<button class="btn btn-sm btn-outline-danger" onclick="confirmDelete(\'reservation\',\''+r.id+'\',\'#'+r.id+'\')" title="Xóa"><i class="bi bi-trash3"></i></button>'
      +'</td></tr>';
  }
  tbody.innerHTML = html;
}

function showReservDetail(id) {
  var r = null;
  for (var i=0;i<adminReservations.length;i++) { if(String(adminReservations[i].id)===String(id)){r=adminReservations[i];break;} }
  if (!r) return;
  document.getElementById('reservDetailTitle').textContent = 'Chi tiết đơn #'+r.id;
  var isOrder   = r.type==='order'||r.orderType;
  var otMap     = { 'dine-in':'Tại quán','takeaway':'Mang về','online':'Đặt online' };
  var itemsHtml = '';
  if (r.items && r.items.length) {
    itemsHtml = '<h6 class="fw-600 mt-3 mb-2">Danh sách món:</h6>';
    for (var j=0;j<r.items.length;j++) {
      var it = r.items[j];
      itemsHtml += '<div class="d-flex justify-content-between py-1 border-bottom small">'
        +'<span>'+it.name+' × '+it.qty+'</span>'
        +'<span class="fw-500">'+formatPrice(Number(it.price)*it.qty)+'</span></div>';
    }
    if (r.discount) itemsHtml += '<div class="d-flex justify-content-between py-1 small cb-text-green"><span>Giảm giá'+(r.couponCode?' ('+r.couponCode+')':'')+'</span><span>-'+formatPrice(r.discount)+'</span></div>';
    itemsHtml += '<div class="d-flex justify-content-between pt-2 fw-bold"><span>Tổng cộng</span><span class="cb-text-green">'+formatPrice(r.total)+'</span></div>';
  }
  document.getElementById('reservDetailBody').innerHTML =
    '<div class="row g-3">'
    +'<div class="col-md-6"><div class="cb-admin-card p-3">'
    +'<h6 class="fw-600 mb-3"><i class="bi bi-person me-2 cb-text-green"></i>Thông tin khách</h6>'
    +'<p class="mb-1 small"><strong>Họ tên:</strong> '+(r.guestName||'—')+'</p>'
    +'<p class="mb-1 small"><strong>Điện thoại:</strong> '+(r.phone||'—')+'</p>'
    +'<p class="mb-1 small"><strong>Email:</strong> '+(r.email||'—')+'</p>'
    +'<p class="mb-0 small"><strong>Ghi chú:</strong> '+(r.note||'Không có')+'</p>'
    +'</div></div>'
    +'<div class="col-md-6"><div class="cb-admin-card p-3">'
    +'<h6 class="fw-600 mb-3"><i class="bi bi-info-circle me-2 cb-text-green"></i>Thông tin đơn</h6>'
    +'<p class="mb-1 small"><strong>Loại:</strong> '+typeBadge(r.type||'reservation')+'</p>'
    +(r.orderType?'<p class="mb-1 small"><strong>Hình thức:</strong> '+(otMap[r.orderType]||r.orderType)+'</p>':'')
    +(r.payMethod?'<p class="mb-1 small"><strong>Thanh toán:</strong> '+(r.payMethod==='qr'?'Quét QR':'Tiền mặt')+'</p>':'')
    +'<p class="mb-1 small"><strong>Bàn / Địa chỉ:</strong> '+(r.tableName||r.address||r.tableId||'—')+'</p>'
    +'<p class="mb-1 small"><strong>Ngày & Giờ:</strong> '+formatDate(r.date||r.createdAt)+' '+(r.time||'')+'</p>'
    +'<p class="mb-0 small"><strong>Trạng thái:</strong> '+statusBadge(r.status)+'</p>'
    +'</div></div>'
    +(itemsHtml?'<div class="col-12"><div class="cb-admin-card p-3">'+itemsHtml+'</div></div>':'')
    +'</div>'
    +(r.status==='pending'
      ?'<div class="d-flex gap-2 mt-3">'
      +'<button class="btn cb-btn-primary flex-grow-1" onclick="changeReservStatus(\''+r.id+'\',\'confirmed\');bootstrap.Modal.getInstance(document.getElementById(\'reservDetailModal\')).hide()"><i class="bi bi-check-lg me-2"></i>Xác nhận</button>'
      +'<button class="btn btn-outline-danger flex-grow-1" onclick="changeReservStatus(\''+r.id+'\',\'cancelled\');bootstrap.Modal.getInstance(document.getElementById(\'reservDetailModal\')).hide()"><i class="bi bi-x-lg me-2"></i>Hủy đơn</button>'
      +'</div>':'');
  new bootstrap.Modal(document.getElementById('reservDetailModal')).show();
}

function changeReservStatus(id, status) {
  // YC4: jqUpdateReservationStatus (jQuery AJAX)
  jqUpdateReservationStatus(id, status,
    function() {
      showToast(status==='confirmed'?'✅ Đã xác nhận đơn #'+id:'❌ Đã hủy đơn #'+id,'success');
      var r = null;
      for (var i=0;i<adminReservations.length;i++) { if(String(adminReservations[i].id)===String(id)){r=adminReservations[i];break;} }
      if (r) {
        NOTIF.add({
          type: status==='confirmed'?'booking':'info',
          title: status==='confirmed'?'Đơn của bạn đã được xác nhận!':'Đơn hàng bị hủy',
          message: status==='confirmed'
            ?'Bàn '+(r.tableName||r.tableId||'')+' lúc '+(r.time||'')+' ngày '+formatDate(r.date||r.createdAt)+' đã xác nhận.'
            :'Đơn #'+id+' đã bị hủy. Liên hệ quán để biết thêm.'
        });
        if (status==='confirmed' && r.items && r.items.length) ANALYTICS.addOrder(r.items);
      }
      loadAdminReservations();
      loadDashboard();
    },
    function() { showToast('Cập nhật thất bại','error'); }
  );
}

function updatePendingBadge() {
  var p = 0;
  for (var i=0;i<adminReservations.length;i++) { if(adminReservations[i].status==='pending') p++; }
  var el = document.getElementById('pendingCount');
  if (el) el.textContent = p;
  var sp = document.getElementById('stat-pending');
  if (sp) sp.textContent = p;
}

// ===== STATUS / TYPE BADGES =====
function statusBadge(status) {
  var m = { pending:['cb-status-pending','Chờ xác nhận'], confirmed:['cb-status-confirmed','Đã xác nhận'], cancelled:['cb-status-cancelled','Đã hủy'] };
  var s = m[status] || m.pending;
  return '<span class="cb-status '+s[0]+'">'+s[1]+'</span>';
}
function typeBadge(type) {
  if (type==='order') return '<span class="badge cb-badge-amber"><i class="bi bi-bag me-1"></i>Đặt món</span>';
  return '<span class="badge bg-light text-dark border"><i class="bi bi-calendar-check me-1"></i>Đặt bàn</span>';
}

// ===== DELETE =====
function confirmDelete(type, id, label) {
  document.getElementById('deleteConfirmMsg').textContent = 'Bạn có chắc muốn xóa "'+label+'"? Thao tác không thể hoàn tác.';
  var modal  = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
  var delBtn = document.getElementById('confirmDeleteBtn');
  // Remove old listener and add fresh one
  var newBtn = delBtn.cloneNode(true);
  delBtn.parentNode.replaceChild(newBtn, delBtn);
  newBtn.addEventListener('click', function() {
    var promise;
    if (type==='drink')       promise = deleteDrink(id);
    if (type==='table')       promise = deleteTable(id);
    if (type==='reservation') promise = deleteReservation(id);
    promise
      .then(function() {
        bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
        showToast('Đã xóa thành công!','success');
        if (type==='drink')       loadAdminDrinks();
        if (type==='table')       loadAdminTables();
        if (type==='reservation') loadAdminReservations();
        loadDashboard();
      })
      .catch(function() { showToast('Xóa thất bại','error'); });
  });
  modal.show();
}

// ===== COUPONS =====
function loadCoupons() {
  var list = COUPONS.getAll();
  var total    = list.length;
  var active   = 0; var used = 0; var inactive = 0;
  for (var i=0;i<list.length;i++) { // YC1: for
    if (list[i].active) active++; else inactive++;
    used += (list[i].used||0);
  }
  var ea = document.getElementById('cpn-total');    if(ea) ea.textContent=total;
  var eb = document.getElementById('cpn-active');   if(eb) eb.textContent=active;
  var ec = document.getElementById('cpn-used');     if(ec) ec.textContent=used;
  var ed = document.getElementById('cpn-inactive'); if(ed) ed.textContent=inactive;
  renderCouponTable(list);
}

function renderCouponTable(list) {
  var tbody = document.getElementById('couponTableBody');
  if (!tbody) return;
  if (!list || !list.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">Chưa có mã giảm giá nào.</td></tr>';
    return;
  }
  var html = '';
  for (var i=0;i<list.length;i++) { // YC1: for loop
    var c = list[i];
    var discLabel = c.type==='percent' ? c.discount+'%' : formatPrice(c.discount);
    var minLabel  = c.minOrder ? formatPrice(c.minOrder) : 'Không giới hạn';
    var useLabel  = (c.used||0)+' / '+(c.maxUse||'∞');
    html += '<tr>'
      +'<td><code class="cb-coupon-code">'+c.code+'</code></td>'
      +'<td class="text-muted small">'+(c.desc||'—')+'</td>'
      +'<td><span class="badge '+(c.type==='percent'?'bg-info text-dark':'cb-badge-amber')+'">'+discLabel+'</span></td>'
      +'<td class="small">'+minLabel+'</td>'
      +'<td class="small">'+useLabel+'</td>'
      +'<td class="small text-muted">'+(c.createdAt||'—')+'</td>'
      +'<td><span class="cb-status '+(c.active?'cb-status-confirmed':'cb-status-cancelled')+'">'+(c.active?'Hoạt động':'Đã tắt')+'</span></td>'
      +'<td class="text-nowrap">'
      +'<button class="btn btn-sm '+(c.active?'btn-outline-warning':'btn-outline-success')+' me-1" onclick="toggleCoupon(\''+c.code+'\')" title="'+(c.active?'Tắt':'Bật')+'">'
      +'<i class="bi bi-'+(c.active?'pause':'play')+'-fill"></i></button>'
      +'<button class="btn btn-sm btn-outline-danger" onclick="deleteCoupon(\''+c.code+'\')" title="Xoá"><i class="bi bi-trash3"></i></button>'
      +'</td></tr>';
  }
  // YC4: jQuery .html()
  $('#couponTableBody').html(html);
}

function openCouponModal() {
  document.getElementById('couponForm').reset();
  clearAllErrors(['cpnCode','cpnDiscount']);
  new bootstrap.Modal(document.getElementById('couponModal')).show();
}

function saveCoupon() {
  clearAllErrors(['cpnCode','cpnDiscount']);
  var code     = (document.getElementById('cpnCode').value||'').toUpperCase().trim();
  var discount = Number(document.getElementById('cpnDiscount').value);
  var type     = document.getElementById('cpnType').value;
  var desc     = document.getElementById('cpnDesc').value.trim();
  var minOrder = Number(document.getElementById('cpnMinOrder').value)||0;
  var maxUse   = Number(document.getElementById('cpnMaxUse').value)||0;
  var active   = document.getElementById('cpnActive').checked;
  var valid    = true;
  if (!code||code.length<2)   { showError('cpnCode','Mã phải có ít nhất 2 ký tự'); valid=false; }
  if (!discount||discount<=0) { showError('cpnDiscount','Giá trị giảm phải lớn hơn 0'); valid=false; }
  if (type==='percent'&&discount>100) { showError('cpnDiscount','Phần trăm không thể quá 100%'); valid=false; }
  if (!valid) return;
  var result = COUPONS.add({ code:code, discount:discount, type:type, desc:desc, minOrder:minOrder, maxUse:maxUse||null, active:active });
  if (!result.ok) { showError('cpnCode',result.msg); return; }
  bootstrap.Modal.getInstance(document.getElementById('couponModal')).hide();
  document.getElementById('couponForm').reset(); // YC3
  showToast('Tạo mã '+code+' thành công!','success');
  loadCoupons();
}

function toggleCoupon(code) {
  var isActive = COUPONS.toggle(code);
  showToast('Mã '+code+(isActive?' đã bật':' đã tắt'),'success');
  loadCoupons();
}

function deleteCoupon(code) {
  if (!confirm('Xoá mã "'+code+'"? Thao tác không thể hoàn tác.')) return;
  COUPONS.remove(code);
  showToast('Đã xoá mã '+code,'success');
  loadCoupons();
}

// ===== NOTIFICATIONS =====
function handleNotifySubmit(e) {
  e.preventDefault();
  clearAllErrors(['notifyTitle','notifyContent']);
  var title   = document.getElementById('notifyTitle').value.trim();
  var content = document.getElementById('notifyContent').value.trim();
  var type    = document.getElementById('notifyType').value;
  var valid   = true;
  if (!title)   { showError('notifyTitle','Tiêu đề không được để trống'); valid=false; }
  if (!content) { showError('notifyContent','Nội dung không được để trống'); valid=false; }
  if (!valid) return;
  NOTIF.add({ type:type, title:title, message:content, icon:'bi-bell' });
  showToast('Đã gửi thông báo!','success');
  document.getElementById('notifyForm').reset(); // YC3
  // YC4: jQuery .append() + .slideDown()
  var tmap  = { promo:'<span class="badge bg-warning text-dark">Khuyến mãi</span>', confirm:'<span class="badge bg-success">Xác nhận</span>', info:'<span class="badge bg-info text-dark">Thông tin</span>' };
  var cmap  = { promo:'cb-notify-promo', confirm:'cb-notify-confirm', info:'cb-notify-info' };
  var item  = $('<div>').addClass('cb-notify-item '+(cmap[type]||'cb-notify-info'));
  item.html('<div class="d-flex justify-content-between"><strong>'+title+'</strong>'+(tmap[type]||'')+'</div>'
    +'<p class="small text-muted mb-0 mt-1">'+content+'</p>');
  item.hide();
  $('#notifyHistory').prepend(item);
  item.slideDown(300); // YC4
}

function clearNotifyHistory() {
  // YC4: jQuery .html()
  $('#notifyHistory').html('<p class="text-muted small text-center py-3">Chưa có thông báo nào được gửi.</p>');
}

// ===== IMPORT DRINKS FROM API =====
function openImportDrinksModal() {
  var el = document.getElementById('importDrinksUrl');
  if (el) el.value = '';
  clearError('importDrinksUrl');
  var res = document.getElementById('importDrinksResult');
  if (res) res.innerHTML = '';
  new bootstrap.Modal(document.getElementById('importDrinksModal')).show();
}

function importDrinksFromApi() {
  var urlEl = document.getElementById('importDrinksUrl');
  var url   = urlEl ? urlEl.value.trim() : '';
  clearError('importDrinksUrl');

  if (!url) { showError('importDrinksUrl', 'Vui lòng nhập URL API'); return; }
  if (!isValidImageUrl(url)) { showError('importDrinksUrl', 'URL không hợp lệ'); return; }

  // YC2: fetch + .then/.catch
  $('#importDrinksText').hide();
  $('#importDrinksSpinner').show();
  $('#importDrinksBtn').prop('disabled', true);
  document.getElementById('importDrinksResult').innerHTML = '';

  fetch(url)
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function(data) {
      if (!Array.isArray(data)) throw new Error('Dữ liệu phải là mảng JSON');

      var valid = [];
      for (var i = 0; i < data.length; i++) { // YC1: for loop
        var d = data[i];
        var name  = d.name || d.title || d.ten || '';
        var price = Number(d.price || d.gia || 0);
        var cat   = d.category || d.loai || 'Đồ uống';
        var img   = d.image || d.imageUrl || d.hinh || '';
        var desc  = d.description || d.moTa || '';
        if (name && price > 0) valid.push({ name:name, price:price, category:cat, image:img, description:desc });
      }

      if (!valid.length) throw new Error('Không tìm thấy dữ liệu hợp lệ trong API');

      var previewHtml = '<div class="alert alert-info py-2 small"><strong>' + valid.length + ' món</strong> sẽ được import.</div>'
        + '<div style="max-height:180px;overflow-y:auto">';
      for (var j = 0; j < valid.length; j++) { // YC1: for loop
        previewHtml += '<div class="d-flex align-items-center gap-2 py-1 border-bottom small">'
          + '<i class="bi bi-cup-hot cb-text-green"></i>'
          + '<span class="fw-500">' + valid[j].name + '</span>'
          + '<span class="text-muted ms-auto">' + formatPrice(valid[j].price) + '</span>'
          + '</div>';
      }
      previewHtml += '</div>'
        + '<div class="mt-2 text-end">'
        + '<button class="btn cb-btn-primary btn-sm" onclick="confirmImportDrinks(' + JSON.stringify(valid).replace(/"/g,'&quot;') + ')">'
        + '<i class="bi bi-cloud-download me-1"></i>Xác nhận import ' + valid.length + ' món</button>'
        + '</div>';

      document.getElementById('importDrinksResult').innerHTML = previewHtml;
    })
    .catch(function(err) {
      document.getElementById('importDrinksResult').innerHTML =
        '<div class="alert alert-danger py-2 small">Lỗi: ' + err.message + '</div>';
    })
    .finally(function() {
      $('#importDrinksText').show();
      $('#importDrinksSpinner').hide();
      $('#importDrinksBtn').prop('disabled', false);
    });
}

function confirmImportDrinks(items) {
  if (!items || !items.length) return;
  var done  = 0;
  var total = items.length;
  var failed = 0;

  // Post all drinks sequentially using reduce + Promise chain
  var chain = Promise.resolve();
  for (var i = 0; i < items.length; i++) { // YC1: for loop
    (function(item) {
      chain = chain.then(function() {
        return createDrink(item)
          .then(function() { done++; })
          .catch(function() { failed++; });
      });
    })(items[i]);
  }

  chain.then(function() {
    var msg = 'Import xong: ' + done + '/' + total + ' món thành công';
    if (failed) msg += ', ' + failed + ' thất bại';
    bootstrap.Modal.getInstance(document.getElementById('importDrinksModal')).hide();
    showToast(msg, done > 0 ? 'success' : 'error');
    loadAdminDrinks();
    loadDashboard();
  });
}