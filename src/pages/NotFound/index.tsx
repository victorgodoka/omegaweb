import { Link } from "react-router";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen w-full flex items-center justify-center overflow-auto bg-zinc-900 px-4">
      <div className="bg-zinc-800 mx-auto py-8 rounded-2xl flex flex-col items-center justify-center text-center px-6 sm:px-12 max-w-md w-full shadow-2xl">
        <img
          src="/back.webp"
          alt="Yu-Gi-Oh! Card Back"
          className="w-28 object-cover rounded-xl mb-6 shadow-lg"
          draggable="false"
        />
        <h1 className="text-5xl font-bold text-orange-500 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-zinc-100 mb-4">{t('notfound.trap_card')}</h2>
        <p className="text-zinc-400 mb-4 max-w-md">
          {t('notfound.not_in_deck')}<br />
          <span className="text-orange-400 font-semibold">{t('notfound.does_not_exist')}</span>
        </p>
        <p className="text-zinc-500 mb-8 italic">{t('notfound.exodia')}</p>
        <Link
          to="/"
          className="inline-block px-6 py-3 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-400 transition-colors shadow-md"
        >
          {t('notfound.return_home')}
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
