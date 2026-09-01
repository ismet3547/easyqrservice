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

type AuthMode = "login" | "register";

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
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
          isRegister ? { name, email, password } : { email, password, remember },
        ),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message || "İşlem tamamlanamadı.");

      const requestedNext = searchParams.get("next");
      const safeNext = requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
        ? requestedNext
        : "/";
      router.replace(safeNext);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Beklenmeyen bir sorun oluştu.");
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
          <div className="eyebrow"><Sparkles size={15} /> İşletmen için dijital menü</div>
          <h1>Menün değişsin.<br /><em>Kodun aynı kalsın.</em></h1>
          <p>Menünü tek yerden yönet, saniyeler içinde güncelle ve müşterilerine her zaman en güncel halini göster.</p>
          <div className="auth-benefits">
            <span><Check size={15} /> Yapay zekâ ile hızlı kurulum</span>
            <span><Check size={15} /> Her telefonda kusursuz görünüm</span>
            <span><Check size={15} /> İstediğin zaman düzenleme</span>
          </div>
        </div>

        <div className="auth-art" aria-hidden="true">
          <div className="auth-art-card card-back">
            <div /><div /><div />
          </div>
          <div className="auth-art-card card-front">
            <div className="mini-brand">S</div>
            <strong>Sade Mutfak</strong>
            <small>Mevsiminde, yerel ve özenli</small>
            <span>Kahvaltı</span>
            <div className="mini-item"><i /><b /><em /></div>
            <div className="mini-item"><i /><b /><em /></div>
          </div>
          <div className="floating-qr"><QrCode size={34} /></div>
        </div>

        <div className="auth-trust"><ShieldCheck size={15} /> Verilerin güvenli oturum çerezleriyle korunur</div>
      </section>

      <section className="auth-form-side">
        <Link className="auth-back" href="/"><ArrowLeft size={16} /> Ana sayfaya dön</Link>
        <div className="auth-form-wrap">
          <div className="auth-form-heading">
            <span>{isRegister ? "Hemen başla" : "Tekrar hoş geldin"}</span>
            <h2>{isRegister ? "Hesabını oluştur" : "Hesabına giriş yap"}</h2>
            <p>
              {isRegister
                ? "İlk QR menünü birkaç dakika içinde hazırlayabilirsin."
                : "Menülerini yönetmeye kaldığın yerden devam et."}
            </p>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {isRegister && (
              <label>
                <span>Ad soyad</span>
                <div className="auth-input"><UserRound size={17} /><input autoComplete="name" placeholder="İsmet Erdoğan" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={60} /></div>
              </label>
            )}
            <label>
              <span>E-posta adresi</span>
              <div className="auth-input"><Mail size={17} /><input type="email" autoComplete="email" placeholder="ornek@restoran.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
            </label>
            <label>
              <span>Şifre</span>
              <div className="auth-input">
                <LockKeyhole size={17} />
                <input type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} placeholder={isRegister ? "En az 8 karakter" : "Şifreni gir"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
                <button type="button" aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </div>
            </label>

            {!isRegister && <div className="auth-form-options"><label className="remember-me"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> <span>Beni 30 gün hatırla</span></label><button type="button" disabled title="Şifre sıfırlama sonraki sürümde eklenecek">Şifremi unuttum</button></div>}

            {error && <div className="auth-error" role="alert">{error}</div>}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? <Loader2 size={18} className="auth-spinner" /> : isRegister ? <><Sparkles size={17} /> Ücretsiz hesap oluştur</> : "Giriş yap"}
            </button>

            {isRegister && <small className="auth-terms">Şifren tek yönlü hash’lenir; açık biçimde saklanmaz.</small>}
          </form>

          <div className="auth-switch">
            {isRegister ? "Zaten hesabın var mı?" : "Henüz hesabın yok mu?"}{" "}
            <Link href={isRegister ? "/giris" : "/kayit"}>{isRegister ? "Giriş yap" : "Ücretsiz hesap oluştur"}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
