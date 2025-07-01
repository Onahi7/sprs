# SPRS API Documentation

This document outlines all available API endpoints in the SPRS (School Portal Registration System) application.

## 🔐 Authentication

### Session Management
- `GET /api/auth/session` - Get current user session
- `POST /api/auth/logout` - Logout user and clear session

### Login Endpoints
- `POST /api/admin/login` - Admin login
- `POST /api/coordinator/login` - Coordinator login
- `POST /api/supervisor/auth` - Supervisor authentication

---

## 👨‍💼 Admin APIs

### Dashboard & Stats
- `GET /api/admin/dashboard/stats` - Get admin dashboard statistics
- `GET /api/admin/dashboard/chart` - Get chart data for dashboard
- `GET /api/admin/dashboard/purchases` - Get recent purchases
- `GET /api/admin/dashboard/recent-activity` - Get recent activities
- `GET /api/admin/dashboard/registrations-by-chapter` - Get registrations grouped by chapter

### User Management
- `GET /api/admin/coordinators` - List all coordinators
- `POST /api/admin/coordinators` - Create new coordinator
- `GET /api/admin/coordinators/[id]` - Get coordinator details
- `PUT /api/admin/coordinators/[id]` - Update coordinator
- `DELETE /api/admin/coordinators/[id]` - Delete coordinator
- `POST /api/admin/coordinators/add-slots` - Add slots to coordinator
- `GET /api/admin/coordinators/slots` - Get coordinator slots

### Chapter Management
- `GET /api/admin/chapters` - List all chapters
- `POST /api/admin/chapters` - Create new chapter
- `GET /api/admin/chapters/[id]` - Get chapter details
- `PUT /api/admin/chapters/[id]` - Update chapter
- `DELETE /api/admin/chapters/[id]` - Delete chapter
- `GET /api/admin/chapters/list` - Get simplified chapter list

### School & Center Management
- `GET /api/admin/schools` - List all schools
- `POST /api/admin/schools` - Create new school
- `PUT /api/admin/schools` - Update school
- `DELETE /api/admin/schools` - Delete school

- `GET /api/admin/centers` - List all centers
- `POST /api/admin/centers` - Create new center
- `PUT /api/admin/centers` - Update center
- `DELETE /api/admin/centers` - Delete center

### Registration Management
- `GET /api/admin/registrations` - List all registrations
- `POST /api/admin/registrations` - Create new registration
- `GET /api/admin/registrations/[id]` - Get registration details
- `PUT /api/admin/registrations/[id]` - Update registration
- `DELETE /api/admin/registrations/[id]` - Delete registration
- `GET /api/admin/registrations/[id]/details` - Get detailed registration info
- `GET /api/admin/registrations/[id]/slip` - Generate registration slip
- `GET /api/admin/registrations/advanced` - Advanced registration search

### Bulk Operations
- `POST /api/admin/registrations/bulk-delete` - Bulk delete registrations
- `POST /api/admin/registrations/bulk-change-center` - Bulk change center
- `POST /api/admin/registrations/bulk-change-chapter` - Bulk change chapter
- `POST /api/admin/registrations/bulk-change-payment-status` - Bulk change payment status
- `POST /api/admin/registrations/bulk-export` - Bulk export registrations
- `POST /api/admin/registrations/bulk-export-advanced` - Advanced bulk export
- `POST /api/admin/registrations/bulk-import` - Bulk import registrations
- `GET /api/admin/registrations/import-template` - Get import template

### Reports & Export
- `GET /api/admin/reports` - Get admin reports
- `POST /api/admin/reports/export` - Export reports
- `GET /api/admin/export-registrations` - Export all registrations
- `GET /api/admin/records/download` - Download records

### Duplicate Management
- `GET /api/admin/duplicates` - List duplicate registrations
- `GET /api/admin/duplicates/[id]` - Get duplicate details
- `DELETE /api/admin/duplicates/[id]` - Resolve duplicate

### System Management
- `GET /api/admin/settings` - Get system settings
- `POST /api/admin/settings` - Update system settings
- `POST /api/admin/csv-upload` - Upload CSV files
- `POST /api/admin/import-sql` - Import SQL data
- `POST /api/admin/test-email` - Test email functionality
- `POST /api/admin/resend-email` - Resend email to user

---

## 🏫 Coordinator APIs

