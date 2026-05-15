document.addEventListener('DOMContentLoaded', function() {
    const menuContainer = document.getElementById('menuContainer');
    const filterButtons = document.querySelectorAll('[data-filter]');
    const refreshBtn = document.getElementById('refreshMenuBtn');

    function setLoading() {
        if (!menuContainer) return;
        menuContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-danger" role="status">
                    <span class="visually-hidden">Đang tải...</span>
                </div>
            </div>
        `;
    }

    function setError(message) {
        if (!menuContainer) return;
        menuContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">${message}</div>
            </div>
        `;
    }

    function displayMenu(drinks) {
        if (!menuContainer) return;
        menuContainer.innerHTML = '';
        if (!drinks || drinks.length === 0) {
            menuContainer.innerHTML = '<div class="col-12 text-center py-5">Chưa có món nào trong thực đơn</div>';
            return;
        }

        drinks.forEach(drink => {
            const card = document.createElement('div');
            card.className = 'col-md-6 col-lg-4';
            card.innerHTML = `
                <div class="card h-100 shadow-sm menu-drink-card">
                    <div class="menu-drink-image-wrapper">
                        <img src="${drink.imageUrl || 'https://via.placeholder.com/300x200?text=Cafe'}" class="card-img-top menu-drink-image" alt="${drink.name}">
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${drink.name}</h5>
                        <p class="card-text text-muted small">${drink.description || 'Đồ uống ngon, phù hợp với mọi khẩu vị.'}</p>
                        <div class="mt-auto">
                            <span class="badge bg-secondary mb-2 text-capitalize">${drink.category || 'Khác'}</span>
                            <div class="d-flex justify-content-between align-items-center">
                                <p class="card-text fw-bold text-danger mb-0">${drink.price ? drink.price.toLocaleString() : '0'} VND</p>
                                <button class="btn btn-sm btn-danger" onclick="addToCart('${drink.id}', '${drink.name}')">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            menuContainer.appendChild(card);
        });
    }

    function applyFilter(category) {
        const normalized = category.toLowerCase();
        let filtered = window.menuItems || [];

        if (normalized !== 'all') {
            filtered = filtered.filter(drink => {
                const cat = (drink.category || '').toString().toLowerCase();
                return cat === normalized || cat.includes(normalized);
            });
        }

        displayMenu(filtered);
    }

    async function loadMenu() {
        try {
            setLoading();
            const drinks = await CafeAPI.getDrinks();
            window.menuItems = drinks || [];
            displayMenu(window.menuItems);
        } catch (error) {
            setError('Không thể tải thực đơn. Vui lòng thử lại sau.');
        }
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            applyFilter(this.getAttribute('data-filter'));
        });
    });

    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadMenu();
            showToast('Đã cập nhập thực đơn', 'success');
        });
    }

    loadMenu();
});

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

function addToCart(drinkId, drinkName) {
    showToast(`Đã thêm ${drinkName} vào đơn hàng`, 'success');
}
