type PasswordResetEmail = {
  recipient: string;
  resetUrl: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character);
}

function getDeliveryMode() {
  return (process.env.EMAIL_DELIVERY_MODE || (
    process.env.NODE_ENV === "production" ? "resend" : "log"
  )).trim().toLowerCase();
}

export function createPasswordResetUrl(token: string) {
  const appUrl = process.env.APP_URL?.trim() || "http://localhost:3000";
  const url = new URL("/sifre-sifirla", appUrl);
  url.hash = `token=${encodeURIComponent(token)}`;
  return url.toString();
}

export async function sendPasswordResetEmail({ recipient, resetUrl }: PasswordResetEmail) {
  const deliveryMode = getDeliveryMode();
  if (deliveryMode === "log") {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_MODE !== "true") {
      throw new Error("Log email delivery is disabled in production.");
    }
    console.info(`[easyqr] Password reset for ${recipient}: ${resetUrl}`);
    return;
  }

  if (deliveryMode !== "resend") {
    throw new Error("Unsupported email delivery mode.");
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    throw new Error("Password reset email delivery is not configured.");
  }

  const safeResetUrl = escapeHtml(resetUrl);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject: "easyqr şifreni sıfırla",
      text: `Şifreni yenilemek için bu bağlantıyı aç: ${resetUrl}\n\nBağlantı 30 dakika geçerlidir. Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin.`,
      html: [
        "<h1>Şifreni yenile</h1>",
        "<p>easyqr hesabın için bir şifre sıfırlama isteği aldık.</p>",
        `<p><a href=\"${safeResetUrl}\">Yeni şifre oluştur</a></p>`,
        "<p>Bu bağlantı 30 dakika boyunca ve yalnızca bir kez kullanılabilir.</p>",
        "<p>Bu isteği sen yapmadıysan e-postayı yok sayabilirsin.</p>",
      ].join(""),
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Email provider returned ${response.status}.`);
  }
}
