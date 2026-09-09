"use client";

import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { DashboardMobileNav } from "@/components/DashboardMobileNav";
import { DashboardMobileHeader, DashboardSidebar } from "@/components/DashboardSidebar";
import type { SessionUser } from "@/lib/auth";

type RequestMessage = {
  kind: "error" | "success";
  text: string;
} | null;

type ProfileResponse = {
  message?: string;
  user?: SessionUser;
};

function PasswordInput({
  autoComplete,
  label,
  onChange,
  placeholder,
  value,
}: {
  autoComplete: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="settings-field">
      <span>{label}</span>
      <div className="settings-input password">
        <LockKeyhole aria-hidden="true" size={17} />
        <input
          autoComplete={autoComplete}
          minLength={8}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required
          type={visible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={visible ? `${label} alanını gizle` : `${label} alanını göster`}
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}

function FormMessage({ message }: { message: RequestMessage }) {
  if (!message) return null;
  return (
    <div
      className={`settings-message ${message.kind}`}
      role={message.kind === "error" ? "alert" : "status"}
    >
      {message.kind === "success"
        ? <CheckCircle2 aria-hidden="true" size={17} />
        : <AlertCircle aria-hidden="true" size={17} />}
      <span>{message.text}</span>
    </div>
  );
}

export function SettingsDashboard({
  initialUser,
  menuCount,
}: {
  initialUser: SessionUser;
  menuCount: number;
}) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [name, setName] = useState(initialUser.name);
  const [email, setEmail] = useState(initialUser.email);
  const [profilePassword, setProfilePassword] = useState("");
  const [profileMessage, setProfileMessage] = useState<RequestMessage>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<RequestMessage>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteMessage, setDeleteMessage] = useState<RequestMessage>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const normalizedEmail = email.trim().toLocaleLowerCase("en-US");
  const emailChanged = normalizedEmail !== user.email.toLocaleLowerCase("en-US");
  const profileChanged = name.trim() !== user.name || emailChanged;

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileMessage(null);
    setProfileSaving(true);
    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: emailChanged ? profilePassword : undefined,
          email: normalizedEmail,
          name: name.trim(),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as ProfileResponse;
      if (!response.ok || !result.user) {
        throw new Error(result.message || "Hesap bilgileri güncellenemedi.");
      }

      setUser(result.user);
      setName(result.user.name);
      setEmail(result.user.email);
      setProfilePassword("");
      setProfileMessage({ kind: "success", text: result.message || "Hesap bilgilerin güncellendi." });
      router.refresh();
    } catch (error) {
      setProfileMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "Hesap bilgileri güncellenemedi.",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordMessage(null);
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ kind: "error", text: "Yeni şifreler birbiriyle eşleşmiyor." });
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(result.message || "Şifre değiştirilemedi.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage({
        kind: "success",
        text: result.message || "Şifren başarıyla değiştirildi.",
      });
      router.refresh();
    } catch (error) {
      setPasswordMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "Şifre değiştirilemedi.",
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const deleteAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDeleteMessage(null);
    if (!window.confirm("Hesabın, menülerin ve analitik verilerin kalıcı olarak silinecek. Devam edilsin mi?")) {
      return;
    }

    setDeletingAccount(true);
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation: deleteConfirmation,
          currentPassword: deletePassword,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(result.message || "Hesap silinemedi.");
      try {
        window.localStorage.removeItem(`easyqr-draft:${user.id}`);
      } catch {
        // Server-side account deletion already succeeded; unavailable browser
        // storage must not trap the user on an authenticated screen.
      }
      router.replace("/");
      router.refresh();
    } catch (error) {
      setDeleteMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "Hesap silinemedi.",
      });
      setDeletingAccount(false);
    }
  };

  return (
    <main className="dashboard-shell">
      <DashboardSidebar active="settings" menuCount={menuCount} onLogout={() => void logout()} user={user} />

      <section className="dashboard-main settings-dashboard-main">
        <DashboardMobileHeader user={user} />

        <div className="dashboard-content settings-page-content">
          <div className="dashboard-heading">
            <div>
              <span className="dashboard-kicker"><ShieldCheck size={14} /> Hesap merkezi</span>
              <h1>Ayarlar</h1>
              <p>Profil bilgilerini ve hesabının güvenliğini tek yerden yönet.</p>
            </div>
            <Link className="settings-back-link" href="/dashboard/menus">
              <ArrowLeft size={17} /> Menülerime dön
            </Link>
          </div>

          <div className="settings-grid">
            <div className="settings-form-column">
              <section className="settings-card">
                <div className="settings-card-heading">
                  <span className="settings-card-icon orange"><UserRound size={20} /></span>
                  <div><h2>Profil bilgileri</h2><p>Dashboard ve hesap bildirimlerinde kullanılan bilgiler.</p></div>
                </div>

                <form className="settings-form" onSubmit={saveProfile}>
                  <label className="settings-field">
                    <span>Ad soyad</span>
                    <div className="settings-input">
                      <UserRound aria-hidden="true" size={17} />
                      <input
                        autoComplete="name"
                        maxLength={60}
                        minLength={2}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Adın ve soyadın"
                        required
                        value={name}
                      />
                    </div>
                  </label>
                  <label className="settings-field">
                    <span>E-posta adresi</span>
                    <div className="settings-input">
                      <Mail aria-hidden="true" size={17} />
                      <input
                        autoComplete="email"
                        maxLength={254}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="ornek@isletme.com"
                        required
                        type="email"
                        value={email}
                      />
                    </div>
                  </label>

                  {emailChanged && (
                    <div className="settings-sensitive-field">
                      <PasswordInput
                        autoComplete="current-password"
                        label="E-posta değişikliği için mevcut şifre"
                        onChange={setProfilePassword}
                        placeholder="Mevcut şifren"
                        value={profilePassword}
                      />
                      <small>Yeni e-posta adresini kaydetmeden önce kimliğini doğruluyoruz.</small>
                    </div>
                  )}

                  <FormMessage message={profileMessage} />
                  <div className="settings-form-actions">
                    <span>{emailChanged ? "E-posta değişikliği şifre doğrulaması gerektirir." : "Bilgilerin hesabındaki tüm ekranlara yansır."}</span>
                    <button disabled={profileSaving || !profileChanged} type="submit">
                      <Save size={16} /> {profileSaving ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
                    </button>
                  </div>
                </form>
              </section>

              <section className="settings-card">
                <div className="settings-card-heading">
                  <span className="settings-card-icon green"><KeyRound size={20} /></span>
                  <div><h2>Şifre ve güvenlik</h2><p>Hesabın için yeni ve güçlü bir giriş şifresi belirle.</p></div>
                </div>

                <form className="settings-form" onSubmit={changePassword}>
                  <PasswordInput
                    autoComplete="current-password"
                    label="Mevcut şifre"
                    onChange={setCurrentPassword}
                    placeholder="Şu an kullandığın şifre"
                    value={currentPassword}
                  />
                  <div className="settings-password-grid">
                    <PasswordInput
                      autoComplete="new-password"
                      label="Yeni şifre"
                      onChange={setNewPassword}
                      placeholder="En az 8 karakter"
                      value={newPassword}
                    />
                    <PasswordInput
                      autoComplete="new-password"
                      label="Yeni şifre tekrar"
                      onChange={setConfirmPassword}
                      placeholder="Yeni şifreni tekrar gir"
                      value={confirmPassword}
                    />
                  </div>

                  <FormMessage message={passwordMessage} />
                  <div className="settings-form-actions">
                    <span>Şifre değişince diğer cihazlardaki oturumlar kapatılır.</span>
                    <button disabled={passwordSaving} type="submit">
                      <KeyRound size={16} /> {passwordSaving ? "Değiştiriliyor…" : "Şifreyi değiştir"}
                    </button>
                  </div>
                </form>
              </section>

              <section className="settings-card settings-danger-card">
                <div className="settings-card-heading">
                  <span className="settings-card-icon red"><AlertTriangle size={20} /></span>
                  <div><h2>Tehlikeli bölge</h2><p>Hesabını ve ona bağlı tüm verileri kalıcı olarak sil.</p></div>
                </div>

                <form className="settings-form" onSubmit={deleteAccount}>
                  <div className="settings-danger-warning">
                    <AlertTriangle aria-hidden="true" size={18} />
                    <p>Bu işlem geri alınamaz. Taslak ve yayınlanmış menülerin, QR bağlantıların, analitik kayıtların ve AI önbelleğin silinir.</p>
                  </div>
                  <PasswordInput
                    autoComplete="current-password"
                    label="Mevcut şifre"
                    onChange={setDeletePassword}
                    placeholder="Kimliğini doğrula"
                    value={deletePassword}
                  />
                  <label className="settings-field">
                    <span>Onaylamak için HESABIMI SİL yaz</span>
                    <div className="settings-input">
                      <AlertTriangle aria-hidden="true" size={17} />
                      <input
                        autoComplete="off"
                        onChange={(event) => setDeleteConfirmation(event.target.value)}
                        placeholder="HESABIMI SİL"
                        required
                        value={deleteConfirmation}
                      />
                    </div>
                  </label>
                  <FormMessage message={deleteMessage} />
                  <div className="settings-form-actions">
                    <span>Silme tamamlandığında tüm cihazlardaki oturumların kapanır.</span>
                    <button
                      className="settings-delete-button"
                      disabled={deletingAccount || deleteConfirmation !== "HESABIMI SİL"}
                      type="submit"
                    >
                      <Trash2 size={16} /> {deletingAccount ? "Siliniyor…" : "Hesabımı sil"}
                    </button>
                  </div>
                </form>
              </section>
            </div>

            <aside className="settings-side-column">
              <section className="settings-account-card">
                <div className="settings-account-avatar">{user.name.slice(0, 1).toLocaleUpperCase("tr-TR")}</div>
                <span className={user.account.status === "expired" ? "expired" : ""}>
                  <BadgeCheck size={14} /> {user.account.status === "active" ? "Aktif hesap" : "Erişim süresi doldu"}
                </span>
                <h2>{user.name}</h2>
                <p>{user.email}</p>
                <div className="settings-plan-summary">
                  <div><small>Plan</small><strong>{user.account.plan === "pro" ? "Pro" : "7 günlük deneme"}</strong></div>
                  <div><small>Menü kullanımı</small><strong>{user.account.menuCount} / {user.account.maxMenus}</strong></div>
                </div>
                <div className="settings-account-meta">
                  <CalendarDays size={16} />
                  <div>
                    <small>{user.account.status === "active" ? "Erişim bitişi" : "Erişim durumu"}</small>
                    <strong>{user.account.endsAt
                      ? `${new Date(user.account.endsAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}${user.account.status === "active" ? ` · ${user.account.daysRemaining} gün` : " · sona erdi"}`
                      : "Tanımlanmamış"}</strong>
                  </div>
                </div>
              </section>

              <section className="settings-security-card">
                <span><ShieldCheck size={17} /> Güvenlik durumu</span>
                <h2>Hesabın korunuyor</h2>
                <ul>
                  <li><CheckCircle2 size={15} /> Şifreler bcrypt ile saklanır</li>
                  <li><CheckCircle2 size={15} /> Oturum anahtarı tarayıcıdan okunamaz</li>
                  <li><CheckCircle2 size={15} /> Hassas değişiklikler yeniden doğrulanır</li>
                </ul>
              </section>
            </aside>
          </div>
        </div>
      </section>

      <DashboardMobileNav active="settings" />
    </main>
  );
}
