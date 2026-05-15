// Dịch vụ API cho Cafebook
// Kết nối và thao tác với MockAPI.io bằng fetch() và Promise (.then/.catch)
// Dữ liệu cục bộ chỉ dùng khi API thất bại.

const ENABLE_LOCAL_FALLBACK = true;

// API Endpoints - Sử dụng các URL chính xác từ MockAPI
const API_DRINKS = 'https://69fd352130ad0a6fd1c09382.mockapi.io/api/v1/drinks';
const API_TABLES = 'https://69fd352130ad0a6fd1c09382.mockapi.io/api/v1/tables';
const API_RESERVATIONS = 'https://69fd35bc30ad0a6fd1c0972c.mockapi.io/api/v1/reservations';

const DEFAULT_HEADERS = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

// Dữ liệu cục bộ mặc định
const LOCAL_DRINKS = [
    { id: 1, name: 'Cà phê sữa', description: 'Đậm đà, thơm ngon.', category: 'cà phê', price: 45000, imageUrl: 'https://via.placeholder.com/300x200?text=Cà+phê+Sữa', rating: 4.5 },
    { id: 2, name: 'Cà phê đen', description: 'Đơn giản nhưng đầy đủ hương vị.', category: 'cà phê', price: 35000, imageUrl: 'https://via.placeholder.com/300x200?text=Cà+phê+Đen', rating: 4.7 },
    { id: 3, name: 'Cà phê latte', description: 'Mịn màng với lớp foam sữa.', category: 'cà phê', price: 50000, imageUrl: 'https://via.placeholder.com/300x200?text=Cà+phê+Latte', rating: 4.8 },
    { id: 4, name: 'Trà đào', description: 'Tươi mát, ngọt nhẹ.', category: 'trà', price: 55000, imageUrl: 'https://via.placeholder.com/300x200?text=Trà+Đào', rating: 4.6 },
    { id: 5, name: 'Trà xanh', description: 'Thanh mát tự nhiên.', category: 'trà', price: 45000, imageUrl: 'https://via.placeholder.com/300x200?text=Trà+Xanh', rating: 4.4 },
    { id: 6, name: 'Trà lạnh lý tử', description: 'Vị ngọt dịu từ lý tử.', category: 'trà', price: 60000, imageUrl: 'https://via.placeholder.com/300x200?text=Trà+Lạnh+Lý+Tử', rating: 4.5 },
    { id: 7, name: 'Sinh tố bơ', description: 'Béo ngậy, mát lạnh.', category: 'sinh tố', price: 65000, imageUrl: 'https://via.placeholder.com/300x200?text=Sinh+tố+Bơ', rating: 4.7 },
    { id: 8, name: 'Sinh tố dâu', description: 'Tart và tươi mát.', category: 'sinh tố', price: 60000, imageUrl: 'https://via.placeholder.com/300x200?text=Sinh+tố+D��u', rating: 4.6 },
    { id: 9, name: 'Sinh tố xoài', description: 'Ngọt tự nhiên từ xoài chín.', category: 'sinh tố', price: 70000, imageUrl: 'https://via.placeholder.com/300x200?text=Sinh+tố+Xoài', rating: 4.8 }
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

// Hàm gọi API chung
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
            throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    })
    .catch(error => {
        console.error('API Error:', error);
        throw error;
    });
}

// Hàm chuẩn hóa dữ liệu
function normalizeId(id) {
    if (id === null || id === undefined) return null;
    return parseInt(id, 10);
}

function normalizeStatus(status) {
    return status ? status.toString().trim().toLowerCase() : '';
}

// ===== DRINKS API =====
function getDrinks() {
    return apiRequest(API_DRINKS)
        .catch(error => {
            if (ENABLE_LOCAL_FALLBACK) {
                console.warn('Using local drinks data');
                return LOCAL_DRINKS;
            }
            throw error;
        });
}

function getDrinkById(id) {
    return apiRequest(`${API_DRINKS}/${id}`)
        .catch(error => {
            if (ENABLE_LOCAL_FALLBACK) {
                return LOCAL_DRINKS.find(item => item.id === normalizeId(id));
            }
            throw error;
        });
}

function createDrink(drink) {
    return apiRequest(API_DRINKS, {
        method: 'POST',
        body: JSON.stringify(drink)
    });
}

function updateDrink(id, drink) {
    return apiRequest(`${API_DRINKS}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(drink)
    });
}

function deleteDrink(id) {
    return apiRequest(`${API_DRINKS}/${id}`, {
        method: 'DELETE'
    });
}

// ===== TABLES API =====
function getTables() {
    return apiRequest(API_TABLES)
        .catch(error => {
            if (ENABLE_LOCAL_FALLBACK) {
                console.warn('Using local tables data');
                return LOCAL_TABLES;
            }
            throw error;
        });
}

function getTableById(id) {
    return apiRequest(`${API_TABLES}/${id}`)
        .catch(error => {
            if (ENABLE_LOCAL_FALLBACK) {
                return LOCAL_TABLES.find(item => item.id === normalizeId(id));
            }
            throw error;
        });
}

function createTable(table) {
    return apiRequest(API_TABLES, {
        method: 'POST',
        body: JSON.stringify(table)
    });
}

function updateTable(id, table) {
    return apiRequest(`${API_TABLES}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(table)
    });
}

function deleteTable(id) {
    return apiRequest(`${API_TABLES}/${id}`, {
        method: 'DELETE'
    });
}

// ===== RESERVATIONS API =====
function getReservations() {
    return apiRequest(API_RESERVATIONS)
        .catch(error => {
            if (ENABLE_LOCAL_FALLBACK) {
                console.warn('Using local reservations data');
                return [];
            }
            throw error;
        });
}

function getReservationById(id) {
    return apiRequest(`${API_RESERVATIONS}/${id}`)
        .catch(error => {
            if (ENABLE_LOCAL_FALLBACK) {
                return null;
            }
            throw error;
        });
}

function createReservation(reservation) {
    // Thêm timestamp
    const data = {
        ...reservation,
        createdAt: new Date().toISOString()
    };
    
    return apiRequest(API_RESERVATIONS, {
        method: 'POST',
        body: JSON.stringify(data)
    })
    .catch(error => {
        if (ENABLE_LOCAL_FALLBACK) {
            console.warn('Creating mock reservation');
            return { 
                ...data, 
                id: Math.floor(Math.random() * 1000000).toString() 
            };
        }
        throw error;
    });
}

function updateReservation(id, reservation) {
    return apiRequest(`${API_RESERVATIONS}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(reservation)
    });
}

function deleteReservation(id) {
    return apiRequest(`${API_RESERVATIONS}/${id}`, {
        method: 'DELETE'
    });
}

// ===== UTILITY FUNCTIONS =====
function showLoading(element) {
    if (!element) return;
    element.innerHTML = '<div class="spinner-border text-danger" role="status"><span class="visually-hidden">Đang tải...</span></div>';
}

function hideLoading(element) {
    if (!element) return;
    element.innerHTML = '';
}

function showError(message) {
    console.error(message);
}

// ===== EXPORT API =====
window.CafeAPI = {
    // Drinks
    getDrinks,
    getDrinkById,
    createDrink,
    updateDrink,
    deleteDrink,
    
    // Tables
    getTables,
    getTableById,
    createTable,
    updateTable,
    deleteTable,
    
    // Reservations
    getReservations,
    getReservationById,
    createReservation,
    updateReservation,
    deleteReservation,
    
    // Utilities
    showLoading,
    hideLoading,
    showError,
    normalizeId,
    normalizeStatus
};

console.log('CafeAPI loaded successfully');
