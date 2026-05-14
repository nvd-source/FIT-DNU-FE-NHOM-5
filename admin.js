// JavaScript quản trị Cafebook
// Xử lý menu, đặt bàn và bảng điều khiển cho admin

let allDrinks = [];
let allReservations = [];
let addDrinkModal = null;

// DOM elements
const menuTableContainer = document.getElementById('menuTableContainer');
const reservationsTableContainer = document.getElementById('reservationsTableContainer');
const drinkForm = document.getElementById('drinkForm');
const saveDrinkBtn = document.getElementById('saveDrinkBtn');
const adminContent = document.getElementById('adminContent');
const logoutBtn = document.getElementById('logoutBtn');

// Khởi tạo admin app
document.addEventListener('DOMContentLoaded', function() {
    addDrinkModal = new bootstrap.Modal(document.getElementById('addDrinkModal'));
    setupEventListeners();
    checkAdminSession();
});

function setupEventListeners() {
    if (saveDrinkBtn) {
        saveDrinkBtn.addEventListener('click', saveDrink);
    }

    const filterButtons = document.querySelectorAll('[data-filter]');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            filterReservations(filter);
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    const formFields = drinkForm.querySelectorAll('input, select, textarea');
    formFields.forEach(field => {
        field.addEventListener('input', validateDrinkField);
        field.addEventListener('blur', validateDrinkField);
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Sidebar navigation
    const sidebarLinks = document.querySelectorAll('.sidebar .nav-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            if (section) {
                showSection(section);
            }
        });
    });
}

function checkAdminSession() {
    const isAdmin = sessionStorage.getItem('adminLoggedIn') === 'true';
    if (!isAdmin) {
        window.location.href = 'login.html';
        return;
    }

    if (adminContent) {
        adminContent.classList.remove('d-none');
    }
    if (logoutBtn) {
        logoutBtn.classList.remove('d-none');
    }

    loadDashboard();
    loadMenu();
    loadReservations();
    showSection('dashboard'); // Hiển thị dashboard mặc định
}

function handleLogout() {
    sessionStorage.removeItem('adminLoggedIn');
    window.location.href = 'login.html';
}


