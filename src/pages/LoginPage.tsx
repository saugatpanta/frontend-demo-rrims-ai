import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, Lock, Mail, PlayCircle, ShieldCheck, Smartphone, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button, Field, inputClass, Panel } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { authApi, type MfaChallenge } from "../api/services";

const demoPassword = import.meta.env.VITE_DEMO_PASSWORD ?? "Test@12345";
const demoAccounts = [
  { role: "Admin", username: "serial.admin", label: "System Admin" },
  { role: "Federal", username: "serial.federal", label: "Federal Command" },
  { role: "Province", username: "serial.provincial", label: "Provincial Ops" },
  { role: "District", username: "serial.district", label: "District Desk" },
  { role: "Local", username: "serial.local", label: "Local Gov" },
  { role: "Ward", username: "serial.ward", label: "Ward Office" },
  { role: "Engineer", username: "serial.engineer", label: "Field Engineer" },
  { role: "Citizen", username: "serial.citizen", label: "Citizen" },
  { role: "NGO", username: "serial.ngo", label: "NGO Observer" },
] as const;

export function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot" | "mfa">("login");
  const [challenge, setChallenge] = useState<MfaChallenge | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaMethod, setMfaMethod] = useState<"TOTP" | "BACKUP_CODE">("TOTP");
  const [rememberDevice, setRememberDevice] = useState(true);
  const { login, refreshUser } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(identifier, password);
      navigate("/app");
    } catch (caught) {
      const code = caught && typeof caught === "object" && "code" in caught ? String((caught as { code?: unknown }).code) : "";
      const nextChallenge = getMfaChallenge(caught);
      if (code === "MFA_CHALLENGE_REQUIRED" && nextChallenge) {
        setChallenge(nextChallenge);
        setMfaMethod(nextChallenge.methods.includes("TOTP") ? "TOTP" : nextChallenge.methods[0] ?? "TOTP");
        setRememberDevice(Boolean(nextChallenge.rememberDeviceAllowed));
        setMode("mfa");
        setError("Additional verification is required. Complete MFA to continue.");
      } else {
        setError(formatAuthError(caught, "Could not sign in."));
      }
    } finally {
      setLoading(false);
    }
  }

  async function verifyMfa(event: FormEvent) {
    event.preventDefault();
    if (!challenge) return;
    setError("");
    setLoading(true);
    try {
      await authApi.verifyChallenge({
        challengeId: challenge.challengeId,
        challengeToken: challenge.challengeToken,
        method: mfaMethod,
        code: mfaCode.trim(),
        rememberDevice: rememberDevice && mfaMethod === "TOTP",
      });
      await refreshUser();
      navigate("/app");
    } catch (caught) {
      setError(formatAuthError(caught, "Could not verify MFA."));
    } finally {
      setLoading(false);
    }
  }

  function useDemoAccount(username: string) {
    setIdentifier(username);
    setPassword(demoPassword);
    setError("");
  }

  return (
    <main className="grid min-h-screen bg-slate-100 lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative flex min-h-[42vh] flex-col justify-between overflow-hidden bg-[url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1600&q=85')] bg-cover bg-center p-6 text-white lg:min-h-screen lg:p-10">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,17,31,0.82),rgba(15,118,110,0.58)_52%,rgba(18,58,111,0.74))]" />
        <div className="absolute inset-0 surface-grid opacity-20" />
        <div className="relative">
        <Link to="/" className="inline-flex w-max items-center gap-2 rounded-md bg-white/15 px-3 py-2 text-sm font-semibold backdrop-blur">
          <ArrowLeft className="h-4 w-4" />
          Public portal
        </Link>
        </div>
        <div className="relative max-w-xl pb-8">
          <img src="/rrims-mark.svg" alt="" className="mb-5 h-16 w-16 rounded-lg bg-white p-1.5 shadow-2xl" />
          <p className="text-sm font-semibold uppercase tracking-wide text-civic-100">Road and resource response</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">RRIMS Command Center</h1>
          <p className="mt-4 text-base leading-7 text-white/90">
            Coordinate reports, field engineers, work orders, citizen follow-up, and local government oversight from one operational workspace.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <TrustPill icon={<ShieldCheck className="h-4 w-4" />} label="MFA ready" />
            <TrustPill icon={<KeyRound className="h-4 w-4" />} label="Audited access" />
            <TrustPill icon={<CheckCircle2 className="h-4 w-4" />} label="Role scoped" />
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <HeroMetric label="Live modules" value="342" />
            <HeroMetric label="Evidence" value="Media" />
            <HeroMetric label="Security" value="AAL2" />
          </div>
        </div>
      </section>

      <section className="flex flex-col items-center justify-center p-4 sm:p-8">
        <Panel className="w-full max-w-md overflow-hidden p-0">
          <div className="p-6">
          {mode === "login" ? (
            <>
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-civic-700">Secure access</p>
            <h2 className="mt-1 text-2xl font-bold text-ink-900">Sign in</h2>
          </div>

          {error ? (
            <div className="mb-4 flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Username, email, or phone">
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input className={`${inputClass} pl-10`} value={identifier} onChange={(event) => setIdentifier(event.target.value)} required />
              </div>
            </Field>
            <Field label="Password">
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input className={`${inputClass} pl-10`} type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </div>
            </Field>
            <Button type="submit" className="w-full" loading={loading}>
              Sign in to RRIMS
            </Button>
          </form>
          <button type="button" className="mt-4 text-sm font-black text-civic-700 hover:text-civic-900" onClick={() => setMode("forgot")}>
            I forgot my password
          </button>
          <p className="mt-5 text-center text-sm text-ink-500">
            New citizen?{" "}
            <Link to="/register" className="font-semibold text-civic-700">
              Create an account
            </Link>
          </p>
            </>
          ) : mode === "mfa" ? (
            <MfaPanel
              challenge={challenge}
              code={mfaCode}
              method={mfaMethod}
              rememberDevice={rememberDevice}
              loading={loading}
              error={error}
              onCode={setMfaCode}
              onMethod={setMfaMethod}
              onRemember={setRememberDevice}
              onSubmit={verifyMfa}
              onBack={() => {
                setMode("login");
                setChallenge(null);
                setMfaCode("");
                setError("");
              }}
            />
          ) : (
            <ForgotPasswordPanel onBack={() => setMode("login")} />
          )}
          </div>
        </Panel>

        <Panel className="mt-4 w-full max-w-md p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-civic-700">Demo access</p>
              <h3 className="mt-1 text-lg font-black text-ink-900">Non-superadmin roles</h3>
            </div>
            <PlayCircle className="h-5 w-5 text-civic-700" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {demoAccounts.map((account) => (
              <button
                key={account.username}
                type="button"
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-civic-200 hover:bg-civic-50"
                onClick={() => useDemoAccount(account.username)}
              >
                <span className="block text-sm font-black text-ink-900">{account.label}</span>
                <span className="block text-xs font-semibold text-ink-500">{account.username}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs font-semibold text-ink-500">
            Password: {demoPassword}. Run backend seed with demo accounts enabled before using these.
          </p>
        </Panel>
      </section>
    </main>
  );
}

function TrustPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white backdrop-blur">
      {icon}
      {label}
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 p-3 backdrop-blur">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-civic-100">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function MfaPanel({
  challenge,
  code,
  method,
  rememberDevice,
  loading,
  error,
  onCode,
  onMethod,
  onRemember,
  onSubmit,
  onBack,
}: {
  challenge: MfaChallenge | null;
  code: string;
  method: "TOTP" | "BACKUP_CODE";
  rememberDevice: boolean;
  loading: boolean;
  error: string;
  onCode: (value: string) => void;
  onMethod: (value: "TOTP" | "BACKUP_CODE") => void;
  onRemember: (value: boolean) => void;
  onSubmit: (event: FormEvent) => void;
  onBack: () => void;
}) {
  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-civic-700">Step 2 of 2</p>
        <h2 className="mt-1 text-2xl font-bold text-ink-900">Additional verification is required.</h2>
        <p className="mt-2 text-sm leading-6 text-ink-500">Enter your authenticator code or backup code to finish signing in.</p>
      </div>
      {error ? (
        <div className="mb-4 flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
          <Smartphone className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Verification method">
          <select className={inputClass} value={method} onChange={(event) => onMethod(event.target.value as "TOTP" | "BACKUP_CODE")}>
            {(challenge?.methods ?? ["TOTP"]).map((item) => (
              <option key={item} value={item}>{item === "BACKUP_CODE" ? "Backup code" : "Authenticator app"}</option>
            ))}
          </select>
        </Field>
        <Field label={method === "BACKUP_CODE" ? "Backup code" : "6-digit authenticator code"}>
          <input className={inputClass} value={code} onChange={(event) => onCode(event.target.value)} required minLength={6} autoFocus />
        </Field>
        {challenge?.rememberDeviceAllowed && method === "TOTP" ? (
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <input className="mt-1 h-4 w-4 accent-civic-700" type="checkbox" checked={rememberDevice} onChange={(event) => onRemember(event.target.checked)} />
            <span>
              <span className="block text-sm font-black text-ink-900">Remember this device</span>
              <span className="text-sm text-ink-500">Allowed by backend MFA policy for this challenge.</span>
            </span>
          </label>
        ) : null}
        <Button type="submit" className="w-full" loading={loading}>Complete verification</Button>
        <Button type="button" variant="secondary" className="w-full" onClick={onBack}>Back to sign in</Button>
      </form>
    </div>
  );
}

function getMfaChallenge(error: unknown): MfaChallenge | null {
  if (!error || typeof error !== "object" || !("details" in error)) return null;
  const details = (error as { details?: unknown }).details;
  const challenge = details && typeof details === "object" && "challenge" in details
    ? (details as { challenge?: unknown }).challenge
    : details;
  if (!challenge || typeof challenge !== "object") return null;
  const value = challenge as Partial<MfaChallenge>;
  if (!value.challengeId || !value.challengeToken) return null;
  return {
    challengeId: String(value.challengeId),
    challengeToken: String(value.challengeToken),
    methods: Array.isArray(value.methods) ? value.methods : ["TOTP"],
    attemptsRemaining: value.attemptsRemaining,
    rememberDeviceAllowed: Boolean(value.rememberDeviceAllowed),
    expiresAt: value.expiresAt,
  };
}

function formatAuthError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;

  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";

  return code ? `${error.message} (${code})` : error.message;
}

function ForgotPasswordPanel({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationSessionId, setVerificationSessionId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"request" | "reset" | "done">("request");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestReset(event: FormEvent) {
    event.preventDefault();
      setError("");
      setMessage("");
      setLoading(true);
    try {
      const result = await authApi.forgotPassword(email);
      const sessionId = String(result.verificationSessionId ?? "");
      setVerificationSessionId(sessionId);
      setStep("reset");
      setMessage("If the account exists, RRIMS sent a 6-digit reset code to the registered email.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start password reset.");
    } finally {
      setLoading(false);
    }
  }

  async function reset(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.resetPassword({
        email,
        verificationSessionId: verificationSessionId || undefined,
        otp,
        newPassword,
        confirmPassword,
      });
      setStep("done");
      setMessage("Password reset complete. You can sign in with your new password.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-civic-700">Account recovery</p>
        <h2 className="mt-1 text-2xl font-bold text-ink-900">Reset password</h2>
        <p className="mt-2 text-sm leading-6 text-ink-500">Use your registered email and the reset code sent by the backend.</p>
      </div>
      {message ? <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800">{message}</div> : null}
      {error ? (
        <div className="mb-4 flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}
      {step === "request" ? (
        <form onSubmit={requestReset} className="space-y-4">
          <Field label="Registered email">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input className={`${inputClass} pl-10`} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
          </Field>
          <Button type="submit" className="w-full" loading={loading}>Send reset code</Button>
        </form>
      ) : null}
      {step === "reset" ? (
        <form onSubmit={reset} className="space-y-4">
          <Field label="6-digit reset code"><input className={inputClass} value={otp} onChange={(event) => setOtp(event.target.value)} maxLength={6} required /></Field>
          <Field label="New password"><input className={inputClass} type="password" minLength={12} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></Field>
          <Field label="Confirm password"><input className={inputClass} type="password" minLength={12} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></Field>
          <Button type="submit" className="w-full" loading={loading}>Reset password</Button>
        </form>
      ) : null}
      {step === "done" ? <Button className="w-full" onClick={onBack}>Back to sign in</Button> : null}
    </div>
  );
}