### Dashboard & Stats
- `GET /api/coordinator/dashboard/stats` - Get coordinator dashboard stats
- `GET /api/coordinator/dashboard/chart` - Get chart data
- `GET /api/coordinator/dashboard/recent-activity` - Get recent activities
- `GET /api/coordinator/dashboard/split-transactions` - Get split transactions

### Profile & Info
- `GET /api/coordinator/profile` - Get coordinator profile
- `GET /api/coordinator/chapter-info` - Get chapter information

### Registration Management
- `GET /api/coordinator/registrations` - List coordinator's registrations
- `POST /api/coordinator/register` - Register new student
- `POST /api/coordinator/register/validate` - Validate registration data
- `POST /api/coordinator/check-duplicate` - Check for duplicate registrations
- `GET /api/coordinator/duplicates` - List duplicates
- `POST /api/coordinator/duplicates-check` - Detailed duplicate check

### Data Management
- `GET /api/coordinator/schools` - Get schools in coordinator's chapter
- `GET /api/coordinator/centers` - Get centers in coordinator's chapter
- `GET /api/coordinator/supervisors` - Get supervisors
- `GET /api/coordinator/export` - Export coordinator data
- `POST /api/coordinator/registrations/bulk-download` - Bulk download registrations

### Slot Management
- `GET /api/coordinator/slots` - Get coordinator slots
- `GET /api/coordinator/slots/balance` - Get slot balance
- `GET /api/coordinator/slots/history` - Get slot usage history
- `GET /api/coordinator/slots/analytics` - Get slot analytics

### Payment Management
- `POST /api/coordinator/payment/initialize` - Initialize payment
- `GET /api/coordinator/payment/query` - Query payment status
- `POST /api/coordinator/payment/verify` - Verify payment

### Reports
- `GET /api/coordinator/reports` - Get coordinator reports
- `POST /api/coordinator/reports/export` - Export reports
- `GET /api/coordinator/[coordinatorCode]/records/download` - Download records

---

## 👨‍🏫 Supervisor APIs

- `GET /api/supervisor/dashboard` - Get supervisor dashboard
- `GET /api/supervisor/sessions` - Get exam sessions
- `GET /api/supervisor/attendance` - Manage attendance
- `GET /api/supervisor/reports` - Get supervisor reports
- `POST /api/supervisor/reports/export` - Export supervisor reports

---

## 🎓 Student APIs

- `GET /api/students` - List students
- `GET /api/student/results/[registrationNumber]/slip` - Get student result slip

---

## 📋 Public APIs

### Registration & Status
- `GET /api/registrations` - Public registration lookup
- `GET /api/registrations/[registrationNumber]` - Get registration by number
- `GET /api/registrations/[registrationNumber]/slip` - Get registration slip
- `GET /api/stats` - Get public statistics

### Reference Data
- `GET /api/chapters` - List all chapters
- `GET /api/chapters/[id]` - Get chapter details
- `GET /api/schools` - List all schools
- `GET /api/centers` - List all centers

### Results
- `GET /api/results` - Get results
- `GET /api/test/result-slip` - Test result slip generation

---

## 💳 Payment APIs

- `POST /api/payment/initialize` - Initialize payment transaction
- `POST /api/payment/verify` - Verify payment transaction
- `POST /api/webhooks/paystack` - Paystack webhook handler

---

## 📁 File Upload APIs

- `POST /api/upload` - General file upload
- `POST /api/upload/passport` - Upload passport photos

---

## 🧪 Testing & Development APIs

- `GET /api/test-db` - Test database connection
- `POST /api/test-email` - Test email functionality
- `GET /api/cloudinary-test` - Test Cloudinary integration
- `GET /api/testimonials` - Get testimonials (if implemented)

---

## 📝 Request/Response Examples

### Admin Login
```bash
POST /api/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

### Coordinator Login
```bash
POST /api/coordinator/login
Content-Type: application/json

{
  "code": "COORD_CODE_123"
}
```

### Get Registration
```bash
GET /api/registrations/REG123456
```

### Initialize Payment
```bash
POST /api/payment/initialize
Content-Type: application/json

{
  "amount": 5000,
  "email": "student@example.com",
  "registrationNumber": "REG123456"
}
```

---

## 🔒 Authentication Notes

- Most admin routes require admin authentication via JWT token
- Coordinator routes require coordinator authentication
- Public routes are accessible without authentication
- Authentication is handled via middleware and cookies

---

## 📊 Response Format

Most APIs return JSON responses in this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

---

*Generated from SPRS API routes - Last updated: $(date)*
