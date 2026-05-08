import {
  Activity,
  Camera,
  CheckCircle2,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useState } from "react";

import { geographyApi, profileApi } from "../api/services";
import type { SelectOption, User } from "../api/types";
import { PageHeader } from "../components/PageHeader";
import { Avatar, Badge, Button, Field, inputClass, Panel } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useAsync } from "../hooks/useAsync";
import { dateLabel } from "../utils/format";
import { playTone } from "../utils/sound";

type ProfileForm = {
  fullName: string;
  username: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  citizenshipNumber: string;
  addressLine1: string;
  addressLine2: string;
  preferredLanguage: string;
  occupation: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  provinceId: string;
  districtId: string;
  localGovernmentId: string;
  wardId: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const blankForm: ProfileForm = {
  fullName: "",
  username: "",
  email: "",
  gender: "",
  dateOfBirth: "",
  citizenshipNumber: "",
  addressLine1: "",
  addressLine2: "",
  preferredLanguage: "ne-NP",
  occupation: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  provinceId: "",
  districtId: "",
  localGovernmentId: "",
  wardId: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const profile = useAsync(() => profileApi.get(), []);
  const activity = useAsync(() => profileApi.activity(), []);
  const provinces = useAsync(() => geographyApi.provinces(), []);
  const [form, setForm] = useState<ProfileForm>(blankForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<Record<string, string> | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const districtQuery = useAsync(
    () => (form.provinceId ? geographyApi.districts(form.provinceId) : Promise.resolve([])),
    [form.provinceId],
  );
  const localQuery = useAsync(
    () => (form.districtId ? geographyApi.localGovernments(form.districtId) : Promise.resolve([])),
    [form.districtId],
  );
  const wardQuery = useAsync(
    () => (form.localGovernmentId ? geographyApi.wards(form.localGovernmentId) : Promise.resolve([])),
    [form.localGovernmentId],
  );

  useEffect(() => {
    const data = profile.data ?? user;
    if (!data) return;
    const profileData = ((data as User & { profile?: Record<string, unknown> }).profile ?? {}) as Record<string, unknown>;
    setForm((current) => ({
      ...current,
      fullName: data.fullName ?? "",
      username: data.username ?? "",
      email: data.email ?? "",
      gender: String(profileData.gender ?? ""),
      dateOfBirth: String(profileData.dateOfBirth ?? "").slice(0, 10),
      citizenshipNumber: String(profileData.citizenshipNumber ?? ""),
      addressLine1: String(profileData.addressLine1 ?? ""),
      addressLine2: String(profileData.addressLine2 ?? ""),
      preferredLanguage: String(profileData.preferredLanguage ?? "ne-NP"),
      occupation: String(profileData.occupation ?? ""),
      emergencyContactName: String(profileData.emergencyContactName ?? ""),
      emergencyContactPhone: String(profileData.emergencyContactPhone ?? ""),
    }));
  }, [profile.data, user]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const body: Record<string, unknown> = {};
      Object.entries(form).forEach(([key, value]) => {
        if (!value) return;
        body[key] = value;
      });
      if (!form.currentPassword) {
        delete body.username;
        delete body.email;
      }
      if (!form.newPassword) {
        delete body.newPassword;
        delete body.confirmPassword;
      }
      if (avatar) Object.assign(body, avatar);
      if (removeAvatar) body.removeAvatar = true;
      await profileApi.update(body);
      await refreshUser();
      profile.setData(await profileApi.get());
      playTone("success");
      setMessage("Profile updated successfully.");
      setForm((value) => ({ ...value, currentPassword: "", newPassword: "", confirmPassword: "" }));
      setAvatar(null);
      setRemoveAvatar(false);
    } catch (error) {
      playTone("error");
      setMessage(error instanceof Error ? error.message : "Could not update profile.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatar(file?: File) {
    if (!file) return;
    const base64 = await toBase64(file);
    setAvatar({
      avatarFileName: file.name,
      avatarMimeType: file.type,
      avatarContentBase64: base64,
    });
    setRemoveAvatar(false);
  }

  const shown = profile.data ?? user;

  return (
    <>
      <PageHeader title="Profile Center" eyebrow="Identity, security, and account governance" />
      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-6">
          <Panel className="overflow-hidden p-0">
            <div className="bg-slate-950 p-5 text-white">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <Avatar userId={shown?.id} name={shown?.fullName ?? shown?.username} size="xl" className="ring-4 ring-white/20" />
                  <button
                    type="button"
                    className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-md bg-civic-500 text-white shadow-lg"
                    onClick={() => setEditorOpen(true)}
                    aria-label="Edit profile photo"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-civic-100">Profile identity</p>
                <h2 className="mt-1 text-2xl font-black text-white">{shown?.fullName ?? "Operator"}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge value={shown?.role} />
                  {shown?.isEmailVerified ? <Badge value="EMAIL_VERIFIED" /> : <Badge value="EMAIL_PENDING" />}
                  {shown?.isPhoneVerified ? <Badge value="PHONE_VERIFIED" /> : null}
                </div>
                <div className="mt-5 h-2 rounded-full bg-white/15">
                  <div className="h-2 rounded-full bg-civic-300" style={{ width: `${shown?.profileCompleteness?.percentage ?? 0}%` }} />
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-200">Profile completeness: {shown?.profileCompleteness?.percentage ?? 0}%</p>
              </div>
              </div>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <Info icon={<Phone className="h-4 w-4" />} label="Phone" value={shown?.phone ?? "Not set"} />
              <Info icon={<Mail className="h-4 w-4" />} label="Email" value={shown?.email ?? "Not set"} />
              <Info icon={<ShieldCheck className="h-4 w-4" />} label="Permissions" value={`${shown?.permissions?.length ?? 0} granted`} />
              <Info icon={<MapPin className="h-4 w-4" />} label="Geography" value={String(shown?.geography?.district ?? shown?.geography?.province ?? "Not set")} />
            </div>
          </Panel>

          <Panel>
            <div className="mb-4 flex items-center gap-3">
              <Activity className="h-5 w-5 text-civic-700" />
              <h2 className="text-xl font-black text-ink-900">Recent activity</h2>
            </div>
            <div className="space-y-3">
              {(Array.isArray(activity.data) ? activity.data : []).slice(0, 6).map((item, index) => (
                <div key={index} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-ink-700">
                  {renderActivity(item)}
                </div>
              ))}
              {!activity.loading && (!Array.isArray(activity.data) || activity.data.length === 0) ? (
                <p className="text-sm text-ink-500">No recent activity returned by the backend.</p>
              ) : null}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-lg border border-white/70 bg-slate-950 text-white shadow-2xl">
            <div className="surface-grid bg-[linear-gradient(135deg,#08111f,#123a6f_58%,#0f766e)] p-6">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-civic-100">Premium profile controls</p>
              <h2 className="mt-2 text-3xl font-black leading-tight">Open profile sections in a popup</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-100">
                Profile photo, identity, citizen details, geography, and password controls stay clean on the page and open in the editor popup.
              </p>
            </div>
          </section>
          <div className="grid gap-4 lg:grid-cols-2">
            <ProfileActionCard title="Identity" body="Name, username, email, and language." icon={<UserRound className="h-5 w-5" />} onOpen={() => setEditorOpen(true)} />
            <ProfileActionCard title="Citizen profile" body="Gender, DOB, citizenship, occupation, emergency contact." icon={<ShieldCheck className="h-5 w-5" />} onOpen={() => setEditorOpen(true)} />
            <ProfileActionCard title="Geography" body="Province, district, local government, and ward." icon={<MapPin className="h-5 w-5" />} onOpen={() => setEditorOpen(true)} />
            <ProfileActionCard title="Profile photo" body="Upload or remove your backend avatar image." icon={<Camera className="h-5 w-5" />} onOpen={() => setEditorOpen(true)} />
            <ProfileActionCard title="Password security" body="Change password using current-password verification." icon={<KeyRound className="h-5 w-5" />} onOpen={() => setEditorOpen(true)} />
            <ProfileActionCard title="Activity" body="Review backend account activity and audit signals." icon={<Activity className="h-5 w-5" />} onOpen={() => setEditorOpen(true)} />
          </div>
        </div>
      </div>

      <ProfileModal open={editorOpen} onClose={() => setEditorOpen(false)}>
        <Panel>
          <form onSubmit={submit} className="space-y-7">
            <Section title="Identity" icon={<UserRound className="h-5 w-5" />}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Full name"><input className={inputClass} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></Field>
                <Field label="Username"><input className={inputClass} value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></Field>
                <Field label="Email"><input className={inputClass} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
                <Field label="Preferred language"><select className={inputClass} value={form.preferredLanguage} onChange={(event) => setForm({ ...form, preferredLanguage: event.target.value })}><option value="ne-NP">Nepali</option><option value="en-NP">English</option></select></Field>
              </div>
            </Section>

            <Section title="Citizen profile" icon={<ShieldCheck className="h-5 w-5" />}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Gender"><select className={inputClass} value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}><option value="">Select</option><option>MALE</option><option>FEMALE</option><option>OTHER</option></select></Field>
                <Field label="Date of birth"><input className={inputClass} type="date" value={form.dateOfBirth} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} /></Field>
                <Field label="Citizenship number"><input className={inputClass} pattern="[A-Za-z0-9-]{5,40}" title="Use only letters, numbers, and hyphen. No slash or spaces." value={form.citizenshipNumber} onChange={(event) => setForm({ ...form, citizenshipNumber: event.target.value.replace(/[^A-Za-z0-9-]/g, "") })} /></Field>
                <Field label="Occupation"><input className={inputClass} value={form.occupation} onChange={(event) => setForm({ ...form, occupation: event.target.value })} /></Field>
                <Field label="Address line 1"><input className={inputClass} value={form.addressLine1} onChange={(event) => setForm({ ...form, addressLine1: event.target.value })} /></Field>
                <Field label="Address line 2"><input className={inputClass} value={form.addressLine2} onChange={(event) => setForm({ ...form, addressLine2: event.target.value })} /></Field>
                <Field label="Emergency contact name"><input className={inputClass} value={form.emergencyContactName} onChange={(event) => setForm({ ...form, emergencyContactName: event.target.value })} /></Field>
                <Field label="Emergency contact phone"><input className={inputClass} value={form.emergencyContactPhone} onChange={(event) => setForm({ ...form, emergencyContactPhone: event.target.value })} /></Field>
              </div>
            </Section>

            <Section title="Geography" icon={<MapPin className="h-5 w-5" />}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Province"><Select value={form.provinceId} onChange={(provinceId) => setForm({ ...form, provinceId, districtId: "", localGovernmentId: "", wardId: "" })} options={provinces.data ?? []} /></Field>
                <Field label="District"><Select value={form.districtId} onChange={(districtId) => setForm({ ...form, districtId, localGovernmentId: "", wardId: "" })} options={districtQuery.data ?? []} /></Field>
                <Field label="Local government"><Select value={form.localGovernmentId} onChange={(localGovernmentId) => setForm({ ...form, localGovernmentId, wardId: "" })} options={localQuery.data ?? []} /></Field>
                <Field label="Ward"><Select value={form.wardId} onChange={(wardId) => setForm({ ...form, wardId })} options={wardQuery.data ?? []} labelKey="number" /></Field>
              </div>
            </Section>

            <Section title="Avatar and security" icon={<KeyRound className="h-5 w-5" />}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Profile photo">
                  <label className={`${inputClass} flex cursor-pointer items-center gap-2`}>
                    <Camera className="h-4 w-4 text-civic-700" />
                    {avatar ? avatar.avatarFileName : "Choose image"}
                    <input className="hidden" type="file" accept="image/jpeg,image/png,image/webp,image/heic" onChange={(event) => handleAvatar(event.target.files?.[0])} />
                  </label>
                </Field>
                <Field label="Remove avatar"><select className={inputClass} value={removeAvatar ? "yes" : "no"} onChange={(event) => setRemoveAvatar(event.target.value === "yes")}><option value="no">No</option><option value="yes">Yes</option></select></Field>
                <Field label="Current password"><input className={inputClass} type="password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} /></Field>
                <Field label="New password"><input className={inputClass} type="password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} /></Field>
                <Field label="Confirm new password"><input className={inputClass} type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} /></Field>
              </div>
            </Section>

            {message ? <p className="rounded-md bg-civic-50 p-3 text-sm font-semibold text-civic-800"><CheckCircle2 className="mr-2 inline h-4 w-4" />{message}</p> : null}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" loading={loading}>Save profile</Button>
              <Button type="button" variant="secondary" onClick={() => profile.setData(profile.data)}>Reset visible changes</Button>
            </div>
          </form>
        </Panel>
      </ProfileModal>
    </>
  );
}

function ProfileActionCard({ title, body, icon, onOpen }: { title: string; body: string; icon: ReactNode; onOpen: () => void }) {
  return (
    <Panel className="overflow-hidden p-0">
      <button type="button" className="block w-full whitespace-normal p-5 text-left" onClick={onOpen}>
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-md bg-civic-50 text-civic-700 ring-1 ring-civic-100">{icon}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-ink-600">Configure</span>
        </div>
        <h2 className="mt-5 text-xl font-black leading-tight text-ink-900">{title}</h2>
        <p className="mt-3 min-h-12 text-sm font-semibold leading-6 text-ink-500">{body}</p>
      </button>
      <button type="button" className="flex w-full items-center justify-between border-t border-slate-200/80 bg-slate-50/80 px-5 py-3 text-sm font-black text-civic-700" onClick={onOpen}>
        Open popup
        <SlidersHorizontal className="h-4 w-4" />
      </button>
    </Panel>
  );
}

function ProfileModal({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="mx-auto my-8 max-w-5xl overflow-hidden rounded-lg border border-white/70 bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-[linear-gradient(135deg,#ffffff,#eef7f6)] px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-civic-700">Profile popup</p>
            <h2 className="text-xl font-black text-ink-900">Edit profile</h2>
          </div>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-md bg-slate-100 text-ink-700 hover:bg-slate-200" onClick={onClose} aria-label="Close profile popup">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[78vh] overflow-y-auto bg-slate-50 p-5">{children}</div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3 border-b border-slate-200 pb-3">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-civic-50 text-civic-700">{icon}</div>
        <h2 className="text-lg font-black text-ink-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-civic-700">{icon}</div>
      <p className="text-xs font-bold uppercase tracking-[0.13em] text-ink-500">{label}</p>
      <p className="mt-1 font-semibold text-ink-900">{value}</p>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  labelKey = "name",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  labelKey?: "name" | "number";
}) {
  return (
    <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Keep current / select</option>
      {options.map((option) => (
        <option key={option.id ?? option.code ?? option.name} value={option.id}>
          {labelKey === "number" ? `Ward ${option.number ?? option.name}` : option.name}
        </option>
      ))}
    </select>
  );
}

function renderActivity(item: unknown) {
  if (!item || typeof item !== "object") return String(item);
  const record = item as Record<string, unknown>;
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-semibold">{String(record.action ?? record.type ?? record.event ?? "Activity")}</span>
      <span className="text-xs text-ink-500">{dateLabel(String(record.createdAt ?? record.timestamp ?? ""))}</span>
    </div>
  );
}

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
