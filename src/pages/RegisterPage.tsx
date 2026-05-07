import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { authApi, geographyApi } from "../api/services";
import type { SelectOption } from "../api/types";
import { Button, Field, inputClass, Panel } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { playTone } from "../utils/sound";

export function RegisterPage() {
  const provinces = useAsync(() => geographyApi.provinces(), []);
  const [provinceId, setProvinceId] = useState("");
  const districts = useAsync(() => provinceId ? geographyApi.districts(provinceId) : Promise.resolve([]), [provinceId]);
  const [districtId, setDistrictId] = useState("");
  const locals = useAsync(() => districtId ? geographyApi.localGovernments(districtId) : Promise.resolve([]), [districtId]);
  const [localGovernmentId, setLocalGovernmentId] = useState("");
  const wards = useAsync(() => localGovernmentId ? geographyApi.wards(localGovernmentId) : Promise.resolve([]), [localGovernmentId]);
  const [wardId, setWardId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    phone: "",
    email: "",
    gender: "MALE",
    dateOfBirth: "",
    citizenshipNumber: "",
    addressLine1: "",
    addressLine2: "",
    preferredLanguage: "NEPALI",
    occupation: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setDistrictId("");
    setLocalGovernmentId("");
    setWardId("");
  }, [provinceId]);

  useEffect(() => {
    setLocalGovernmentId("");
    setWardId("");
  }, [districtId]);

  useEffect(() => {
    setWardId("");
  }, [localGovernmentId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await authApi.register({
        ...form,
        provinceId,
        districtId,
        localGovernmentId,
        wardId,
        addressLine2: form.addressLine2 || undefined,
        emergencyContactName: form.emergencyContactName || undefined,
        emergencyContactPhone: form.emergencyContactPhone || undefined,
      });
      playTone("success");
      setMessage("Registration accepted. Please verify your email before signing in.");
    } catch (error) {
      playTone("error");
      setMessage(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/login" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-civic-700">
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
        <Panel className="p-6">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-civic-700">Citizen access</p>
            <h1 className="text-3xl font-black text-ink-900">Create RRIMS account</h1>
            <p className="mt-2 text-sm text-ink-500">Password must be 12+ characters with uppercase, lowercase, number, and symbol.</p>
          </div>
          {message ? <p className="mb-4 rounded-md bg-civic-50 p-3 text-sm font-medium text-civic-800"><CheckCircle2 className="mr-2 inline h-4 w-4" />{message}</p> : null}
          <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
            <Field label="Full name"><input className={inputClass} required minLength={3} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></Field>
            <Field label="Username"><input className={inputClass} required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></Field>
            <Field label="Phone"><input className={inputClass} required placeholder="98XXXXXXXX" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
            <Field label="Email"><input className={inputClass} required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
            <Field label="Gender"><select className={inputClass} value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}><option>MALE</option><option>FEMALE</option><option>OTHER</option></select></Field>
            <Field label="Date of birth"><input className={inputClass} required type="date" value={form.dateOfBirth} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} /></Field>
            <Field label="Citizenship number"><input className={inputClass} required value={form.citizenshipNumber} onChange={(event) => setForm({ ...form, citizenshipNumber: event.target.value })} /></Field>
            <Field label="Occupation"><input className={inputClass} required value={form.occupation} onChange={(event) => setForm({ ...form, occupation: event.target.value })} /></Field>
            <Field label="Address line 1"><input className={inputClass} required value={form.addressLine1} onChange={(event) => setForm({ ...form, addressLine1: event.target.value })} /></Field>
            <Field label="Address line 2"><input className={inputClass} value={form.addressLine2} onChange={(event) => setForm({ ...form, addressLine2: event.target.value })} /></Field>
            <Field label="Province"><Select className={inputClass} value={provinceId} onChange={setProvinceId} options={provinces.data ?? []} /></Field>
            <Field label="District"><Select className={inputClass} value={districtId} onChange={setDistrictId} options={districts.data ?? []} /></Field>
            <Field label="Local government"><Select className={inputClass} value={localGovernmentId} onChange={setLocalGovernmentId} options={locals.data ?? []} /></Field>
            <Field label="Ward"><Select className={inputClass} value={wardId} onChange={setWardId} options={wards.data ?? []} labelKey="number" /></Field>
            <Field label="Preferred language"><select className={inputClass} value={form.preferredLanguage} onChange={(event) => setForm({ ...form, preferredLanguage: event.target.value })}><option>NEPALI</option><option>ENGLISH</option></select></Field>
            <Field label="Emergency contact name"><input className={inputClass} value={form.emergencyContactName} onChange={(event) => setForm({ ...form, emergencyContactName: event.target.value })} /></Field>
            <Field label="Emergency contact phone"><input className={inputClass} value={form.emergencyContactPhone} onChange={(event) => setForm({ ...form, emergencyContactPhone: event.target.value })} /></Field>
            <div />
            <Field label="Password"><input className={inputClass} required type="password" minLength={12} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></Field>
            <Field label="Confirm password"><input className={inputClass} required type="password" minLength={12} value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} /></Field>
            <div className="lg:col-span-2">
              <Button type="submit" loading={loading}>Create account</Button>
            </div>
          </form>
        </Panel>
      </div>
    </main>
  );
}

function Select({
  value,
  onChange,
  options,
  className,
  labelKey = "name",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className: string;
  labelKey?: "name" | "number";
}) {
  return (
    <select className={className} required value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Select</option>
      {options.map((option) => (
        <option key={option.id ?? option.code ?? option.name} value={option.id}>
          {labelKey === "number" ? `Ward ${option.number ?? option.name}` : option.name}
        </option>
      ))}
    </select>
  );
}
