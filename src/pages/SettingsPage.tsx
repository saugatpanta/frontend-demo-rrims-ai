import { Bell, Camera, CheckCircle2, Database, KeyRound, LockKeyhole, MapPin, Mic, MonitorCog, RefreshCw, ShieldCheck, SlidersHorizontal, Smartphone, Volume2, X } from "lucide-react";
import QRCode from "qrcode";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { authApi, settingsApi } from "../api/services";
import { PageHeader } from "../components/PageHeader";
import { Badge, Button, Field, FloatingToast, inputClass, JsonViewer, Panel } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { isSoundEnabled, playTone, setSoundEnabled } from "../utils/sound";

const topics = [
  "AUTH_SECURITY",
  "REPORT_STATUS",
  "WORK_ORDER",
  "ASSIGNMENT",
  "SYSTEM",
  "COMPLIANCE",
];

export function SettingsPage() {
  const mfa = useAsync(() => authApi.mfaStatus(), []);
  const sessions = useAsync(() => authApi.sessions(), []);
  const preferences = useAsync(() => settingsApi.notificationPreferences(), []);
  const system = useAsync(() => settingsApi.systemSettings(), []);
  const flags = useAsync(() => settingsApi.featureFlags(), []);
  const [message, setMessage] = useState("");
  const [activePanel, setActivePanel] = useState<SettingsPanelKey | null>(null);
  const [soundEnabled, setSoundEnabledState] = useState(() => isSoundEnabled());
  const mfaStatus = (mfa.data?.status ?? {}) as Record<string, unknown>;
  const mfaEnabled = Boolean(mfaStatus.enabled ?? mfaStatus.enabledAt);
  const sessionItems = (sessions.data && typeof sessions.data === "object" && "items" in sessions.data)
    ? (sessions.data as { items?: unknown[] }).items
    : null;
  const sessionCount = Array.isArray(sessions.data) ? sessions.data.length : Array.isArray(sessionItems) ? sessionItems.length : 0;

  function toggleSound(value: boolean) {
    setSoundEnabled(value);
    setSoundEnabledState(value);
    if (value) playTone("success");
    setMessage(value ? "App sounds enabled for this browser." : "App sounds muted for this browser.");
  }

  return (
    <>
      <PageHeader title="Settings & Security" eyebrow="Premium control center for identity, permissions, sound, and platform policies" />
      <FloatingToast message={message} tone={message.toLowerCase().includes("could not") ? "error" : "success"} />
      <section className="mb-6 overflow-hidden rounded-lg border border-white/70 bg-slate-950 text-white shadow-2xl">
        <div className="surface-grid bg-[linear-gradient(135deg,#08111f,#0f766e_55%,#123a6f)] p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-civic-100">Operator preferences</p>
              <h2 className="mt-2 text-3xl font-black leading-tight">Advanced settings center</h2>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-100">
                Open each section in a secure popup. The page stays clean while MFA, permissions,
                notifications, sessions, sound, and platform policy controls remain one click away.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatusChip label="MFA" value={mfaEnabled ? "On" : "Off"} />
              <StatusChip label="Sessions" value={String(sessionCount)} />
              <StatusChip label="Sound" value={soundEnabled ? "On" : "Off"} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <SettingsCard
          title="Multi-factor authentication"
          eyebrow="Identity"
          body="Enroll, scan QR, verify code, disable MFA, and regenerate recovery codes."
          icon={<LockKeyhole className="h-5 w-5" />}
          tone="teal"
          status={mfaEnabled ? "Enabled" : "Disabled"}
          checked={mfaEnabled}
          onToggle={() => setActivePanel("mfa")}
          onOpen={() => setActivePanel("mfa")}
        />
        <SettingsCard
          title="Change password"
          eyebrow="Credentials"
          body="Update only your password in a separate protected section."
          icon={<KeyRound className="h-5 w-5" />}
          tone="blue"
          status="Protected"
          checked
          onToggle={() => setActivePanel("password")}
          onOpen={() => setActivePanel("password")}
        />
        <SettingsCard
          title="Active sessions"
          eyebrow="Devices"
          body="Review signed-in browsers and revoke sessions from unknown devices."
          icon={<Smartphone className="h-5 w-5" />}
          tone="amber"
          status={`${sessionCount} active`}
          checked={sessionCount > 0}
          onToggle={() => setActivePanel("sessions")}
          onOpen={() => setActivePanel("sessions")}
        />
        <SettingsCard
          title="Notification policy"
          eyebrow="Alerts"
          body="Control government alert topics and apply the standard notification policy."
          icon={<Bell className="h-5 w-5" />}
          tone="red"
          status="Policy"
          checked
          onToggle={() => setActivePanel("notifications")}
          onOpen={() => setActivePanel("notifications")}
        />
        <SettingsCard
          title="System permissions"
          eyebrow="Browser access"
          body="Camera, microphone, location, and notification permissions for field work."
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="green"
          status="Review"
          checked
          onToggle={() => setActivePanel("permissions")}
          onOpen={() => setActivePanel("permissions")}
        />
        <SettingsCard
          title="App sound"
          eyebrow="Audio"
          body="Enable alert chimes, success tones, errors, and call rings for this browser."
          icon={<Volume2 className="h-5 w-5" />}
          tone="blue"
          status={soundEnabled ? "Enabled" : "Muted"}
          checked={soundEnabled}
          onToggle={toggleSound}
          onOpen={() => setActivePanel("sound")}
        />
        <SettingsCard
          title="System settings"
          eyebrow="Platform"
          body="Inspect backend configuration returned by the settings API."
          icon={<MonitorCog className="h-5 w-5" />}
          tone="teal"
          status={system.loading ? "Loading" : "Ready"}
          checked={Boolean(system.data)}
          onToggle={() => setActivePanel("system")}
          onOpen={() => setActivePanel("system")}
        />
        <SettingsCard
          title="Feature flags"
          eyebrow="Release control"
          body="Review enabled feature flags and policy switches from the backend."
          icon={<ShieldCheck className="h-5 w-5" />}
          tone="amber"
          status={flags.loading ? "Loading" : "Ready"}
          checked={Boolean(flags.data)}
          onToggle={() => setActivePanel("flags")}
          onOpen={() => setActivePanel("flags")}
        />
        <SettingsCard
          title="API configuration"
          eyebrow="Connected apps"
          body="Settings APIs, security APIs, permissions, and notification APIs are connected."
          icon={<Database className="h-5 w-5" />}
          tone="green"
          status="Connected"
          checked
          onToggle={() => setActivePanel("system")}
          onOpen={() => setActivePanel("system")}
        />
      </div>

      <SettingsModal title={modalTitle(activePanel)} open={activePanel !== null} onClose={() => setActivePanel(null)}>
        {activePanel === "mfa" ? <MfaPanel data={mfa.data} onChanged={() => mfa.setData(null)} setMessage={setMessage} /> : null}
        {activePanel === "password" ? <PasswordPanel setMessage={setMessage} /> : null}
        {activePanel === "sessions" ? <SessionsPanel data={sessions.data} loading={sessions.loading} reload={() => sessions.setData(null)} setMessage={setMessage} /> : null}
        {activePanel === "notifications" ? <NotificationPanel data={preferences.data} setMessage={setMessage} /> : null}
        {activePanel === "permissions" ? <DevicePermissionsPanel setMessage={setMessage} /> : null}
        {activePanel === "sound" ? <DeviceSoundPanel enabled={soundEnabled} onToggle={toggleSound} /> : null}
        {activePanel === "system" ? <SystemPanel title="System settings" icon={<MonitorCog className="h-5 w-5" />} data={system.data} /> : null}
        {activePanel === "flags" ? <SystemPanel title="Feature flags" icon={<ShieldCheck className="h-5 w-5" />} data={flags.data} /> : null}
      </SettingsModal>
    </>
  );
}

