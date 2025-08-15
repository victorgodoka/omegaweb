import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/utils/Api";

export interface RankedData {
  bronze: number;
  diamond: number;
  gold: number;
  iron: number;
  master: number;
  omega: number;
  platinum: number;
  silver: number;
}

const getRanks = (t: any): { key: keyof RankedData; label: string; color: string }[] => [
  { key: "iron", label: t("ranks.iron"), color: "bg-gradient-to-t from-zinc-700 to-zinc-400" },
  { key: "bronze", label: t("ranks.bronze"), color: "bg-gradient-to-t from-yellow-900 to-yellow-500" },
  { key: "silver", label: t("ranks.silver"), color: "bg-gradient-to-t from-zinc-400 to-zinc-100" },
  { key: "gold", label: t("ranks.gold"), color: "bg-gradient-to-t from-yellow-600 to-yellow-300" },
  { key: "platinum", label: t("ranks.platinum"), color: "bg-gradient-to-t from-blue-900 to-blue-300" },
  { key: "diamond", label: t("ranks.diamond"), color: "bg-gradient-to-t from-cyan-700 to-cyan-200" },
  { key: "master", label: t("ranks.master"), color: "bg-gradient-to-t from-purple-800 to-purple-400" },
  { key: "omega", label: t("ranks.omega"), color: "bg-gradient-to-t from-orange-700 to-orange-400" },
];

const RankedUserCountCard = () => {
  const [data, setData] = useState<RankedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { t } = useTranslation();

  useEffect(() => {
    let mounted = true;
    api.external.duelistsUnite.getUserCount()
      .then((res) => {
        if (!mounted) return;
        if (res.ok && res.data) {
          setData(res.data as RankedData);
        } else {
          setError(t("error_loading_rank_data"));
        }
      })
      .catch(() => mounted && setError(t("error_loading_rank_data")));
    return () => { mounted = false; };
  }, [t]);

  if (error) return <div className="w-full py-10 text-center text-red-500">{error}</div>;
  if (!data) return <div className="w-full py-10 text-center text-zinc-400">{t("loading")}</div>;

  const ranks = getRanks(t);
  const logCounts = ranks.map(r => Math.log10(Math.max(1, data[r.key]))); // avoid log(0)
  const maxLog = Math.max(...logCounts);
  const barMaxHeight = 128;

  return (
    <div className="w-full bg-zinc-800 rounded-2xl shadow-xl p-6 flex flex-col gap-6 overflow-auto">
      <span className="uppercase text-xs text-zinc-400 tracking-widest mb-2">{t("user_count_by_rank")}</span>
      <div className="w-full flex items-end gap-3 h-32">
        {getRanks(t).map((rank, idx) => {
          const val = data[rank.key];
          const logVal = logCounts[idx];
          const heightPx = maxLog > 0 ? Math.max((logVal / maxLog) * barMaxHeight, 8) : 8;
          return (
            <div key={rank.key} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full rounded ${rank.color} flex items-end justify-center transition-all duration-300`}
                style={{ height: `${heightPx}px` }}
                title={t("users_in_rank", { count: val, rank: rank.label })}
              >
                <span className="text-xs font-bold text-zinc-900 drop-shadow-sm select-none">
                  {val}
                </span>
              </div>
              <span className="text-xs text-zinc-400 mt-1 select-none">{rank.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RankedUserCountCard;
