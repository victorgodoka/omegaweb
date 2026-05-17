import { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router";
import { Icon } from "@iconify/react";
import { api } from "@/utils/Api";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import TournamentSkeleton from "./components/TournamentSkeleton";
import { decodeDuelData } from "@/utils/Functions";
import type {
  TournamentDetail,
  TournamentUser,
  Round,
  TopcutData,
} from "@/pages/History/types";
import type { Card, Decklist } from "@/utils/ApiTypes";
import { useCardsSearch } from "@/contexts/CardsSearchContext";
import DeckDisplay from "@/components/DeckDisplay";
import DeckExport from "@/components/DeckExport";
import DeckPieChart, { type DeckPieChartData } from "@/components/DeckPieChart";
import { calculateTiebreakers, type PlayerStats } from "@/utils/Tiebreaker";
import { unwrapApiPayload } from "@/utils/unwrapApiPayload";

type TabType = 'brackets' | 'standings' | 'decklists' | 'graphs';

const Tournament = () => {
  const { id: tournamentId } = useParams<'id'>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [tournamentData, setTournamentData] = useState<TournamentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('brackets');
  const { cards, searchCards, isLoading: isLoadingCards } = useCardsSearch();

  const loadCards = useCallback(
    (detail: TournamentDetail) => {
      if (!detail.topcutPlayers?.length) return;

      const allCardIds = new Set<number>();
      detail.topcutPlayers.forEach((player) => {
        if (player.deck?.fullDeck) {
          player.deck.fullDeck.main.forEach((id) => allCardIds.add(id));
          player.deck.fullDeck.side.forEach((id) => allCardIds.add(id));
        }
      });

      if (allCardIds.size > 0) {
        void searchCards({
          method: "POST",
          id: Array.from(allCardIds),
        });
      }
    },
    [searchCards]
  );

  // Fetch tournament data
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setError(null);
      setIsLoading(true);

      try {
        const response =
          !tournamentId || tournamentId === "live"
            ? await api.main.getLiveTournament()
            : await api.main.getTournamentById(Number.parseInt(tournamentId, 10));

        if (cancelled) return;

        if (!response.ok || !response.data) {
          throw new Error(t("live.failed_to_load"));
        }

        const detail = unwrapApiPayload<TournamentDetail>(response.data);
        if (!detail?.tournament) {
          throw new Error(t("live.failed_to_load"));
        }

        setTournamentData(detail);
        loadCards(detail);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : t("live.unexpected_error")
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    if (tournamentId && tournamentId !== "live") {
      const id = Number.parseInt(tournamentId, 10);
      if (Number.isNaN(id)) {
        navigate("/");
        return;
      }
    }

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [tournamentId, navigate, loadCards, t]);

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return dateString;
    }
    const lang = i18n.language || "en-US";
    const locale = lang.startsWith("pt") ? "pt-BR" : "en-US";
    return date.toLocaleString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading state
  if (isLoading) {
    return <TournamentSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon icon="mdi:alert-circle" className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-white text-xl mb-2">{t('error')}</h2>
          <p className="text-zinc-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!tournamentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon
            icon="mdi:tournament"
            className="w-16 h-16 text-zinc-700 mx-auto mb-4"
          />
          <p className="text-zinc-400">{t("live.failed_to_load")}</p>
        </div>
      </div>
    );
  }

  const { tournament, users, rounds, topcutPlayers } = tournamentData;

  // Tabs configuration
  const tabs = [
    {
      id: "brackets" as TabType,
      label: t("live.brackets"),
      icon: "mdi:tournament",
    },
    {
      id: "standings" as TabType,
      label: t("live.table"),
      icon: "mdi:format-list-numbered",
    },
    {
      id: "decklists" as TabType,
      label: t("live.topcut_decklists"),
      icon: "mdi:cards",
      disabled: !topcutPlayers || topcutPlayers.length === 0,
    },
    {
      id: "graphs" as TabType,
      label: t("tournament.data_graphs", { defaultValue: "Data & Graphs" }),
      icon: "mdi:chart-pie",
      disabled: !tournamentData.topcutData || tournamentData.topcutData.decks.length === 0,
    },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-7xl space-y-6">
        {/* Header */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Tournament Info */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Icon icon="mdi:tournament" className="w-8 h-8 text-white" />
                {t("live.tournament_number", { id: tournament.id })}
              </h1>
              <p className="text-zinc-400">
                {formatDate(tournament.starttime)}
              </p>
              {tournament.endtime && (
                <span className="inline-block px-3 py-1 bg-zinc-800 text-zinc-400 text-sm rounded border border-zinc-700">
                  {t("history.completed")}
                </span>
              )}
            </div>

            {/* Players Preview */}
            <div className="flex flex-col items-start md:items-end gap-2">
              <span className="text-sm text-zinc-500">
                {users.length} {t("history.players_count")}
              </span>
              <div className="flex -space-x-3">
                {users.slice(0, 8).map((user) => (
                  <PlayerAvatar
                    key={user.user_id}
                    className="cursor-pointer border-2 border-zinc-900 hover:border-zinc-700 transition-colors"
                    id={user.user_id}
                    avatar={user.avatar}
                    displayname={user.displayname}
                    username={user.username}
                    stacked
                    rounded
                    onClick={() => navigate(`/profile/${user.user_id}`)}
                  />
                ))}
                {users.length > 8 && (
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center">
                    <span className="text-xs text-zinc-400">
                      +{users.length - 8}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const isDisabled = tab.disabled;

              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id)}
                  disabled={isDisabled}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                    ${
                      isActive
                        ? "bg-white text-black"
                        : isDisabled
                        ? "text-zinc-600 cursor-not-allowed"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                    }
                  `}
                >
                  <Icon icon={tab.icon} className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <DetailsTab tournament={tournament} />

        {/* Content */}
        {activeTab === "brackets" && (
          <>
            <BracketsTab rounds={rounds} users={users} />
          </>
        )}
        {activeTab === "standings" && (
          <StandingsTab users={calculateTiebreakers(tournamentData)} endtime={tournamentData.tournament.endtime} />
        )}
        {activeTab === "decklists" && (
          <DecklistsTab
            cards={cards}
            players={topcutPlayers}
            isLoadingCards={isLoadingCards}
          />
        )}
        {activeTab === "graphs" && tournamentData.topcutData && (
          <DataGraphsTab topcutData={tournamentData.topcutData} />
        )}
      </div>
    </div>
  );
};

// ============================================================================
// INLINE COMPONENTS (TABS)
// ============================================================================

// Details Tab
const DetailsTab = ({
  tournament,
}: {
  tournament: TournamentDetail["tournament"];
}) => {
  const { t } = useTranslation();
  const settingsBits = Number.parseInt(String(tournament.settings), 10);
  const decoded = decodeDuelData(
    Number.isFinite(settingsBits) ? settingsBits : 0,
    t
  );

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 space-y-4">
      <h2 className="text-xl font-bold text-white mb-4">{t('live.details')}</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <InfoCard
          icon="mdi:shield-check"
          label={t('banlist')}
          value={tournament.banlist}
        />
        <InfoCard
          icon="mdi:cog"
          label={t('region')}
          value={decoded.region}
        />
        <InfoCard
          icon="mdi:cards"
          label={t('live.master_rule')}
          value={`MR ${decoded.mr}`}
        />
        <InfoCard
          icon="mdi:account-group"
          label={t("history.players_count")}
          value={t("live.registered_players", { count: tournament.players })}
        />
      </div>

      {tournament.refteam && (
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Icon icon="mdi:shield-account" className="w-4 h-4" />
          <span>
            {t('common.ref_team', { defaultValue: 'Referee Team' })}: {tournament.refteam}
          </span>
        </div>
      )}
    </div>
  );
};

// Brackets Tab
const BracketsTab = ({ rounds, users }: { rounds: Round[]; users: TournamentUser[] }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expandedRound, setExpandedRound] = useState<number | null>(
    rounds.length > 0 ? rounds[rounds.length - 1].id : null
  );

  const getUserById = (id: string) => users.find((u) => u.user_id === id);

  if (rounds.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-12 text-center">
        <Icon icon="mdi:tournament" className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
        <p className="text-zinc-400">{t('common.no_data')}</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 space-y-3">
      {Array.from(rounds).reverse().map((round) => {
        const isExpanded = expandedRound === round.id;

        return (
          <div key={round.id} className="border border-zinc-800 rounded-lg overflow-hidden">
            {/* Round Header - Collapsible */}
            <button
              onClick={() => setExpandedRound(isExpanded ? null : round.id)}
              className="w-full flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white text-black px-3 py-1 rounded font-bold text-sm">
                  {t('round')} {round.phase}
                </div>
                <span className="text-zinc-500 text-sm">
                  {round.duels.length}{" "}
                  {round.duels.length === 1
                    ? t("live.duel_singular")
                    : t("live.duel_plural")}
                </span>
              </div>
              <Icon
                icon={isExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                className="w-5 h-5 text-zinc-400"
              />
            </button>

            {/* Grid responsivo: 2 colunas desktop, 1 mobile */}
            {isExpanded && (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {round.duels.map((duel, idx) => {
                    const player1 = getUserById(duel.duelist1);
                    const player2 = getUserById(duel.duelist2);
                    const isFinished = duel.result !== -1;
                    const isBye = duel.duelist2 === '0' || !player2;

                    // Determinar cores baseado no status
                    let borderColor = 'border-zinc-700'; // Em andamento (cinza)
                    if (isFinished && isBye) {
                      borderColor = 'border-blue-500/30'; // BYE (azul)
                    }

                    return (
                      <div
                        key={`${round.id}-${idx}`}
                        className={`bg-zinc-800/50 border-2 relative ${borderColor} rounded-lg overflow-hidden transition-colors hover:border-zinc-600`}
                      >
                        {/* Player 1 */}
                        <DuelPlayerCard
                          user={player1}
                          isWinner={duel.winner === duel.duelist1}
                          isFinished={isFinished}
                          isBye={isBye && duel.winner === duel.duelist1}
                          onClick={() =>
                            player1 && navigate(`/profile/${player1.user_id}`)
                          }
                        />

                        {/* Divider - sem score individual */}
                        {!isFinished && (
                          <div className="flex min-h-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 justify-center items-center gap-2 text-zinc-500 text-xs">
                            <Icon icon="mdi:clock-outline" className="w-4 h-4" />
                            <span>{t("common.in_progress")}</span>
                          </div>
                        )}

                        {/* Player 2 */}
                        <DuelPlayerCard
                          user={player2}
                          isWinner={duel.winner === duel.duelist2}
                          isFinished={isFinished}
                          isBye={false}
                          isByeOpponent={isBye}
                          onClick={() =>
                            player2 && navigate(`/profile/${player2.user_id}`)
                          }
                        />
                      </div>
                    );
                  })}

                  {/* BYE Card */}
                  {round.bye && (
                    <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-500/20 p-2 rounded-lg">
                          <Icon icon="mdi:shield-check" className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <PlayerAvatar
                              id={getUserById(round.bye)?.user_id || round.bye}
                              avatar={getUserById(round.bye)?.avatar || null}
                              displayname={getUserById(round.bye)?.displayname}
                              username={getUserById(round.bye)?.username}
                              className="w-8 h-8 cursor-pointer"
                              onClick={() => {
                                const user = getUserById(round.bye);
                                if (user) navigate(`/profile/${user.user_id}`);
                              }}
                            />
                            <div className="flex-1">
                              <p className="text-white font-semibold">
                                {getUserById(round.bye)?.displayname || round.bye}
                              </p>
                              <p className="text-blue-400 text-sm font-medium">BYE - {t('common.auto_win', { defaultValue: 'Auto Win' })}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Standings Tab
const StandingsTab = ({ users, endtime }: { users: PlayerStats[], endtime: string | null }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-800 border-b border-zinc-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {t("player")}
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {t("w_l_d")}
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {t("win_rate")}
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {t("leaderboard_page.rating")}
              </th>
              {endtime && <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {t("leaderboard_page.tiebreaker")}
              </th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {users.map((user, index) => {
              const winRate =
                user.wins + user.losses > 0
                  ? (user.wins / (user.wins + user.losses)) *
                    100
                  : 0;

              return (
                <tr
                  key={user.id}
                  className="hover:bg-zinc-800/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/profile/${user.id}`)}
                >
                  <td className="px-4 py-3">
                    <span
                      className={`font-bold ${
                        index === 0
                          ? "text-yellow-400"
                          : index === 1
                          ? "text-zinc-300"
                          : index === 2
                          ? "text-orange-400"
                          : "text-zinc-500"
                      }`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <PlayerAvatar
                        id={user.id}
                        avatar={user.avatar || ""}
                        displayname={user.displayname}
                        username={user.username}
                        className="w-8 h-8"
                      />
                      <div>
                        <p className="text-white font-medium">
                          {user.displayname}
                        </p>
                        <p className="text-zinc-500 text-sm">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-zinc-300">
                      {user.wins} - {user.losses} - {user.draws}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-semibold ${
                        winRate >= 60
                          ? "text-green-400"
                          : winRate >= 50
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {winRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-white font-semibold">
                      {user.rating}
                    </span>
                  </td>
                  {endtime && (
                    <td className="px-4 py-3 text-center">
                      <span className="text-white font-semibold">
                        {(user.tiebreaker ?? "")
                          .replace(/\./gi, "")
                          .padStart(11, "0")}
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Decklists Tab
const DecklistsTab = ({
  players,
  cards,
  isLoadingCards,
}: {
  players: TournamentUser[];
  cards: Card[];
  isLoadingCards: boolean;
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loadedDecks, setLoadedDecks] = useState<Record<string, Decklist>>({});

  // Convert deck data to Decklist format (runs even when `cards` is empty so we never spin forever)
  useEffect(() => {
    if (players.length === 0) {
      setLoadedDecks({});
      return;
    }

    const cardMap = new Map(cards.map((c) => [c.id, c]));
    const newLoadedDecks: Record<string, Decklist> = {};

    players.forEach((player) => {
      if (!player.deck?.fullDeck) return;

      const mainDeckCards: Card[] = [];
      const extraDeckCards: Card[] = [];
      const sideDeckCards: Card[] = [];

      player.deck.fullDeck.main.forEach((cardId) => {
        const card = cardMap.get(cardId);
        if (!card) return;

        if (
          card.type_tags.includes("Fusion") ||
          card.type_tags.includes("Synchro") ||
          card.type_tags.includes("XYZ") ||
          card.type_tags.includes("Xyz") ||
          card.type_tags.includes("Link")
        ) {
          extraDeckCards.push(card);
        } else {
          mainDeckCards.push(card);
        }
      });

      player.deck.fullDeck.side.forEach((cardId) => {
        const card = cardMap.get(cardId);
        if (card) sideDeckCards.push(card);
      });

      newLoadedDecks[player.user_id] = {
        archetypes: player.deck.archetypes.map((a) => a.name),
        mainDeck: mainDeckCards,
        extraDeck: extraDeckCards,
        sideDeck: sideDeckCards,
      };
    });

    setLoadedDecks(newLoadedDecks);
  }, [cards, players]);

  const playersWithDeckPayload = useMemo(
    () => players.filter((p) => p.deck?.fullDeck),
    [players]
  );

  if (isLoadingCards) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
        <div className="h-7 bg-zinc-800 rounded-md w-48 mb-6 animate-pulse"></div>
        <div className="grid grid-cols-1 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 animate-pulse"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-zinc-700"></div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-700"></div>
                    <div className="space-y-1 flex-1">
                      <div className="h-5 bg-zinc-700 rounded w-32"></div>
                      <div className="h-4 bg-zinc-700/70 rounded w-24"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-20 bg-zinc-700/50 rounded"></div>
                <div className="h-32 bg-zinc-700/30 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-12 text-center">
        <Icon
          icon="mdi:cards"
          className="w-16 h-16 text-zinc-700 mx-auto mb-4"
        />
        <p className="text-zinc-400">
          {t("common.no_decklists", { defaultValue: "No decklists available" })}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">
        {t("live.topcut_decklists")}
      </h2>

      {!isLoadingCards &&
        cards.length === 0 &&
        playersWithDeckPayload.length > 0 && (
          <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {t("live.cards_unavailable")}
          </div>
        )}

      <div className="grid grid-cols-1 gap-4">
        {players.map((player, index) => {
          const deck = loadedDecks[player.user_id];
          if (!deck || !player.deck) return null;

          return (
            <div
              key={player.user_id}
              className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                    index === 0
                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      : index === 1
                      ? "bg-zinc-500/20 text-zinc-300 border border-zinc-500/30"
                      : index === 2
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                      : "bg-zinc-700 text-zinc-400"
                  }`}
                >
                  {index + 1}
                </div>

                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => navigate(`/profile/${player.user_id}`)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <PlayerAvatar
                      id={player.user_id}
                      avatar={player.avatar}
                      displayname={player.displayname}
                      username={player.username}
                      className="w-8 h-8"
                    />
                    <div>
                      <p className="text-white font-semibold">
                        {player.displayname}
                      </p>
                      <p className="text-zinc-500 text-sm">
                        @{player.username}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <DeckExport deck={deck} code={player.deck.code} />
              <DeckDisplay deck={deck} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Helper Components
const InfoCard = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
    <div className="flex items-center gap-3">
      <Icon icon={icon} className="w-6 h-6 text-zinc-400" />
      <div>
        <p className="text-zinc-500 text-sm">{label}</p>
        <p className="text-white font-semibold">{value}</p>
      </div>
    </div>
  </div>
);

const DuelPlayerCard = ({
  user,
  isWinner,
  isFinished,
  isBye,
  isByeOpponent,
  onClick,
}: {
  user?: TournamentUser;
  isWinner: boolean;
  isFinished: boolean;
  isBye?: boolean;
  isByeOpponent?: boolean;
  onClick?: () => void;
}) => {
  const { t } = useTranslation();

  let bgColor = "bg-zinc-800/30";
  let borderColor = "border-l-zinc-700";
  let textColor = "text-zinc-300";

  if (isFinished) {
    if (isBye) {
      // Vitória com BYE (azul sólido - sem gradiente)
      bgColor = 'bg-blue-500/10';
      borderColor = 'border-l-blue-500';
      textColor = 'text-white';
    } else if (isWinner) {
      // Vitória (verde)
      bgColor = 'bg-green-500/10';
      borderColor = 'border-l-green-500';
      textColor = 'text-white';
    } else {
      // Derrota (vermelho)
      bgColor = 'bg-red-500/10';
      borderColor = 'border-l-red-500';
      textColor = 'text-zinc-400';
    }
  }

  if (isByeOpponent) {
    return (
      <div className="p-4 bg-zinc-900/50 border-l-4 border-l-zinc-800">
        <div className="flex items-center gap-2 text-zinc-600">
          <Icon icon="mdi:close-circle" className="w-5 h-5" />
          <span className="text-sm font-medium">{t("live.bye_short")}</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`p-4 ${bgColor} border-l-4 ${borderColor}`}>
        <div className="flex items-center gap-2 text-zinc-600">
          <Icon icon="mdi:account-off" className="w-5 h-5" />
          <span className="text-sm">{t("live.unknown_player")}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 ${bgColor} border-l-4 ${borderColor} cursor-pointer hover:brightness-110 transition-all`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <PlayerAvatar
          id={user.user_id}
          avatar={user.avatar}
          displayname={user.displayname}
          username={user.username}
          className="w-10 h-10"
        />
        <div className="flex-1 min-w-0">
          <p className={`font-semibold truncate ${textColor}`}>{user.displayname}</p>
          <div className="flex items-center gap-2">
            <p className="text-zinc-500 text-xs">@{user.username}</p>
            {isFinished && (
              <>
                {isBye && (
                  <span className="text-xs font-medium text-blue-400 flex items-center gap-1">
                    <Icon icon="mdi:shield-check" className="w-3 h-3" />
                    {t("live.bye_short")}
                  </span>
                )}
                {isWinner && !isBye && (
                  <span className="text-xs font-medium text-green-400 flex items-center gap-1">
                    <Icon icon="mdi:trophy" className="w-3 h-3" />
                    {t("live.result_win")}
                  </span>
                )}
                {!isWinner && !isBye && (
                  <span className="text-xs font-medium text-red-400 flex items-center gap-1">
                    <Icon icon="mdi:close-circle" className="w-3 h-3" />
                    {t("live.result_loss")}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Data & Graphs Tab
const DataGraphsTab = ({ topcutData }: { topcutData: TopcutData }) => {
  const { t } = useTranslation();

  // Transform topcutData to DeckPieChartData format
  const chartData: DeckPieChartData[] = useMemo(() => {
    const divisor = topcutData.totalPlayers > 0 ? topcutData.totalPlayers : 1;
    return topcutData.decks
      .map((deck) => ({
        name: deck.primaryArchetype,
        value: deck.qty,
        percentage: ((deck.qty / divisor) * 100).toFixed(1),
        cardId: deck.archetypes[0]?.ids[0] || null,
        archetypes: deck.archetypes.map((arch) => ({
          name: arch.name,
          percentage: arch.percentage.toString(),
          ids: arch.ids,
        })),
        hasVariants: false,
      }))
      .sort((a, b) => b.value - a.value);
  }, [topcutData]);

  return (
    <div className="space-y-6">
      {/* Stats Table */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Icon icon="mdi:table" className="w-5 h-5 text-blue-400" />
            {t('tournament.topcut_breakdown', { defaultValue: 'Top Cut Breakdown' })}
          </h3>
          <p className="text-sm text-zinc-500 mt-1">
            {topcutData.totalPlayers} {t('tournament.players_lowercase', { defaultValue: 'players' })} · {topcutData.uniqueDecks} {t('tournament.unique_decks', { defaultValue: 'unique decks' })}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {t('tournament.deck', { defaultValue: 'Deck' })}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {t('tournament.archetypes', { defaultValue: 'Archetypes' })}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {t('tournament.players', { defaultValue: 'Players' })}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {t('tournament.percentage', { defaultValue: 'Percentage' })}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {topcutData.decks.map((deck, index) => {
                const divisor = topcutData.totalPlayers > 0 ? topcutData.totalPlayers : 1;
                const pct = (deck.qty / divisor) * 100;
                const percentage = pct.toFixed(1);
                const barWidth = Math.min(pct, 100);
                return (
                  <tr
                    key={`${deck.primaryArchetype}-${deck.qty}-${index}`}
                    className="hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-zinc-500">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {deck.archetypes[0]?.ids[0] && (
                          <img
                            src={`https://ygopro.online/assets/card-arts/${deck.archetypes[0].ids[0]}.jpg`}
                            alt={deck.primaryArchetype}
                            className="w-12 h-12 rounded object-cover border border-zinc-700"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <span className="text-white font-medium">
                          {deck.primaryArchetype}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {deck.archetypes.map((arch, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-zinc-800 text-gray-300 px-2 py-1 rounded border border-zinc-700"
                          >
                            {arch.name} ({arch.percentage}%)
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-white font-semibold">
                        {deck.qty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-white font-semibold">
                          {percentage}%
                        </span>
                        <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pie Chart */}
      <DeckPieChart
        data={chartData}
        title={t('tournament.topcut_distribution', { defaultValue: 'Top Cut Distribution' })}
        subtitle={t('tournament.topcut_subtitle', { 
          defaultValue: 'Visual breakdown of deck archetypes',
          count: topcutData.totalPlayers,
          unique: topcutData.uniqueDecks 
        })}
        totalPlayers={topcutData.totalPlayers}
        uniqueDecks={topcutData.uniqueDecks}
      />
    </div>
  );
};

export default Tournament;