// Tải dữ liệu bảng điều khiển
async function loadDashboard() {
    try {
        const reservations = await CafeAPI.getReservations();

        const total = reservations.length;
        const pending = reservations.filter(r => r.status === 'pending').length;
        const confirmed = reservations.filter(r => r.status === 'confirmed').length;

        document.getElementById('totalReservations').textContent = total;
        document.getElementById('pendingReservations').textContent = pending;
        document.getElementById('confirmedReservations').textContent = confirmed;

    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Tải danh sách đồ uống
async function loadMenu() {
    try {
        CafeAPI.showLoading(menuTableContainer);
        allDrinks = await CafeAPI.getDrinks();
        displayMenuTable(allDrinks);
    } catch (error) {
        CafeAPI.showError('Không thể tải menu');
        menuTableContainer.innerHTML = '<div class="alert alert-danger">Không thể tải menu</div>';
    }
}

// Hiển thị bảng menu đồ uống
function displayMenuTable(drinks) {
    if (drinks.length === 0) {
        menuTableContainer.innerHTML = '<div class="alert alert-info">Chưa có món nào trong menu</div>';
        return;
    }

    let tableHTML = `
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Hình ảnh</th>
                        <th>Tên món</th>
                        <th>Danh mục</th>
                        <th>Giá</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
    `;

    drinks.forEach(drink => {
        tableHTML += `
            <tr>
                <td><img src="${drink.imageUrl || 'https://via.placeholder.com/50x50'}" alt="${drink.name}" class="img-thumbnail" style="width: 50px; height: 50px;"></td>
                <td>${drink.name}</td>
                <td><span class="badge bg-secondary">${drink.category}</span></td>
                <td>${drink.price.toLocaleString()} VND</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-2" onclick="editDrink('${drink.id}')">Sửa</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteDrink('${drink.id}')">Xóa</button>
                </td>
            </tr>
        `;
    });

    tableHTML += `
                </tbody>
            </table>
        </div>
    `;

    menuTableContainer.innerHTML = tableHTML;
}

// Chỉnh sửa món
async function editDrink(id) {
    try {
        const drink = await CafeAPI.getDrinkById(id);

        document.getElementById('drinkId').value = drink.id;
        document.getElementById('drinkName').value = drink.name;
        document.getElementById('drinkDescription').value = drink.description || '';
        document.getElementById('drinkPrice').value = drink.price;
        document.getElementById('drinkCategory').value = drink.category;
        document.getElementById('drinkImage').value = drink.imageUrl || '';

        document.getElementById('modalTitle').textContent = 'Chỉnh sửa món';
        if (addDrinkModal) addDrinkModal.show();

    } catch (error) {
        CafeAPI.showError('Không thể tải thông tin món');
    }
}

// Xóa món
async function deleteDrink(id) {
    if (confirm('Bạn có chắc muốn xóa món này?')) {
        try {
            await CafeAPI.deleteDrink(id);
            loadMenu(); // Reload menu
            showToast('Đã xóa món thành công', 'success');
        } catch (error) {
            CafeAPI.showError('Không thể xóa món');
        }
    }
}

// Lưu món (thêm mới hoặc cập nhật)
async function saveDrink() {
    // Validate form
    if (!validateDrinkForm()) {
        return;
    }

    const drinkData = {
        name: document.getElementById('drinkName').value.trim(),
        description: document.getElementById('drinkDescription').value.trim(),
        price: parseInt(document.getElementById('drinkPrice').value),
        category: document.getElementById('drinkCategory').value,
        imageUrl: document.getElementById('drinkImage').value.trim()
    };

    try {
        saveDrinkBtn.disabled = true;
        saveDrinkBtn.textContent = 'Đang lưu...';

        const drinkId = document.getElementById('drinkId').value;

        if (drinkId) {
            // Update
            await CafeAPI.updateDrink(drinkId, drinkData);
            showToast('Đã cập nhật món thành công', 'success');
        } else {
            // Create
            await CafeAPI.createDrink(drinkData);
            showToast('Đã thêm món mới thành công', 'success');
        }

        if (addDrinkModal) addDrinkModal.hide();
        drinkForm.reset();
        loadMenu(); // Reload menu

    } catch (error) {
        CafeAPI.showError('Không thể lưu món');
    } finally {
        saveDrinkBtn.disabled = false;
        saveDrinkBtn.textContent = 'Lưu';
    }
}

// Kiểm tra form đồ uống
function validateDrinkForm() {
    const requiredFields = drinkForm.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!validateDrinkField({ target: field })) {
            isValid = false;
        }
    });

    return isValid;
}

// Kiểm tra từng trường trong form đồ uống
function validateDrinkField(event) {
    const field = event.target;
    const value = field.value.trim();

    if (field.hasAttribute('required') && value === '') {
        showFieldError(field, 'Trường này là bắt buộc');
        return false;
    }

    if (field.type === 'number' && field.id === 'drinkPrice' && (isNaN(value) || parseInt(value) <= 0)) {
        showFieldError(field, 'Giá phải lớn hơn 0');
        return false;
    }

    if (field.type === 'url' && value !== '' && !isValidUrl(value)) {
        showFieldError(field, 'URL không hợp lệ');
        return false;
    }

    hideFieldError(field);
    return true;
}

// Kiểm tra URL có hợp lệ hay không
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Show field error
function showFieldError(field, message) {
    field.classList.add('is-invalid');
    const feedback = field.nextElementSibling;
    if (feedback && feedback.classList.contains('invalid-feedback')) {
        feedback.textContent = message;
    }
}

// Hide field error
function hideFieldError(field) {
    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
}

