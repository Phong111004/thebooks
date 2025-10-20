document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // URL của backend API
    const API_BASE_URL = 'http://localhost:3000';

    // Xử lý form đăng ký
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch(`${API_BASE_URL}/api/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: name, email, password })
                });

                // Kiểm tra xem phản hồi có nội dung không trước khi parse JSON
                const responseText = await response.text();
                if (!responseText) {
                    throw new Error(`Lỗi ${response.status}: ${response.statusText || 'Không có phản hồi từ máy chủ.'}`);
                }
                const result = JSON.parse(responseText);

                if (!response.ok) {
                    throw new Error(result.error || 'Đăng ký thất bại với lỗi không xác định.');
                }

                alert('Đăng ký thành công! Vui lòng đăng nhập.');
                window.location.href = 'login.html'; // Chuyển hướng đến trang đăng nhập

            } catch (error) {
                console.error('Lỗi đăng ký:', error);
                alert(`Đăng ký thất bại: ${error.message}`);
            }
        });
    }

    // Xử lý form đăng nhập
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch(`${API_BASE_URL}/api/users/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: email, password })
                });

                // Kiểm tra xem phản hồi có nội dung không trước khi parse JSON
                const responseText = await response.text();
                if (!responseText) {
                    throw new Error(`Lỗi ${response.status}: ${response.statusText || 'Không có phản hồi từ máy chủ.'}`);
                }
                const result = JSON.parse(responseText);

                if (!response.ok) {
                    throw new Error(result.error || 'Thông tin đăng nhập không hợp lệ.');
                }

                // Lưu thông tin người dùng vào localStorage để sử dụng ở các trang khác
                localStorage.setItem('user', JSON.stringify(result.user));

                alert('Đăng nhập thành công!');
                window.location.href = 'index.html'; // Chuyển hướng về trang chủ

            } catch (error) {
                console.error('Lỗi đăng nhập:', error);
                alert(`Đăng nhập thất bại: ${error.message}`);
            }
        });
    }
});