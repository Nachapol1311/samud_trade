
    // Demo data: replace with data from your backend API when available.
    const myBooks = [
      { id:1, title:'Atomic Habits', author:'James Clear' },
      { id:2, title:'The Great Gatsby', author:'F. Scott Fitzgerald' },
      { id:3, title:'Harry Potter', author:'J. K. Rowling' },
      { id:4, title:'Clean Code', author:'Robert C. Martin' },
      { id:5, title:'1984', author:'George Orwell' }
    ];
    const targetBook = { id:101, title:'The Alchemist', author:'Paulo Coelho' };
    const picker = document.getElementById('my-book');
    const status = document.getElementById('status');
    const dialog = document.getElementById('confirm-dialog');
    const tradeButton = document.getElementById('trade');
    myBooks.forEach(book => { const option = document.createElement('option'); option.value = book.id; option.textContent = book.title; picker.appendChild(option); });
    function selectedBook() { return myBooks.find(book => String(book.id) === picker.value); }
    picker.addEventListener('change', () => {
      const book = selectedBook();
      document.getElementById('my-cover').textContent = book ? book.title : 'Select a book';
      document.getElementById('my-title').textContent = book ? book.title : 'Your book';
      document.getElementById('my-author').textContent = book ? book.author : 'No book selected';
      tradeButton.disabled = !book;
      status.textContent = '';
    });
    document.getElementById('my-detail').addEventListener('click', () => { const book = selectedBook(); if (book) alert(`${book.title}\nAuthor: ${book.author}`); else alert('Please select your book first.'); });
    document.getElementById('target-detail').addEventListener('click', () => alert(`${targetBook.title}\nAuthor: ${targetBook.author}`));
    document.getElementById('cancel').addEventListener('click', () => { picker.value = ''; picker.dispatchEvent(new Event('change')); });
    tradeButton.addEventListener('click', () => { const book = selectedBook(); if (!book) return; document.getElementById('confirm-text').textContent = `Trade "${book.title}" for "${targetBook.title}"?`; dialog.showModal(); });
    document.getElementById('close-dialog').addEventListener('click', () => dialog.close());
    document.getElementById('confirm-trade').addEventListener('click', () => { dialog.close(); status.textContent = 'Trade confirmed (demo only — not saved to database).'; });
  