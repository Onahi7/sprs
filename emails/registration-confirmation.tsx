import { Body, Container, Head, Heading, Html, Preview, Section, Text, Hr, Link } from "@react-email/components"

interface RegistrationConfirmationEmailProps {
  name: string
  registrationNumber: string
  chapter: string
  school: string
  center: string
}

export default function RegistrationConfirmationEmail({
  name,
  registrationNumber,
  chapter,
  school,
  center,
}: RegistrationConfirmationEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  return (
    <Html>
      <Head />
      <Preview>Your Student Project Registration Confirmation</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Registration Confirmation</Heading>
          <Text style={text}>Dear {name},</Text>
          <Text style={text}>
            Thank you for registering for the Student Project. Your registration has been received successfully.
          </Text>

          <Section style={detailsSection}>
            <Text style={detailsHeading}>Registration Details:</Text>
            <Text style={detailsText}>
              <strong>Registration Number:</strong> {registrationNumber}
            </Text>
            <Text style={detailsText}>
              <strong>Chapter:</strong> {chapter}
            </Text>
            <Text style={detailsText}>
              <strong>School:</strong> {school}
            </Text>
            <Text style={detailsText}>
              <strong>Exam Center:</strong> {center}
            </Text>
          </Section>

          <Text style={text}>
            Please complete your payment to finalize your registration. You can make your payment by clicking the button
            below:
          </Text>

          <Section style={buttonContainer}>
            <Link
              href={`${appUrl}/payment/initialize?registrationNumber=${registrationNumber}`}
              style={button}
              target="_blank"
            >
              Make Payment
            </Link>
          </Section>

          <Text style={text}>
            You can also check your registration status at any time by visiting{" "}
            <Link href={`${appUrl}/status`} target="_blank">
              {appUrl}/status
            </Link>{" "}
            and entering your registration number.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            If you have any questions, please contact your chapter coordinator or email us at support@sprs.org.
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
}
