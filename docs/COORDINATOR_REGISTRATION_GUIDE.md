# Coordinator Candidate Registration Guide

## Overview
Coordinators can register candidates/students for examinations using their purchased slot balance. Each registration consumes exactly 1 slot from the coordinator's available slots.

## Prerequisites
1. Coordinator must be logged in with valid coordinator account
2. Coordinator must have purchased slots (minimum 1 slot for each registration)
3. Coordinator must have access to student and parent information
4. Student passport photograph must be available for upload

## Registration Process

### Step 1: Access Registration Page
- Navigate to `/coordinator/register` from the coordinator dashboard
- The page displays current slot balance and registration form

### Step 2: Complete Registration Form
The form has 4 steps that must be completed in order:

#### Step 1: Student Information
- **First Name*** (required)
- **Last Name*** (required)
- Middle Name (optional)

#### Step 2: School & Center Information
- **Chapter**: Automatically set to coordinator's chapter
- **Examination Center*** (required): Select from available centers
- **School**: Choose from existing schools or select "Other" to enter manually

#### Step 3: Parent/Guardian Information
- **Parent First Name*** (required)
- **Parent Last Name*** (required)
- **Phone Number*** (required): Format: +234-XXX-XXX-XXXX
- **Email Address*** (required): Valid email for confirmation
- **Parent Consent*** (required): Must check consent checkbox

#### Step 4: Passport Upload
- Upload clear passport photograph
- Accepted formats: JPEG, PNG
- Maximum file size: 2MB
- System validates slot availability before final submission

### Step 3: Submit Registration
- System validates all required fields
- Checks coordinator has sufficient slots (minimum 1)
- Creates registration record with unique registration number
- Deducts 1 slot from coordinator's balance
- Sends confirmation email to parent
- Automatically downloads registration slip

## Slot Management

### Viewing Slot Balance
- Real-time slot balance is displayed on registration page
- Shows: Available, Used, Total Purchased, and Usage Efficiency
- Updates automatically every 30 seconds

### Slot Usage
- Each successful registration uses exactly 1 slot
- Slots are deducted immediately upon registration completion
- Failed registrations do not consume slots
- Slot usage is tracked and cannot be reversed

### Insufficient Slots
- If coordinator has insufficient slots, registration is blocked
- System displays clear error message with current balance
- Coordinator must purchase more slots to continue registering

## Key Features

### Automatic School Creation
- If coordinator enters a new school name, system automatically creates it
- Prevents duplicate schools within same chapter
- School becomes available for future registrations

### Error Handling
- Form validation prevents submission with incomplete data
- Slot validation prevents registration without sufficient balance
- Payment rollback if slot deduction fails
- Clear error messages guide users to resolution

### Email Confirmations
- Registration confirmation sent to parent email
- Includes registration number, student details, and examination info
- Uses Resend email service for reliable delivery

### Registration Slip
- PDF registration slip generated automatically
- Downloads immediately after successful registration
- Can be reprinted later from coordinator dashboard

## API Endpoints Used

### Frontend Form
- `/api/coordinator/chapter-info` - Get coordinator's chapter and related data
- `/api/coordinator/register/validate?slots=1` - Validate slot availability
- `/api/coordinator/register` - Submit registration
- `/api/coordinator/slots/balance` - Get current slot balance

### File Upload
- Cloudinary API for passport photograph upload
- Secure direct upload with validation

## Technical Implementation

### Database Updates
1. **Registration Record**: Created in `registrations` table with coordinator reference
2. **Slot Deduction**: Updates `coordinator_slots` table (available -1, used +1)
3. **Usage History**: Records slot usage in `slot_usage_history` table
4. **School Creation**: Auto-creates new schools in `schools` table if needed

### Transaction Safety
- Registration creation and slot deduction are handled as atomic operation
- If slot deduction fails, registration is rolled back
- Prevents data inconsistency

### Real-time Updates
- Slot balance refreshes automatically
- Form validates slots before each submission
- Background balance checks prevent stale data

## Success Flow Example

```
1. Coordinator visits /coordinator/register
2. Sees current balance: "Available: 5 slots"
3. Fills out student form completely
4. Uploads passport photograph
5. Clicks "Complete Registration"
6. System validates: ✅ Slots available
7. Creates registration: NAPPS-123456AB
8. Deducts slot: Available becomes 4
9. Sends email to parent@example.com
10. Downloads registration-slip-NAPPS-123456AB.pdf
11. Redirects to success page
```

## Troubleshooting

### Common Issues
1. **"Insufficient Slots"**: Purchase more slot packages
2. **"Upload Failed"**: Check file size (<2MB) and format (JPEG/PNG)
3. **"Email Failed"**: Registration still succeeds, email can be resent later
4. **"Validation Failed"**: Check all required fields are completed

### Testing
Run the test script to verify system functionality:
```bash
npx ts-node scripts/test-coordinator-registration.ts
```

## Related Documentation
- [Slot Purchase Guide](../COORDINATOR_SLOTS_IMPLEMENTATION.md)
- [Payment Integration](../docs/EMAIL_SETUP.md)
- [API Documentation](../db/README.md)
