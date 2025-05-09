# Project: Recreate WordPress "Student Portal Registration System" (SPRS) as a Next.js Application

## 1. Project Overview

The goal is to migrate the existing WordPress plugin, "Student Portal Registration System" (SPRS), into a modern, standalone web application using Next.js. This new application should faithfully replicate all core functionalities, business logic, and data flows of the WordPress plugin while improving scalability, maintainability, and user experience.

## 2. Core Requirements & User Roles

The application will serve three primary user roles:

### Public Users/Students:
- Access a multi-step registration form with proper validation and conditional logic
- Upload passport photographs
- Make payments via Paystack payment gateway integration
- Check registration status using registration number
- Print/download registration slips after successful payment
- View exam information

### Chapter Coordinators:
- Login securely using a unique code (no username/password required)
- View chapter-specific dashboard with analytics (registrations, schools, centers, pending registrations)
- View visualizations (registration trends chart, school distribution pie chart)
- Access paginated list of all registrations for their chapter with search functionality
- Edit student names if corrections are needed
- Print registration slips for students in their chapter
- Export registrations data for their chapter as CSV
- View schools in their chapter and total registrations per school
- Add new exam centers to their chapter
- View all centers in their chapter and total registrations per center

### Administrators:
- Login securely to an admin dashboard
- View system-wide statistics (total registrations, completed/pending payments, revenue)
- View visualization charts (registration status distribution, top chapters, daily registrations, revenue trends)
- Manage chapters (CRUD operations, including setting Paystack split codes and registration amounts)
- Manage schools with chapter associations (CRUD operations)
- Manage centers with chapter associations (CRUD operations)
- Manage chapter coordinators (CRUD operations) with auto-generated unique codes
- View all registrations with advanced search, filtering, pagination
- Verify pending Paystack transactions manually if needed
- Export registration data as CSV with proper UTF-8 encoding
- Import data via CSV upload for chapters, schools, and centers
- Configure system settings (Paystack keys, default exam fee)

## 3. Data Models & Relationships

The application will require the following data models, based on the existing WordPress plugin's schema:

### Chapter
- `id`: Unique identifier (Primary Key)
- `name`: String (e.g., "Nasarawa North Chapter")
- `split_code`: String (Paystack split code, optional)
- `amount`: Decimal (Registration fee for this chapter, default: 3000.00)

### School
- `id`: Unique identifier (Primary Key)
- `chapter_id`: Foreign Key referencing Chapter
- `name`: String (e.g., "Government Secondary School, Keffi")

### Center
- `id`: Unique identifier (Primary Key) 
- `chapter_id`: Foreign Key referencing Chapter
- `name`: String (e.g., "Pilot Science Primary School Exam Center")

### Registration
- `id`: Unique identifier (Primary Key)
- `registration_number`: String (Unique, automatically generated, format: 6 digits + 2 random letters)
- `first_name`: String
- `middle_name`: String (optional)
- `last_name`: String
- `chapter_id`: Foreign Key referencing Chapter
- `school_id`: Foreign Key referencing School
- `school_name`: String (Denormalized for direct access)
- `center_id`: Foreign Key referencing Center
- `parent_first_name`: String
- `parent_last_name`: String
- `parent_phone`: String
- `parent_email`: String (Valid email required)
- `parent_consent`: Boolean (Must be true for valid registration)
- `passport_url`: String (URL to the uploaded passport photograph)
- `payment_status`: Enum ('pending', 'completed')
- `payment_reference`: String (Paystack transaction reference)
- `created_at`: DateTime (Timestamp of registration)

### ChapterCoordinator
- `id`: Unique identifier (Primary Key)
- `chapter_id`: Foreign Key referencing Chapter
- `name`: String
- `email`: String
- `unique_code`: String (Unique, randomly generated, 8 characters alphanumeric)

### Setting (Key-value store for global settings)
- `key`: String (e.g., `paystack_public_key`, `paystack_secret_key`, `exam_fee`)
- `value`: String

## 4. Detailed Feature Specifications

