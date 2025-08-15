import { Icon } from "@iconify/react";
import { Trans } from "react-i18next";
const DISCORD_URL = "https://discord.gg/duelistsunite";

import { useTranslation } from "react-i18next";

const DiscordBanner = () => {
  const { t } = useTranslation();
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl shadow flex flex-col sm:flex-row items-center justify-between p-5 gap-6 my-6">
      <div className="flex items-center gap-3">
        <span className="bg-zinc-900 rounded-full p-4 hidden md:block">
          <Icon icon="mdi:discord" className="text-white text-4xl" />
        </span>
        <div>
          <h3 className="text-xl sm:text-2xl font-semibold text-white mb-1">{t('discord_banner.title')}</h3>
          <div className="text-zinc-300 text-sm sm:text-base">
            <p className="mb-1 text-xl">{t('discord_banner.ready')}</p>
            <p>{t('discord_banner.community')}</p>
            <Trans i18nKey="discord_banner.meet" components={{ 1: <p /> }} />
          </div>
        </div>
      </div>
      <a
        href={DISCORD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 min-w-44 sm:mt-0 px-5 py-2 bg-zinc-700 hover:bg-orange-500 text-white font-semibold rounded-lg transition-colors text-base flex items-center gap-2 border border-zinc-600"
      >
        <Icon icon="mdi:discord" className="text-xl" />
        <span>{t('discord_banner.join_now')}</span>
      </a>
    </div>
  );
};

export default DiscordBanner;