type SettingsPanelKey = "mfa" | "password" | "sessions" | "notifications" | "permissions" | "sound" | "system" | "flags";

function modalTitle(key: SettingsPanelKey | null) {
  const titles: Record<SettingsPanelKey, string> = {
    mfa: "Multi-factor authentication",
    password: "Change password",
    sessions: "Active sessions",
    notifications: "Notification policy",
    permissions: "System permissions",
    sound: "App sound",
    system: "System settings",
    flags: "Feature flags",
  };
  return key ? titles[key] : "";
}

function StatusChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 p-3 text-center shadow-inner">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-civic-100">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function SettingsCard({
  title,
  eyebrow,
  body,
  icon,
  tone,
  status,
  checked,
  onToggle,
  onOpen,
}: {
  title: string;
  eyebrow: string;
  body: string;
  icon: ReactNode;
  tone: "teal" | "blue" | "amber" | "red" | "green";
  status: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  onOpen: () => void;
}) {
  const tones = {
    teal: "bg-civic-50 text-civic-700 ring-civic-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    green: "bg-green-50 text-green-700 ring-green-100",
  };

  return (
    <Panel className="group relative overflow-hidden p-0">
      <button type="button" className="block w-full whitespace-normal p-5 text-left" onClick={onOpen}>
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-civic-700 via-blue-700 to-amber-500 opacity-80" />
        <div className="flex items-start justify-between gap-4">
          <span className={`grid h-12 w-12 place-items-center rounded-md ring-1 ${tones[tone]}`}>{icon}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-ink-600">{status}</span>
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-civic-700">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-black leading-tight text-ink-900">{title}</h2>
        <p className="mt-3 min-h-12 text-sm font-semibold leading-6 text-ink-500">{body}</p>
      </button>
      <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/80 px-5 py-3">
        <button type="button" className="inline-flex items-center gap-2 text-sm font-black text-civic-700" onClick={onOpen}>
          <SlidersHorizontal className="h-4 w-4" />
          Configure
        </button>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={checked}
            onChange={(event) => onToggle(event.target.checked)}
          />
          <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-civic-700" />
          <span className="absolute left-1 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
        </label>
      </div>
    </Panel>
  );
}

