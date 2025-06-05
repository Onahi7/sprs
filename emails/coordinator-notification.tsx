import { Body, Container, Head, Heading, Html, Preview, Section, Text, Hr, Link } from "@react-email/components"

interface CoordinatorNotificationEmailProps {
  coordinatorName: string
  studentName: string
  registrationNumber: string
  chapter: string
}

export default function CoordinatorNotificationEmail({
  coordinatorName,
  studentName,
  registrationNumber,
  chapter,
}: CoordinatorNotificationEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  return (
    <Html>
      <Head />
      <Preview>New NAPPS Nasarawa Unified Exams Registration Notification</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>NAPPS NASARAWA STATE</Text>
            <Text style={subHeading}>UNIFIED EXAMS</Text>
          </Section>
          <Heading style={h1}>New Registration Notification</Heading>
          <Text style={text}>Dear {coordinatorName},</Text>
          <Text style={text}>A new student has registered for the NAPPS Nasarawa State Unified Exams in your chapter.</Text>

          <Section style={detailsSection}>
            <Text style={detailsHeading}>Registration Details:</Text>
            <Text style={detailsText}>
              <strong>Student Name:</strong> {studentName}
            </Text>
            <Text style={detailsText}>
              <strong>Registration Number:</strong> {registrationNumber}
            </Text>
            <Text style={detailsText}>
              <strong>Chapter:</strong> {chapter}
            </Text>
          </Section>

          <Text style={text}>You can view all registrations in your coordinator dashboard:</Text>

          <Section style={buttonContainer}>
            <Link href={`${appUrl}/coordinator`} style={button} target="_blank">
              View Dashboard
            </Link>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>This is an automated notification. Please do not reply to this email.</Text>
          <Text style={organizationFooter}>
            National Association of Proprietors of Private Schools - Nasarawa State Chapter
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
  padding: "20px 0",
}

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #e6ebf1",
  borderRadius: "5px",
  margin: "0 auto",
  padding: "20px",
  width: "100%",
  maxWidth: "600px",
}

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "30px 0",
  padding: "0",
  textAlign: "center" as const,
}

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
}

const detailsSection = {
  backgroundColor: "#f9f9f9",
  borderRadius: "5px",
  padding: "15px",
  margin: "20px 0",
}

const detailsHeading = {
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 10px 0",
}

const detailsText = {
  margin: "5px 0",
  fontSize: "15px",
}

const buttonContainer = {
  textAlign: "center" as const,
  margin: "30px 0",
}

const button = {
  backgroundColor: "#4f46e5",
  borderRadius: "5px",
  color: "#fff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "bold",
  padding: "12px 24px",
  textDecoration: "none",
  textAlign: "center" as const,
}

const hr = {
  borderColor: "#e6ebf1",
  margin: "30px 0",
}

const footer = {
  color: "#666",
  fontSize: "14px",
  fontStyle: "italic",
  textAlign: "center" as const,
  margin: "10px 0",
}

const organizationFooter = {
  color: "#0066CC",
  fontSize: "12px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "5px 0",
}

const logoSection = {
  textAlign: "center" as const,
  marginBottom: "20px",
  paddingBottom: "15px",
  borderBottom: "2px solid #0066CC",
}

const logoText = {
  color: "#0066CC",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0",
  letterSpacing: "1px",
}

const subHeading = {
  color: "#333",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "5px 0 0 0",
}
