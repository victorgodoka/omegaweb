import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Icon } from "@iconify/react";
import { api } from "@/utils/Api";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { getTierInfo } from "@/utils/Functions";

interface LeaderboardPlayer {
  id: string;
  username: string;
  avatar: string | null;
  displayname: string;
  wins: number;
  loses: number;
  draws: number;
  rating: number;
  winstreak: number;
  losestreak: number;
  games: number;
  ot: string;
}

interface LeaderboardData {
  TCG: LeaderboardPlayer[];
  OCG: LeaderboardPlayer[];
}

const getWinRate = (player: LeaderboardPlayer) => {
  if (!player || player.games === 0) return 0;
  return (player.wins / player.games) * 100;
};

const Leaderboards = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<"TCG" | "OCG">("TCG");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await api.main.getLeaderboard();

        if (response.ok && response.data) {
          setData(response.data.data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Leaderboard Error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const { currentData, featuredPlayer, spotlightPlayers, tablePlayers } =
    useMemo(() => {
      const leaderboardData = data
        ? selectedRegion === "TCG"
          ? data.TCG
          : data.OCG
        : null;

      if (!leaderboardData || leaderboardData.length === 0) {
        return {
          currentData: leaderboardData,
          featuredPlayer: null,
          spotlightPlayers: [],
          tablePlayers: [] as LeaderboardPlayer[],
        };
      }

      const [first, ...restPlayers] = leaderboardData;
      return {
        currentData: leaderboardData,
        featuredPlayer: first,
        spotlightPlayers: restPlayers.slice(0, 4),
        tablePlayers: leaderboardData,
      };
    }, [data, selectedRegion]);

  if (loading) {
    return (
      <section className="w-full px-4 pb-16 pt-28">
        <div className="mx-auto w-full max-w-6xl space-y-4">
          <div className="h-32 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/60" />
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/40"
            />
          ))}
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="w-full px-4 pb-16 pt-28">
        <div className="mx-auto w-full max-w-4xl rounded-lg border border-red-500/20 bg-zinc-950 p-10 text-center">
          <Icon
            icon="mdi:alert-octagon"
            className="mx-auto mb-4 h-10 w-10 text-red-400"
          />
          <p className="text-lg font-semibold text-white">
            {t("leaderboard_page.error_title")}
          </p>
          <p className="mt-2 text-zinc-400">
            {t("leaderboard_page.error_loading")}
          </p>
        </div>
      </section>
    );
  }

  if (!currentData || currentData.length === 0) {
    return (
      <section className="w-full px-4 pb-16 pt-28">
        <div className="mx-auto w-full max-w-4xl rounded-lg border border-zinc-800 bg-zinc-950 p-10 text-center">
          <p className="text-lg font-semibold text-white">
            {t("leaderboard_page.empty_title")}
          </p>
          <p className="mt-2 text-zinc-400">
            {t("leaderboard_page.empty_subtitle")}
          </p>
        </div>
      </section>
    );
  }

  const formatLabel =
    selectedRegion === "TCG"
      ? t("leaderboard_page.tcg_label")
      : t("leaderboard_page.ocg_label");

  return (
    <section className="w-full px-4 pb-16 pt-28">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              {t("leaderboard_page.section_label")}
            </span>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-4xl font-semibold text-white">
                  {t("leaderboard_page.title")}
                </h1>
                <p className="mt-2 text-zinc-400">
                  {t("leaderboard_page.subtitle", { format: formatLabel })}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-md border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
                <span className="h-2 w-2 rounded-full bg-zinc-200" />
                {t("leaderboard_page.updated_badge")}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase text-zinc-500">
              {t("leaderboard_page.region_label")}
            </span>
            <div className="flex rounded-lg border border-zinc-800 bg-zinc-950 p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => setSelectedRegion("TCG")}
                className={`flex-1 rounded-md px-4 py-2 transition-colors ${selectedRegion === "TCG"
                    ? "bg-white text-black"
                    : "text-zinc-500 hover:text-zinc-200"
                  }`}
              >
                {t("leaderboard_page.tcg_label")}
              </button>
              <button
                type="button"
                onClick={() => setSelectedRegion("OCG")}
                className={`flex-1 rounded-md px-4 py-2 transition-colors ${selectedRegion === "OCG"
                    ? "bg-white text-black"
                    : "text-zinc-500 hover:text-zinc-200"
                  }`}
              >
                {t("leaderboard_page.ocg_label")}
              </button>
            </div>
          </div>
        </header>

        {featuredPlayer && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-md border border-zinc-800 text-sm font-semibold text-white">
                  #{1}
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <PlayerAvatar
                      id={featuredPlayer.id}
                      avatar={featuredPlayer.avatar}
                      displayname={featuredPlayer.displayname}
                      username={featuredPlayer.username}
                      rounded={true}
                      size="lg"
                      bordered={true}
                    />
                    <img
                      src={`/badges/TCG/${getTierInfo(
                        featuredPlayer.rating
                      ).name.toLowerCase()}.png`}
                      alt={getTierInfo(featuredPlayer.rating).name}
                      className="w-8 h-8 bottom-0 right-0 object-contain absolute"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  </div>
                  <div>
                    <Link
                      to={`/profile/${featuredPlayer.id}`}
                      className="text-2xl font-semibold text-white hover:text-zinc-200"
                    >
                      {featuredPlayer.displayname || featuredPlayer.username}
                    </Link>
                    <p className="text-sm text-zinc-500">
                      @{featuredPlayer.username}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 flex-wrap justify-end gap-3 text-sm text-zinc-400">
                <div className="rounded-md border border-zinc-800 bg-zinc-950 px-4 py-2">
                  <p className="text-xs uppercase text-zinc-500">
                    {t("leaderboard_page.rating")}
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {Math.round(featuredPlayer.rating)}
                  </p>
                </div>
                <div className="rounded-md border border-zinc-800 bg-zinc-950 px-4 py-2">
                  <p className="text-xs uppercase text-zinc-500">
                    {t("leaderboard_page.record_label")}
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {t("leaderboard_page.win_loss", {
                      wins: featuredPlayer.wins,
                      losses: featuredPlayer.loses,
                    })}
                  </p>
                </div>
                <div className="rounded-md border border-zinc-800 bg-zinc-950 px-4 py-2">
                  <p className="text-xs uppercase text-zinc-500">
                    {t("leaderboard_page.win_rate")}
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {getWinRate(featuredPlayer).toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-md border border-zinc-800 bg-zinc-950 px-4 py-2">
                  <p className="text-xs uppercase text-zinc-500">
                    {t("leaderboard_page.games_label")}
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {featuredPlayer.games}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {spotlightPlayers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Icon icon="mdi:spotlight" className="h-4 w-4 text-zinc-400" />
              {t("leaderboard_page.spotlight_title")}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {spotlightPlayers.map((player, index) => {
                const position = index + 2;
                return (
                  <article
                    key={player.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-zinc-800 text-sm text-white">
                        #{position}
                      </div>
                      <div className="relative">
                        <PlayerAvatar
                          id={player.id}
                          avatar={player.avatar}
                          displayname={player.displayname}
                          username={player.username}
                          rounded={true}
                          size="lg"
                          bordered={true}
                        />

                        <img
                          src={`/badges/TCG/${getTierInfo(
                            player.rating
                          ).name.toLowerCase()}.png`}
                          alt={getTierInfo(player.rating).name}
                          className="w-8 h-8 bottom-0 right-0 object-contain absolute"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/profile/${player.id}`}
                          className="block truncate text-base font-semibold text-white hover:text-zinc-200"
                        >
                          {player.displayname || player.username}
                        </Link>
                        <p className="text-sm text-zinc-500">
                          @{player.username}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-400">
                      <span className="rounded-md border border-zinc-800 px-3 py-1 text-white">
                        {Math.round(player.rating)}{" "}
                        {t("leaderboard_page.rating_short")}
                      </span>
                      <span className="rounded-md border border-zinc-800 px-3 py-1">
                        {t("leaderboard_page.win_loss", {
                          wins: player.wins,
                          losses: player.loses,
                        })}
                      </span>
                      <span className="rounded-md border border-zinc-800 px-3 py-1">
                        {getWinRate(player).toFixed(1)}%{" "}
                        {t("leaderboard_page.win_rate")}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        <section className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("leaderboard_page.table_label")}
              </p>
              <h2 className="text-2xl font-semibold text-white">
                {t("leaderboard_page.table_title")}
              </h2>
            </div>
            <p className="text-sm text-zinc-500">
              {t("leaderboard_page.table_subtitle")}
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-zinc-800">
            <div className="hidden grid-cols-[72px_1fr_120px_120px_90px] bg-zinc-950 px-4 py-3 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 md:grid">
              <span>{t("leaderboard_page.rank_column")}</span>
              <span>{t("leaderboard_page.player_column")}</span>
              <span>{t("leaderboard_page.rating_column")}</span>
              <span>{t("leaderboard_page.record_column")}</span>
              <span>{t("leaderboard_page.win_rate_column")}</span>
            </div>
            <div className="divide-y divide-zinc-900">
              {tablePlayers.map((player, index) => {
                const position = index + 1;
                const winRate = getWinRate(player);
                return (
                  <article
                    key={`${player.id}-${position}`}
                    className="grid grid-cols-1 gap-4 px-4 py-4 text-sm text-zinc-300 md:grid-cols-[72px_1fr_120px_120px_90px] md:items-center"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base font-semibold text-white">
                        #{position}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <PlayerAvatar
                          id={player.id}
                          avatar={player.avatar}
                          displayname={player.displayname}
                          username={player.username}
                          rounded={true}
                          size="lg"
                          bordered={true}
                        />
                        <img
                          src={`/badges/TCG/${getTierInfo(
                            player.rating
                          ).name.toLowerCase()}.png`}
                          alt={getTierInfo(player.rating).name}
                          className="w-8 h-8 bottom-0 right-0 object-contain absolute"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/profile/${player.id}`}
                          className="block truncate text-base font-medium text-white hover:text-zinc-200"
                        >
                          {player.displayname || player.username}
                        </Link>
                        <p className="text-sm text-zinc-500">
                          @{player.username}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center text-white">
                      <span className="text-base font-semibold">
                        {Math.round(player.rating)}
                      </span>
                    </div>
                    <div className="text-white">
                      {t("leaderboard_page.win_loss", {
                        wins: player.wins,
                        losses: player.loses,
                      })}
                    </div>
                    <div className="text-white">{winRate.toFixed(1)}%</div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
};

export default Leaderboards;
