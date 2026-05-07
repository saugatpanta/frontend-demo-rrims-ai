import { Bell, KeyRound, LockKeyhole, MonitorCog, RefreshCw, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { authApi, settingsApi } from "../api/services";
import { PageHeader } from "../components/PageHeader";
import { Badge, Button, Field, inputClass, Panel } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { playTone } from "../utils/sound";

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
    <Panel>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <LockKeyhole className="h-5 w-5 text-civic-700" />
          <h2 className="text-xl font-black text-ink-900">Multi-factor authentication</h2>
        </div>
        <Badge value={enabled ? "ENABLED" : enrollmentId ? "PENDING" : "DISABLED"} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Current password"><input className={inputClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></Field>
        <Field label="6-digit code"><input className={inputClass} value={code} onChange={(event) => setCode(event.target.value)} maxLength={6} /></Field>
      </div>
      {enrollment ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
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
    </Panel>
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
