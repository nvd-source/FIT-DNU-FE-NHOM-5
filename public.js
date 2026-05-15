// JavaScript cho trang public - Quản lý menu, bàn và đặt bàn

let allDrinks = [];
let allTables = [];
let selectedTableId = null;

// ================== INIT ==================
document.addEventListener('DOMContentLoaded', function () {
    loadMenu();
    loadTables();
    setupEventListeners();
    loadSavedReservationData();
    loadCustomerInfo();
});

// ================== SETUP EVENTS ==================
function setupEventListeners() {

    // Filter menu
    const filterButtons = document.querySelectorAll('[data-filter]');
    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
            const filter = this.getAttribute('data-filter');
            filterMenu(filter);

            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Submit form
    const reservationForm = document.getElementById('reservationForm');
    if (reservationForm) {
        reservationForm.addEventListener('submit', handleReservationSubmit);
    }

    // Refresh menu
    const refreshBtn = document.getElementById('refreshMenuBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            loadMenu();
            showToast('Đã tải lại menu', 'success');
        });
    }

    // Table buttons click
    const tableButtons = document.querySelectorAll(".table-btn");
    const tableSelect = document.getElementById("tableId");

    tableButtons.forEach(button => {
        button.addEventListener("click", function () {
            const selectedTable = this.getAttribute('data-table');

            // reset trạng thái button
            tableButtons.forEach(btn => {
                btn.classList.remove("btn-primary", "text-white");
                btn.classList.add("btn-outline-success");
            });

            // active button
            this.classList.remove("btn-outline-success");
            this.classList.add("btn-primary", "text-white");

            // sync dropdown
            tableSelect.value = selectedTable;
            selectedTableId = selectedTable;

            // scroll to form
            document.getElementById("reservation").scrollIntoView({
                behavior: "smooth"
            });
        });
    });

    // Save data on input
    const inputs = document.querySelectorAll('#reservationForm input, #reservationForm textarea, #reservationForm select');
    inputs.forEach(input => {
        input.addEventListener('input', saveReservationData);
        input.addEventListener('change', saveReservationData);
    });
}

// ================== MENU ==================
async function loadMenu() {
    const menuContainer = document.getElementById('menuContainer');

    try {
        menuContainer.innerHTML = '<p class="text-center col-12">Đang tải menu...</p>';

        allDrinks = await CafeAPI.getDrinks();
        displayMenu(allDrinks);

    } catch (error) {
        menuContainer.innerHTML = '<div class="col-12"><div class="alert alert-danger">Không thể tải menu</div></div>';
    }
}

function displayMenu(drinks) {
    const menuContainer = document.getElementById('menuContainer');
    menuContainer.innerHTML = '';

    if (!drinks || drinks.length === 0) {
        menuContainer.innerHTML = '<div class="col-12 text-center py-5">Chưa có món nào trong menu</div>';
        return;
    }

    drinks.forEach(drink => {
        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6';

        col.innerHTML = `
            <div class="card h-100 shadow-sm public-drink-card">
                <div class="public-drink-image-wrapper">
                    <img src="${drink.imageUrl || 'https://via.placeholder.com/300x200'}" class="card-img-top public-drink-image" alt="${drink.name}">
                </div>
                <div class="card-body d-flex flex-column">
                    <h6 class="card-title">${drink.name}</h6>
                    <p class="card-text text-muted small">${drink.description || ''}</p>
                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="badge bg-secondary">${drink.category}</span>
                            <button class="btn btn-sm btn-danger" onclick="addDrinkToOrder('${drink.id}', '${drink.name}')">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <p class="fw-bold text-danger mt-2 mb-0">
                            ${drink.price.toLocaleString()} VND
                        </p>
                    </div>
                </div>
            </div>
        `;

        menuContainer.appendChild(col);
    });
}

function filterMenu(category) {
    if (category === 'all') {
        displayMenu(allDrinks);
        return;
    }

    const filtered = allDrinks.filter(d =>
        d.category.toLowerCase().includes(category.toLowerCase())
    );

    displayMenu(filtered);
}

// ================== TABLES ==================
async function loadTables() {
    const tableSelect = document.getElementById('tableId');

    try {
        allTables = await CafeAPI.getTables();

        tableSelect.innerHTML = '<option value="">Chọn bàn</option>';

        allTables.forEach(table => {
            if (table.status === 'available') {
                const option = document.createElement('option');
                option.value = table.id;
                option.textContent = `Bàn ${table.id} (${table.capacity} người)`;
                tableSelect.appendChild(option);
            }
        });

    } catch (error) {
        tableSelect.innerHTML = '<option>Không tải được bàn</option>';
    }
}

// ================== FORM ==================
async function handleReservationSubmit(e) {
    e.preventDefault();

    const form = e.target;
    
    if (!form.checkValidity() === false) {
        e.stopPropagation();
    }

    form.classList.add('was-validated');

    if (!form.checkValidity()) {
        return;
    }

    const data = {
        guestName: document.getElementById('guestName').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        date: document.getElementById('reservationDate').value,
        time: document.getElementById('reservationTime').value,
        tableId: document.getElementById('tableId').value,
        guests: document.getElementById('guests').value,
        notes: document.getElementById('notes').value.trim(),
        status: 'pending'
    };

    try {
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

        await CafeAPI.createReservation(data);

        showToast('Đặt bàn thành công! Chúng tôi sẽ xác nhận trong giây lát', 'success');

        form.reset();
        form.classList.remove('was-validated');
        localStorage.removeItem('reservationData');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);

    } catch (err) {
        showToast('Lỗi khi đặt bàn. Vui lòng thử lại!', 'danger');
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = false;
        btn.textContent = 'Đặt bàn';
    }
}

// ================== LOCAL STORAGE ==================
function saveReservationData() {
    const data = {
        guestName: document.getElementById('guestName').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        date: document.getElementById('reservationDate').value,
        time: document.getElementById('reservationTime').value,
        tableId: document.getElementById('tableId').value,
        guests: document.getElementById('guests').value,
        notes: document.getElementById('notes').value
    };

    localStorage.setItem('reservationData', JSON.stringify(data));
}

function loadSavedReservationData() {
    const saved = localStorage.getItem('reservationData');
    if (!saved) return;

    const data = JSON.parse(saved);

    if (document.getElementById('guestName')) document.getElementById('guestName').value = data.guestName || '';
    if (document.getElementById('phone')) document.getElementById('phone').value = data.phone || '';
    if (document.getElementById('email')) document.getElementById('email').value = data.email || '';
    if (document.getElementById('reservationDate')) document.getElementById('reservationDate').value = data.date || '';
    if (document.getElementById('reservationTime')) document.getElementById('reservationTime').value = data.time || '';
    if (document.getElementById('tableId')) document.getElementById('tableId').value = data.tableId || '';
    if (document.getElementById('guests')) document.getElementById('guests').value = data.guests || '';
    if (document.getElementById('notes')) document.getElementById('notes').value = data.notes || '';
}

function loadCustomerInfo() {
    const customerData = localStorage.getItem('customerLoggedIn');
    if (!customerData) return;

    const customer = JSON.parse(customerData);
    if (document.getElementById('guestName') && !document.getElementById('guestName').value) {
        document.getElementById('guestName').value = customer.name || '';
    }
    if (document.getElementById('phone') && !document.getElementById('phone').value) {
        document.getElementById('phone').value = customer.phone || '';
    }
}

// ================== TOAST ==================
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

function addDrinkToOrder(drinkId, drinkName) {
    showToast(`Đã thêm ${drinkName} vào đơn hàng`, 'success');
}
