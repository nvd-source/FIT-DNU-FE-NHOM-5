// Admin panel functionality

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

// Initialize
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
    showSection('dashboard');
}

function handleLogout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        sessionStorage.removeItem('adminLoggedIn');
        window.location.href = 'login.html';
    }
}

// Dashboard
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

// Menu Management
async function loadMenu() {
    try {
        CafeAPI.showLoading(menuTableContainer);
        allDrinks = await CafeAPI.getDrinks();
        displayMenuTable(allDrinks);
    } catch (error) {
        console.error('Error loading menu:', error);
        menuTableContainer.innerHTML = '<div class="alert alert-danger">Không thể tải menu</div>';
    }
}

function displayMenuTable(drinks) {
    if (drinks.length === 0) {
        menuTableContainer.innerHTML = '<div class="alert alert-info">Chưa có món nào trong menu</div>';
        return;
    }

    let tableHTML = `
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>Hình Ảnh</th>
                        <th>Tên Món</th>
                        <th>Danh Mục</th>
                        <th>Giá</th>
                        <th>Thao Tác</th>
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
                    <button class="btn btn-sm btn-outline-primary me-2" onclick="editDrink('${drink.id}')">
                        <i class="bi bi-pencil"></i> Sửa
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteDrink('${drink.id}')">
                        <i class="bi bi-trash"></i> Xóa
                    </button>
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

async function editDrink(id) {
    try {
        const drink = await CafeAPI.getDrinkById(id);

        document.getElementById('drinkId').value = drink.id;
        document.getElementById('drinkName').value = drink.name;
        document.getElementById('drinkDescription').value = drink.description || '';
        document.getElementById('drinkPrice').value = drink.price;
        document.getElementById('drinkCategory').value = drink.category;
        document.getElementById('drinkImage').value = drink.imageUrl || '';

        document.getElementById('modalTitle').textContent = 'Chỉnh Sửa Món';
        if (addDrinkModal) addDrinkModal.show();

    } catch (error) {
        console.error('Error editing drink:', error);
        alert('Không thể tải thông tin món');
    }
}

async function deleteDrink(id) {
    if (confirm('Bạn có chắc muốn xóa món này?')) {
        try {
            await CafeAPI.deleteDrink(id);
            loadMenu();
            showToast('Đã xóa món thành công', 'success');
        } catch (error) {
            console.error('Error deleting drink:', error);
            alert('Không thể xóa món');
        }
    }
}

async function saveDrink() {
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
        saveDrinkBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Đang lưu...';

        const drinkId = document.getElementById('drinkId').value;

        if (drinkId) {
            await CafeAPI.updateDrink(drinkId, drinkData);
            showToast('Đã cập nhật món thành công', 'success');
        } else {
            await CafeAPI.createDrink(drinkData);
            showToast('Đã thêm món mới thành công', 'success');
        }

        if (addDrinkModal) addDrinkModal.hide();
        drinkForm.reset();
        loadMenu();

    } catch (error) {
        console.error('Error saving drink:', error);
        alert('Không thể lưu món');
    } finally {
        saveDrinkBtn.disabled = false;
        saveDrinkBtn.innerHTML = '<i class="bi bi-save"></i> Lưu';
    }
}

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

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

function showFieldError(field, message) {
    field.classList.add('is-invalid');
    const feedback = field.nextElementSibling;
    if (feedback && feedback.classList.contains('invalid-feedback')) {
        feedback.textContent = message;
    }
}

function hideFieldError(field) {
    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
}

// Sections
function showSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.add('d-none'));

    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.remove('d-none');
    }

    const sidebarLinks = document.querySelectorAll('.sidebar .nav-link');
    sidebarLinks.forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`.sidebar .nav-link[data-section="${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Reservations
async function loadReservations() {
    try {
        CafeAPI.showLoading(reservationsTableContainer);
        allReservations = await CafeAPI.getReservations();
        displayReservationsTable(allReservations);
    } catch (error) {
        console.error('Error loading reservations:', error);
        reservationsTableContainer.innerHTML = '<div class="alert alert-danger">Không thể tải danh sách đặt bàn</div>';
    }
}

function displayReservationsTable(reservations) {
    if (reservations.length === 0) {
        reservationsTableContainer.innerHTML = '<div class="alert alert-info">Chưa có đặt bàn nào</div>';
        return;
    }

    let tableHTML = `
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>Khách Hàng</th>
                        <th>SĐT</th>
                        <th>Email</th>
                        <th>Bàn</th>
                        <th>Ngày/Giờ</th>
                        <th>Số Người</th>
                        <th>Ghi Chú</th>
                        <th>Trạng Thái</th>
                        <th>Thao Tác</th>
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
                <td>${reservation.email || '-'}</td>
                <td>Bàn ${reservation.tableId}</td>
                <td>${formatDate(reservation.date)} ${reservation.time}</td>
                <td>${reservation.guests}</td>
                <td><small>${reservation.notes || '-'}</small></td>
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

function getStatusBadge(status) {
    const statusMap = {
        'pending': { class: 'warning', text: 'Chờ Duyệt' },
        'confirmed': { class: 'success', text: 'Đã Xác Nhận' },
        'cancelled': { class: 'danger', text: 'Đã Hủy' }
    };

    const statusInfo = statusMap[status] || { class: 'secondary', text: status };
    return `<span class="badge bg-${statusInfo.class}">${statusInfo.text}</span>`;
}

function getActionButtons(reservation) {
    let buttons = '';

    if (reservation.status === 'pending') {
        buttons += `<button class="btn btn-outline-success btn-sm" onclick="updateReservationStatus('${reservation.id}', 'confirmed')"><i class="bi bi-check-circle"></i> Xác Nhận</button>`;
        buttons += `<button class="btn btn-outline-danger btn-sm" onclick="updateReservationStatus('${reservation.id}', 'cancelled')"><i class="bi bi-x-circle"></i> Hủy</button>`;
    } else if (reservation.status === 'confirmed') {
        buttons += `<button class="btn btn-outline-danger btn-sm" onclick="updateReservationStatus('${reservation.id}', 'cancelled')"><i class="bi bi-x-circle"></i> Hủy</button>`;
    } else if (reservation.status === 'cancelled') {
        buttons += `<button class="btn btn-outline-secondary btn-sm" disabled>Đã Hủy</button>`;
    }

    return buttons;
}

async function updateReservationStatus(id, status) {
    try {
        const reservation = await CafeAPI.getReservationById(id);
        reservation.status = status;

        await CafeAPI.updateReservation(id, reservation);

        loadReservations();
        loadDashboard();
        showToast(`Đã ${status === 'confirmed' ? 'xác nhận' : 'hủy'} đặt bàn`, 'success');

    } catch (error) {
        console.error('Error updating status:', error);
        alert('Không thể cập nhật trạng thái');
    }
}

function filterReservations(status) {
    let filteredReservations;

    if (status === 'all') {
        filteredReservations = allReservations;
    } else {
        filteredReservations = allReservations.filter(r => r.status === status);
    }

    displayReservationsTable(filteredReservations);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

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
