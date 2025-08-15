import { findPlayer } from "@/utils/Cards";
import ExportDeck from "@/components/ExportDeck";
import DeckList from "@/components/DeckList";
import { Icon } from "@iconify/react";
import Image from "@/ui/Image";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { Player } from "@/pages/Live/types";

type TopcutDecklistsProps = { deckListsEnd: DeckLists[]; players: Player[] };

const getMedals = (t: any) => [
  <span className="text-2xl" role="img" aria-label={t("positions.1st_place")}>🥇</span>,
  <span className="text-2xl" role="img" aria-label={t("positions.2nd_place")}>🥈</span>,
  <span className="text-2xl" role="img" aria-label={t("positions.3rd_place")}>🥉</span>,
];

import { useState } from "react";
import { getAvatarUrl } from "@/utils/DiscordAvatar";

export const TopcutDecklists = ({ deckListsEnd, players }: TopcutDecklistsProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { t } = useTranslation();
  const medals = getMedals(t);

  return (
    <div className="grid grid-cols-1 gap-8">
      {deckListsEnd.map((deck, i) => {
        const player = findPlayer(players, deck?.id) || { username: '', displayname: '', id: deck?.id, avatar: '' };
        const isOpen = openIndex === i;
        return (
          <div
            key={deck?.id}
            className="bg-zinc-950/90 rounded-2xl shadow-lg border border-zinc-800 flex flex-col overflow-hidden"
          >
            <button
              className={`flex cursor-pointer items-center gap-4 px-6 py-4 border-b border-zinc-800 w-full text-left focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors duration-200 ${isOpen ? 'bg-zinc-950/70' : 'hover:bg-zinc-800/40'}`}
              aria-expanded={isOpen}
              aria-controls={`deck-details-${i}`}
              onClick={() => setOpenIndex(isOpen ? null : i)}
              type="button"
            >
              <Link to={`/profile/${player.id}`}>
                <Image className="h-20 w-20 border-2 border-orange-500" defaultSrc="/default.png" src={getAvatarUrl(player.id, player.avatar || "")} />
              </Link>
              <div className="flex flex-col gap-1 flex-1">
                <span className="font-bold text-lg text-zinc-100 flex items-center gap-2">
                  {i < 3 ? medals[i] : `#${i + 1}`} {player.displayname || player.username}
                </span>
                <span className="text-xs text-zinc-400">{player.username}</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {deck?.set.map((s, j) => (
                    <span key={j} className="bg-orange-500/90 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      {s.archetype}
                    </span>
                  ))}
                </div>
              </div>
              <span className={`ml-2 transition-transform text-2xl text-white ${isOpen ? 'rotate-180' : ''}`}><Icon icon="mdi:arrow-up-drop-circle" /></span>
            </button>
            <div
              id={`deck-details-${i}`}
              className={`grid grid-cols-1 gap-4 bg-zinc-800 px-6 transition-all duration-300 overflow-hidden ${isOpen ? 'py-6 opacity-100' : 'max-h-0 opacity-0 py-0'}`}
              aria-hidden={!isOpen}
            >
              {isOpen && <>
                <ExportDeck deck={deck} players={players} />
                <DeckList deck={deck} />
              </>}
            </div>
          </div>
        );
      })}
    </div>
  );
};
