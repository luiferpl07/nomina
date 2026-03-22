"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email o contraseña incorrectos");
      setCargando(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0ede8]">
      <div className="w-full max-w-sm">
        {/* Logo / marca */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#1a1916] text-white text-sm font-semibold mb-4">
            N
          </div>
          <h1 className="text-[18px] font-semibold tracking-[-0.3px] text-[#1a1916]">
            NóminaFlow
          </h1>
          <p className="text-xs text-[#999891] mt-1">
            Inicia sesión para continuar
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-black/[0.08] overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#6b6a64]">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-black/[0.12] rounded-[8px] px-3 py-2 text-sm text-[#1a1916] placeholder:text-[#bbb9b0] focus:outline-none focus:border-[#2d5be3] focus:ring-2 focus:ring-[#2d5be3]/10 transition-all"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              {/* Contraseña */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#6b6a64]">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-black/[0.12] rounded-[8px] px-3 py-2 pr-10 text-sm text-[#1a1916] placeholder:text-[#bbb9b0] focus:outline-none focus:border-[#2d5be3] focus:ring-2 focus:ring-[#2d5be3]/10 transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999891] hover:text-[#1a1916] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      // Ojo cerrado
                      <svg width="16" height="16" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 2l12 12"/>
                        <path d="M6.5 6.6A2 2 0 0110 9.5"/>
                        <path d="M4.2 4.3C2.8 5.2 1.8 6.5 1.5 8c.8 3 3.5 5 6.5 5a7 7 0 003.8-1.1"/>
                        <path d="M11.5 11.6C13 10.7 14 9.4 14.5 8c-.8-3-3.5-5-6.5-5a7 7 0 00-2.9.6"/>
                      </svg>
                    ) : (
                      // Ojo abierto
                      <svg width="16" height="16" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1.5 8C2.3 5 5 3 8 3s5.7 2 6.5 5c-.8 3-3.5 5-6.5 5S2.3 11 1.5 8z"/>
                        <circle cx="8" cy="8" r="2"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-[#faeaea] text-[#a02020] text-xs px-3 py-2.5 rounded-[8px]">
                  <svg width="13" height="13" fill="none" viewBox="0 0 13 13" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="6.5" cy="6.5" r="5.5"/>
                    <path d="M6.5 4v3M6.5 9h.01"/>
                  </svg>
                  {error}
                </div>
              )}
            </div>

            {/* Footer del form */}
            <div className="px-6 py-4 border-t border-black/[0.05] bg-[#fafaf7]">
              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-[#1a1916] text-white rounded-[8px] py-2.5 text-sm font-medium hover:opacity-85 disabled:opacity-40 transition-opacity"
              >
                {cargando ? "Ingresando..." : "Ingresar →"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}