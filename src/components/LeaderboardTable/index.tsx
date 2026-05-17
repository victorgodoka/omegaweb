import type { PlayerStats } from "@/utils/Tiebreaker";
import { PlayerAvatar } from "../PlayerAvatar";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

type LeaderboardTableProps = { tiebreakers: PlayerStats[]; tournament: TournamentHistory };

export const LeaderboardTable = ({ tiebreakers, tournament }: LeaderboardTableProps) => {
  const { t } = useTranslation();
  return (
    <section aria-label={t("leaderboard_aria")} className="w-full overflow-hidden">
    {/* Desktop/tablet header */}
    <header className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 px-4 py-3 hidden md:block">
      <div className="grid grid-cols-12 gap-2 text-gray-400 font-medium text-sm uppercase tracking-wider">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-5 md:col-span-4">{t('player')}</div>
        <div className="col-span-2 text-center">{t('w_l_d')}</div>
        {tournament.endtime && <div className="col-span-2 text-center">{t('win_rate')}</div>}
        {tournament.endtime && <div className="col-span-2 text-center">{t('tiebreaker')}</div>}
      </div>
    </header>
    <ul className="divide-y divide-zinc-800">
      {tiebreakers.map((p, i) => (
        <li
          key={p.id}
          className="group hover:bg-zinc-800/50 transition-colors px-4 py-3 md:grid md:grid-cols-12 md:gap-2 md:items-center block"
          tabIndex={0}
          aria-label={t("rank_player", { rank: i + 1, player: p.displayname || p.username })}
        >
          {/* Desktop/tablet layout */}
          <div className="hidden md:flex col-span-1 flex-col items-center justify-center text-2xl font-extrabold text-zinc-400 select-none">
            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
          </div>
          <div className="hidden md:flex col-span-5 md:col-span-4 items-center gap-3">
            <PlayerAvatar
              id={p.id}
              rounded
              avatar={p.avatar || null}
              displayname={p.displayname || p.username}
              username={p.username}
              className="h-10 w-10 border border-zinc-700"
            />
            <div className="flex flex-col min-w-0">
              <Link to={`/profile/${p.id}`} className="font-medium text-white hover:text-gray-300 transition-colors truncate">
                {p.displayname || p.username}
              </Link>
              <span className="text-xs text-gray-500 truncate">{p.username}</span>
            </div>
          </div>
          <div className="hidden md:flex col-span-2 text-center text-gray-300 items-center justify-center font-medium">
            {p.wins}-{p.losses}-{p.draws}
          </div>
          {tournament.endtime && (
            <div className="hidden md:flex col-span-2 text-center text-white font-medium items-center justify-center">
              {p.winPercentage}%
            </div>
          )}
          {tournament.endtime && (
            <div className="hidden md:flex col-span-2 text-center text-gray-400 text-xs font-mono items-center justify-center" title={t("tiebreaker_score_tooltip")}>
              {p.tiebreaker.replace(/\./ig, '').padStart(11, '0')}
            </div>
          )}

          {/* Mobile layout */}
          <div className="flex md:hidden flex-col gap-2 w-full">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-extrabold text-zinc-400 select-none w-8 text-center">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
              </span>
              <PlayerAvatar
                id={p.id}
                rounded
                avatar={p.avatar || null}
                displayname={p.displayname || p.username}
                username={p.username}
                className="h-9 w-9 border border-zinc-700"
              />
              <div className="flex flex-col flex-1 min-w-0">
                <Link to={`/profile/${p.id}`} className="font-medium truncate text-white hover:text-gray-300 transition-colors">
                  {p.displayname || p.username}
                </Link>
                <span className="text-xs text-gray-500 truncate">{p.username}</span>
              </div>
              <span className="text-xs text-gray-300 font-medium ml-auto">
                {p.wins}-{p.losses}-{p.draws}
              </span>
            </div>
            {tournament.endtime && (
              <div className="flex gap-3 text-xs text-gray-400 mt-1 justify-between">
                <span className="font-medium text-white">{t('win_rate')}: {p.winPercentage}%</span>
                <span className="font-mono" title={t('tiebreaker_score_tooltip')}>{t('tiebreaker_short')}: {p.tiebreaker.replace(/\./ig, '').padStart(11, '0')}</span>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  </section>
  );
};
