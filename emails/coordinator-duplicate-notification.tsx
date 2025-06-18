import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Link,
  Hr,
} from "@react-email/components"

interface CoordinatorDuplicateNotificationEmailProps {
  coordinatorName: string
  studentName: string
  registrationNumber: string
  chapterName: string
  reason: string
  adminUser: string
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
}

const logoSection = {
  padding: "32px 32px 0",
  textAlign: "center" as const,
}

const logoText = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#1f2937",
  margin: "0",
}

const subHeading = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "4px 0 0 0",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
}

const h1 = {
  color: "#dc2626",
  fontSize: "24px",
  fontWeight: "normal",
  textAlign: "center" as const,
  margin: "30px 0",
}

const text = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "24px",
  padding: "0 32px",
}

const detailsSection = {
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: "6px",
  margin: "24px 32px",
  padding: "16px",
}

const detailsHeading = {
  color: "#dc2626",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px 0",
}

const detailsText = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "4px 0",
}

const reasonSection = {
  backgroundColor: "#fefce8",
  border: "1px solid #fde68a",
  borderRadius: "6px",
  margin: "24px 32px",
  padding: "16px",
}

const reasonHeading = {
  color: "#d97706",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 8px 0",
}

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
}

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "5px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
}

const hr = {
  borderColor: "#e5e7eb",
  margin: "20px 0",
}

const footer = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "16px",
  padding: "0 32px",
}

const organizationFooter = {
  color: "#6b7280",
  fontSize: "12px",
  textAlign: "center" as const,
  padding: "0 32px",
  fontWeight: "600",
}

export default function CoordinatorDuplicateNotificationEmail({
  coordinatorName,
  studentName,
  registrationNumber,
  chapterName,
  reason,
  adminUser,
}: CoordinatorDuplicateNotificationEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  return (
    <Html>
      <Head />
      <Preview>NAPPS Registration Deletion Notification - {registrationNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>NAPPS NASARAWA STATE</Text>
            <Text style={subHeading}>UNIFIED EXAMS</Text>
          </Section>
          
          <Heading style={h1}>Registration Deletion Notice</Heading>
          
          <Text style={text}>Dear {coordinatorName},</Text>
          
          <Text style={text}>
            We are writing to inform you that one of your student registrations has been removed 
            from the system due to a duplicate registration issue.
          </Text>

          <Section style={detailsSection}>
            <Text style={detailsHeading}>Deleted Registration Details:</Text>
            <Text style={detailsText}>
              <strong>Student Name:</strong> {studentName}
            </Text>
            <Text style={detailsText}>
              <strong>Registration Number:</strong> {registrationNumber}
            </Text>
            <Text style={detailsText}>
              <strong>Chapter:</strong> {chapterName}
            </Text>
            <Text style={detailsText}>
              <strong>Deleted by:</strong> {adminUser}
            </Text>
            <Text style={detailsText}>
              <strong>Date:</strong> {new Date().toLocaleDateString()}
            </Text>
          </Section>

          <Section style={reasonSection}>
            <Text style={reasonHeading}>Reason for Deletion:</Text>
            <Text style={{ ...detailsText, color: "#92400e" }}>
              {reason}
            </Text>
          </Section>

          <Text style={text}>
            <strong>What this means:</strong>
          </Text>
          <Text style={text}>
            • The registration has been permanently removed from our system<br />
            • If this student needs to be registered, you will need to create a new registration<br />
            • Any fees paid will need to be handled according to your chapter's refund policy<br />
            • Please ensure to check for existing registrations before creating new ones
          </Text>

          <Text style={text}>
            If you believe this deletion was made in error, please contact the administration 
            immediately with the registration details provided above.
          </Text>

          <Section style={buttonContainer}>
            <Link href={`${appUrl}/coordinator`} style={button} target="_blank">
              View Your Dashboard
            </Link>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            This is an automated notification regarding your coordinator account. 
            If you have any questions, please contact the administration.
          </Text>
          <Text style={organizationFooter}>
            National Association of Proprietors of Private Schools - Nasarawa State Chapter
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
