import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface InvitationEmailProps {
  orgName: string;
  inviterName: string;
  acceptUrl: string;
  role: string;
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  member: "Membro",
  viewer: "Visualizador",
};

export function InvitationEmail({
  orgName,
  inviterName,
  acceptUrl,
  role,
}: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {inviterName} convidou você para a {orgName} no Elleva
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={logo}>Elleva</Heading>

          <Section style={card}>
            <Heading style={h1}>Você foi convidado 🎉</Heading>
            <Text style={text}>
              <strong>{inviterName}</strong> convidou você para participar da
              organização <strong>{orgName}</strong> no Elleva como{" "}
              <strong>{ROLE_LABEL[role] ?? role}</strong>.
            </Text>
            <Text style={text}>
              O Elleva é a plataforma de gestão de etiquetas industriais. Aceite
              o convite para começar.
            </Text>

            <Button style={button} href={acceptUrl}>
              Aceitar convite
            </Button>

            <Text style={muted}>
              Este convite expira em 7 dias. Se você não esperava este email,
              pode ignorá-lo com segurança.
            </Text>
          </Section>

          <Text style={footer}>
            © {new Date().getFullYear()} Elleva Tecnologia
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default InvitationEmail;

const main = {
  backgroundColor: "#FAFAF8",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "480px",
};

const logo = {
  color: "#1A2744",
  fontSize: "28px",
  fontWeight: "400" as const,
  fontFamily: "Georgia, serif",
  textAlign: "center" as const,
  marginBottom: "24px",
};

const card = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  padding: "40px 32px",
  border: "1px solid rgba(26,39,68,0.08)",
};

const h1 = {
  color: "#1A2744",
  fontSize: "22px",
  fontWeight: "600" as const,
  marginBottom: "16px",
};

const text = {
  color: "#1A2744",
  fontSize: "15px",
  lineHeight: "24px",
  opacity: 0.8,
  marginBottom: "16px",
};

const button = {
  backgroundColor: "#C9A96E",
  color: "#1A2744",
  fontSize: "15px",
  fontWeight: "600" as const,
  padding: "12px 28px",
  borderRadius: "12px",
  textDecoration: "none",
  display: "inline-block",
  marginTop: "8px",
  marginBottom: "24px",
};

const muted = {
  color: "#1A2744",
  fontSize: "13px",
  lineHeight: "20px",
  opacity: 0.4,
};

const footer = {
  color: "#1A2744",
  fontSize: "12px",
  textAlign: "center" as const,
  opacity: 0.3,
  marginTop: "24px",
};
