document.addEventListener('DOMContentLoaded', async () => {
    const followedBooksContainer = document.getElementById('followed-books-container');
    const API_BASE_URL = 'http://localhost:3000';
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        followedBooksContainer.innerHTML = '<p class="no-results">Vui lòng <a href="login.html">đăng nhập</a> để xem danh sách theo dõi của bạn.</p>';
        return;
    }

    try {
        // Lấy danh sách sách đã theo dõi từ API
        const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/history`);
        if (!response.ok) {
            throw new Error('Không thể tải danh sách theo dõi.');
        }
        const books = await response.json();

        if (!books || books.length === 0) {
            followedBooksContainer.innerHTML = '<p class="no-results">Bạn chưa theo dõi cuốn sách nào.</p>';
            return;
        }

        // Hiển thị sách (sử dụng lại hàm displayBooks từ script.js nếu có thể, hoặc định nghĩa lại)
        followedBooksContainer.innerHTML = books.map(book => `
            <div class="book" data-book-id="${book.BookID}">
                <div class="book-image-container">
                    <img src="${book.ImageUrl || 'images/default-book.png'}" alt="${book.Title}" loading="lazy" onerror="this.onerror=null;this.src='images/default-book.png';">
                </div>
                <div class="book-content">
                    <h3>${book.Title}</h3>
                    <div class="book-meta">
                        <p><strong>Tác giả:</strong> ${book.Author}</p>
                        <p><strong>Thể loại:</strong> ${book.category_name || 'Chưa phân loại'}</p>
                    </div>
                    <a href="details.html?id=${book.BookID}" class="read-btn">Xem chi tiết</a>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Lỗi khi tải sách đã theo dõi:', error);
        followedBooksContainer.innerHTML = '<p class="error-message">Đã xảy ra lỗi khi tải danh sách theo dõi của bạn.</p>';
    }
});