// Hàm gọi API để lấy danh sách sách
const fetchBooksFromAPI = async (searchQuery = '') => {
    try {
        const trimmedQuery = searchQuery.trim();
        const url = trimmedQuery 
            ? `http://localhost:3000/api/books/search?q=${encodeURIComponent(trimmedQuery)}` 
            : 'http://localhost:3000/api/books';
        
        console.log('🌐 Calling URL:', url);
        
        const response = await fetch(url);
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Lỗi HTTP! Status: ${response.status}`);
        }
        const books = await response.json();
        console.log(`📚 Đã tải ${books.length} cuốn sách`, books);
        return books;
    } catch (error) {
        console.error('❌ Không thể lấy sách từ API:', error);
        return [];
    }
};

// HÀM MỚI: Tìm kiếm gần đúng ở frontend
const fuzzySearchBooks = (books, searchQuery) => {
    if (!searchQuery || searchQuery.trim() === '') {
        return books;
    }
    
    const query = searchQuery.toLowerCase().trim();
    
    return books.filter(book => {
        const title = (book.Title || '').toLowerCase();
        const author = (book.Author || '').toLowerCase();
        const category = (book.category_name || '').toLowerCase();
        
        // Tìm kiếm gần đúng: chỉ cần chứa từ khóa
        return title.includes(query) || 
               author.includes(query) || 
               category.includes(query);
    });
};

// Hàm gọi API để lấy danh sách thể loại
const fetchCategoriesFromAPI = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/categories');
        if (!response.ok) {
            throw new Error(`Lỗi HTTP! Status: ${response.status}`);
        }
        const categories = await response.json();
        return categories;
    } catch (error) {
        console.error('Không thể lấy thể loại từ API:', error);
        return [];
    }
};

// Hàm hiển thị sách ra HTML
const populateBooksSection = (books, searchQuery = '') => {
    const booksContainer = document.getElementById('books-container');
    
    if (!booksContainer) {
        console.error('❌ Không tìm thấy element #books-container');
        return;
    }
    
    booksContainer.innerHTML = '';

    if (!books || books.length === 0) {
        const noResultMsg = searchQuery 
            ? `<div class="no-results">
                <p style="font-size: 48px; margin-bottom: 10px;">😔</p>
                <p style="font-size: 20px; color: #8B4513; font-weight: 600;">Không tìm thấy sách với từ khóa "<strong>${searchQuery}</strong>"</p>
                <p style="color: #666;">Hãy thử tìm kiếm với từ khóa khác!</p>
               </div>`
            : '<div class="no-results"><p>Không có sách nào trong thư viện.</p></div>';
        booksContainer.innerHTML = noResultMsg;
        return;
    }

    const fragment = document.createDocumentFragment();
    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book';

        // Highlight từ khóa tìm kiếm trong tiêu đề
        let displayTitle = book.Title;
        if (searchQuery) {
            const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            displayTitle = book.Title.replace(regex, '<mark>$1</mark>');
        }

        bookCard.innerHTML = `
            <div class="book-image-container">
                <img src="${book.ImageUrl || 'images/default-book.png'}" 
                     alt="${book.Title}" 
                     loading="lazy" 
                     onerror="this.onerror=null;this.src='images/default-book.png';">
            </div>
            <div class="book-content">
                <h3>${displayTitle}</h3>
                <div class="book-meta">
                    <p><strong>Tác giả:</strong> ${book.Author}</p>
                    <p><strong>Thể loại:</strong> ${book.category_name || 'Chưa xác định'}</p>
                    ${book.Rating ? `<p><strong>Đánh giá:</strong> ${book.Rating}/5 ⭐</p>` : ''}
                </div>
                <a href="details.html?id=${book.BookID}" class="read-btn">Xem chi tiết</a>
            </div>
        `;
        fragment.appendChild(bookCard);
    });
    booksContainer.appendChild(fragment);
};

// Hàm hiển thị thể loại ra menu dropdown
const populateCategoryDropdown = (categories) => {
    const dropdown = document.getElementById('category-dropdown');
    if (!dropdown) {
        console.warn('⚠️ Không tìm thấy #category-dropdown');
        return;
    }
    
    console.log('📂 Categories received:', categories);
    
    dropdown.innerHTML = '';
    
    if (!categories || categories.length === 0) {
        console.warn('⚠️ Không có categories');
        return;
    }
    
    categories.forEach(category => {
        if (!category || !category.Name) {
            console.warn('⚠️ Category thiếu name:', category);
            return;
        }
        
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#`;
        
        const categoryName = String(category.Name);
        a.textContent = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
        
        a.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log(`📂 Lọc theo thể loại: ${categoryName}`);
            const books = await fetch(`http://localhost:3000/api/books/category/${category.CategoryID}`)
                .then(res => res.json())
                .catch((err) => {
                    console.error('❌ Lỗi khi lọc category:', err);
                    return [];
                });
            populateBooksSection(books);
        });
        
        li.appendChild(a);
        dropdown.appendChild(li);
    });
};

// Biến toàn cục để cache tất cả sách
let allBooksCache = [];

// Chạy các hàm này khi trang được tải xong
document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ DOMContentLoaded fired');
    console.log('📍 Script version: 2.0 - Fuzzy Search Enabled');
    
    // Lấy và cache tất cả sách
    allBooksCache = await fetchBooksFromAPI();
    console.log('📦 Books cached:', allBooksCache.length);
    populateBooksSection(allBooksCache);

    // Lấy và hiển thị thể loại
    const categories = await fetchCategoriesFromAPI();
    populateCategoryDropdown(categories);

    // Xử lý tìm kiếm
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    if (!searchInput) {
        console.error('❌ Không tìm thấy element #search-input');
        return;
    }
    
    if (!searchButton) {
        console.error('❌ Không tìm thấy element #search-button');
        return;
    }
    
    let currentQuery = '';

    const performSearch = () => {
        const query = searchInput.value.trim();
        console.log('🔍 Tìm kiếm gần đúng:', query);
        
        if (query === currentQuery) {
            console.log('⏭️ Query không thay đổi, skip');
            return;
        }
        
        currentQuery = query;
        
        // Tìm kiếm gần đúng trên cache
        const filteredBooks = fuzzySearchBooks(allBooksCache, query);
        console.log(`✅ Tìm thấy ${filteredBooks.length} kết quả`);
        
        populateBooksSection(filteredBooks, query);
    };

    // 1. Tìm kiếm khi click nút
    searchButton.addEventListener('click', (e) => {
        console.log('🖱️ Search button clicked!');
        e.preventDefault();
        e.stopPropagation();
        performSearch();
    });

    // 2. Tìm kiếm khi nhấn Enter
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            console.log('⌨️ Enter pressed!');
            e.preventDefault();
            performSearch();
        }
        // Xóa khi nhấn ESC
        if (e.key === 'Escape') {
            searchInput.value = '';
            currentQuery = '';
            populateBooksSection(allBooksCache);
        }
    });

    // 3. Tải lại sách khi xóa hết text
    searchInput.addEventListener('input', () => {
        if (searchInput.value.trim() === '' && currentQuery !== '') {
            console.log('🗑️ Input cleared, showing all books');
            currentQuery = '';
            populateBooksSection(allBooksCache);
        }
    });
    
    console.log('✅ Event listeners attached successfully');
});