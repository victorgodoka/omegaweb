import { Icon } from "@iconify/react";
import { Trans } from "react-i18next";
const DISCORD_URL = "https://discord.gg/duelistsunite";

import { useTranslation } from "react-i18next";

const DiscordBanner = () => {
  const { t } = useTranslation();
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg flex flex-col sm:flex-row items-center justify-between p-6 gap-6 my-6">
      <div className="flex items-center gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 hidden md:flex items-center justify-center">
          <Icon icon="mdi:discord" className="text-gray-300 text-3xl" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-bold text-white">{t('discord_banner.title')}</h3>
          <p className="text-gray-400 text-sm">{t('discord_banner.ready')}</p>
          <p className="text-gray-500 text-sm">{t('discord_banner.community')}</p>
          <div className="text-gray-500 text-sm">
            <Trans i18nKey="discord_banner.meet" components={{ 1: <span /> }} />
          </div>
        </div>
      </div>
      <a
        href={DISCORD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 px-6 py-2.5 bg-white hover:bg-gray-200 text-black font-semibold rounded-lg transition-colors text-sm flex items-center gap-2"
      >
        <Icon icon="mdi:discord" className="text-lg" />
        <span>{t('discord_banner.join_now')}</span>
      </a>
    </div>
  );
};

export default DiscordBanner;
