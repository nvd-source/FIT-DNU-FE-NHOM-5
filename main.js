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
const tablesContainer = document.getElementById('tablesContainer');
const tableMap = document.getElementById('tableMap');
const floor1Image = document.getElementById('floor1Image');
const floor2Image = document.getElementById('floor2Image');
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

    // Nút chuyển tầng
    const floorButtons = document.querySelectorAll('.floor-toggle');
    floorButtons.forEach(button => {
        button.addEventListener('click', function() {
            selectedFloor = parseInt(this.getAttribute('data-floor'), 10);
            floorButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            displayFloorPlans();
            displayTableMap();
            displayTables();
        });
    });

    // Đồng bộ lựa chọn bàn với sơ đồ
    tableSelect.addEventListener('change', function() {
        const selectedValue = this.value;
        if (selectedValue) {
            selectTable(parseInt(selectedValue));
        } else {
            selectedTableId = null;
            displayTableMap();
        }
    });

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
        displayFloorPlans();
        displayTableMap();
        displayTables();
        populateTableSelect();
    } catch (error) {
        CafeAPI.showError('Không thể tải danh sách bàn. Vui lòng thử lại sau.');
        floor1Image.innerHTML = '<div class="text-center">Không thể tải sơ đồ Tầng 1</div>';
        floor2Image.innerHTML = '<div class="text-center">Không thể tải sơ đồ Tầng 2</div>';
        tableMap.innerHTML = '<div class="alert alert-danger">Không thể tải sơ đồ bàn</div>';
        tablesContainer.innerHTML = '<div class="alert alert-danger">Không thể tải danh sách bàn</div>';
    }
}

// Hiển thị sơ đồ bàn
function getTableFloor(table) {
    return table && table.floor ? parseInt(table.floor, 10) : 1;
}

function displayTableMap() {
    tableMap.innerHTML = '';

    const floorTables = allTables.filter(table => getTableFloor(table) === selectedFloor);
    if (floorTables.length === 0) {
        tableMap.innerHTML = '<div class="text-center">Chưa có bàn nào trên tầng này</div>';
        return;
    }

    floorTables.forEach(table => {
        const node = createTableNode(table);
        tableMap.appendChild(node);
    });
}

// Tạo nút bàn cho sơ đồ
function createTableNode(table) {
    const status = getTableStatus(table);
    const isAvailable = status === 'available';
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'table-node';
    node.classList.add(isAvailable ? 'available' : 'reserved');
    if (normalizeId(selectedTableId) === normalizeId(table.id)) {
        node.classList.add('selected');
    }
    node.innerHTML = `
        <div class="table-node-number">Bàn ${table.id}</div>
        <div class="table-node-capacity">${table.capacity} người</div>
    `;

    if (isAvailable) {
        node.addEventListener('click', () => selectTable(table.id));
    } else {
        node.disabled = true;
    }

    return node;
}

// Hiển thị danh sách bàn
function displayTables() {
    tablesContainer.innerHTML = '';

    const floorTables = allTables.filter(table => getTableFloor(table) === selectedFloor);
    if (floorTables.length === 0) {
        tablesContainer.innerHTML = '<div class="col-12 text-center">Không có bàn nào trên tầng này</div>';
        return;
    }

    renderTables(floorTables);
}

// Render bàn bằng grid layout hiện đại
function renderTables(tables) {
    const container = document.getElementById('tableMap');
    if(!container) return;
    
    container.innerHTML = '';
    tables.forEach(table => {
        const div = document.createElement('div');
        // Thêm các class để đồng bộ với CSS mới
        div.className = `table-node ${table.status.toLowerCase()}`;
        div.innerHTML = `
            <span class="fw-bold fs-4">#${table.id}</span>
            <small class="text-muted"><i class="fas fa-users"></i> ${table.capacity} chỗ</small>
        `;
        div.onclick = () => selectTable(table.id);
        container.appendChild(div);
    });
}

// Create table card element
function createTableCard(table) {
    const col = document.createElement('div');
    col.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';

    const status = getTableStatus(table);
    const statusClass = status === 'available' ? 'success' : 'danger';
    const statusText = status === 'available' ? 'Trống' : 'Đã đặt';

    col.innerHTML = `
        <div class="card h-100 shadow-sm">
            <div class="card-body text-center">
                <h5 class="card-title">Bàn ${table.id}</h5>
                <p class="card-text">Sức chứa: ${table.capacity} người</p>
                <span class="badge bg-${statusClass}">${statusText}</span>
            </div>
        </div>
    `;

    return col;
}