function SettingsModal({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="mx-auto my-8 max-w-5xl overflow-hidden rounded-lg border border-white/70 bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-[linear-gradient(135deg,#ffffff,#eef7f6)] px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-civic-700">Settings popup</p>
            <h2 className="text-xl font-black text-ink-900">{title}</h2>
          </div>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-md bg-slate-100 text-ink-700 hover:bg-slate-200" onClick={onClose} aria-label="Close settings popup">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[78vh] overflow-y-auto bg-slate-50 p-5">{children}</div>
      </div>
    </div>
  );
}

function MfaPanel({
  data,
  onChanged,
  setMessage,
}: {
  data: Record<string, unknown> | null;
  onChanged: () => void;
  setMessage: (message: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [enrollment, setEnrollment] = useState<Record<string, unknown> | null>(null);
  const [disableCode, setDisableCode] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrError, setQrError] = useState("");
  const [step, setStep] = useState<"password" | "scan" | "protected" | "manage">("password");

  const status = (data?.status ?? {}) as Record<string, unknown>;
  const enabled = Boolean(status.enabled ?? status.enabledAt);
  const enrollmentId = String(enrollment?.enrollmentId ?? data?.enrollmentId ?? "");
  const setup = useMemo(
    () => ((enrollment?.setup as Record<string, unknown> | undefined) ?? {}),
    [enrollment],
  );
  const secret = String(setup.secret ?? "");
  const otpAuthUrl = String(setup.otpauthUrl ?? "");

  useEffect(() => {
    let cancelled = false;
    setQrDataUrl("");
    setQrError("");

    if (!otpAuthUrl) return;

    QRCode.toDataURL(otpAuthUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      scale: 6,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrError("Could not generate the QR code. Use the setup key instead.");
      });

    return () => {
      cancelled = true;
    };
  }, [otpAuthUrl]);

  async function enable() {
    try {
      const result = await authApi.enableMfa(password);
      setEnrollment(result);
      setStep("scan");
      playTone("success");
      setMessage("MFA enrollment initialized. Add the secret to your authenticator and verify the 6-digit code.");
    } catch (error) {
      playTone("error");
      setMessage(error instanceof Error ? error.message : "Could not start MFA enrollment.");
    }
  }

  async function verify() {
    try {
      const result = await authApi.verifyMfa(enrollmentId, code);
      setEnrollment(result);
      setStep("protected");
      playTone("success");
      setMessage("MFA enabled successfully. Save your recovery codes if returned.");
      onChanged();
    } catch (error) {
      playTone("error");
      setMessage(error instanceof Error ? error.message : "Could not verify MFA.");
    }
  }

  async function disable() {
    try {
      await authApi.disableMfa({ password, mfaCode: disableCode });
      setStep("password");
      playTone("success");
      setMessage("MFA disabled. Sign in again if the backend invalidated sessions.");
      onChanged();
    } catch (error) {
      playTone("error");
      setMessage(error instanceof Error ? error.message : "Could not disable MFA.");
    }
  }

  async function regenerate() {
    try {
      const result = await authApi.regenerateRecoveryCodes({ password, mfaCode: disableCode });
      playTone("success");
      setEnrollment(result);
      setMessage("Recovery codes regenerated.");
    } catch (error) {
      playTone("error");
      setMessage(error instanceof Error ? error.message : "Could not regenerate recovery codes.");
    }
  }

  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#ffffff,#eef7f6)] p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-civic-700 text-white shadow-lg">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-civic-700">Step-up security</p>
              <h2 className="text-xl font-black text-ink-900">Multi-factor authentication</h2>
            </div>
          </div>
          <Badge value={enabled ? "ENABLED" : enrollmentId ? "PENDING" : "DISABLED"} />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MfaStep active={step === "password"} done={Boolean(enrollmentId || enabled)} label="1. Verify password" />
          <MfaStep active={step === "scan"} done={enabled} label="2. Scan QR code" />
          <MfaStep active={step === "protected" || step === "manage"} done={enabled} label="3. Protected login" />
        </div>
      </div>
      <div className="p-5">
        {step === "password" ? (
          <div className="space-y-4">
            <p className="text-sm font-semibold leading-6 text-ink-500">Start with your current password. The QR setup appears only after the backend creates the MFA enrollment.</p>
            <Field label="Current password"><input className={inputClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></Field>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={enable}>Start MFA</Button>
              {enabled ? <Button type="button" variant="secondary" onClick={() => setStep("manage")}>Manage existing MFA</Button> : null}
            </div>
          </div>
        ) : null}
      {step === "scan" && enrollment ? (
        <div className="mt-4 rounded-lg border border-civic-100 bg-civic-50/70 p-4">
          <div className="grid gap-4 md:grid-cols-[180px_1fr]">
            <div className="rounded-md border border-slate-200 bg-white p-3">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Authenticator app QR code" className="h-36 w-36" />
              ) : (
                <div className="grid h-36 w-36 place-items-center rounded-md bg-slate-100 p-3 text-center text-xs font-semibold text-ink-500">
                  {qrError || "Generating QR..."}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-ink-900">Authenticator setup key</p>
              <code className="mt-2 block break-all rounded-md bg-white p-3 text-xs text-ink-700">
                {secret || "Secret returned after enrollment"}
              </code>
              <p className="mt-3 break-all text-xs text-ink-500">otpauth: {otpAuthUrl || "Not returned"}</p>
            </div>
          </div>
          {Array.isArray(enrollment.recoveryCodes) ? (
            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-civic-700">Recovery codes</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {enrollment.recoveryCodes.map((code) => (
                  <code key={String(code)} className="rounded-md bg-slate-50 px-3 py-2 text-xs font-black text-ink-700">
                    {String(code)}
                  </code>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <Field label="Authenticator code"><input className={inputClass} placeholder="6-digit code" value={code} onChange={(event) => setCode(event.target.value)} maxLength={6} /></Field>
            <Button type="button" variant="secondary" onClick={verify}>Verify MFA</Button>
          </div>
        </div>
      ) : null}
      {step === "protected" ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="font-black text-green-900">MFA is protecting this account.</p>
          <p className="mt-1 text-sm font-semibold text-green-800">Use the manage step only when you need recovery codes or disable access.</p>
          <Button className="mt-4" type="button" variant="secondary" onClick={() => setStep("manage")}>Manage MFA</Button>
        </div>
      ) : null}
      {step === "manage" ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Current password"><input className={inputClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></Field>
            <Field label="Authenticator / recovery code"><input className={inputClass} value={disableCode} onChange={(event) => setDisableCode(event.target.value)} /></Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={regenerate}><RefreshCw className="h-4 w-4" />Recovery codes</Button>
            <Button type="button" variant="danger" onClick={disable}>Disable MFA</Button>
          </div>
        </div>
      ) : null}
      </div>
    </Panel>
  );
}

