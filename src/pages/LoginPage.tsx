import { AlertCircle, ArrowLeft, Lock, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button, Field, inputClass, Panel } from "../components/ui";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(identifier, password);
      navigate("/app");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-slate-100 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="flex min-h-[42vh] flex-col justify-between bg-[url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center p-6 text-white lg:min-h-screen lg:p-10">
        <Link to="/" className="inline-flex w-max items-center gap-2 rounded-md bg-white/15 px-3 py-2 text-sm font-semibold backdrop-blur">
          <ArrowLeft className="h-4 w-4" />
          Public portal
        </Link>
        <div className="max-w-xl pb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-civic-100">Road and resource response</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">RRIMS Command Center</h1>
          <p className="mt-4 text-base leading-7 text-white/90">
            Coordinate reports, field engineers, work orders, citizen follow-up, and local government oversight from one operational workspace.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center p-4 sm:p-8">
        <Panel className="w-full max-w-md p-6">
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
        </Panel>
      </section>
    </main>
  );
}
