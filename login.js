// Admin login handler

const adminLoginForm = document.getElementById('adminLoginForm');

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

    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

function handleAdminLogin(event) {
    event.preventDefault();

    const username = document.getElementById('adminUser').value.trim();
    const password = document.getElementById('adminPass').value.trim();

    // Tài khoản admin
    if (username === 'admin' && password === '123456') {

        localStorage.setItem('adminLoggedIn', 'true');

        showToast('Đăng nhập thành công', 'success');

        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1500);

    } else {
        showToast('Sai tài khoản hoặc mật khẩu', 'danger');
    }
}

function checkAlreadyLoggedIn() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');

    if (isLoggedIn === 'true') {
        window.location.href = 'admin.html';
    }
}

document.addEventListener('DOMContentLoaded', function () {

    checkAlreadyLoggedIn();

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
});
