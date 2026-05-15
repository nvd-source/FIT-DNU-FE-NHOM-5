// Index page - Drinks carousel and animations

let allDrinks = [];
let carouselIndex = 0;
const itemsPerView = 4;

document.addEventListener('DOMContentLoaded', function() {
    loadDrinksCarousel();
    setupCarouselControls();
});

async function loadDrinksCarousel() {
    try {
        allDrinks = await CafeAPI.getDrinks();
        displayCarousel();
    } catch (error) {
        console.error('Error loading drinks:', error);
        document.getElementById('drinksCarousel').innerHTML = '<div class="alert alert-danger">Không thể tải menu đồ uống</div>';
    }
}

function displayCarousel() {
    const carousel = document.getElementById('drinksCarousel');
    carousel.innerHTML = '';

    allDrinks.slice(0, 30).forEach((drink, index) => {
        const card = document.createElement('div');
        card.className = 'drink-carousel-item';
        card.innerHTML = `
            <div class="drink-card h-100">
                <div class="drink-image-wrapper">
                    <img src="${drink.imageUrl || 'https://via.placeholder.com/250x200'}" alt="${drink.name}" class="drink-image">
                </div>
                <div class="drink-info">
                    <h6 class="drink-name">${drink.name}</h6>
                    <div class="d-flex align-items-center mb-2">
                        <div class="drink-rating">
                            <i class="fas fa-star text-warning"></i>
                            <span class="ms-1">4.5</span>
                        </div>
                    </div>
                    <p class="drink-price text-danger fw-bold">${drink.price.toLocaleString()} VND</p>
                    <button class="btn btn-sm btn-danger w-100">
                        <i class="fas fa-plus me-1"></i> Thêm
                    </button>
                </div>
            </div>
        `;
        carousel.appendChild(card);
    });

    updateCarouselView();
}

function updateCarouselView() {
    const items = document.querySelectorAll('.drink-carousel-item');
    items.forEach((item, index) => {
        if (index >= carouselIndex && index < carouselIndex + itemsPerView) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function setupCarouselControls() {
    const prevBtn = document.getElementById('prevCarouselBtn');
    const nextBtn = document.getElementById('nextCarouselBtn');

    prevBtn.addEventListener('click', () => {
        if (carouselIndex > 0) {
            carouselIndex -= 1;
            updateCarouselView();
            animateCarousel();
        }
    });

    nextBtn.addEventListener('click', () => {
        const totalItems = Math.min(allDrinks.length, 30);
        if (carouselIndex < totalItems - itemsPerView) {
            carouselIndex += 1;
            updateCarouselView();
            animateCarousel();
        }
    });
}

function animateCarousel() {
    const carousel = document.getElementById('drinksCarousel');
    carousel.style.opacity = '0.5';
    setTimeout(() => {
        carousel.style.opacity = '1';
    }, 200);
}
