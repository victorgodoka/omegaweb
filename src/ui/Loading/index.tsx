import { Spinner } from "flowbite-react";
import { useTranslation } from "react-i18next";

const Loading = () => {
  const { t } = useTranslation();
  return (
    <div
      className="h-screen w-screen bg-black/85 flex flex-col items-center justify-center fixed top-0 left-0 z-[9999] animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <Spinner color="purple" aria-label={t("loading")} size="xl" />
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
};

export default Loading;