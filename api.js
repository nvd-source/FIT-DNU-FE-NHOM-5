// Dịch vụ API cho Cafebook
// Kết nối và thao tác với MockAPI.io bằng fetch() và Promise (.then/.catch)
// Dữ liệu cục bộ chỉ dùng khi API thất bại.

const ENABLE_LOCAL_FALLBACK = true;
const API_BASE = window.APP_API_BASE || 'https://69fd352130ad0a6fd1c09382.mockapi.io/api/v1';

// Endpoints
const DRINKS_URL = `${API_BASE}/drinks`;
const TABLES_URL = `${API_BASE}/tables`;
const RESERVATIONS_URL = window.APP_RESERVATIONS_URL || `${API_BASE}/reservations`;

const DEFAULT_HEADERS = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

const LOCAL_DRINKS = [
    { id: 1, name: 'Cà phê sữa', description: 'Đậm đà, thơm ngon.', category: 'cà phê', price: 45000, imageUrl: 'https://via.placeholder.com/300x200?text=C%C3%A0+ph%C3%AA+S%E1%BB%A9a' },
    { id: 2, name: 'Trà đào', description: 'Tươi mát, ngọt nhẹ.', category: 'trà', price: 55000, imageUrl: 'https://via.placeholder.com/300x200?text=Tr%C3%A0+%C4%91%C3%A0o' },
    { id: 3, name: 'Sinh tố bơ', description: 'Béo ngậy, mát lạnh.', category: 'sinh tố', price: 65000, imageUrl: 'https://via.placeholder.com/300x200?text=Sinh+t%E1%BB%91+B%C6%A1' }
];

const LOCAL_TABLES = [
    { id: 1, capacity: 2, status: 'available', location: 'Cửa vào', floor: 1 },
    { id: 2, capacity: 4, status: 'available', location: 'Gần cửa sổ', floor: 1 },
    { id: 3, capacity: 4, status: 'reserved', location: 'Giữa phòng', floor: 1 },
    { id: 4, capacity: 2, status: 'available', location: 'Góc yên tĩnh', floor: 1 },
    { id: 5, capacity: 6, status: 'available', location: 'Ban công', floor: 1 },
    { id: 6, capacity: 2, status: 'available', location: 'Cửa thang máy', floor: 2 },
    { id: 7, capacity: 4, status: 'reserved', location: 'Gần cửa sổ', floor: 2 },
    { id: 8, capacity: 4, status: 'available', location: 'Gần quầy bar', floor: 2 },
    { id: 9, capacity: 6, status: 'available', location: 'Phòng họp nhỏ', floor: 2 },
    { id: 10, capacity: 2, status: 'available', location: 'Khu yên tĩnh', floor: 2 }
];

function apiRequest(url, options = {}) {
    return fetch(url, {
        mode: 'cors',
        cache: 'no-cache',
        headers: {
            ...DEFAULT_HEADERS,
            ...options.headers
        },
        ...options
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP lỗi: ${response.status}`);
        }
        return response.json();
    })
    .catch(error => {
        console.error('Lỗi API:', error);
        throw error;
    });
}

function normalizeId(id) {
    if (id === null || id === undefined) return null;
    return parseInt(id, 10);
}

function normalizeStatus(status) {
    return status ? status.toString().trim().toLowerCase() : '';
}

function getDrinks() {
    return apiRequest(DRINKS_URL)
        .catch(error => {
            if (ENABLE_LOCAL_FALLBACK) {
                console.warn('Dùng dữ liệu đồ uống cục bộ.');
                return LOCAL_DRINKS;
            }
            throw error;
        });
}

function getDrinkById(id) {
    return apiRequest(`${DRINKS_URL}/${id}`)
        .catch(error => {
            if (ENABLE_LOCAL_FALLBACK) {
                return LOCAL_DRINKS.find(item => item.id === parseInt(id, 10));
            }
            throw error;
        });
}

function createDrink(drink) {
    return apiRequest(DRINKS_URL, {
        method: 'POST',
        body: JSON.stringify(drink)
    });
}

function updateDrink(id, drink) {
    return apiRequest(`${DRINKS_URL}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(drink)
    });
}

function deleteDrink(id) {
    return apiRequest(`${DRINKS_URL}/${id}`, {
        method: 'DELETE'
    });
}

function getTables() {
    return apiRequest(TABLES_URL)
        .catch(error => {
            if (ENABLE_LOCAL_FALLBACK) {
                console.warn('Dùng dữ liệu bàn cục bộ.');
                return LOCAL_TABLES;
            }
            throw error;
        });
}

function getTableById(id) {
    return apiRequest(`${TABLES_URL}/${id}`)
        .catch(error => {
            if (ENABLE_LOCAL_FALLBACK) {
                return LOCAL_TABLES.find(item => item.id === parseInt(id, 10));
            }
            throw error;
        });
}

function createTable(table) {
    return apiRequest(TABLES_URL, {
        method: 'POST',
        body: JSON.stringify(table)
    });
}

function updateTable(id, table) {
    return apiRequest(`${TABLES_URL}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(table)
    });
}

function deleteTable(id) {
    return apiRequest(`${TABLES_URL}/${id}`, {
        method: 'DELETE'
    });
}

function getReservations() {
    return apiRequest(RESERVATIONS_URL)
        .catch(error => {
            if (ENABLE_LOCAL_FALLBACK) {
                console.warn('Dùng dữ liệu đặt bàn cục bộ.');
                return [];
            }
            throw error;
        });
}

function getReservationById(id) {
    return apiRequest(`${RESERVATIONS_URL}/${id}`)
        .catch(error => {
            if (ENABLE_LOCAL_FALLBACK) {
                return null;
            }
            throw error;
        });
}

function createReservation(reservation) {
    return apiRequest(RESERVATIONS_URL, {
        method: 'POST',
        body: JSON.stringify(reservation)
    })
    .catch(error => {
        if (ENABLE_LOCAL_FALLBACK) {
            console.warn('Tạo đặt bàn giả lập.');
            return { ...reservation, id: Math.floor(Math.random() * 100000) };
        }
        throw error;
    });
}

function updateReservation(id, reservation) {
    return apiRequest(`${RESERVATIONS_URL}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(reservation)
    });
}

function deleteReservation(id) {
    return apiRequest(`${RESERVATIONS_URL}/${id}`, {
        method: 'DELETE'
    });
}

function showLoading(element) {
    element.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div>';
}

function hideLoading(element) {
    // Khi cần, có thể thay bằng nội dung thực tế sau khi tải xong
}

function showError(message) {
    alert(`Lỗi: ${message}`);
}

window.CafeAPI = {
    getDrinks,
    getDrinkById,
    createDrink,
    updateDrink,
    deleteDrink,
    getTables,
    getTableById,
    createTable,
    updateTable,
    deleteTable,
    getReservations,
    getReservationById,
    createReservation,
    updateReservation,
    deleteReservation,
    showLoading,
    hideLoading,
    showError
};
