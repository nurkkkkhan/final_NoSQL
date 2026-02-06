1. Project Overview
This web application is a digital management system for a community library. It allows users to browse a book catalog, manage inventory via CRUD operations, and view system-wide statistics generated through NoSQL aggregation.
2. System Architecture
The project follows a MERN-style (without React) architecture to ensure modularity:
Frontend: HTML and JavaScript (Fetch API).
Backend: Node.js with Express.js framework.
Database: MongoDB Atlas (NoSQL).
3. Database schema Description
Collection Strategy Summary
Books (Embedded): Stores book details and a nested array of reviews. This optimizes read performance by retrieving all book data in a single query.
Authors (Referenced): Linked to Books via authorId. This avoids data duplication and allows for independent management of author biographies.
Loans (Referenced): A junction collection linking userId and bookId to track borrowing history without cluttering the main collections.
Users (Referenced): Manages user profiles and security roles (Admin/User).
Categories & Audit_Logs (Flat): Simple collections used for genre lookups and tracking system changes for security. 

4. API Documentation
The backend exposes 8 RESTful endpoints, meeting the minimum requirement of 8 for a single-student project:
GET /api/books: Retrieves all books from the catalog.
POST /api/books: Creates a new book record.
PUT /api/books/:id: Updates book details using the $set operator.
DELETE /api/books/:id: Removes a book (requires admin authorization).
POST /api/books/:id/reviews: Adds a review to the embedded array using the $push operator.
PATCH /api/books/:id/reviews/remove: Removes a review using the $pull operator.
5. Indexing & Optimization Strategy
To optimize query performance, a Compound Index has been implemented:
Index: db.collection('books').createIndex({ title: "text", description: "text" }).
Justification: This allows for high-performance full-text searches across both titles and descriptions, significantly reducing the execution time for search queries during the live demo.

6. How to Run
Clone the repository.
Install dependencies: Run npm install express mongodb cors.
Environment Setup: Ensure your MongoDB connection string is placed in the server.js file.
Start the Server: Run node server.js in your terminal.
Access the App: Open your browser and navigate to http://localhost:3000.