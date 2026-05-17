import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import { useState, useEffect, useMemo, type FC, type ReactElement } from "react";
import { api } from "@/utils/Api";
import type { DuelActivityBucket, DuelActivityPayload } from "@/utils/ApiTypes";
import { unwrapApiPayload } from "@/utils/unwrapApiPayload";

function normalizeBucket(
  raw: Partial<DuelActivityBucket> | undefined | null
): DuelActivityBucket {
  return {
    live: Number(raw?.live) || 0,
    lastHour: Number(raw?.lastHour) || 0,
    lastDay: Number(raw?.lastDay) || 0,
  };
}

function isDuelActivityPayload(x: unknown): x is DuelActivityPayload {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.tcg === "object" &&
    o.tcg !== null &&
    typeof o.genesys === "object" &&
    o.genesys !== null
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}): ReactElement {
  return (
    <div className="bg-black/40 border border-zinc-800 rounded-lg p-4">
      <p className="text-sm text-zinc-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
      <span className="text-xs text-zinc-500">{hint}</span>
    </div>
  );
}

function FormatDuelStats({
  title,
  bucket,
  t,
}: {
  title: string;
  bucket: DuelActivityBucket;
  t: (key: string) => string;
}): ReactElement {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white border-b border-zinc-800 pb-2">
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label={t("home_new.duels_stats.activeDuels")}
          value={bucket.live}
          hint={t("home_new.duels_stats.activeDuels_hint")}
        />
        <MetricCard
          label={t("home_new.duels_stats.lastHour")}
          value={bucket.lastHour}
          hint={t("home_new.duels_stats.lastHour_hint")}
        />
        <MetricCard
          label={t("home_new.duels_stats.lastDay")}
          value={bucket.lastDay}
          hint={t("home_new.duels_stats.lastDay_hint")}
        />
      </div>
    </div>
  );
}