function MfaStep({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className={`rounded-md border px-3 py-2 text-sm font-black ${done ? "border-green-200 bg-green-50 text-green-800" : active ? "border-civic-200 bg-white text-civic-800" : "border-slate-200 bg-white/70 text-ink-500"}`}>
      {label}
    </div>
  );
}

function PasswordPanel({ setMessage }: { setMessage: (message: string) => void }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await authApi.changePassword(form);
      playTone("success");
      setMessage("Password changed. You may need to sign in again.");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      playTone("error");
      setMessage(error instanceof Error ? error.message : "Could not change password.");
    }
  }
  return (
    <Panel>
      <div className="mb-5 flex items-center gap-3 rounded-lg border border-civic-100 bg-civic-50/70 p-4">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-white text-civic-700 ring-1 ring-civic-100">
          <KeyRound className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-civic-700">Separate section</p>
          <h2 className="text-xl font-black text-ink-900">Change password</h2>
        </div>
      </div>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
        <Field label="Current password"><input className={inputClass} type="password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} /></Field>
        <Field label="New password"><input className={inputClass} type="password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} /></Field>
        <Field label="Confirm password"><input className={inputClass} type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} /></Field>
        <div className="md:col-span-3"><Button>Change password</Button></div>
      </form>
    </Panel>
  );
}

