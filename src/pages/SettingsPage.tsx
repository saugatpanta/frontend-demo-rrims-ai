import { Bell, Camera, CheckCircle2, KeyRound, LockKeyhole, MapPin, Mic, MonitorCog, RefreshCw, ShieldCheck, Volume2 } from "lucide-react";
import QRCode from "qrcode";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { authApi, settingsApi } from "../api/services";
import { PageHeader } from "../components/PageHeader";
import { Badge, Button, Field, inputClass, Panel } from "../components/ui";
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

  return (
    <>
      <PageHeader title="Settings & Security" eyebrow="MFA, sessions, notifications, and platform configuration" />
      {message ? <Panel className="mb-5 bg-civic-50 text-sm font-semibold text-civic-800">{message}</Panel> : null}
      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="space-y-6">
          <MfaPanel data={mfa.data} onChanged={() => mfa.setData(null)} setMessage={setMessage} />
          <PasswordPanel setMessage={setMessage} />
          <SessionsPanel data={sessions.data} loading={sessions.loading} reload={() => sessions.setData(null)} setMessage={setMessage} />
        </div>
        <div className="space-y-6">
          <NotificationPanel data={preferences.data} setMessage={setMessage} />
          <DevicePermissionsPanel setMessage={setMessage} />
          <DeviceSoundPanel setMessage={setMessage} />
          <SystemPanel title="System settings" icon={<MonitorCog className="h-5 w-5" />} data={system.data} />
          <SystemPanel title="Feature flags" icon={<ShieldCheck className="h-5 w-5" />} data={flags.data} />
        </div>
      </div>
    </>
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
          <MfaStep active={!enabled && !enrollmentId} done={Boolean(enrollmentId || enabled)} label="1. Verify password" />
          <MfaStep active={Boolean(enrollmentId && !enabled)} done={enabled} label="2. Scan QR code" />
          <MfaStep active={enabled} done={enabled} label="3. Protected login" />
        </div>
      </div>
      <div className="p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Current password"><input className={inputClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></Field>
          <Field label="Authenticator code"><input className={inputClass} placeholder="6-digit code" value={code} onChange={(event) => setCode(event.target.value)} maxLength={6} /></Field>
        </div>
      {enrollment ? (
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
          {Array.isArray(enrollment.recoveryCodes) ? <pre className="mt-3 rounded-md bg-slate-950 p-3 text-xs text-white">{enrollment.recoveryCodes.join("\n")}</pre> : null}
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={enable}>Start MFA</Button>
        <Button type="button" variant="secondary" onClick={verify}>Verify MFA</Button>
        <Field label="Disable/regenerate code"><input className={inputClass} value={disableCode} onChange={(event) => setDisableCode(event.target.value)} /></Field>
        <Button type="button" variant="secondary" onClick={regenerate}><RefreshCw className="h-4 w-4" />Recovery codes</Button>
        <Button type="button" variant="danger" onClick={disable}>Disable MFA</Button>
      </div>
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
      <div className="mb-5 flex items-center gap-3">
        <KeyRound className="h-5 w-5 text-civic-700" />
        <h2 className="text-xl font-black text-ink-900">Password security</h2>
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
      <pre className="mt-4 max-h-48 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-white">{JSON.stringify(data ?? {}, null, 2)}</pre>
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

function DeviceSoundPanel({ setMessage }: { setMessage: (message: string) => void }) {
  const [enabled, setEnabled] = useState(() => isSoundEnabled());

  function toggle(value: boolean) {
    setSoundEnabled(value);
    setEnabled(value);
    if (value) playTone("success");
    setMessage(value ? "App sounds enabled for this browser." : "App sounds muted for this browser.");
  }

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
          onChange={(event) => toggle(event.target.checked)}
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
      <pre className="max-h-72 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-white">{JSON.stringify(data ?? {}, null, 2)}</pre>
    </Panel>
  );
}
