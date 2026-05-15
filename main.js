// JavaScript chính cho Cafebook Public

let allDrinks = [];
let allTables = [];
let selectedTableId = null;

// ================== INIT ==================
document.addEventListener('DOMContentLoaded', function () {
    loadMenu();
    loadTables();
    setupEventListeners();
    loadSavedReservationData();
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
    reservationForm.addEventListener('submit', handleReservationSubmit);

    // Refresh menu
    const refreshBtn = document.getElementById('refreshMenuBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            loadMenu();
            const status = document.getElementById('jqueryStatus');
            if (status) status.textContent = 'Đã tải lại menu.';
        });
    }

    // Table buttons click
    const tableButtons = document.querySelectorAll(".table-btn");
    const tableSelect = document.getElementById("tableId");

    tableButtons.forEach(button => {
        button.addEventListener("click", function () {
            const selectedTable = this.dataset.table;

            // reset trạng thái button
            tableButtons.forEach(btn => {
                btn.classList.remove("btn-primary", "text-white");
                btn.classList.add("btn-outline-success");
            });

            // active button
            this.classList.remove("btn-outline-success");
            this.classList.add("btn-primary", "text-white");

            // sync dropdown
            for (let i = 0; i < tableSelect.options.length; i++) {
                if (
                    tableSelect.options[i].text.trim() === selectedTable ||
                    tableSelect.options[i].value.trim() === selectedTable
                ) {
                    tableSelect.selectedIndex = i;
                    selectedTableId = tableSelect.options[i].value;
                    break;
                }
            }

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
        menuContainer.innerHTML = '<p class="text-center">Đang tải menu...</p>';

        allDrinks = await CafeAPI.getDrinks();
        displayMenu(allDrinks);

    } catch (error) {
        menuContainer.innerHTML = '<div class="alert alert-danger">Không thể tải menu</div>';
    }
}

function displayMenu(drinks) {
    const menuContainer = document.getElementById('menuContainer');
    menuContainer.innerHTML = '';

    drinks.forEach(drink => {
        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6 mb-4';

        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                <img src="${drink.imageUrl || 'https://via.placeholder.com/300x200'}" class="card-img-top">
                <div class="card-body">
                    <h5>${drink.name}</h5>
                    <p>${drink.description || ''}</p>
                    <span class="badge bg-secondary">${drink.category}</span>
                    <p class="fw-bold text-primary mt-2">
                        ${drink.price.toLocaleString()} VND
                    </p>
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

    const data = {
        guestName: document.getElementById('guestName').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        date: document.getElementById('reservationDate').value,
        time: document.getElementById('reservationTime').value,
        tableId: document.getElementById('tableId').value,
        guests: document.getElementById('guests').value,
        notes: document.getElementById('notes').value,
        status: 'pending'
    };

    try {
        const btn = document.querySelector('#reservationForm button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Đang xử lý...';

        await CafeAPI.createReservation(data);

        alert('Đặt bàn thành công!');

        document.getElementById('reservationForm').reset();
        localStorage.removeItem('reservationData');

        btn.disabled = false;
        btn.textContent = 'Đặt bàn';

    } catch (err) {
        alert('Lỗi đặt bàn!');
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

    document.getElementById('guestName').value = data.guestName || '';
    document.getElementById('phone').value = data.phone || '';
    document.getElementById('email').value = data.email || '';
    document.getElementById('reservationDate').value = data.date || '';
    document.getElementById('reservationTime').value = data.time || '';
    document.getElementById('guests').value = data.guests || '';
    document.getElementById('notes').value = data.notes || '';
}