### 4.1. Student Registration Process

#### Multi-step Registration Form
1. **Instructions Step**
   - Welcome message and detailed instructions
   - "Start Registration" button to proceed

2. **Candidate Information Step**
   - First Name (required, alphabetic validation)
   - Middle Name (optional)
   - Last Name (required, alphabetic validation)
   - Client-side validation before proceeding
   - Progress indicator showing completion percentage

3. **School Details Step**
   - Chapter dropdown (dynamically loaded, required)
   - School dropdown (dynamically loaded based on selected chapter, required)
   - "Add New School" checkbox option
   - New School Name input field (appears when checkbox is checked)
   - Center dropdown (dynamically loaded based on selected chapter, required)
   - Form validates all required selections

4. **Parent/Guardian Information Step**
   - Parent/Guardian First Name (required, alphabetic validation)
   - Parent/Guardian Last Name (required, alphabetic validation)
   - Parent/Guardian Phone (required, numeric validation)
   - Parent/Guardian Email (required, email validation)
   - Consent checkbox (required)
   - Client-side validation

5. **Passport Upload Step**
   - File input for passport photo upload
   - Constraints: Image file (JPEG/PNG), max size 2MB
   - Preview of uploaded image
   - Option to retake/reupload

6. **Payment Summary Step**
   - Display examination fee based on selected chapter
   - Review of all entered information
   - "Submit and Pay" button
   - Loading indicator during submission

#### Registration Submission Logic
1. Check for duplicate registrations (by student name + parent email)
2. Generate unique registration number (6 digits + 2 random letters)
3. Save registration with 'pending' payment status
4. Initialize Paystack payment:
   - Use parent email as customer email
   - Use registration number as reference
   - Use chapter-specific amount (or default)
   - Include chapter split_code if available
   - Set callback URL to payment confirmation endpoint
5. Redirect user to Paystack payment page

### 4.2. Payment Processing

#### Paystack Integration
1. **Payment Initialization**
   - Prepare payment data (email, amount, reference, callback URL)
   - Include split_code if chapter has one configured
   - Include custom metadata (registration number, organization)
   - Send to Paystack API and get authorization URL
   - Redirect student to authorization URL

2. **Payment Confirmation**
   - Handle callback from Paystack after payment attempt
   - Verify payment status with Paystack API using transaction reference
   - Update registration payment_status to 'completed' if successful
   - Send confirmation email to chapter coordinator
   - Redirect to success or failure page based on status

3. **Registration Success Page**
   - Display success message and registration details
   - Show registration number prominently
   - Option to print registration slip
   - Instructions for exam day

4. **Registration Failed Page**
   - Display appropriate error message based on failure reason
   - Option to try again or contact support

### 4.3. Student Dashboard

1. **Registration Lookup**
   - Input field for registration number
   - Form to submit and look up registration

2. **Registration Details Display**
   - Personal information (name, registration number, date)
   - School information (chapter, school, center)
   - Payment status with visual indicator
   - Button to print registration slip if payment completed

3. **Registration Slip Generation**
   - Clean, printable layout
   - Include student name, registration number, school, center
   - Display passport photo
   - Include NAPPS branding
   - Print-friendly styling

4. **Exam Information Section**
   - Static information about the examination
   - What to bring on exam day
   - Contact information for queries

### 4.4. Coordinator Dashboard

1. **Authentication**
   - Simple form requiring only the unique coordinator code
   - Session-based authentication with timeout

2. **Dashboard Overview**
   - Welcome header with coordinator name and chapter
   - Statistics cards: total registrations, total schools, total centers, pending registrations
   - Registration trends chart (last 14 days)
   - School distribution pie chart (top 4 schools by registration)

3. **Registrations Management**
   - Paginated table of registrations for coordinator's chapter
   - Columns: Registration No., Student Name, School, Center, Date, Status
   - Actions: Edit Student Name, Print Registration Slip
   - Search functionality
   - Export to CSV button

4. **Schools View**
   - Table of schools in coordinator's chapter
   - Columns: ID, School Name, Total Registrations

