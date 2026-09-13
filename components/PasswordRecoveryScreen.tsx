"use client";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { useAppLocale } from "@/components/LocaleProvider";
import { getLocalizedAppPath } from "@/lib/i18n";

type RecoveryMode = "request" | "reset";
type ResetState = "invalid" | "loading" | "ready" | "success";

function RecoveryShowcase() {
  const { locale } = useAppLocale();
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  return (
    <section className="auth-showcase recovery-showcase">
      <Link className="auth-brand" href="/">
        <span><QrCode size={20} /></span>
        <strong>easy<i>qr</i></strong>
      </Link>
      <div className="auth-showcase-copy">
        <div className="eyebrow"><ShieldCheck size={15} /> {t("Secure account recovery", "Güvenli hesap kurtarma")}</div>
        <h1>{t("Your menus are here.", "Menülerin burada.")}<br /><em>{t("Restore your access.", "Erişimini yenile.")}</em></h1>
        <p>{t("Set a new password with a one-time link and automatically close existing sessions.", "Tek kullanımlık bağlantıyla yeni şifreni belirle; mevcut oturumların otomatik olarak kapatılsın.")}</p>
        <div className="auth-benefits">
          <span><Check size={15} /> {t("Link expires after 30 minutes", "Bağlantı 30 dakika geçerli")}</span>
          <span><Check size={15} /> {t("Can only be used once", "Yalnızca bir kez kullanılabilir")}</span>
          <span><Check size={15} /> {t("Old sessions are closed", "Eski oturumlar kapatılır")}</span>
        </div>
      </div>
      <div className="recovery-shield" aria-hidden="true"><LockKeyhole size={48} /></div>
      <div className="auth-trust"><ShieldCheck size={15} /> {t("The raw reset token is never stored in the database", "Ham sıfırlama anahtarı veritabanında saklanmaz")}</div>
    </section>
  );
}

