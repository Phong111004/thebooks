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
    iframe.height = '100%';
    iframe.style.border = 'none';
    readingContainer.innerHTML = ''; // Xóa thông báo loading
    readingContainer.appendChild(iframe);
});