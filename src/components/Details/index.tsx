import moment from "moment";
import { decodeDuelData } from "@/utils/Functions";

import { useTranslation } from "react-i18next";

type DetailsProps = { tournament: TournamentHistory };
export const Details = ({ tournament }: DetailsProps) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="w-full flex flex-col justify-center shadow-xs shadow-zinc-700 rounded-xl p-6 bg-zinc-800 text-white">
        <p className="text-xs text-zinc-500">{t('region')}</p>
        <p className="text-2xl text-zinc-200">{decodeDuelData(tournament.settings, t).region} Master Rule {decodeDuelData(tournament.settings, t).mr}</p>
      </div>
      <div className="w-full flex flex-col justify-center shadow-xs shadow-zinc-700 rounded-xl p-6 bg-zinc-800 text-white">
        <p className="text-xs text-zinc-500">{t('date_time')}</p>
        <p className="text-2xl text-zinc-200">{moment.utc(tournament.starttime).format("dddd, MMMM Do YYYY")}</p>
        <p className="text-lg text-zinc-200">{moment.utc(tournament.starttime).format("HH:mm A Z")}</p>
      </div>
      <div className="w-full flex flex-col justify-center shadow-xs shadow-zinc-700 rounded-xl p-6 bg-zinc-800 text-white">
        <p className="text-xs text-zinc-500">{t('banlist')}</p>
        <p className="text-2xl text-zinc-200">{tournament.banlist}</p>
      </div>
    </div>
  );
};
