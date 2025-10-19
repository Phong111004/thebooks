document.addEventListener('DOMContentLoaded', () => {
    const readingContainer = document.getElementById('reading-container');
    const params = new URLSearchParams(window.location.search);
    const filePath = params.get('path');
    const bookTitle = params.get('title') || 'Đọc sách';

    document.title = bookTitle;

    if (!filePath) {
        readingContainer.innerHTML = '<p class="error-message">Không tìm thấy đường dẫn tệp sách.</p>';
        return;
    }

    // Tạo một iframe để hiển thị PDF
    const iframe = document.createElement('iframe');
    iframe.src = filePath;
    iframe.width = '100%';
    iframe.height = '100%'; // Sẽ hoạt động đúng với CSS mới
    iframe.style.border = 'none';

    // Xử lý lỗi khi không tải được PDF
    iframe.onerror = () => {
        readingContainer.innerHTML = '<p class="error-message">Không thể tải tệp sách. Vui lòng kiểm tra lại đường dẫn.</p>';
    };

    // Xóa thông báo "Đang tải..." và chèn iframe
    readingContainer.innerHTML = '';
    readingContainer.appendChild(iframe);
});