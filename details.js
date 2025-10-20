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
                    <div class="book-detail-actions">
                        ${book.PdfPath ? `<a href="read.html?path=${encodeURIComponent(book.PdfPath)}&title=${encodeURIComponent(book.Title)}" class="btn-action btn-start-reading">Bắt đầu đọc</a>` : ''}
                        <button class="btn-action btn-follow">Theo dõi</button>
                        ${book.PdfPath ? `<a href="read.html?path=${encodeURIComponent(book.PdfPath)}&title=${encodeURIComponent(book.Title)}" class="btn-action btn-read-continue">Đọc tiếp</a>` : ''}
                    </div>
                    ${!book.PdfPath ? '<p class="no-content-message">Nội dung sách chưa có sẵn.</p>' : ''}
                </div>
            </div>
        `;

        // --- LOGIC NÚT THEO DÕI ---
        const followButton = document.querySelector('.btn-follow');
        if (followButton) {
            const user = JSON.parse(localStorage.getItem('user'));

            // Chỉ hiển thị và cho phép theo dõi nếu người dùng đã đăng nhập
            if (!user) {
                followButton.style.display = 'none'; // Ẩn nút nếu chưa đăng nhập
            } else {
                // TODO: Cần cập nhật API GET /api/books/:id để kiểm tra và trả về trạng thái isFollowed
                // Tạm thời, chúng ta sẽ kiểm tra trạng thái này ở phía client khi trang tải
                let isFollowing = false;

                // Hàm kiểm tra và cập nhật trạng thái nút
                const checkAndSetFollowStatus = async () => {
                    try {
                        const historyResponse = await fetch(`http://localhost:3000/api/users/${user.id}/history`);
                        const historyBooks = await historyResponse.json();
                        isFollowing = historyBooks.some(b => b.BookID.toString() === bookId);
                        
                        if (isFollowing) {
                            followButton.textContent = 'Đang theo dõi';
                            followButton.classList.add('following');
                        } else {
                            followButton.textContent = 'Theo dõi';
                            followButton.classList.remove('following');
                        }
                    } catch (error) {
                        console.error("Không thể kiểm tra trạng thái theo dõi:", error);
                    }
                };

                await checkAndSetFollowStatus();

                // Xử lý sự kiện click
                followButton.addEventListener('click', async () => {
                    const method = isFollowing ? 'DELETE' : 'POST';
                    try {
                        const response = await fetch(`http://localhost:3000/api/users/${user.id}/history/${bookId}`, {
                            method: method,
                        });

                        if (!response.ok) {
                            throw new Error('Thao tác thất bại');
                        }

                        // Đảo ngược trạng thái và cập nhật lại nút
                        isFollowing = !isFollowing;
                        await checkAndSetFollowStatus();

                    } catch (error) {
                        console.error('Lỗi khi theo dõi/bỏ theo dõi:', error);
                        alert('Đã xảy ra lỗi. Vui lòng thử lại.');
                    }
                });
            }
        }

    } catch (error) {
        console.error('Lỗi khi tải chi tiết sách:', error);
        bookDetailContainer.innerHTML = '<p class="error-message">Đã xảy ra lỗi khi tải thông tin sách. Vui lòng thử lại.</p>';
    }
});