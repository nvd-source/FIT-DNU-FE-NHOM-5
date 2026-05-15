// JavaScript chính cho phần Public của Cafebook
// Xử lý hiển thị menu, lọc danh mục, xem sơ đồ bàn và form đặt bàn

let allDrinks = [];
let allTables = [];
let selectedTableId = null;
let selectedFloor = 1;

function normalizeId(value) {
    if (value === null || value === undefined) return null;
    return parseInt(value, 10);
}

function getTableStatus(table) {
    return table && table.status ? table.status.toString().trim().toLowerCase() : 'available';
}

function showToast(message, type = 'success') {
    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    if (!document.getElementById('toastContainer')) {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1080';
        document.body.appendChild(container);
    }

    const container = document.getElementById('toastContainer');
    container.insertAdjacentHTML('beforeend', toastHtml);
    const toastEl = container.lastElementChild;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

// DOM elements
const menuContainer = document.getElementById('menuContainer');
const reservationForm = document.getElementById('reservationForm');
const tableSelect = document.getElementById('tableId');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadMenu();
    loadTables();
    setupEventListeners();
    loadSavedReservationData(); // Tải thông tin đặt bàn đã lưu
});

// Thiết lập sự kiện cho trang
function setupEventListeners() {
    // Nút lọc menu
    const filterButtons = document.querySelectorAll('[data-filter]');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            filterMenu(filter);
            // Cập nhật nút đang chọn
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Gửi form đặt bàn
    reservationForm.addEventListener('submit', handleReservationSubmit);

    // Kiểm tra dữ liệu khi nhập
    const requiredFields = reservationForm.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        field.addEventListener('input', validateField);
        field.addEventListener('blur', validateField);
        field.addEventListener('input', saveReservationData); // Lưu dữ liệu khi nhập
    });

    // Kiểm tra số lượng khách
    document.getElementById('guests').addEventListener('input', validateGuests);
    document.getElementById('guests').addEventListener('input', saveReservationData);

    // Lưu khi chọn bàn
    tableSelect.addEventListener('change', saveReservationData);

    // Lưu khi nhập notes
    document.getElementById('notes').addEventListener('input', saveReservationData);

    const refreshBtn = document.getElementById('refreshMenuBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadMenu();
            const status = document.getElementById('jqueryStatus');
            if (status) {
                status.textContent = 'Đã tải lại menu.';
            }
        });
    }
}

// Tải menu đồ uống từ API
async function loadMenu() {
    try {
        CafeAPI.showLoading(menuContainer);
        allDrinks = await CafeAPI.getDrinks();
        displayMenu(allDrinks);
    } catch (error) {
        CafeAPI.showError('Không thể tải menu. Vui lòng thử lại sau.');
        menuContainer.innerHTML = '<div class="alert alert-danger">Không thể tải menu</div>';
    }
}

// Hiển thị danh sách menu
function displayMenu(drinks) {
    menuContainer.innerHTML = '';

    if (drinks.length === 0) {
        menuContainer.innerHTML = '<div class="col-12 text-center">Không có món nào trong menu</div>';
        return;
    }

    drinks.forEach(drink => {
        const drinkCard = createDrinkCard(drink);
        menuContainer.appendChild(drinkCard);
    });
}

// Tạo thẻ đồ uống
function createDrinkCard(drink) {
    const col = document.createElement('div');
    col.className = 'col-lg-4 col-md-6 mb-4';

    col.innerHTML = `
        <div class="card h-100 shadow-sm">
            <img src="${drink.imageUrl || 'https://via.placeholder.com/300x200'}" class="card-img-top" alt="${drink.name}">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${drink.name}</h5>
                <p class="card-text">${drink.description || ''}</p>
                <div class="mt-auto">
                    <span class="badge bg-secondary mb-2">${drink.category}</span>
                    <p class="card-text fw-bold text-primary">${drink.price.toLocaleString()} VND</p>
                </div>
            </div>
        </div>
    `;

    return col;
}

// Filter menu by category
function filterMenu(category) {
    const normalizedFilter = category.toLowerCase();
    let filteredDrinks;

    if (normalizedFilter === 'all') {
        filteredDrinks = allDrinks;
    } else {
        filteredDrinks = allDrinks.filter(drink => {
            const normalizedCategory = drink.category.toString().toLowerCase();
            return normalizedCategory === normalizedFilter
                || normalizedCategory.includes(normalizedFilter)
                || (normalizedFilter === 'coffee' && normalizedCategory.includes('cà phê'))
                || (normalizedFilter === 'tea' && normalizedCategory.includes('trà'))
                || (normalizedFilter === 'juice' && normalizedCategory.includes('sinh tố'));
        });
    }

    displayMenu(filteredDrinks);
}

// Tải danh sách bàn từ API
async function loadTables() {
    try {
        allTables = await CafeAPI.getTables();
        populateTableSelect();
    } catch (error) {
        CafeAPI.showError('Không thể tải danh sách bàn. Vui lòng thử lại sau.');
        if (tableSelect) {
            tableSelect.innerHTML = '<option value="">Không thể tải danh sách bàn</option>';
        }
    }
}

function getTableFloor(table) {
    return table && table.floor ? parseInt(table.floor, 10) : 1;
}