const Home: FC = () => {
  const { t } = useTranslation();
  const [duelStats, setDuelStats] = useState<DuelActivityPayload | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const features = useMemo(
    () => [
      {
        id: "tournament-live",
        icon: "mdi:tournament",
        title: t("home_new.features.live_tournament.title"),
        description: t("home_new.features.live_tournament.description"),
        link: "/tournament/live",
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/30",
        hoverBorder: "hover:border-yellow-500",
      },
      {
        id: "history",
        icon: "mdi:history",
        title: t("home_new.features.history.title"),
        description: t("home_new.features.history.description"),
        link: "/history",
        color: "text-blue-400",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
        hoverBorder: "hover:border-blue-500",
      },
      {
        id: "leaderboard",
        icon: "mdi:podium-gold",
        title: t("home_new.features.leaderboard.title"),
        description: t("home_new.features.leaderboard.description"),
        link: "/leaderboards",
        color: "text-orange-400",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/30",
        hoverBorder: "hover:border-orange-500",
      },
      {
        id: "statistics",
        icon: "mdi:chart-bar",
        title: t("home_new.features.statistics.title"),
        description: t("home_new.features.statistics.description"),
        link: "/statistics",
        color: "text-purple-400",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/30",
        hoverBorder: "hover:border-purple-500",
      },
      {
        id: "decks",
        icon: "mdi:cards",
        title: t("home_new.features.decks.title"),
        description: t("home_new.features.decks.description"),
        link: "/decks",
        color: "text-green-400",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/30",
        hoverBorder: "hover:border-green-500",
      },
      {
        id: "calculator",
        icon: "mdi:calculator",
        title: t("home_new.features.calculator.title"),
        description: t("home_new.features.calculator.description"),
        link: "/calculator",
        color: "text-cyan-400",
        bgColor: "bg-cyan-500/10",
        borderColor: "border-cyan-500/30",
        hoverBorder: "hover:border-cyan-500",
      },
    ],
    [t]
  );

  useEffect(() => {
    let isMounted = true;
    const fetchDuelStats = async () => {
      try {
        const response = await api.main.getDuelsActivityStats();
        if (!isMounted) return;

        const raw =
          unwrapApiPayload<DuelActivityPayload>(response.data) ??
          response.data;
        if (response.ok && isDuelActivityPayload(raw)) {
          setDuelStats({
            tcg: normalizeBucket(raw.tcg),
            genesys: normalizeBucket(raw.genesys),
          });
        } else {
          setDuelStats(null);
        }
      } catch (error) {
        console.error("Failed to fetch duel stats:", error);
        if (isMounted) setDuelStats(null);
      } finally {
        if (isMounted) {
          setIsLoadingStats(false);
        }
      }
    };

    void fetchDuelStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-16 mt-8">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            {t("home_new.hero.title")}
          </h1>
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            {t("home_new.hero.subtitle")}
          </p>

          <a
            href="https://discord.gg/duelistsunite"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-zinc-200 transition-colors"
          >
            <Icon icon="mdi:discord" className="w-6 h-6" />
            {t("home_new.cta.join_discord")}
          </a>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            {t("home_new.sections.features")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Link
                key={feature.id}
                to={feature.link}
                className={`group bg-zinc-900/50 border ${feature.borderColor} ${feature.hoverBorder} rounded-lg p-6 transition-all hover:scale-[1.02]`}
              >
                <div
                  className={`w-14 h-14 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}
                >
                  <Icon
                    icon={feature.icon}
                    className={`w-8 h-8 ${feature.color}`}
                  />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white transition-colors">
                  {feature.title}
                </h3>
                <p className="text-zinc-400 text-sm">{feature.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Ranked Duels Activity — TCG & Genesys */}
        <div className="mb-16">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <p className="text-sm uppercase tracking-widest text-zinc-500">
                  {t("home_new.duels_stats.label")}
                </p>
                <h2 className="text-2xl font-bold text-white">
                  {t("home_new.duels_stats.title")}
                </h2>
                <p className="text-sm text-zinc-500">
                  {t("home_new.duels_stats.subtitle")}
                </p>
              </div>
              <Icon icon="mdi:sword-cross" className="text-4xl text-zinc-500" />
            </div>

            {isLoadingStats ? (
              <div className="text-center text-zinc-500 text-sm py-8">
                {t("home_new.duels_stats.loading")}
              </div>
            ) : duelStats ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <FormatDuelStats
                  title={t("home_new.duels_stats.tcg")}
                  bucket={duelStats.tcg}
                  t={t}
                />
                <FormatDuelStats
                  title={t("home_new.duels_stats.genesys")}
                  bucket={duelStats.genesys}
                  t={t}
                />
              </div>
            ) : (
              <div className="text-center text-red-400 text-sm py-8">
                {t("home_new.duels_stats.error")}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Icon icon="mdi:toolbox" className="w-6 h-6 text-zinc-400" />
              {t("home_new.sections.tools")}
            </h3>
            <div className="space-y-3">
              <Link
                to="/statistics"
                className="block p-3 bg-zinc-800/50 rounded-md hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300">
                    {t("home_new.tools.deck_stats")}
                  </span>
                  <Icon
                    icon="mdi:chevron-right"
                    className="w-5 h-5 text-zinc-500"
                  />
                </div>
              </Link>
              <Link
                to="/konami-decklist"
                className="block p-3 bg-zinc-800/50 rounded-md hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300">
                    {t("home_new.tools.konami_converter")}
                  </span>
                  <Icon
                    icon="mdi:chevron-right"
                    className="w-5 h-5 text-zinc-500"
                  />
                </div>
              </Link>
              <Link
                to="/pdf-decklist"
                className="block p-3 bg-zinc-800/50 rounded-md hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300">
                    {t("home_new.tools.pdf_generator")}
                  </span>
                  <Icon
                    icon="mdi:chevron-right"
                    className="w-5 h-5 text-zinc-500"
                  />
                </div>
              </Link>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Icon icon="mdi:account-group" className="w-6 h-6 text-zinc-400" />
              {t("home_new.sections.community")}
            </h3>
            <div className="space-y-4">
              <a
                href="https://forum.duelistsunite.org"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-zinc-800/50 rounded-md hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300">
                    {t("home_new.community.forum")}
                  </span>
                  <Icon
                    icon="mdi:open-in-new"
                    className="w-5 h-5 text-zinc-500"
                  />
                </div>
              </a>
              <a
                href="https://discord.gg/duelistsunite"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-zinc-800/50 rounded-md hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300">
                    {t("home_new.community.discord")}
                  </span>
                  <Icon
                    icon="mdi:open-in-new"
                    className="w-5 h-5 text-zinc-500"
                  />
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
