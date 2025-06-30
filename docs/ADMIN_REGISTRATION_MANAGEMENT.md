# Advanced Registration Management Module

## Overview

The Advanced Registration Management module provides comprehensive tools for administrators to oversee and manage student registrations across all chapters. This module extends beyond basic viewing to include powerful editing, bulk operations, and data management capabilities.

## Features

### 1. Enhanced Registration Viewing
- **Comprehensive List View**: View all registrations with detailed filtering
- **Advanced Search**: Search by student name, registration number, parent details
- **Multi-level Filtering**: Filter by chapter, payment status, registration type, center
- **Detailed View**: Click to see complete registration information including passport photos
- **Real-time Statistics**: Dashboard cards showing registration counts and status breakdowns

### 2. Individual Registration Management
- **Edit Registration Details**: Modify student information, parent details, chapter, school, center assignments
- **Payment Status Updates**: Change payment status between pending and completed
- **Registration Transfers**: Move registrations between chapters and centers
- **Delete Registrations**: Remove individual registrations with confirmation dialogs

### 3. Bulk Operations
#### Bulk Selection
- Select multiple registrations using checkboxes
- Select all visible registrations
- Clear selections easily

#### Bulk Actions Available
- **Change Centers**: Reassign multiple registrations to a different examination center
- **Change Chapters**: Transfer registrations to a different chapter (resets center assignment)
- **Update Payment Status**: Bulk update payment status for multiple registrations
- **Bulk Delete**: Remove multiple registrations at once
- **Bulk Export**: Export selected registrations to CSV

### 4. Import/Export Tools
#### Data Import
- **CSV Template Download**: Get standardized template for data import
- **Bulk Registration Import**: Import multiple registrations from CSV files
- **Chapter-specific Import**: Import registrations directly into specific chapters
- **Error Reporting**: Detailed feedback on import failures with row-level error reporting
- **Duplicate Prevention**: Automatic detection and skipping of duplicate registrations

#### Data Export
- **Multiple Formats**: Export to CSV, Excel (XLSX), or PDF
- **Advanced Filtering**: Export with date ranges, chapter filters
- **Selected Records Export**: Export only selected registrations
- **Comprehensive Data**: Includes all registration fields, parent information, payment details

### 5. Registration Detail View
- **Complete Information Display**: All student and parent details in organized cards
- **Passport Photo Display**: View uploaded student photos
- **Payment Information**: Payment status, references, split codes used
- **Academic Information**: Chapter, school, and center assignments
- **Registration Slip Management**: Download registration slips, track download counts
- **Coordinator Information**: Details of coordinator who registered the student (if applicable)

## User Interface

### Navigation
Access the module via the admin sidebar:
- **Admin Dashboard** → **Registration Management**
- Direct URL: `/admin/registrations/management`

### Main Interface Tabs

#### 1. List View Tab
- **Statistics Cards**: Real-time counts of total, completed, pending, and selected registrations
- **Advanced Filters**: Chapter, status, type, center, and search filters
- **Bulk Selection Tools**: Select individual or all registrations
- **Action Buttons**: Quick access to bulk operations when registrations are selected
- **Data Table**: Comprehensive table with all registration information
- **Pagination**: Navigate through large datasets efficiently

#### 2. Bulk Actions Tab
- **Visual Action Cards**: Large clickable cards for different bulk operations
- **Guided Workflows**: Step-by-step processes for bulk changes
- **Preview and Confirmation**: Review changes before execution

#### 3. Import/Export Tab
- **Import Section**: 
  - Template download
  - File upload with validation
  - Chapter selection
  - Progress tracking
  - Error reporting
- **Export Section**:
  - Format selection
  - Advanced filtering options
  - Date range selection
  - One-click export

## API Endpoints

### Core Registration Management
- `GET /api/admin/registrations/advanced` - Get filtered registrations with pagination
- `GET /api/admin/registrations/{id}/details` - Get detailed registration information
- `PUT /api/admin/registrations/{id}` - Update registration details
- `DELETE /api/admin/registrations/{id}` - Delete single registration