function populateTableSelect() {
    if (!tableSelect) return;

    tableSelect.innerHTML = '<option value="">Chọn bàn</option>';

    const availableTables = allTables.filter(table => getTableStatus(table) === 'available');

    availableTables.forEach(table => {
        const option = document.createElement('option');
        option.value = table.id;
        const floor = getTableFloor(table);
        option.textContent = `Bàn ${table.id} (${table.capacity} người) - Tầng ${floor}`;
        if (normalizeId(selectedTableId) === normalizeId(table.id)) {
            option.selected = true;
        }
        tableSelect.appendChild(option);
    });
}

function selectTable(tableId) {
    const normalizedId = normalizeId(tableId);
    const table = allTables.find(item => normalizeId(item.id) === normalizedId);
    if (!table) return;

    selectedTableId = normalizedId;
    if (tableSelect) {
        tableSelect.value = normalizedId;
    }

    const reservationSection = document.getElementById('reservation');
    if (reservationSection) {
        reservationSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Kiểm tra từng trường dữ liệu
function validateField(event) {
    const field = event.target;
    const value = field.value.trim();

    if (field.hasAttribute('required') && value === '') {
        showFieldError(field, 'Trường này là bắt buộc');
        return false;
    }

    if (field.type === 'email' && value !== '' && !isValidEmail(value)) {
        showFieldError(field, 'Email không hợp lệ');
        return false;
    }

    hideFieldError(field);
    return true;
}

// Kiểm tra số lượng khách
function validateGuests(event) {
    const field = event.target;
    const value = parseInt(field.value);

    if (value < 1 || value > 10) {
        showFieldError(field, 'Số người phải từ 1 đến 10');
        return false;
    }

    hideFieldError(field);
    return true;
}

// Hiển thị lỗi trường
function showFieldError(field, message) {
    field.classList.add('is-invalid');
    const feedback = field.nextElementSibling;
    if (feedback && feedback.classList.contains('invalid-feedback')) {
        feedback.textContent = message;
    }
}

// Ẩn lỗi trường
function hideFieldError(field) {
    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
}

// Kiểm tra định dạng email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Xử lý gửi form đặt bàn
async function handleReservationSubmit(event) {
    event.preventDefault();

    // Validate all fields
    const requiredFields = reservationForm.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!validateField({ target: field })) {
            isValid = false;
        }
    });

    // Validate guests
    if (!validateGuests({ target: document.getElementById('guests') })) {
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    // Collect form data
    const reservationData = {
        guestName: document.getElementById('guestName').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        date: document.getElementById('reservationDate').value,
        time: document.getElementById('reservationTime').value,
        tableId: parseInt(document.getElementById('tableId').value),
        guests: parseInt(document.getElementById('guests').value),
        status: 'pending',
        notes: document.getElementById('notes').value.trim(),
        createdAt: new Date().toISOString()
    };

    try {
        // Disable submit button
        const submitBtn = reservationForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Đang xử lý...';
        }

        // Submit reservation
        await CafeAPI.createReservation(reservationData);

        if (selectedTableId !== null) {
            const selectedTable = allTables.find(item => normalizeId(item.id) === normalizeId(selectedTableId));
            if (selectedTable) {
                selectedTable.status = 'reserved';
                try {
                    await CafeAPI.updateTable(selectedTableId, { ...selectedTable, status: 'reserved' });
                } catch (updateError) {
                    console.warn('Không thể cập nhật trạng thái bàn:', updateError);
                }
            }
        }

        showToast('Đặt bàn thành công! Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.', 'success');
        resetForm();

    } catch (error) {
        CafeAPI.showError('Không thể đặt bàn. Vui lòng thử lại sau.');
        const submitBtn = reservationForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Đặt bàn';
        }
    }
}

// Đặt lại form sau khi đặt bàn thành công
function resetForm() {
    selectedTableId = null;
    reservationForm.reset();
    localStorage.removeItem('reservationData'); // Xóa dữ liệu đã lưu
    populateTableSelect();

    const submitBtn = reservationForm.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Đặt bàn';
    }
}

// Cuộn mượt khi bấm điều hướng
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

// Tải thông tin đặt bàn đã lưu từ localStorage
function loadSavedReservationData() {
    const savedData = localStorage.getItem('reservationData');
    if (savedData) {
        const data = JSON.parse(savedData);
        document.getElementById('guestName').value = data.guestName || '';
        document.getElementById('phone').value = data.phone || '';
        document.getElementById('email').value = data.email || '';
        document.getElementById('reservationDate').value = data.date || '';
        document.getElementById('reservationTime').value = data.time || '';
        document.getElementById('guests').value = data.guests || '';
        document.getElementById('notes').value = data.notes || '';
        if (data.tableId) {
            selectTable(data.tableId);
        }
    }
}

// Lưu thông tin đặt bàn vào localStorage
function saveReservationData() {
    const data = {
        guestName: document.getElementById('guestName').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        date: document.getElementById('reservationDate').value,
        time: document.getElementById('reservationTime').value,
        tableId: selectedTableId,
        guests: document.getElementById('guests').value,
        notes: document.getElementById('notes').value
    };
    localStorage.setItem('reservationData', JSON.stringify(data));
}