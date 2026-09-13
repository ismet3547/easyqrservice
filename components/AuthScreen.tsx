"use client";

import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  QrCode,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { useAppLocale } from "@/components/LocaleProvider";
import { getLocalizedAppPath } from "@/lib/i18n";
import { getSafeInternalPath } from "@/lib/navigation";

type AuthMode = "login" | "register";

const authCopy = {
  en: {
    back: "Back to home",
    benefits: ["Fast setup with AI", "Looks great on every phone", "Edit whenever you need"],
    createAccount: "Create free account",
    email: "Email address",
    emailPlaceholder: "hello@restaurant.com",
    existingAccount: "Already have an account?",
    forgotPassword: "Forgot password?",
    fullName: "Full name",
    fullNamePlaceholder: "Alex Morgan",
    headlineFirst: "Your menu changes.",
    headlineSecond: "Your QR code stays.",
    intro: "Manage your menu in one place, update it in seconds, and always show guests the latest version.",
    login: "Log in",
    loginDescription: "Pick up where you left off and keep managing your menus.",
    loginEyebrow: "Welcome back",
    loginTitle: "Log in to your account",
    newAccount: "New to easyqr?",
    password: "Password",
    passwordLoginPlaceholder: "Enter your password",
    passwordNewPlaceholder: "At least 8 characters",
    registerDescription: "Build your first QR menu in just a few minutes.",
    registerEyebrow: "Get started",
    registerTitle: "Create your account",
    remember: "Remember me for 30 days",
    security: "Your data is protected with secure session cookies",
    showPassword: "Show password",
    hidePassword: "Hide password",
    subtitle: "Seasonal ingredients, thoughtfully prepared",
    termsNote: "Your password is stored as a one-way hash, never as plain text.",
    venue: "Sage Kitchen",
    category: "Breakfast",
    valueFallback: "Something went wrong. Please try again.",
    valueProposition: "A digital menu for your venue",
  },
  tr: {
    back: "Ana sayfaya dön",
    benefits: ["Yapay zekâ ile hızlı kurulum", "Her telefonda kusursuz görünüm", "İstediğin zaman düzenleme"],
    createAccount: "Ücretsiz hesap oluştur",
    email: "E-posta adresi",
    emailPlaceholder: "ornek@restoran.com",
    existingAccount: "Zaten hesabın var mı?",
    forgotPassword: "Şifremi unuttum",
    fullName: "Ad soyad",
    fullNamePlaceholder: "İsmet Erdoğan",
    headlineFirst: "Menün değişsin.",
    headlineSecond: "Kodun aynı kalsın.",
    intro: "Menünü tek yerden yönet, saniyeler içinde güncelle ve müşterilerine her zaman en güncel halini göster.",
    login: "Giriş yap",
    loginDescription: "Menülerini yönetmeye kaldığın yerden devam et.",
    loginEyebrow: "Tekrar hoş geldin",
    loginTitle: "Hesabına giriş yap",
    newAccount: "Henüz hesabın yok mu?",
    password: "Şifre",
    passwordLoginPlaceholder: "Şifreni gir",
    passwordNewPlaceholder: "En az 8 karakter",
    registerDescription: "İlk QR menünü birkaç dakika içinde hazırlayabilirsin.",
    registerEyebrow: "Hemen başla",
    registerTitle: "Hesabını oluştur",
    remember: "Beni 30 gün hatırla",
    security: "Verilerin güvenli oturum çerezleriyle korunur",
    showPassword: "Şifreyi göster",
    hidePassword: "Şifreyi gizle",
    subtitle: "Mevsiminde, yerel ve özenli",
    termsNote: "Şifren tek yönlü hash’lenir; açık biçimde saklanmaz.",
    venue: "Sade Mutfak",
    category: "Kahvaltı",
    valueFallback: "Beklenmeyen bir sorun oluştu.",
    valueProposition: "İşletmen için dijital menü",
  },
} as const;

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useAppLocale();
  const copy = authCopy[locale];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isRegister = mode === "register";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegister
            ? { acceptedTerms, name, email, password }
            : { email, password, remember },
        ),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message || copy.valueFallback);

      const requestedNext = searchParams.get("next");
      const safeNext = getSafeInternalPath(
        requestedNext,
        isRegister ? "/dashboard?welcome=1" : "/dashboard",
      );
      router.replace(safeNext);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : copy.valueFallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-showcase">
        <Link className="auth-brand" href="/">
          <span><QrCode size={20} /></span>
          <strong>easy<i>qr</i></strong>
        </Link>

        <div className="auth-showcase-copy">
          <div className="eyebrow"><Sparkles size={15} /> {copy.valueProposition}</div>
          <h1>{copy.headlineFirst}<br /><em>{copy.headlineSecond}</em></h1>
          <p>{copy.intro}</p>
          <div className="auth-benefits">
            {copy.benefits.map((benefit) => <span key={benefit}><Check size={15} /> {benefit}</span>)}
          </div>
        </div>

        <div className="auth-art" aria-hidden="true">
          <div className="auth-art-card card-back">
            <div /><div /><div />
          </div>
          <div className="auth-art-card card-front">
            <div className="mini-brand">S</div>
            <strong>{copy.venue}</strong>
            <small>{copy.subtitle}</small>
            <span>{copy.category}</span>
            <div className="mini-item"><i /><b /><em /></div>
            <div className="mini-item"><i /><b /><em /></div>
          </div>
          <div className="floating-qr"><QrCode size={34} /></div>
        </div>

        <div className="auth-trust"><ShieldCheck size={15} /> {copy.security}</div>
      </section>

      <section className="auth-form-side">
        <Link className="auth-back" href="/"><ArrowLeft size={16} /> {copy.back}</Link>
        <div className="auth-locale-switcher"><LocaleSwitcher /></div>
        <div className="auth-form-wrap">
          <div className="auth-form-heading">
            <span>{isRegister ? copy.registerEyebrow : copy.loginEyebrow}</span>
            <h2>{isRegister ? copy.registerTitle : copy.loginTitle}</h2>
            <p>
              {isRegister
                ? copy.registerDescription
                : copy.loginDescription}
            </p>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {isRegister && (
              <label>
                <span>{copy.fullName}</span>
                <div className="auth-input"><UserRound size={17} /><input autoComplete="name" placeholder={copy.fullNamePlaceholder} value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={60} /></div>
              </label>
            )}
            <label>
              <span>{copy.email}</span>
              <div className="auth-input"><Mail size={17} /><input type="email" autoComplete="email" placeholder={copy.emailPlaceholder} value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
            </label>
            <label>
              <span>{copy.password}</span>
              <div className="auth-input">
                <LockKeyhole size={17} />
                <input type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} placeholder={isRegister ? copy.passwordNewPlaceholder : copy.passwordLoginPlaceholder} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
                <button type="button" aria-label={showPassword ? copy.hidePassword : copy.showPassword} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </div>
            </label>

            {!isRegister && <div className="auth-form-options"><label className="remember-me"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> <span>{copy.remember}</span></label><Link href={getLocalizedAppPath(locale, "forgotPassword")}>{copy.forgotPassword}</Link></div>}

            {isRegister && (
              <label className="auth-legal-consent">
                <input
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  required
                  type="checkbox"
                />
                {locale === "tr" ? (
                  <span><Link href={getLocalizedAppPath(locale, "terms")} target="_blank" rel="noreferrer">Kullanım Koşulları</Link>’nı kabul ediyor ve{" "}<Link href={getLocalizedAppPath(locale, "privacy")} target="_blank" rel="noreferrer">Gizlilik Bildirimi</Link>’ni okuduğumu beyan ediyorum.</span>
                ) : (
                  <span>I agree to the <Link href={getLocalizedAppPath(locale, "terms")} target="_blank" rel="noreferrer">Terms of Service</Link> and confirm that I have read the <Link href={getLocalizedAppPath(locale, "privacy")} target="_blank" rel="noreferrer">Privacy Notice</Link>.</span>
                )}
              </label>
            )}

            {error && <div className="auth-error" role="alert">{error}</div>}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? <Loader2 size={18} className="auth-spinner" /> : isRegister ? <><Sparkles size={17} /> {copy.createAccount}</> : copy.login}
            </button>

            {isRegister && <small className="auth-terms">{copy.termsNote}</small>}
          </form>

          <div className="auth-switch">
            {isRegister ? copy.existingAccount : copy.newAccount}{" "}
            <Link href={getLocalizedAppPath(locale, isRegister ? "login" : "register")}>{isRegister ? copy.login : copy.createAccount}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
