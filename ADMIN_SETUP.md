# Admin Registration and Login System

## Overview
This system provides admin registration and login functionality for the Mental Wellness App. Admins are stored in a separate MongoDB database collection for enhanced security.

## Database Configuration
- **Database**: `mental-wellness-chat`
- **Collection**: `admin`
- **Connection URL**: `mongodb://localhost:27017/mental-wellness-chat`

## Backend Endpoints

### 1. Admin Registration
- **URL**: `POST /api/auth/admin-register`
- **Body**:
  ```json
  {
    "name": "Admin Name",
    "email": "admin@wellness.com",
    "password": "securepassword"
  }
  ```
- **Response**: `201 Created` with success message

### 2. Admin Login
- **URL**: `POST /api/auth/admin-login`
- **Body**:
  ```json
  {
    "email": "admin@wellness.com",
    "password": "securepassword"
  }
  ```
- **Response**: `200 OK` with JWT token and admin data

## Frontend Routes

### 1. Admin Registration Page
- **URL**: `/admin/register`
- **Features**:
  - Form validation
  - Password confirmation
  - Success/error messages
  - Automatic redirect to login after successful registration

### 2. Admin Login Page
- **URL**: `/admin/login`
- **Features**:
  - Admin-specific styling (red theme)
  - JWT token storage
  - Automatic redirect to admin dashboard

## How to Use

### Step 1: Start the Backend
```bash
cd backend
npm install
npm start
```
The backend will run on `http://localhost:5000`

### Step 2: Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:8080`

### Step 3: Register an Admin
1. Navigate to `http://localhost:8080/admin/register`
2. Fill in the registration form:
   - Name: Your admin name
   - Email: admin email address
   - Password: secure password
   - Confirm Password: same password
3. Click "Admin Sign Up"
4. You'll be redirected to the login page

### Step 4: Login as Admin
1. Navigate to `http://localhost:8080/admin/login`
2. Enter your registered email and password
3. Click "Admin Sign In"
4. You'll be redirected to the admin dashboard

## Security Features

1. **Separate Database Collection**: Admins are stored in a separate `admin` collection
2. **Password Hashing**: All passwords are hashed using bcrypt
3. **JWT Authentication**: Secure token-based authentication
4. **Input Validation**: Server-side validation for all inputs
5. **CORS Protection**: Cross-origin requests are properly handled

## Default Admin Credentials
The system automatically creates a default admin user:
- **Email**: `admin@wellness.com`
- **Password**: `admin@123`

## API Testing Examples

### Test Admin Registration
```bash
curl -X POST http://localhost:5000/api/auth/admin-register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Admin",
    "email": "testadmin@wellness.com",
    "password": "testpass123"
  }'
```

### Test Admin Login
```bash
curl -X POST http://localhost:5000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testadmin@wellness.com",
    "password": "testpass123"
  }'
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running on localhost:27017
   - Check if the database `mental-wellness-chat` exists

2. **Port Already in Use**
   - Backend: Change port in backend/index.js
   - Frontend: Change port in frontend/vite.config.ts

3. **CORS Errors**
   - Ensure the backend CORS configuration is correct
   - Check that the frontend is making requests to the correct backend URL

4. **JWT Token Issues**
   - Check if JWT_SECRET environment variable is set
   - Verify token expiration settings

## File Structure

```
backend/
├── index.js          # Main server file with admin endpoints
├── models.js         # Database models including Admin model
└── seed_admin.js     # Admin seeding script

frontend/
├── src/
│   ├── App.tsx       # Main app with routing
│   └── pages/
│       ├── Login.tsx     # Login component (handles admin login)
│       └── Register.tsx  # Register component (handles admin registration)
└── vite.config.ts    # Vite configuration
```

## Notes
- The admin system is completely separate from the regular user system
- Admins have access to the admin dashboard with additional privileges
- All admin operations are logged for security purposes
- The system automatically creates a default admin user on startup 