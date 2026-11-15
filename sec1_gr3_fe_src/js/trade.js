// Books owned by current user
const myBooks = [
    {
        title: "Book 1",
        author: "Author 1",
        image: "",
        description: "My first book."
    },
    {
        title: "Book 2",
        author: "Author 2",
        image: "",
        description: "My second book."
    },
    {
        title: "Book 3",
        author: "Author 3",
        image: "",
        description: "My third book."
    },
    {
        title: "Book 4",
        author: "Author 4",
        image: "",
        description: "My fourth book."
    },
    {
        title: "Book 5",
        author: "Author 5",
        image: "",
        description: "My fifth book."
    }
];


// Books from other users
const otherBooks = [
    {
        title: "Harry Potter",
        author: "J.K. Rowling",
        image: "",
        description: "A fantasy novel about a young wizard."
    },
    {
        title: "The Little Prince",
        author: "Antoine de Saint-Exupery",
        image: "",
        description: "A story about friendship and life."
    },
    {
        title: "Sherlock Holmes",
        author: "Arthur Conan Doyle",
        image: "",
        description: "A detective story."
    }
];


// Current book index
let currentIndex = 0;


// Selected book for trade
let selectedOtherBook = null;


// Display current matching book
function displayBook() {

    let book = otherBooks[currentIndex];

    document.getElementById("matchTitle").textContent = book.title;
    document.getElementById("matchAuthor").textContent = book.author;
    document.getElementById("matchImage").src = book.image;

}


// Skip current book
function nextBook() {

    currentIndex++;

    if (currentIndex >= otherBooks.length) {
        currentIndex = 0;
    }

    displayBook();

}


// Select book using star button
function selectBook() {

    selectedOtherBook = otherBooks[currentIndex];

    document.getElementById("matchingPage").style.display = "none";

    document.getElementById("tradePage").style.display = "block";

    updateMyBook();

    displayOtherBook();

}


// Display selected book from other user
function displayOtherBook() {

    document.getElementById("otherTitle").textContent =
        selectedOtherBook.title;

    document.getElementById("otherAuthor").textContent =
        selectedOtherBook.author;

    document.getElementById("otherImage").src =
        selectedOtherBook.image;

}


// Update our selected book
function updateMyBook() {

    let index = document.getElementById("myBook").value;

    let book = myBooks[index];

    document.getElementById("myTitle").textContent = book.title;

    document.getElementById("myAuthor").textContent = book.author;

    document.getElementById("myImage").src = book.image;

}


// Cancel trade
function cancelTrade() {

    document.getElementById("tradePage").style.display = "none";

    document.getElementById("matchingPage").style.display = "block";

}


// Confirm trade
function confirmTrade() {

    let myBookIndex = document.getElementById("myBook").value;

    let myBook = myBooks[myBookIndex];

    let confirmResult = confirm(
        "Confirm trade?\n\n" +
        "Your book: " + myBook.title + "\n" +
        "Other book: " + selectedOtherBook.title
    );

    if (confirmResult) {

        alert("Trade request sent successfully!");

        cancelTrade();

        nextBook();

    }

}


// Show book detail
function showDetail() {

    let book = otherBooks[currentIndex];

    openModal(book);

}


// Show our book detail
function showMyDetail() {

    let index = document.getElementById("myBook").value;

    let book = myBooks[index];

    openModal(book);

}


// Show other user's book detail
function showOtherDetail() {

    openModal(selectedOtherBook);

}


// Open detail modal
function openModal(book) {

    document.getElementById("detailTitle").textContent =
        book.title;

    document.getElementById("detailAuthor").textContent =
        book.author;

    document.getElementById("detailDescription").textContent =
        book.description;

    document.getElementById("detailImage").src =
        book.image;

    document.getElementById("detailModal").style.display =
        "flex";

}


// Close detail modal
function closeDetail() {

    document.getElementById("detailModal").style.display =
        "none";

}


// Start system
displayBook();
updateMyBook();