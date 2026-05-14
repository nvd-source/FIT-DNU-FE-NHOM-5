const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin010101'
};

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
    toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
}

function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value.trim();

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem('adminLoggedIn', 'true'); // Dùng sessionStorage để xóa khi đóng tab
        showToast('Đăng nhập thành công', 'success');
        window.location.href = 'admin.html';
        return;
    }

    showToast('Tên đăng nhập hoặc mật khẩu không đúng', 'danger');
}

function checkAlreadyLoggedIn() {
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        window.location.href = 'admin.html';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    checkAlreadyLoggedIn();
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleLogin);
    }
});
