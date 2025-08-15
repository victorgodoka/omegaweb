import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AvatarGroup, AvatarGroupCounter, Tabs, TabItem } from "flowbite-react";
import { calculateTiebreakers } from "@/utils/Tiebreaker";
import { useParams, useNavigate } from "react-router";
import { useCache } from "@/contexts/CacheContext";
import { fetchApi } from "@/utils/Api";
import { loadDecklists } from "@/utils/Cards";
import moment from "moment";
import 'moment/locale/pt-br';
import { tabsTheme } from "@/utils/Themes";
import { getTopCut } from "@/utils/Functions";
import { Details } from "@/components/Details";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { TopcutDecklists } from "@/components/TopcutDecklists";
import { BracketsSection } from "@/components/BracketsSection";
import DiscordBanner from "@/components/DiscordBanner";
import LiveSkeleton from "./components/LiveSkeleton";
import type { TournamentData, Player, Round, Tournament, Table } from "./types";
// import Graphs from "@/components/Graphs";

const Live = () => {
  const { id: tournamentId } = useParams<"id">();
  const { t, i18n } = useTranslation();
  const { cardStats } = useCache();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [table, setTable] = useState<Table[]>([]);
  const [deckLists, setDeckList] = useState<DeckLists[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const fetchTournamentData = async (endpoint: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const resp = await fetchApi(endpoint);
      if (resp.ok && resp.data) {
        const { tournament, players, rounds, decks, table } = resp.data as TournamentData;
        setTournament(tournament);
        setPlayers(players);
        setRounds(rounds);
        setTable(table);
        setDeckList(loadDecklists(decks, cardStats));
      } else {
        setError(t('live.failed_to_load'));
      }
    } catch (e) {
      setError(t('live.unexpected_error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Sync Moment.js locale with current i18n language
    // Map common language codes to moment locales
    const lang = i18n.language?.toLowerCase() || 'en';
    const momentLocale = lang.startsWith('pt') ? 'pt-br' : 'en';
    moment.locale(momentLocale);

    let isMounted = true;
    const updateData = async () => {
      if (!isMounted) return;
      if (!tournamentId) {
        await fetchTournamentData('tournaments/live');
      } else if (isNaN(parseInt(tournamentId!))) {
        navigate("/");
      } else {
        await fetchTournamentData('tournaments/' + tournamentId);
      }
    };
    updateData();
  }, [tournamentId, i18n.language]);

  // Memoize tiebreakers for leaderboard
  const tiebreakers = useMemo(() => {
    return calculateTiebreakers({ players, rounds, table });
  }, [players, rounds, table]);

  // Memoize deckListsEnd for topcut decklists
  const deckListsEnd = useMemo(() => {
    if (players.length && rounds.length && deckLists.length) {
      const tiebreakerIds = calculateTiebreakers({ players, rounds, table })
        .slice(0, getTopCut(players.length))
        .map(d => d.id);
      return tiebreakerIds.map(id => deckLists.find(dl => dl.id === id)!)
    }
    return [];
  }, [players, rounds, deckLists, table]);

  if (error) {
    return <div className="w-full text-center py-12 text-lg text-red-500">{error}</div>;
  }

  if (isLoading) {
    return <LiveSkeleton />;
  }

  return (
    <div key={tournamentId} className="mt-8 w-full h-full mx-auto p-4 space-y-4 relative xl:max-w-[1280px] xl:mx-auto">
      {(tournament && players.length && rounds.length) ? (
        <>
          <DiscordBanner />
          <div className="px-8 md:px-0">
            <div className="py-8 border-b border-gray-600/35 flex flex-col items-center justify-center">
              <h1 className="nunito-sans text-white text-4xl">{t('live.tournament_number', { id: tournament.id })}</h1>
              <p className="text-gray-400 text-center">
                {(() => {
                  const lang = i18n.language?.toLowerCase() || 'en';
                  const mLoc = lang.startsWith('pt') ? 'pt-br' : 'en';
                  return moment.utc(tournament.starttime).locale(mLoc).format("LLL Z");
                })()}
              </p>
              <div className="flex my-2">
                <AvatarGroup>
                  {players.slice(0, 5).map(p => (
                    <PlayerAvatar
                      key={p.id}
                      className="cursor-pointer"
                      id={p.id}
                      avatar={p.avatar || '/default.png'}
                      displayname={p.displayname || p.username}
                      username={p.username}
                      stacked
                      rounded
                      onClick={() => navigate("/profile/" + p.id)}
                    />
                  ))}
                  {players.length > 5 && <AvatarGroupCounter total={players.length - 5} href="#" />}
                </AvatarGroup>
              </div>
            </div>
          </div>
          <Tabs
            variant="underline"
            theme={tabsTheme}
          >
            <TabItem title={t('live.details')}>
              <Details tournament={tournament} />
            </TabItem>
            <TabItem title={t('live.brackets')}>
              <BracketsSection players={players} rounds={rounds} />
            </TabItem>
            <TabItem title={t('live.table')}>
              <LeaderboardTable tiebreakers={tiebreakers} tournament={tournament} />
            </TabItem>
            <TabItem disabled={deckLists.length === 0 || !tournament.endtime} title={t('live.topcut_decklists')}>
              <TopcutDecklists deckListsEnd={deckListsEnd} players={players} />
            </TabItem>
            {/* <TabItem disabled={deckLists.length === 0 || !tournament.endtime} title={t('live.graphs')}>
              <Graphs deckLists={deckLists} players={players} rounds={rounds} table={table} />
            </TabItem> */}
          </Tabs>
        </>
      ) : null}
    </div>
  );
}

export default Live;