// Điền danh sách bàn vào form đặt bàn
function populateTableSelect() {
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
    if (!table) {
        return;
    }

    selectedTableId = normalizedId;
    selectedFloor = getTableFloor(table);
    tableSelect.value = normalizedId;
    updateFloorButtons();
    displayFloorPlans();
    displayTableMap();
    displayTables();

    // Đánh dấu bàn đang chọn trên sơ đồ
    document.querySelectorAll('.table-node.selected').forEach(node => node.classList.remove('selected'));
    const selectedNode = Array.from(tableMap.children).find(node => node.textContent.includes(`Bàn ${tableId}`));
    if (selectedNode) selectedNode.classList.add('selected');

    // Scroll đến form đặt bàn
    document.getElementById('reservation').scrollIntoView({ behavior: 'smooth' });
}

function updateFloorButtons() {
    const floorButtons = document.querySelectorAll('.floor-toggle');
    floorButtons.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.getAttribute('data-floor'), 10) === selectedFloor);
    });
}

function displayFloorPlans() {
    floor1Image.innerHTML = renderFloorPlan(1);
    floor2Image.innerHTML = renderFloorPlan(2);
    attachFloorPlanEvents();
}

function renderFloorPlan(floor) {
    const positions = getFloorPlanPositions(floor);
    const width = 360;
    const height = 320;

    const svgParts = positions.map(pos => {
        const table = allTables.find(item => normalizeId(item.id) === pos.id);
        if (!table) {
            return '';
        }

        const status = getTableStatus(table);
        const isSelected = normalizeId(selectedTableId) === normalizeId(table.id);
        const color = status === 'available' ? '#fffdf6' : '#f7d7d0';
        const stroke = isSelected ? '#9b261f' : '#c0392b';
        const strokeWidth = isSelected ? 3 : 1.8;
        const cursorStyle = status === 'available' ? 'cursor:pointer;' : 'cursor:not-allowed;';

        return `
            <g class="floor-table" data-table-id="${normalizeId(table.id)}" style="${cursorStyle}">
                <rect x="${pos.x}" y="${pos.y}" width="${pos.w}" height="${pos.h}" rx="10" ry="10" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}" />
                <text x="${pos.x + pos.w / 2}" y="${pos.y + pos.h / 2 - 4}" text-anchor="middle" fill="#4b4b4b" font-size="11" font-weight="700">Bàn ${table.id}</text>
                <text x="${pos.x + pos.w / 2}" y="${pos.y + pos.h / 2 + 12}" text-anchor="middle" fill="#6b6b6b" font-size="9">${table.capacity} chỗ</text>
            </g>
        `;
    }).join('');

    return `
        <svg class="floor-svg" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            ${renderFloorOutline(floor)}
            ${renderFloorDetails(floor)}
            <text x="${width / 2}" y="28" text-anchor="middle" fill="#4b4b4b" font-size="18" font-weight="700">Tầng ${floor}</text>
            ${svgParts}
        </svg>
    `;
}

function renderFloorOutline(floor) {
    if (floor === 1) {
        return `
            <rect x="18" y="30" width="324" height="278" rx="18" fill="#f8f0e8" stroke="#4b4b4b" stroke-width="3" />
            <rect x="18" y="30" width="84" height="116" rx="16" fill="#dfd4c8" stroke="#4b4b4b" stroke-width="2" />
            <rect x="102" y="30" width="172" height="80" rx="16" fill="#ffffff" stroke="#4b4b4b" stroke-width="2" />
            <rect x="276" y="30" width="66" height="90" rx="16" fill="#f6f2ee" stroke="#4b4b4b" stroke-width="2" />
            <rect x="18" y="146" width="84" height="162" rx="16" fill="#ffffff" stroke="#4b4b4b" stroke-width="2" />
            <path d="M 18 100 H 84" fill="none" stroke="#4b4b4b" stroke-width="3" />
            <path d="M 18 146 H 84" fill="none" stroke="#4b4b4b" stroke-width="3" />
            <line x1="102" y1="52" x2="274" y2="52" stroke="#4b4b4b" stroke-width="2" />
        `;
    }

    return `
        <rect x="18" y="30" width="324" height="278" rx="18" fill="#eef4e5" stroke="#4b4b4b" stroke-width="3" />
        <rect x="18" y="30" width="88" height="278" rx="16" fill="#f7f7f2" stroke="#4b4b4b" stroke-width="2" />
        <rect x="108" y="30" width="234" height="278" rx="16" fill="#ecf5e3" stroke="#4b4b4b" stroke-width="2" />
        <path d="M 18 110 H 84" fill="none" stroke="#4b4b4b" stroke-width="3" />
        <path d="M 18 162 H 84" fill="none" stroke="#4b4b4b" stroke-width="3" />
        <path d="M 108 54 V 304" fill="none" stroke="#4b4b4b" stroke-width="2" stroke-dasharray="6 4" />
    `;
}

