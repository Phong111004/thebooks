document.addEventListener('DOMContentLoaded', async () => {
    const bookDetailContainer = document.getElementById('book-detail-container');

    // Lấy ID sách từ URL (ví dụ: details.html?id=5)
    const params = new URLSearchParams(window.location.search);
    const bookId = params.get('id');

    if (!bookId) {
        bookDetailContainer.innerHTML = '<p class="error-message">Không tìm thấy ID sách. Vui lòng quay lại trang chủ.</p>';
        return;
    }

    try {
        // Gọi API để lấy chi tiết sách
        const response = await fetch(`http://localhost:3000/api/books/${bookId}`);
        if (!response.ok) {
            throw new Error('Không thể tải thông tin sách.');
        }
        const book = await response.json();

        // Cập nhật tiêu đề trang
        document.title = book.Title;

        // Hiển thị thông tin sách
        bookDetailContainer.innerHTML = `
            <div class="book-detail-card">
                <div class="book-detail-image">
                    <img src="${book.ImageUrl || 'images/default-book.png'}" alt="${book.Title}">
                </div>
                <div class="book-detail-content">
                    <h1>${book.Title}</h1>
                    <div class="book-detail-meta">
                        <p><strong>Tác giả:</strong> ${book.Author}</p>
                        <p><strong>Thể loại:</strong> ${book.category_name || 'Chưa xác định'}</p>
                        ${book.Genre ? `<p><strong>Genre:</strong> ${book.Genre}</p>` : ''}
                        ${book.Rating ? `<p><strong>Đánh giá:</strong> ${book.Rating}/5 ⭐</p>` : ''}
                    </div>
                    ${book.PdfPath ? `<a href="read.html?path=${encodeURIComponent(book.PdfPath)}&title=${encodeURIComponent(book.Title)}" class="read-btn-large">Bắt đầu đọc</a>` : '<p>Nội dung sách chưa có sẵn.</p>'}
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Lỗi khi tải chi tiết sách:', error);
        bookDetailContainer.innerHTML = '<p class="error-message">Đã xảy ra lỗi khi tải thông tin sách. Vui lòng thử lại.</p>';
    }
});