5. **Centers Management**
   - Form to add new centers to the chapter
   - Table of existing centers
   - Columns: ID, Center Name, Total Registrations

6. **Navigation**
   - Sidebar with icons and labels for each section
   - Visual indication of current section
   - Logout option

### 4.5. Admin Dashboard

1. **Authentication**
   - Secure login form for administrators
   - Session management with proper security

2. **Dashboard Overview**
   - Statistics cards: total registrations, completed payments, pending payments, total revenue
   - Charts: Registration status distribution, top chapters, daily registrations, revenue trends
   - Additional statistics tables: registrations by chapter, top schools

3. **Registrations Management**
   - Paginated table with search and filtering
   - Advanced controls (current page selection, items per page)
   - Export functionality for completed registrations

4. **Entity Management (Chapters, Schools, Centers)**
   - CRUD operations for each entity type
   - For chapters: additional fields for split code and amount
   - For schools and centers: association with chapters
   - Bulk selection and deletion options
   - Validation to prevent deletion of entities with associated registrations

5. **Coordinator Management**
   - Add new coordinators with auto-generated unique codes
   - View, edit, and delete existing coordinators
   - Association with chapters

6. **CSV Upload Functionality**
   - Separate forms for chapters, schools, and centers
   - Validation and error handling
   - Progress indication

7. **Settings Management**
   - Examination fee setting
   - Paystack API keys configuration
   - Form with validation

8. **Transaction Verification**
   - Button to manually verify pending transactions older than 1 hour
   - Automatic cleanup of abandoned registrations (older than 24 hours with no payment reference)
   - Success/failure feedback

### 4.6. Security Measures

1. **Input Validation**
   - Client-side validation for immediate feedback
   - Server-side validation for all inputs
   - Sanitization of user inputs to prevent XSS, SQL injection

2. **Authentication**
   - Secure coordinator login with unique codes
   - Admin authentication with proper password hashing
   - Session management with appropriate timeouts

3. **Authorization**
   - Role-based access control
   - Verification of permissions before sensitive operations

4. **File Upload Security**
   - File type validation
   - Size restrictions
   - Secure storage of uploaded files

5. **Payment Security**
   - Verification of Paystack callbacks
   - Protection of payment API keys

## 5. API Endpoints (Backend - Next.js API Routes)

### Public Endpoints

- `GET /api/chapters` - Get all chapters
- `GET /api/chapters/:id/schools-centers` - Get schools and centers for a chapter
- `POST /api/schools` - Add a new school during registration
- `POST /api/registrations/check-existing` - Check for existing registration
- `POST /api/registrations` - Submit a new registration
- `GET /api/registrations/:registrationNumber` - Get registration details by registration number 
- `GET /api/registrations/:registrationNumber/slip` - Generate registration slip HTML
- `POST /api/payment/initialize` - Initialize payment with Paystack
- `GET /api/payment/verify` - Verify payment with Paystack (callback handler)

### Coordinator Endpoints

- `POST /api/coordinator/login` - Verify coordinator code and create session
- `GET /api/coordinator/dashboard/stats` - Get dashboard statistics for coordinator's chapter
- `GET /api/coordinator/registrations` - Get paginated registrations for coordinator's chapter
- `PUT /api/coordinator/registrations/:registrationNumber/update-name` - Update student name
- `POST /api/coordinator/centers` - Add a new center to coordinator's chapter
- `GET /api/coordinator/schools` - Get schools for coordinator's chapter
- `GET /api/coordinator/centers` - Get centers for coordinator's chapter
- `GET /api/coordinator/export` - Export registrations for coordinator's chapter

### Admin Endpoints

- `POST /api/admin/login` - Authenticate admin
- `GET /api/admin/dashboard/stats` - Get overall statistics
- `GET /api/admin/registrations` - Get paginated registrations with search/filter
- `GET /api/admin/export-registrations` - Export all completed registrations