function SessionsPanel({
  data,
  loading,
  reload,
  setMessage,
}: {
  data: unknown;
  loading: boolean;
  reload: () => void;
  setMessage: (message: string) => void;
}) {
  const items = Array.isArray(data) ? data : Array.isArray((data as { items?: unknown[] } | null)?.items) ? (data as { items: unknown[] }).items : [];
  async function revoke(id: string) {
    try {
      await authApi.revokeSession(id);
      playTone("success");
      setMessage("Session revoked.");
      reload();
    } catch (error) {
      playTone("error");
      setMessage(error instanceof Error ? error.message : "Could not revoke session.");
    }
  }
  return (
    <Panel>
      <h2 className="mb-4 text-xl font-black text-ink-900">Active sessions</h2>
      <div className="space-y-3">
        {loading ? <p className="text-sm text-ink-500">Loading sessions...</p> : null}
        {items.map((item, index) => {
          const record = item as Record<string, unknown>;
          const id = String(record.id ?? record.sessionId ?? "");
          return (
            <div key={index} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-ink-900">{String(record.deviceLabel ?? record.userAgent ?? "Session")}</p>
                <p className="text-xs text-ink-500">{String(record.ipAddress ?? record.lastUsedIp ?? "Unknown IP")}</p>
              </div>
              {id ? <Button variant="secondary" onClick={() => revoke(id)}>Revoke</Button> : null}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function NotificationPanel({
  data,
  setMessage,
}: {
  data: Record<string, unknown> | null;
  setMessage: (message: string) => void;
}) {
  async function save() {
    try {
      await settingsApi.updateNotificationPreferences(
        topics.map((topic) => ({
          topic,
          inAppEnabled: true,
          emailEnabled: true,
          whatsappEnabled: false,
          smsEnabled: false,
          criticalOnly: topic === "AUTH_SECURITY",
        })),
      );
      playTone("success");
      setMessage("Notification preferences updated.");
    } catch (error) {
      playTone("error");
      setMessage(error instanceof Error ? error.message : "Could not update notification preferences.");
    }
  }
  return (
    <Panel>
      <div className="mb-5 flex items-center gap-3">
        <Bell className="h-5 w-5 text-civic-700" />
        <h2 className="text-xl font-black text-ink-900">Notification preferences</h2>
      </div>
      <div className="space-y-2">
        {topics.map((topic) => <Badge key={topic} value={topic} />)}
      </div>
      <div className="mt-4"><JsonViewer title="Current notification preferences" data={data ?? {}} /></div>
      <Button className="mt-4" onClick={save}>Apply standard government policy</Button>
    </Panel>
  );
}

type PermissionStatusValue = "granted" | "prompt" | "denied" | "default" | "unsupported";

const devicePermissions = [
  {
    key: "camera",
    label: "Camera",
    body: "Required for field evidence photos and video calls.",
    icon: Camera,
    request: () => navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => stream.getTracks().forEach((track) => track.stop())),
  },
  {
    key: "microphone",
    label: "Microphone",
    body: "Required for voice notes and call rooms.",
    icon: Mic,
    request: () => navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => stream.getTracks().forEach((track) => track.stop())),
  },
  {
    key: "geolocation",
    label: "Location",
    body: "Required for map pins, incident location, and field updates.",
    icon: MapPin,
    request: () =>
      new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(() => resolve(), reject, { enableHighAccuracy: true, timeout: 10000 });
      }),
  },
  {
    key: "notifications",
    label: "Notifications",
    body: "Required for live alerts and unread incident updates.",
    icon: Bell,
    request: async () => {
      if (typeof Notification === "undefined") throw new Error("Notifications are not supported in this browser.");
      const result = await Notification.requestPermission();
      if (result !== "granted") throw new Error("Notification permission was not granted.");
    },
  },
] as const;

function DevicePermissionsPanel({ setMessage }: { setMessage: (message: string) => void }) {
  const [statuses, setStatuses] = useState<Record<string, PermissionStatusValue>>({});

  async function refresh() {
    const next: Record<string, PermissionStatusValue> = {};
    await Promise.all(
      devicePermissions.map(async (permission) => {
        if (permission.key === "notifications") {
          next[permission.key] = typeof Notification === "undefined" ? "unsupported" : Notification.permission;
          return;
        }
        if (permission.key === "geolocation" && !("geolocation" in navigator)) {
          next[permission.key] = "unsupported";
          return;
        }
        if ((permission.key === "camera" || permission.key === "microphone") && !navigator.mediaDevices?.getUserMedia) {
          next[permission.key] = "unsupported";
          return;
        }
        if (!navigator.permissions?.query) {
          next[permission.key] = "prompt";
          return;
        }
        try {
          const status = await navigator.permissions.query({ name: permission.key as PermissionName });
          next[permission.key] = status.state;
        } catch {
          next[permission.key] = "prompt";
        }
      }),
    );
    setStatuses(next);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function requestPermission(permission: (typeof devicePermissions)[number]) {
    try {
      await permission.request();
      await refresh();
      setMessage(`${permission.label} permission is ready.`);
      playTone("success");
    } catch (error) {
      await refresh();
      setMessage(error instanceof Error ? error.message : `${permission.label} permission was not granted.`);
      playTone("error");
    }
  }

  return (
    <Panel>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-civic-700" />
          <h2 className="text-xl font-black text-ink-900">System permissions</h2>
        </div>
        <Button type="button" variant="secondary" onClick={() => void refresh()}><RefreshCw className="h-4 w-4" />Refresh</Button>
      </div>
      <div className="grid gap-3">
        {devicePermissions.map((permission) => {
          const Icon = permission.icon;
          const status = statuses[permission.key] ?? "prompt";
          return (
            <div key={permission.key} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-md bg-civic-50 text-civic-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-black text-ink-900">{permission.label}</span>
                    <span className="mt-1 block text-sm leading-6 text-ink-500">{permission.body}</span>
                  </span>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${status === "granted" ? "bg-green-50 text-green-800" : status === "denied" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800"}`}>
                  {status}
                </span>
              </div>
              <Button className="mt-3" type="button" variant="secondary" disabled={status === "unsupported"} onClick={() => void requestPermission(permission)}>
                Allow {permission.label}
              </Button>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function DeviceSoundPanel({ enabled, onToggle }: { enabled: boolean; onToggle: (value: boolean) => void }) {
  return (
    <Panel>
      <div className="mb-5 flex items-center gap-3">
        <Volume2 className="h-5 w-5 text-civic-700" />
        <h2 className="text-xl font-black text-ink-900">App sound</h2>
      </div>
      <label className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-4">
        <span>
          <span className="block text-sm font-black text-ink-900">Sound effects</span>
          <span className="mt-1 block text-sm text-ink-500">Rings, success tones, errors, and new notification chimes.</span>
        </span>
        <input
          className="mt-1 h-5 w-5 accent-civic-700"
          type="checkbox"
          checked={enabled}
          onChange={(event) => onToggle(event.target.checked)}
        />
      </label>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => playTone("notification")}><Bell className="h-4 w-4" />Test alert</Button>
        <Button type="button" variant="secondary" onClick={() => playTone("ring")}><Volume2 className="h-4 w-4" />Test ring</Button>
      </div>
    </Panel>
  );
}

function SystemPanel({ title, icon, data }: { title: string; icon: ReactNode; data: unknown }) {
  return (
    <Panel>
      <div className="mb-4 flex items-center gap-3">
        {icon}
        <h2 className="text-xl font-black text-ink-900">{title}</h2>
      </div>
      <JsonViewer title={title} data={data ?? {}} />
    </Panel>
  );
}
