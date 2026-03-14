import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import type { GetStaticProps } from "next";
import { CheckCircle, XCircle, Loader2, Sparkles } from "lucide-react";
import { authApi } from "@/services/api";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await serverSideTranslations(locale ?? "en", ["common"])) },
});

type State = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    const { token } = router.query;
    if (!token || typeof token !== "string") return;

    authApi.verifyEmail(token)
      .then(() => setState("success"))
      .catch(() => setState("error"));
  }, [router.query]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 p-6">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-4">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-surface-900">FinWise AI</span>
        </div>

        {state === "loading" && (
          <div className="bg-white rounded-2xl border border-surface-200 p-10 space-y-4">
            <Loader2 size={40} className="animate-spin text-brand-500 mx-auto" />
            <p className="text-surface-600 font-medium">{t("auth.verifying")}</p>
          </div>
        )}

        {state === "success" && (
          <div className="bg-white rounded-2xl border border-green-100 p-10 space-y-4">
            <CheckCircle size={48} className="text-green-500 mx-auto" />
            <div>
              <h1 className="text-xl font-bold text-surface-900">{t("auth.verifiedTitle")}</h1>
              <p className="text-surface-500 text-sm mt-1">{t("auth.verifiedDesc")}</p>
            </div>
            <button
              onClick={() => router.push("/login")}
              className="btn-primary px-8 py-2.5 mx-auto"
            >
              {t("auth.signIn")}
            </button>
          </div>
        )}

        {state === "error" && (
          <div className="bg-white rounded-2xl border border-red-100 p-10 space-y-4">
            <XCircle size={48} className="text-red-400 mx-auto" />
            <div>
              <h1 className="text-xl font-bold text-surface-900">{t("auth.verifyErrorTitle")}</h1>
              <p className="text-surface-500 text-sm mt-1">{t("auth.verifyErrorDesc")}</p>
            </div>
            <button
              onClick={() => router.push("/login")}
              className="text-brand-600 font-medium text-sm hover:text-brand-800"
            >
              {t("auth.backToLogin")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