export function PasswordRecoveryScreen({ mode }: { mode: RecoveryMode }) {
  const { locale } = useAppLocale();
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  const isReset = mode === "reset";
  const effectStarted = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [token, setToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestComplete, setRequestComplete] = useState(false);
  const [resetState, setResetState] = useState<ResetState>(isReset ? "loading" : "ready");

  useEffect(() => {
    if (!isReset || effectStarted.current) return;
    effectStarted.current = true;
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const resetToken = fragment.get("token") || "";
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    if (/^[A-Za-z0-9_-]{43}$/.test(resetToken)) {
      setToken(resetToken);
      setResetState("ready");
    } else {
      setResetState("invalid");
    }
  }, [isReset]);

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(result.message || t("The request could not be completed.", "İstek tamamlanamadı."));
      setRequestComplete(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("Something went wrong.", "Beklenmeyen bir sorun oluştu."));
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError(t("The new passwords do not match.", "Yeni şifreler birbiriyle eşleşmiyor."));
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, token }),
      });
      const result = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(result.message || t("The password could not be updated.", "Şifre yenilenemedi."));
      setToken("");
      setPassword("");
      setConfirmation("");
      setResetState("success");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("Something went wrong.", "Beklenmeyen bir sorun oluştu."));
    } finally {
      setLoading(false);
    }
  };

  const feedback = requestComplete || resetState === "success"
    ? (
      <div className="recovery-result success" role="status">
        <CheckCircle2 size={25} />
        <div>
          <strong>{requestComplete ? t("Check your email", "E-postanı kontrol et") : t("Password updated", "Şifren yenilendi")}</strong>
          <p>{requestComplete
            ? t("If an account matches this address, we sent a link valid for 30 minutes. Check your inbox and spam folder.", "Bu adresle eşleşen bir hesap varsa 30 dakika geçerli bağlantıyı gönderdik. Gelen kutusu ve spam klasörünü kontrol et.")
            : t("All old sessions have been closed. You can now log in securely with your new password.", "Tüm eski oturumların kapatıldı. Yeni şifrenle güvenle giriş yapabilirsin.")}</p>
        </div>
      </div>
    )
    : resetState === "invalid"
      ? (
        <div className="recovery-result error" role="alert">
          <AlertCircle size={25} />
          <div><strong>{t("Invalid link", "Bağlantı geçersiz")}</strong><p>{t("The link may be incomplete, already used, or expired. Request a new one.", "Bağlantı eksik, daha önce kullanılmış veya süresi dolmuş olabilir. Yeni bir bağlantı iste.")}</p></div>
        </div>
      )
      : null;

  return (
    <main className="auth-shell">
      <RecoveryShowcase />
      <section className="auth-form-side">
        <Link className="auth-back" href={getLocalizedAppPath(locale, "login")}><ArrowLeft size={16} /> {t("Back to login", "Giriş ekranına dön")}</Link>
        <div className="auth-locale-switcher"><LocaleSwitcher /></div>
        <div className="auth-form-wrap">
          <div className="auth-form-heading">
            <span>{t("Account recovery", "Hesap kurtarma")}</span>
            <h2>{isReset ? t("Choose a new password", "Yeni şifreni belirle") : t("Reset your password", "Şifreni sıfırla")}</h2>
            <p>{isReset
              ? t("Create a new password with at least 8 characters.", "Hesabın için en az 8 karakterli yeni bir şifre oluştur.")
              : t("Enter the email address for your account and we'll send a secure link.", "Hesabında kullandığın e-posta adresini gir; güvenli bağlantıyı gönderelim.")}</p>
          </div>

          {resetState === "loading" ? (
            <div className="recovery-loading"><Loader2 className="auth-spinner" size={24} /> {t("Verifying link…", "Bağlantı doğrulanıyor…")}</div>
          ) : feedback ? (
            <>
              {feedback}
              <div className="recovery-actions">
                {(requestComplete || resetState === "success") && <Link className="auth-submit" href={getLocalizedAppPath(locale, "login")}>{t("Log in", "Giriş yap")}</Link>}
                {resetState === "invalid" && <Link className="auth-submit" href={getLocalizedAppPath(locale, "forgotPassword")}>{t("Request a new link", "Yeni bağlantı iste")}</Link>}
              </div>
            </>
          ) : isReset ? (
            <form className="auth-form" onSubmit={submitReset}>
              <label>
                <span>{t("New password", "Yeni şifre")}</span>
                <div className="auth-input">
                  <LockKeyhole size={17} />
                  <input autoComplete="new-password" minLength={8} required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t("At least 8 characters", "En az 8 karakter")} />
                  <button aria-label={showPassword ? t("Hide password", "Şifreyi gizle") : t("Show password", "Şifreyi göster")} onClick={() => setShowPassword((current) => !current)} type="button">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                </div>
              </label>
              <label>
                <span>{t("Confirm new password", "Yeni şifre tekrar")}</span>
                <div className="auth-input"><LockKeyhole size={17} /><input autoComplete="new-password" minLength={8} required type={showPassword ? "text" : "password"} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder={t("Enter the new password again", "Yeni şifreni tekrar gir")} /></div>
              </label>
              {error && <div className="auth-error" role="alert">{error}</div>}
              <button className="auth-submit" disabled={loading} type="submit">{loading ? <Loader2 className="auth-spinner" size={18} /> : t("Update password", "Şifremi yenile")}</button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={submitRequest}>
              <label>
                <span>{t("Email address", "E-posta adresi")}</span>
                <div className="auth-input"><Mail size={17} /><input autoComplete="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t("hello@restaurant.com", "ornek@restoran.com")} /></div>
              </label>
              {error && <div className="auth-error" role="alert">{error}</div>}
              <button className="auth-submit" disabled={loading} type="submit">{loading ? <Loader2 className="auth-spinner" size={18} /> : t("Send reset link", "Yenileme bağlantısı gönder")}</button>
              <small className="auth-terms">{t("For security, the same response is shown for unregistered addresses.", "Güvenlik için kayıtlı olmayan adreslerde de aynı yanıt gösterilir.")}</small>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
