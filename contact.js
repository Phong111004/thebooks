document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');

    if (!contactForm) {
        console.error('Không tìm thấy form liên hệ #contact-form');
        return;
    }

    const submitButton = contactForm.querySelector('button[type="submit"]');

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Ngăn form tự gửi đi và tải lại trang

        // Vô hiệu hóa nút và cung cấp phản hồi cho người dùng
        submitButton.disabled = true;
        submitButton.textContent = 'Đang gửi...';

        const data = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            message: document.getElementById('message').value
        };

        try {
            const response = await fetch('http://localhost:3000/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            alert(result.message || result.error || 'Đã có lỗi xảy ra. Vui lòng thử lại.');

            if (response.ok) {
                contactForm.reset(); // Xóa form sau khi gửi thành công
            }
        } catch (error) {
            console.error('Lỗi khi gửi form:', error);
            alert('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
        } finally {
            // Kích hoạt lại nút sau khi hoàn tất
            submitButton.disabled = false;
            submitButton.textContent = 'Gửi tin nhắn';
        }
    });
});