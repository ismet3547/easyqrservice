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

type RecoveryMode = "request" | "reset";
type ResetState = "invalid" | "loading" | "ready" | "success";

function RecoveryShowcase() {
  return (
    <section className="auth-showcase recovery-showcase">
      <Link className="auth-brand" href="/">
        <span><QrCode size={20} /></span>
        <strong>easy<i>qr</i></strong>
      </Link>
      <div className="auth-showcase-copy">
        <div className="eyebrow"><ShieldCheck size={15} /> Güvenli hesap kurtarma</div>
        <h1>Menülerin burada.<br /><em>Erişimini yenile.</em></h1>
        <p>Tek kullanımlık bağlantıyla yeni şifreni belirle; mevcut oturumların otomatik olarak kapatılsın.</p>
        <div className="auth-benefits">
          <span><Check size={15} /> Bağlantı 30 dakika geçerli</span>
          <span><Check size={15} /> Yalnızca bir kez kullanılabilir</span>
          <span><Check size={15} /> Eski oturumlar kapatılır</span>
        </div>
      </div>
      <div className="recovery-shield" aria-hidden="true"><LockKeyhole size={48} /></div>
      <div className="auth-trust"><ShieldCheck size={15} /> Ham sıfırlama anahtarı veritabanında saklanmaz</div>
    </section>
  );
}

export function PasswordRecoveryScreen({ mode }: { mode: RecoveryMode }) {
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
      if (!response.ok) throw new Error(result.message || "İstek tamamlanamadı.");
      setRequestComplete(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Beklenmeyen bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("Yeni şifreler birbiriyle eşleşmiyor.");
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
      if (!response.ok) throw new Error(result.message || "Şifre yenilenemedi.");
      setToken("");
      setPassword("");
      setConfirmation("");
      setResetState("success");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Beklenmeyen bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const feedback = requestComplete || resetState === "success"
    ? (
      <div className="recovery-result success" role="status">
        <CheckCircle2 size={25} />
        <div>
          <strong>{requestComplete ? "E-postanı kontrol et" : "Şifren yenilendi"}</strong>
          <p>{requestComplete
            ? "Bu adresle eşleşen bir hesap varsa 30 dakika geçerli bağlantıyı gönderdik. Gelen kutusu ve spam klasörünü kontrol et."
            : "Tüm eski oturumların kapatıldı. Yeni şifrenle güvenle giriş yapabilirsin."}</p>
        </div>
      </div>
    )
    : resetState === "invalid"
      ? (
        <div className="recovery-result error" role="alert">
          <AlertCircle size={25} />
          <div><strong>Bağlantı geçersiz</strong><p>Bağlantı eksik, daha önce kullanılmış veya süresi dolmuş olabilir. Yeni bir bağlantı iste.</p></div>
        </div>
      )
      : null;

  return (
    <main className="auth-shell">
      <RecoveryShowcase />
      <section className="auth-form-side">
        <Link className="auth-back" href="/giris"><ArrowLeft size={16} /> Giriş ekranına dön</Link>
        <div className="auth-form-wrap">
          <div className="auth-form-heading">
            <span>Hesap kurtarma</span>
            <h2>{isReset ? "Yeni şifreni belirle" : "Şifreni sıfırla"}</h2>
            <p>{isReset
              ? "Hesabın için en az 8 karakterli yeni bir şifre oluştur."
              : "Hesabında kullandığın e-posta adresini gir; güvenli bağlantıyı gönderelim."}</p>
          </div>

          {resetState === "loading" ? (
            <div className="recovery-loading"><Loader2 className="auth-spinner" size={24} /> Bağlantı doğrulanıyor…</div>
          ) : feedback ? (
            <>
              {feedback}
              <div className="recovery-actions">
                {(requestComplete || resetState === "success") && <Link className="auth-submit" href="/giris">Giriş yap</Link>}
                {resetState === "invalid" && <Link className="auth-submit" href="/sifremi-unuttum">Yeni bağlantı iste</Link>}
              </div>
            </>
          ) : isReset ? (
            <form className="auth-form" onSubmit={submitReset}>
              <label>
                <span>Yeni şifre</span>
                <div className="auth-input">
                  <LockKeyhole size={17} />
                  <input autoComplete="new-password" minLength={8} required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="En az 8 karakter" />
                  <button aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"} onClick={() => setShowPassword((current) => !current)} type="button">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                </div>
              </label>
              <label>
                <span>Yeni şifre tekrar</span>
                <div className="auth-input"><LockKeyhole size={17} /><input autoComplete="new-password" minLength={8} required type={showPassword ? "text" : "password"} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Yeni şifreni tekrar gir" /></div>
              </label>
              {error && <div className="auth-error" role="alert">{error}</div>}
              <button className="auth-submit" disabled={loading} type="submit">{loading ? <Loader2 className="auth-spinner" size={18} /> : "Şifremi yenile"}</button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={submitRequest}>
              <label>
                <span>E-posta adresi</span>
                <div className="auth-input"><Mail size={17} /><input autoComplete="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ornek@restoran.com" /></div>
              </label>
              {error && <div className="auth-error" role="alert">{error}</div>}
              <button className="auth-submit" disabled={loading} type="submit">{loading ? <Loader2 className="auth-spinner" size={18} /> : "Yenileme bağlantısı gönder"}</button>
              <small className="auth-terms">Güvenlik için kayıtlı olmayan adreslerde de aynı yanıt gösterilir.</small>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