### Bulk Operations
- `POST /api/admin/registrations/bulk-change-center` - Bulk center changes
- `POST /api/admin/registrations/bulk-change-chapter` - Bulk chapter transfers
- `POST /api/admin/registrations/bulk-change-payment-status` - Bulk payment updates
- `POST /api/admin/registrations/bulk-delete` - Bulk deletion
- `POST /api/admin/registrations/bulk-export` - Export selected registrations

### Import/Export
- `GET /api/admin/registrations/import-template` - Download CSV template
- `POST /api/admin/registrations/bulk-import` - Import registrations from CSV
- `GET /api/admin/registrations/bulk-export-advanced` - Advanced export with filtering

### Additional Services
- `GET /api/admin/registrations/{id}/slip` - Download registration slip PDF
- `GET /api/admin/chapters` - Get all chapters for dropdowns
- `GET /api/admin/schools` - Get all schools for dropdowns  
- `GET /api/admin/centers` - Get all centers for dropdowns

## Security & Permissions

### Authentication
- Requires admin role authentication
- Session-based authentication using `getSession()`
- All API endpoints validate admin access

### Data Protection
- Confirmation dialogs for destructive operations
- Audit trails for bulk operations
- Backup recommendations before major changes

### Input Validation
- File type validation for imports (CSV only)
- Data format validation during import
- Chapter/center existence validation
- Parent email format validation

## Technical Implementation

### Frontend Components
- **AdvancedRegistrationsManagement**: Main container component
- **RegistrationDetailView**: Modal for viewing complete registration details
- **BulkImportExport**: Import/export functionality component
- Built with React, TypeScript, and Tailwind CSS
- Uses shadcn/ui component library for consistent UI

### Backend Services
- Built on Next.js API routes
- Drizzle ORM for database operations
- PostgreSQL database with relational queries
- File upload handling with FormData
- CSV parsing and generation
- PDF generation for registration slips

### Database Operations
- Efficient querying with pagination
- Bulk operations using SQL batch updates
- Foreign key relationship maintenance
- Transaction support for data integrity

## Usage Guidelines

### Best Practices
1. **Backup Data**: Always backup before bulk operations
2. **Test Imports**: Test with small CSV files first
3. **Verify Changes**: Review bulk operation results
4. **Monitor Performance**: Large operations may take time
5. **Regular Exports**: Maintain regular data exports for backup

### Common Workflows

#### Bulk Center Assignment
1. Navigate to List View tab
2. Filter registrations by chapter if needed
3. Select registrations needing center assignment
4. Click "Change Centers" from bulk actions
5. Select target center and confirm

#### Import New Registrations
1. Go to Import/Export tab
2. Download CSV template
3. Fill template with registration data
4. Select target chapter
5. Upload file and monitor progress
6. Review import results and errors

#### Generate Reports
1. Use advanced filters to narrow data
2. Select specific registrations if needed
3. Choose export format (PDF for reports)
4. Set date ranges if required
5. Export and download

### Troubleshooting

#### Import Issues
- **File Format**: Ensure CSV format matches template
- **Required Fields**: All required fields must be filled
- **Duplicate Detection**: Check for existing registration numbers
- **Chapter Assignment**: Verify chapter exists and is active

#### Performance Considerations
- **Large Datasets**: Operations on 1000+ records may take time
- **Concurrent Access**: Avoid simultaneous bulk operations
- **Database Load**: Monitor system performance during bulk operations

## Future Enhancements

### Planned Features
- **Advanced Analytics**: Registration trends and insights
- **Automated Workflows**: Scheduled exports and imports
- **Email Integration**: Bulk email notifications
- **API Integration**: External system connectivity
- **Advanced Security**: Role-based permissions for different admin levels

### Integration Possibilities
- **Payment Gateway Integration**: Automatic payment status updates
- **SMS Notifications**: Bulk SMS capabilities
- **Document Management**: Automated document generation
- **Reporting Dashboard**: Advanced analytics and visualizations

## Support & Maintenance

### Monitoring
- Track import/export success rates
- Monitor bulk operation performance
- Audit significant data changes
- Regular database optimization

### Backup Strategy
- Daily database backups
- Export critical data regularly
- Version control for configuration changes
- Disaster recovery procedures

This module provides comprehensive tools for efficient registration management while maintaining data integrity and user experience.
