# Library Books REST API

## Overview

This REST API is designed to manage books in a library. It supports listing books, retrieving a single book, creating new books, updating existing books, deleting books, and filtering books by author.

**Base URL:** `/api`

## Endpoints

### 1. List All Books

* **Method:** `GET`
* **Path:** `/api/books`
* **Description:** Retrieves a list of all books in the library.
* **Request Body:** None required.
* **Success Status Code:** `200 OK`

**Example Request:**

http
GET /api/books


2. Get a Single Book

* **Method:** `GET`
* **Path:** `/api/books/42`
* **Description:** Retrieves the details of a book with ID 42.
* **Request Body:** None required.
* **Success Status Code:** `200 OK`

**Example Request:**

http
GET /api/books/42

### 3. Create a New Book

* **Method:** `POST`
* **Path:** `/api/books`
* **Description:** Creates a new book in the library.
* **Example Request Body:**

json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "publicationYear": 1958
}


* **Success Status Code:** `201 Created`

### 4. Update an Existing Book

* **Method:** `PUT`
* **Path:** `/api/books/42`
* **Description:** Replaces the details of the book with ID 42.
* **Example Request Body:**

json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "publicationYear": 1958
}


* **Success Status Code:** `200 OK`

### 5. Delete a Book

* **Method:** `DELETE`
* **Path:** `/api/books/42`
* **Description:** Deletes the book with ID 42 from the library.
* **Request Body:** None required.
* **Success Status Code:** `204 No Content`

**Example Request:**

http
DELETE /api/books/42


### 6. List Books by Author

* **Method:** `GET`
* **Path:** `/api/books?author=Chinua%20Achebe`
* **Description:** Retrieves all books written by the specified author using the `author` query parameter.
* **Request Body:** None required.
* **Success Status Code:** `200 OK`

**Example Request:**
http
GET /api/books?author=Chinua%20Achebe


### 7. Search Books by Title

* **Method:** `GET`
* **Path:** `/api/books?title=Things%20Fall%20Apart`
* **Description:** Retrieves books matching the specified title using the `title` query parameter.
* **Request Body:** None required.
* **Success Status Code:** `200 OK`

**Example Request:**

http
GET /api/books?title=Things%20Fall%20Apart


## Error Status Codes

### 400 Bad Request

* **Description:** The server cannot process the request because the supplied data is invalid.
* **Example:** A client attempts to create a book without providing the required title or author.
* **Example Response:**

json
{
  "error": "Title and author are required."
}


### 404 Not Found

* **Description:** The requested resource does not exist.
* **Example:** A client requests `/api/books/9999`, but no book with ID 9999 exists.
* **Example Response:**

json
{
  "error": "Book not found."
}


 REST API Design Principles

* Use nouns such as `/books` to identify resources.
* Use HTTP methods to specify actions.
* Use resource IDs to identify individual books.
* Use query parameters to filter collections.
* Return appropriate HTTP status codes.
* Use JSON for request and response data where appropriate.
