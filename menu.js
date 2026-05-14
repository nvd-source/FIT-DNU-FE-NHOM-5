document.addEventListener('DOMContentLoaded', function() {
    const menuContainer = document.getElementById('menuContainer');
    const filterButtons = document.querySelectorAll('[data-filter]');

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
                <div class="card h-100 shadow-sm">
                    <img src="${drink.imageUrl || 'https://via.placeholder.com/300x200?text=Cafe'}" class="card-img-top" alt="${drink.name}">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${drink.name}</h5>
                        <p class="card-text text-muted">${drink.description || 'Đồ uống ngon, phù hợp với mọi khẩu vị.'}</p>
                        <div class="mt-auto">
                            <span class="badge bg-secondary mb-2 text-capitalize">${drink.category || 'Khác'}</span>
                            <p class="card-text fw-bold text-red">${drink.price ? drink.price.toLocaleString() : '0'} VND</p>
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

    loadMenu();
});
