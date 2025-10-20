// URL của backend API
const API_BASE_URL = 'http://localhost:3000';

// Kiểm tra trạng thái đăng nhập và cập nhật header
function updateHeaderUI() {
    const userActionsDiv = document.querySelector('.user-actions');
    const user = JSON.parse(localStorage.getItem('user'));

    if (user && userActionsDiv) {
        // Người dùng đã đăng nhập
        userActionsDiv.innerHTML = `
            <div class="user-info">
                <span class="user-greeting">👋 Xin chào, <strong>${user.username}</strong></span>
                <button class="btn-logout" id="logout-btn">Đăng xuất</button>
            </div>
        `;

        // Xử lý nút đăng xuất
        document.getElementById('logout-btn').addEventListener('click', () => {
            if (confirm('Bạn có chắc muốn đăng xuất?')) {
                localStorage.removeItem('user');
                alert('Đăng xuất thành công!');
                location.reload();
            }
        });
    }
}

// Gọi hàm cập nhật UI khi trang load
document.addEventListener('DOMContentLoaded', async () => {
    // Cập nhật header UI
    updateHeaderUI();

    try {
        // Fetch và hiển thị categories
        const categoriesResponse = await fetch(`${API_BASE_URL}/api/categories`);
        const categories = await categoriesResponse.json();
        const categoryDropdown = document.getElementById('category-dropdown');
        
        if (categoryDropdown) {
            categoryDropdown.innerHTML = categories.map(cat => 
                `<li><a href="#" data-category-id="${cat.CategoryID}">${cat.Name}</a></li>`
            ).join('');

            // Add event listeners for category filtering
            categoryDropdown.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const categoryId = e.target.dataset.categoryId;
                    await loadBooksByCategory(categoryId);
                });
            });
        }

        // Fetch và hiển thị tất cả sách
        await loadAllBooks();

        // Xử lý tìm kiếm
        const searchButton = document.getElementById('search-button');
        const searchInput = document.getElementById('search-input');
        
        if (searchButton && searchInput) {
            searchButton.addEventListener('click', async () => {
                const query = searchInput.value.trim();
                if (query) {
                    await searchBooks(query);
                } else {
                    await loadAllBooks();
                }
            });

            // Tìm kiếm khi nhấn Enter
            searchInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    const query = searchInput.value.trim();
                    if (query) {
                        await searchBooks(query);
                    } else {
                        await loadAllBooks();
                    }
                }
            });
        }

    } catch (error) {
        console.error('Error loading data:', error);
    }
});

// Hàm load tất cả sách
async function loadAllBooks() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/books`);
        const books = await response.json();
        displayBooks(books);
    } catch (error) {
        console.error('Error loading books:', error);
    }
}

// Hàm load sách theo category
async function loadBooksByCategory(categoryId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/books/category/${categoryId}`);
        const books = await response.json();
        displayBooks(books);
    } catch (error) {
        console.error('Error loading books by category:', error);
    }
}

// Hàm tìm kiếm sách
async function searchBooks(query) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/books/search?q=${encodeURIComponent(query)}`);
        const books = await response.json();
        displayBooks(books);
    } catch (error) {
        console.error('Error searching books:', error);
    }
}

// Hàm hiển thị sách
function displayBooks(books) {
    const booksContainer = document.getElementById('books-container');
    
    if (!booksContainer) return;

    if (books.length === 0) {
        booksContainer.innerHTML = '<p class="no-results">Không tìm thấy sách nào.</p>';
        return;
    }

    booksContainer.innerHTML = books.map(book => `
        <div class="book">
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
}