- `GET /api/admin/chapters` - Get all chapters
- `POST /api/admin/chapters` - Create a new chapter
- `PUT /api/admin/chapters/:id` - Update a chapter
- `DELETE /api/admin/chapters/:id` - Delete a chapter
- `PUT /api/admin/chapters/:id/split-code` - Update chapter split code

- `GET /api/admin/schools` - Get all schools
- `POST /api/admin/schools` - Create a new school
- `PUT /api/admin/schools/:id` - Update a school
- `DELETE /api/admin/schools/:id` - Delete a school

- `GET /api/admin/centers` - Get all centers
- `POST /api/admin/centers` - Create a new center
- `PUT /api/admin/centers/:id` - Update a center
- `DELETE /api/admin/centers/:id` - Delete a center

- `GET /api/admin/coordinators` - Get all coordinators
- `POST /api/admin/coordinators` - Create a new coordinator
- `DELETE /api/admin/coordinators/:id` - Delete a coordinator

- `POST /api/admin/bulk-delete` - Bulk delete entities
- `POST /api/admin/csv-upload` - Handle CSV uploads
- `GET /api/admin/settings` - Get application settings
- `PUT /api/admin/settings` - Update application settings
- `POST /api/admin/verify-pending-transactions` - Verify pending transactions

## 6. Technical Stack & Implementation Details

### Frontend
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS for responsive design
- **Form Handling**: React Hook Form with Zod for validation
- **State Management**: React Context API for global state
- **Data Fetching**: SWR or React Query for efficient data fetching and caching
- **Charts**: Chart.js or Recharts for visualization
- **UI Components**: Custom components styled with Tailwind or a component library like shadcn/ui
- **File Upload**: React Dropzone for handling file uploads

### Backend
- **API Routes**: Next.js API Routes for backend logic
- **Database ORM**: Prisma for type-safe database operations
- **Authentication**: NextAuth.js for authentication 
- **Email**: Nodemailer or a service like SendGrid for email sending
- **File Storage**: AWS S3, Cloudinary or similar service for passport photo storage
- **Payment Gateway**: Paystack API integration

### Database
- **Type**: PostgreSQL (primary choice) or MySQL
- **Schema**: Implementation of the data models described in section 3
- **Migrations**: Managed through Prisma or similar ORM

### Hosting & Deployment
- **Platform**: Vercel (primary choice), Netlify, or AWS/Azure/GCP
- **CI/CD**: Automated builds and deployments
- **Environment Variables**: Securely managed for different environments

## 7. Business Logic Implementation Details

### Registration Number Generation
```typescript
function generateRegistrationNumber(): string {
  // Get the highest current registration number 
  const highestRegNumber = await prisma.registration.findFirst({
    orderBy: { registration_number: 'desc' },
    select: { registration_number: true },
  });
  
  // Extract the numeric part or start at 1
  let numericPart = 1;
  if (highestRegNumber) {
    const match = highestRegNumber.registration_number.match(/^(\d+)/);
    if (match) {
      numericPart = parseInt(match[1], 10) + 1;
    }
  }
  
  // Pad with leading zeros to 6 digits
  const paddedNumber = numericPart.toString().padStart(6, '0');
  
  // Generate 2 random uppercase letters
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetters = Array(2)
    .fill(null)
    .map(() => letters.charAt(Math.floor(Math.random() * letters.length)))
    .join('');
  
  return paddedNumber + randomLetters;
}
```

### Coordinator Unique Code Generation
```typescript
function generateUniqueCode(): string {
  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  
  // Generate 8-character random alphanumeric code
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return code;
}
```

