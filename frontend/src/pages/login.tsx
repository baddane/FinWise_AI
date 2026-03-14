import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { TrendingUp, Shield, Sparkles, Mail, RefreshCw } from "lucide-react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import type { GetStaticProps } from "next";
import { authApi } from "@/services/api";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await serverSideTranslations(locale ?? "en", ["common"])) },
});

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (el: HTMLElement, config: object) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { login, register, googleLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  // Load Google Identity Services script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []);

  const handleGoogleResponse = useCallback(
    async (response: { credential: string }) => {
      setError("");
      setIsLoading(true);
      try {
        await googleLogin(response.credential);
        router.push("/dashboard");
      } catch {
        setError(t("auth.googleFailed"));
      } finally {
        setIsLoading(false);
      }
    },
    [googleLogin, router, t]
  );

  // Render Google button once script + element are ready
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const tryInit = () => {
      const el = document.getElementById("google-btn");
      if (!el) return;
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(el, {
          theme: "outline",
          size: "large",
          width: el.offsetWidth || 360,
          text: isRegister ? "signup_with" : "signin_with",
        });
      } else {
        setTimeout(tryInit, 200);
      }
    };
    tryInit();
  }, [isRegister, handleGoogleResponse, emailSent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (isRegister) {
        await register(email, password, fullName);
        setEmailSent(true);
      } else {
        await login(email, password);
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
      const detail = axiosErr?.response?.data?.detail;
      const httpStatus = axiosErr?.response?.status;
      if (httpStatus === 403 && detail === "EMAIL_NOT_VERIFIED") {
        setEmailSent(true);
        return;
      }
      if (isRegister) {
        setError(detail ?? t("auth.registrationFailed", { status: httpStatus ?? "network error" }));
      } else {
        setError(detail ?? t("auth.invalidCredentials"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.resendVerification(email);
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-12 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-pulse-soft [animation-delay:1s]" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl animate-pulse-soft [animation-delay:2s]" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-300" />
              </div>
              <span className="text-2xl font-bold text-white">FinWise AI</span>
            </div>
            <p className="text-brand-300/80 text-sm ml-[52px]">Intelligent Finance</p>
          </div>
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-white leading-tight">
              {t("landing.tagline1")}
              <br />
              <span className="bg-gradient-to-r from-brand-300 to-emerald-300 bg-clip-text text-transparent">
                {t("landing.tagline2")}
              </span>
            </h2>
            <p className="text-brand-200/70 text-lg max-w-md leading-relaxed">{t("landing.description")}</p>
            <div className="space-y-4">
              {([
                { icon: TrendingUp, key: "landing.feature1" },
                { icon: Shield, key: "landing.feature2" },
                { icon: Sparkles, key: "landing.feature3" },
              ] as const).map(({ icon: Icon, key }) => (
                <div key={key} className="flex items-center gap-3 text-brand-200/80">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-brand-400" />
                  </div>
                  <span className="text-sm font-medium">{t(key)}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-brand-400/50 text-xs">{t("landing.poweredBy")}</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-surface-50">
        <div className="w-full max-w-[420px] animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-surface-900">FinWise AI</span>
          </div>

          {/* ── Email verification sent ── */}
          {emailSent ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto">
                <Mail size={30} className="text-brand-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-surface-900">{t("auth.checkEmailTitle")}</h2>
                <p className="text-surface-500 mt-2 text-sm leading-relaxed max-w-sm mx-auto">
                  {t("auth.checkEmailDesc", { email })}
                </p>
              </div>
              <div className="bg-white border border-surface-200 rounded-2xl p-5 text-left space-y-3">
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">{t("auth.nextSteps")}</p>
                <ol className="text-sm text-surface-600 space-y-1.5 list-decimal list-inside">
                  <li>{t("auth.step1")}</li>
                  <li>{t("auth.step2")}</li>
                  <li>{t("auth.step3")}</li>
                </ol>
              </div>
              <button
                onClick={handleResend}
                disabled={resending || resent}
                className="flex items-center gap-2 mx-auto text-sm text-brand-600 hover:text-brand-800 font-medium disabled:opacity-50 transition"
              >
                <RefreshCw size={14} className={resending ? "animate-spin" : ""} />
                {resent ? t("auth.resentOk") : resending ? t("auth.resending") : t("auth.resendEmail")}
              </button>
              <button
                onClick={() => { setEmailSent(false); setIsRegister(false); setError(""); }}
                className="block mx-auto text-sm text-surface-400 hover:text-surface-600 transition"
              >
                {t("auth.backToLogin")}
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-surface-900">
                  {isRegister ? t("auth.createAccount") : t("auth.welcomeBack")}
                </h1>
                <p className="text-surface-500 mt-2 text-sm">
                  {isRegister ? t("auth.startJourney") : t("auth.signInAccess")}
                </p>
              </div>

              {/* Google Sign-In button */}
              {GOOGLE_CLIENT_ID && (
                <div className="mb-5">
                  <div id="google-btn" className="w-full min-h-[44px]" />
                  <div className="flex items-center gap-3 mt-5">
                    <div className="flex-1 h-px bg-surface-200" />
                    <span className="text-xs text-surface-400 font-medium">{t("auth.orContinueWith")}</span>
                    <div className="flex-1 h-px bg-surface-200" />
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {isRegister && (
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">{t("auth.fullName")}</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input"
                      placeholder={t("auth.fullNamePlaceholder")}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">{t("auth.email")}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input"
                    placeholder={t("auth.emailPlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">{t("auth.password")}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input"
                    placeholder={t("auth.passwordPlaceholder")}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
                  {isLoading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {t("auth.loading")}
                    </span>
                  ) : isRegister ? t("auth.createAccountBtn") : t("auth.signIn")}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-surface-500">
                  {isRegister ? t("auth.alreadyHaveAccount") : t("auth.dontHaveAccount")}{" "}
                  <button
                    onClick={() => { setIsRegister(!isRegister); setError(""); }}
                    className="text-brand-600 font-semibold hover:text-brand-700 transition-colors"
                  >
                    {isRegister ? t("auth.signIn") : t("auth.signUp")}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