// Hiển thị section được chọn trong sidebar
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.add('d-none'));

    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.remove('d-none');
    }

    // Update sidebar active link
    const sidebarLinks = document.querySelectorAll('.sidebar .nav-link');
    sidebarLinks.forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`.sidebar .nav-link[data-section="${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Tải danh sách đặt bàn
async function loadReservations() {
    try {
        CafeAPI.showLoading(reservationsTableContainer);
        allReservations = await CafeAPI.getReservations();
        displayReservationsTable(allReservations);
    } catch (error) {
        CafeAPI.showError('Không thể tải danh sách đặt bàn');
        reservationsTableContainer.innerHTML = '<div class="alert alert-danger">Không thể tải danh sách đặt bàn</div>';
    }
}

// Hiển thị bảng đặt bàn
function displayReservationsTable(reservations) {
    if (reservations.length === 0) {
        reservationsTableContainer.innerHTML = '<div class="alert alert-info">Chưa có đặt bàn nào</div>';
        return;
    }

    let tableHTML = `
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Khách hàng</th>
                        <th>SĐT</th>
                        <th>Bàn</th>
                        <th>Ngày/Giờ</th>
                        <th>Số người</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
    `;

    reservations.forEach(reservation => {
        const statusBadge = getStatusBadge(reservation.status);
        tableHTML += `
            <tr>
                <td>${reservation.guestName}</td>
                <td>${reservation.phone}</td>
                <td>Bàn ${reservation.tableId}</td>
                <td>${formatDate(reservation.date)} ${reservation.time}</td>
                <td>${reservation.guests}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        ${getActionButtons(reservation)}
                    </div>
                </td>
            </tr>
        `;
    });

    tableHTML += `
                </tbody>
            </table>
        </div>
    `;

    reservationsTableContainer.innerHTML = tableHTML;
}

// Tạo nhãn trạng thái đặt bàn
function getStatusBadge(status) {
    const statusMap = {
        'pending': { class: 'warning', text: 'Chờ duyệt' },
        'confirmed': { class: 'success', text: 'Đã xác nhận' },
        'cancelled': { class: 'danger', text: 'Đã hủy' }
    };

    const statusInfo = statusMap[status] || { class: 'secondary', text: status };
    return `<span class="badge bg-${statusInfo.class}">${statusInfo.text}</span>`;
}

// Tạo nút hành động theo trạng thái
function getActionButtons(reservation) {
    let buttons = '';

    if (reservation.status === 'pending') {
        buttons += `<button class="btn btn-outline-success" onclick="updateReservationStatus('${reservation.id}', 'confirmed')">Xác nhận</button>`;
        buttons += `<button class="btn btn-outline-danger" onclick="updateReservationStatus('${reservation.id}', 'cancelled')">Hủy</button>`;
    } else if (reservation.status === 'confirmed') {
        buttons += `<button class="btn btn-outline-danger" onclick="updateReservationStatus('${reservation.id}', 'cancelled')">Hủy</button>`;
    }

    return buttons;
}

// Cập nhật trạng thái đặt bàn
async function updateReservationStatus(id, status) {
    try {
        const reservation = await CafeAPI.getReservationById(id);
        reservation.status = status;

        await CafeAPI.updateReservation(id, reservation);

        loadReservations(); // Reload reservations
        loadDashboard(); // Update dashboard
        showToast(`Đã ${status === 'confirmed' ? 'xác nhận' : 'hủy'} đặt bàn`, 'success');

    } catch (error) {
        CafeAPI.showError('Không thể cập nhật trạng thái');
    }
}

// Lọc danh sách đặt bàn
function filterReservations(status) {
    let filteredReservations;

    if (status === 'all') {
        filteredReservations = allReservations;
    } else {
        filteredReservations = allReservations.filter(r => r.status === status);
    }

    displayReservationsTable(filteredReservations);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

// Hiển thị thông báo toast
function showToast(message, type = 'info') {
    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;

    if (!document.getElementById('toastContainer')) {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '11';
        document.body.appendChild(container);
    }

    const container = document.getElementById('toastContainer');
    container.insertAdjacentHTML('beforeend', toastHtml);

    const toastElement = container.lastElementChild;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();

    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});