### Paystack Payment Initialization
```typescript
async function initializePayment(data: {
  email: string;
  reference: string;
  chapter_id: number;
}): Promise<string | null> {
  try {
    // Get chapter details including amount and split_code
    const chapter = await prisma.chapter.findUnique({
      where: { id: data.chapter_id },
    });
    
    if (!chapter || !chapter.amount) {
      console.error(`Chapter amount not set for chapter ID: ${data.chapter_id}`);
      return null;
    }
    
    // Convert amount to kobo (smallest currency unit)
    const amountInKobo = Math.round(chapter.amount * 100);
    
    // Prepare request payload
    const payload = {
      email: data.email,
      amount: amountInKobo,
      reference: data.reference,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/callback`,
      metadata: JSON.stringify({
        custom_fields: [
          {
            display_name: 'Registration Number',
            variable_name: 'registration_number',
            value: data.reference
          },
          {
            display_name: 'Organization',
            variable_name: 'organization',
            value: 'NAPPS NASARAWA'
          },
          {
            display_name: 'Payment For',
            variable_name: 'payment_for',
            value: 'NAPPS Unified Examination Registration'
          }
        ]
      })
    };
    
    // Add split_code if chapter has one
    if (chapter.split_code) {
      payload.split_code = chapter.split_code;
    }
    
    // Make API request to Paystack
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    
    if (result.status) {
      return result.data.authorization_url;
    } else {
      console.error('Paystack Error:', result.message || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.error('Payment initialization error:', error);
    return null;
  }
}
```

### Paystack Payment Verification
```typescript
async function verifyPayment(reference: string): Promise<string | false> {
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Cache-Control': 'no-cache',
        },
      }
    );
    
    const result = await response.json();
    
    if (result.status && result.data.status === 'success') {
      // Return the registration number (reference)
      return result.data.reference;
    }
    
    console.error('Paystack Verification Error:', result.message || 'Unknown error');
    return false;
  } catch (error) {
    console.error('Payment verification error:', error);
    return false;
  }
}
```

### Handling Registration Submission
```typescript
async function handleRegistrationSubmission(formData: FormData) {
  // Validate form data
  const validationResult = validateRegistrationForm(formData);
  if (validationResult.errors.length > 0) {
    return { success: false, errors: validationResult.errors };
  }
  
  // Check for duplicate registration
  const existingRegistration = await prisma.registration.findFirst({
    where: {
      first_name: formData.first_name,
      last_name: formData.last_name,
      parent_email: formData.parent_email,
    }
  });
  
  if (existingRegistration) {
    return { 
      success: false, 
      errors: ['A registration with this name and parent email already exists.'] 
    };
  }
  
  // Handle file upload for passport
  const passportUrl = await handlePassportUpload(formData.passport);
  if (!passportUrl) {
    return { 
      success: false, 
      errors: ['Failed to upload passport photo.'] 
    };
  }
  
  // Generate registration number
  const registrationNumber = generateRegistrationNumber();
  
  // Handle school selection or new school addition
  let schoolId = parseInt(formData.school_id, 10);
  let schoolName = '';
  
  if (formData.new_school_name) {
    // Check if school already exists in this chapter
    const existingSchool = await prisma.school.findFirst({
      where: {
        name: formData.new_school_name,
        chapter_id: parseInt(formData.chapter_id, 10)
      }
    });
    
    if (existingSchool) {
      schoolId = existingSchool.id;
      schoolName = existingSchool.name;
    } else {
      // Create new school
      const newSchool = await prisma.school.create({
        data: {
          name: formData.new_school_name,
          chapter_id: parseInt(formData.chapter_id, 10)
        }
      });
      schoolId = newSchool.id;
      schoolName = newSchool.name;
    }
  } else {
    // Get name of selected school
    const selectedSchool = await prisma.school.findUnique({
      where: { id: schoolId }
    });
    schoolName = selectedSchool?.name || '';
  }
  
  // Create registration record
  const registration = await prisma.registration.create({
    data: {
      registration_number: registrationNumber,
      first_name: formData.first_name,
      middle_name: formData.middle_name || null,
      last_name: formData.last_name,
      chapter_id: parseInt(formData.chapter_id, 10),
      school_id: schoolId,
      school_name: schoolName,
      center_id: parseInt(formData.center_id, 10),
      parent_first_name: formData.parent_first_name,
      parent_last_name: formData.parent_last_name,
      parent_phone: formData.parent_phone,
      parent_email: formData.parent_email,
      parent_consent: formData.parent_consent === 'on' ? true : false,
      passport_url: passportUrl,
      payment_status: 'pending',
    }
  });
  
  // Initialize payment
  const paymentUrl = await initializePayment({
    email: registration.parent_email,
    reference: registration.registration_number,
    chapter_id: registration.chapter_id
  });
  
  if (paymentUrl) {
    return {
      success: true,
      message: 'Registration submitted successfully!',
      payment_url: paymentUrl
    };
  } else {
    return {
      success: false,
      errors: ['Failed to initialize payment. Please try again.']
    };
  }
}
```

## 8. Non-Functional Requirements

### Security
- HTTPS for all communications
- Proper authentication and authorization flows
- CSRF protection for form submissions
- Input validation and sanitization for preventing XSS and SQL injection
- Secure storage of sensitive information (API keys, credentials)
- Rate limiting to prevent abuse

### Performance
- Optimized database queries with proper indexing
- Efficient caching strategies (Redis, in-memory)
- Image optimization for passport photos
- Pagination for large data sets
- Backend APIs optimized for quick response times

### Usability
- Mobile-responsive design
- Intuitive user interface with clear navigation
- Form validation with helpful error messages
- Progress indicators for multi-step forms
- Loading states for asynchronous operations
- Confirmation dialogs for destructive actions

### Accessibility
- Semantic HTML
- ARIA attributes where appropriate
- Keyboard navigation support
- Sufficient color contrast
- Screen reader compatibility

### Scalability
- Database design that supports growing data volume
- Horizontal scaling capability
- Efficient API endpoints to handle increased load
- Optimized file storage solution
- Caching strategy for frequently accessed data

### Maintainability
- Clean, well-documented code with consistent style
- Modular architecture
- Comprehensive test suite
- Clear error logging
- Environment-based configuration

## 9. Deliverables

1. **Fully functional Next.js application** implementing all features described above
2. **Source code** in a Git repository with proper documentation
3. **Database schema** and migration scripts
4. **API documentation** with endpoint descriptions, request/response formats
5. **User guides** for each role (student, coordinator, admin)
6. **Deployment instructions** for different environments
7. **Test reports** showing application reliability

## 10. Deployment & Infrastructure

### Recommended Setup
- **Frontend/Backend**: Vercel for Next.js hosting
- **Database**: Managed PostgreSQL (Supabase, Neon, or similar)
- **File Storage**: AWS S3, Cloudinary, or similar for passport photos
- **Email Service**: SendGrid, Mailgun, or similar for coordinator notifications
- **Monitoring**: Sentry or similar for error tracking
- **Analytics**: (Optional) Simple analytics for usage statistics

## 11. Migration Strategy

1. **Data Export**: Export all existing data from WordPress database tables
2. **Data Transformation**: Transform the exported data to match the new schema
3. **Database Seeding**: Import transformed data into the new database
4. **Testing**: Verify data integrity and application functionality
5. **Parallel Run**: Initially run both systems in parallel
6. **Switchover**: Redirect users to the new system once verified

## 12. Phased Implementation Approach

### Phase 1: Core Registration System
- Student registration form
- Payment integration
- Registration status lookup
- Registration slip generation

### Phase 2: Student Dashboard
- Complete student dashboard
- Registration lookup functionality
- Exam information display

### Phase 3: Coordinator Features
- Coordinator authentication
- Dashboard with statistics
- Registration management
- School/center management

### Phase 4: Admin Features
- Admin authentication
- Complete admin dashboard
- Entity management (CRUD operations)
- System settings
- CSV import/export

### Phase 5: Advanced Features
- Email notifications
- Enhanced analytics
- Performance optimizations
- Security hardening

## 13. Guidelines for Future Enhancements

- **Mobile App**: Consider a companion mobile app for students/coordinators
- **Offline Support**: Add PWA capabilities for limited offline functionality
- **Multilingual Support**: Add support for multiple languages
- **Advanced Analytics**: Deeper insights into registration patterns
- **Integration**: APIs for integration with other school systems
- **Exam Results**: Support for publishing and viewing examination results
