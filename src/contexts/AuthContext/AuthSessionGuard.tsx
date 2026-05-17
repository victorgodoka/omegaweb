import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { AUTH_EXPIRED_EVENT } from "@/utils/Api";
import { AuthManager } from "@/utils/auth";
import { useAuthContext } from "./index";
import { useToast } from "@/contexts/ToastContext";

const AuthSessionGuard = () => {
  const { t } = useTranslation();
  const { logout } = useAuthContext();
  const { showWarning } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const hasHandledRef = useRef(false);

  useEffect(() => {
    const handleExpiredToken = (event: Event) => {
      if (hasHandledRef.current) return;
      hasHandledRef.current = true;

      AuthManager.logout();
      logout();

      const detail = (event as CustomEvent<{ message?: string }>).detail;
      showWarning(detail?.message || t("auth.session_expired"));

      const currentPath = location.pathname + location.search + location.hash;
      navigate("/", { replace: true, state: { from: currentPath } });
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpiredToken);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpiredToken);
    };
  }, [location.hash, location.pathname, location.search, logout, navigate, showWarning, t]);

  return null;
};

export default AuthSessionGuard;
