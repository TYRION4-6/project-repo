# Agent Instructions & Project Documentation

Welcome! This repository is a Node.js Express backend service that interacts with a MongoDB database to perform CRUD operations on Student records.

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- Connection string config in `.env` file

### Running the Application
To run the server locally:
```bash
npm start
```

---

## 🛠️ Tech Stack

- **Framework**: Express (Node.js)
- **Database ORM**: Mongoose (MongoDB)
- **Environment Management**: dotenv
- **Template Engine**: Jade (configured but API endpoints return JSON)

---

## 📂 Project Structure

- `app.js` - Main entry point configuring Express, Middleware, and Routes.
- `bin/www` - Server startup script.
- [config/db.js](file:///C:/Users/uathe/Desktop/backend-26/backend-26/config/db.js) - MongoDB connection helper.
- [models/Student.js](file:///C:/Users/uathe/Desktop/backend-26/backend-26/models/Student.js) - Mongoose Schema definition for the `Student` entity.
- [routes/students.js](file:///C:/Users/uathe/Desktop/backend-26/backend-26/routes/students.js) - REST API routes for Student operations.
- `.env` - Environment variables configuration.

---

## 💾 Data Model

### Student Model
Defined in [Student.js](file:///C:/Users/uathe/Desktop/backend-26/backend-26/models/Student.js):
- `name` (String, Required)
- `email` (String, Required)
- `age` (Number, Required)

---

## 🔗 API Reference

All routes are prefixed with `/students`.

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/students` | Create a new student | `{ name, email, age }` | `201 Created` with student JSON |
| **GET** | `/students` | Retrieve all students | None | `200 OK` with JSON array of students |
| **GET** | `/students/:id` | Retrieve a single student by ID | None | `200 OK` with student JSON |
| **PUT** | `/students/:id` | Update an existing student | `{ name, email, age }` (optional fields) | `200 OK` with updated student JSON |
| **DELETE** | `/students/:id` | Delete a student | None | `200 OK` with success message |

---

## 🤖 Guidelines for AI Agents

1. **Routing and REST Conventions**: Keep routes RESTful. Place new routes under appropriate route files in `/routes` and mount them in `app.js`.
2. **Database Queries**: Always use `try/catch` blocks inside async route handlers to handle errors and return a `500` status with error details.
3. **Environment Variables**: Do not commit secrets. Add any new keys to `.env` and read them via `process.env`.
4. **Code Quality**: Use clear variable names and document logic if it is complex.
5. **No Placeholders**: Do not insert placeholder comments for code that needs implementation; implement full functionality.