function renderFloorDetails(floor) {
    if (floor === 1) {
        return `
            <text x="50" y="48" fill="#4b4b4b" font-size="10" font-weight="700">Quầy pha chế</text>
            <text x="298" y="48" fill="#4b4b4b" font-size="10" font-weight="700">WC</text>
            <rect x="104" y="104" width="30" height="18" rx="8" fill="#c0b3a4" />
            <rect x="140" y="104" width="30" height="18" rx="8" fill="#c0b3a4" />
            <rect x="176" y="104" width="30" height="18" rx="8" fill="#c0b3a4" />
            <rect x="212" y="104" width="30" height="18" rx="8" fill="#c0b3a4" />
            <rect x="104" y="148" width="30" height="18" rx="8" fill="#c0b3a4" />
            <rect x="140" y="148" width="30" height="18" rx="8" fill="#c0b3a4" />
            <rect x="176" y="148" width="30" height="18" rx="8" fill="#c0b3a4" />
            <rect x="212" y="148" width="30" height="18" rx="8" fill="#c0b3a4" />
            <g fill="#8abf8f" opacity="0.8">
                <circle cx="62" cy="236" r="8" />
                <circle cx="82" cy="266" r="8" />
                <circle cx="62" cy="292" r="8" />
            </g>
        `;
    }

    return `
        <text x="44" y="48" fill="#4b4b4b" font-size="10" font-weight="700">Cầu thang</text>
        <text x="44" y="82" fill="#4b4b4b" font-size="10" font-weight="700">Khu vườn</text>
        <rect x="110" y="66" width="30" height="18" rx="8" fill="#d0d7c1" />
        <rect x="146" y="66" width="30" height="18" rx="8" fill="#d0d7c1" />
        <rect x="182" y="66" width="30" height="18" rx="8" fill="#d0d7c1" />
        <rect x="110" y="110" width="30" height="18" rx="8" fill="#d0d7c1" />
        <rect x="146" y="110" width="30" height="18" rx="8" fill="#d0d7c1" />
        <rect x="182" y="110" width="30" height="18" rx="8" fill="#d0d7c1" />
        <g fill="#8abf8f" opacity="0.7">
            <circle cx="64" cy="194" r="8" />
            <circle cx="64" cy="232" r="8" />
            <circle cx="64" cy="270" r="8" />
            <circle cx="64" cy="308" r="8" />
        </g>
    `;
}

function getFloorPlanPositions(floor) {
    if (floor === 1) {
        return [
            { id: 1, x: 108, y: 68, w: 48, h: 30 },
            { id: 2, x: 164, y: 68, w: 48, h: 30 },
            { id: 3, x: 220, y: 68, w: 48, h: 30 },
            { id: 4, x: 136, y: 120, w: 48, h: 30 },
            { id: 5, x: 192, y: 120, w: 48, h: 30 }
        ];
    }

    return [
        { id: 6, x: 108, y: 68, w: 48, h: 30 },
        { id: 7, x: 164, y: 68, w: 48, h: 30 },
        { id: 8, x: 220, y: 68, w: 48, h: 30 },
        { id: 9, x: 136, y: 120, w: 48, h: 30 },
        { id: 10, x: 192, y: 120, w: 48, h: 30 }
    ];
}
function attachFloorPlanEvents() {
    [floor1Image, floor2Image].forEach(floorEl => {
        if (!floorEl) return;
        floorEl.querySelectorAll('.floor-table').forEach(node => {
            const tableId = normalizeId(node.getAttribute('data-table-id'));
            const table = allTables.find(item => normalizeId(item.id) === tableId);
            if (!table || getTableStatus(table) !== 'available') {
                return;
            }

            node.addEventListener('click', () => selectTable(tableId));
        });
    });
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
    updateFloorButtons();
    displayTableMap();
    displayTables();

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