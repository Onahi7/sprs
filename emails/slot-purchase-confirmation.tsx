import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from "@react-email/components"

interface SlotPurchaseConfirmationEmailProps {
  coordinatorName: string
  coordinatorEmail?: string
  chapterName: string
  packageName: string
  slotsPurchased: number
  amountPaid: string
  paymentReference: string
  transactionDate: string
  currentSlotBalance: number
}

export default function SlotPurchaseConfirmationEmail({
  coordinatorName = "John Doe",
  coordinatorEmail = "coordinator@example.com",
  chapterName = "Sample Chapter",
  packageName = "100 Slots Package",
  slotsPurchased = 100,
  amountPaid = "₦25,000",
  paymentReference = "REF_123456789",
  transactionDate = new Date().toLocaleDateString(),
  currentSlotBalance = 150,
}: SlotPurchaseConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Your slot purchase has been confirmed - ${slotsPurchased} slots added to your account`}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src="/napps-logo.svg"
              width="60"
              height="60"
              alt="NAPPS Logo"
              style={logo}
            />
            <Heading style={h1}>Payment Confirmation</Heading>
          </Section>

          {/* Success Message */}
          <Section style={successSection}>
            <Text style={successText}>
              ✅ Payment Successful!
            </Text>
            <Text style={paragraph}>
              Dear {coordinatorName}, your slot purchase has been successfully processed. 
              {slotsPurchased} registration slots have been added to your account.
            </Text>
          </Section>

          {/* Purchase Details */}
          <Section style={detailsSection}>
            <Heading style={h2}>Purchase Details</Heading>
            
            <Row style={detailRow}>
              <Column style={detailLabel}>Package:</Column>
              <Column style={detailValue}>{packageName}</Column>
            </Row>
            
            <Row style={detailRow}>
              <Column style={detailLabel}>Slots Purchased:</Column>
              <Column style={detailValue}>{slotsPurchased} slots</Column>
            </Row>
            
            <Row style={detailRow}>
              <Column style={detailLabel}>Amount Paid:</Column>
              <Column style={detailValue}>{amountPaid}</Column>
            </Row>
            
            <Row style={detailRow}>
              <Column style={detailLabel}>Transaction Reference:</Column>
              <Column style={detailValue}>{paymentReference}</Column>
            </Row>
            
            <Row style={detailRow}>
              <Column style={detailLabel}>Date:</Column>
              <Column style={detailValue}>{transactionDate}</Column>
            </Row>
            
            <Row style={detailRow}>
              <Column style={detailLabel}>Chapter:</Column>
              <Column style={detailValue}>{chapterName}</Column>
            </Row>
          </Section>

          {/* Current Balance */}
          <Section style={balanceSection}>
            <Heading style={h2}>Current Slot Balance</Heading>
            <Text style={balanceText}>
              {currentSlotBalance} slots available
            </Text>
            <Text style={paragraph}>
              You can now register up to {currentSlotBalance} students for the examination.
            </Text>
          </Section>

          {/* Actions */}
          <Section style={actionSection}>
            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL}/coordinator/slots`}
              style={button}
            >
              View My Slots
            </Link>
            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL}/coordinator/register`}
              style={buttonSecondary}
            >
              Register Students
            </Link>
          </Section>

          {/* Important Notes */}
          <Section style={notesSection}>
            <Heading style={h3}>Important Notes</Heading>
            <Text style={paragraph}>
              • Slots are automatically deducted when you register students
            </Text>
            <Text style={paragraph}>
              • You can track your slot usage in the coordinator dashboard
            </Text>
            <Text style={paragraph}>
              • Purchase additional slots before your balance runs low
            </Text>
            <Text style={paragraph}>
              • Keep this email as a receipt for your records
            </Text>
          </Section>

          {/* Support */}
          <Section style={supportSection}>
            <Text style={paragraph}>
              Need help? Contact our support team or visit your{" "}
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/coordinator/slots/payment/status`} style={link}>
                payment history
              </Link>
              {" "}for more details.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              This email was sent as confirmation of your slot purchase.
            </Text>
            <Text style={footerText}>
              © 2025 National Association of Proprietors of Private Schools (NAPPS)
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
}

const header = {
  padding: "20px 40px",
  textAlign: "center" as const,
  borderBottom: "1px solid #eaeaea",
}

const logo = {
  margin: "0 auto",
}

const h1 = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "16px 0",
  padding: "0",
}

const h2 = {
  color: "#374151",
  fontSize: "18px",
  fontWeight: "600",
  margin: "24px 0 16px",
  padding: "0",
}

const h3 = {
  color: "#374151",
  fontSize: "16px",
  fontWeight: "600",
  margin: "20px 0 12px",
  padding: "0",
}

const successSection = {
  padding: "20px 40px",
  textAlign: "center" as const,
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  margin: "20px 40px",
}

const successText = {
  color: "#166534",
  fontSize: "20px",
  fontWeight: "600",
  margin: "0 0 12px",
}

const detailsSection = {
  padding: "0 40px",
  margin: "20px 0",
}

const detailRow = {
  marginBottom: "8px",
}

const detailLabel = {
  color: "#6b7280",
  fontSize: "14px",
  width: "45%",
  verticalAlign: "top",
}

const detailValue = {
  color: "#1f2937",
  fontSize: "14px",
  fontWeight: "500",
  width: "55%",
}

const balanceSection = {
  padding: "20px 40px",
  textAlign: "center" as const,
  backgroundColor: "#eff6ff",
  borderRadius: "8px",
  margin: "20px 40px",
}

const balanceText = {
  color: "#1d4ed8",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 12px",
}

const actionSection = {
  padding: "20px 40px",
  textAlign: "center" as const,
}

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  margin: "8px",
}

const buttonSecondary = {
  backgroundColor: "#ffffff",
  borderRadius: "6px",
  color: "#2563eb",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  margin: "8px",
  border: "1px solid #2563eb",
}

const notesSection = {
  padding: "0 40px",
  margin: "20px 0",
}

const supportSection = {
  padding: "20px 40px",
  textAlign: "center" as const,
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  margin: "20px 40px",
}

const paragraph = {
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "8px 0",
}

const link = {
  color: "#2563eb",
  textDecoration: "underline",
}

const footer = {
  padding: "20px 40px",
  textAlign: "center" as const,
  borderTop: "1px solid #eaeaea",
  marginTop: "32px",
}

const footerText = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "1.4",
  margin: "8px 0",
}

// Named export for easier importing
export { SlotPurchaseConfirmationEmail }
