// Open IndexedDB
let db;
const request = indexedDB.open("eLibrary", 1);

request.onupgradeneeded = (e) => {
  db = e.target.result;
  if (!db.objectStoreNames.contains("books")) {
    const store = db.createObjectStore("books", { keyPath: "id", autoIncrement: true });
    store.createIndex("title", "title", { unique: false });
    store.createIndex("author", "author", { unique: false });
    store.createIndex("tags", "tags", { unique: false });
  }
};

request.onsuccess = (e) => {
  db = e.target.result;
  displayBooks();
};

request.onerror = () => {
  alert("Error opening database!");
};

// Handle upload
document.getElementById("uploadForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const tags = document.getElementById("tags").value.trim();
  const fileInput = document.getElementById("file").files[0];

  if (!fileInput) return alert("Please select a PDF!");

  const reader = new FileReader();
  reader.onload = () => {
    const book = {
      title,
      author,
      tags,
      file: reader.result
    };

    const tx = db.transaction("books", "readwrite");
    const store = tx.objectStore("books");
    store.add(book);

    tx.oncomplete = () => {
      document.getElementById("uploadForm").reset();
      displayBooks();
    };
  };
  reader.readAsDataURL(fileInput);
});

// Display books
function displayBooks(filter = "") {
  const list = document.getElementById("bookList");
  list.innerHTML = "";

  const tx = db.transaction("books", "readonly");
  const store = tx.objectStore("books");
  store.openCursor().onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      const book = cursor.value;
      if (
        book.title.toLowerCase().includes(filter) ||
        book.author.toLowerCase().includes(filter) ||
        book.tags.toLowerCase().includes(filter)
      ) {
        const li = document.createElement("li");
        li.className = "book-item";
        li.innerHTML = `
          <div>
            <strong>${book.title}</strong> by ${book.author} <br>
            <small>Tags: ${book.tags || "none"}</small>
          </div>
          <div>
            <button class="open-btn">Open</button>
            <button class="delete-btn">Delete</button>
          </div>
        `;

        // Open PDF
        li.querySelector(".open-btn").addEventListener("click", () => {
          const pdfWindow = window.open();
          pdfWindow.document.write(`<embed src="${book.file}" width="100%" height="100%" type="application/pdf">`);
        });

        // Delete
        li.querySelector(".delete-btn").addEventListener("click", () => {
          const txDelete = db.transaction("books", "readwrite");
          const storeDelete = txDelete.objectStore("books");
          storeDelete.delete(cursor.key);
          txDelete.oncomplete = () => displayBooks(filter);
        });

        list.appendChild(li);
      }
      cursor.continue();
    }
  };
}

// Search
document.getElementById("searchInput").addEventListener("input", (e) => {
  displayBooks(e.target.value.toLowerCase());
});
