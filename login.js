// Customer login handler

const customerLoginForm = document.getElementById('customerLoginForm');

function showToast(message, type = 'danger') {
    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;

    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1080';
        document.body.appendChild(container);
    }

    container.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = container.lastElementChild;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
}

function handleCustomerLogin(event) {
    event.preventDefault();
    const phone = document.getElementById('customerPhone').value.trim();
    const name = document.getElementById('customerName').value.trim();

    if (!phone) {
        showToast('Vui lòng nhập số điện thoại', 'danger');
        return;
    }

    // Validate phone number
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(phone)) {
        showToast('Số điện thoại không hợp lệ', 'danger');
        return;
    }

    // Save customer info to localStorage
    const customerData = {
        phone: phone,
        name: name,
        loginTime: new Date().toISOString()
    };

    localStorage.setItem('customerLoggedIn', JSON.stringify(customerData));
    
    showToast('Đăng nhập thành công', 'success');
    setTimeout(() => {
        window.location.href = 'public.html';
    }, 1500);
}

function checkAlreadyLoggedIn() {
    const customerData = localStorage.getItem('customerLoggedIn');
    if (customerData) {
        window.location.href = 'public.html';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    checkAlreadyLoggedIn();
    if (customerLoginForm) {
        customerLoginForm.addEventListener('submit', handleCustomerLogin);
    }
});
