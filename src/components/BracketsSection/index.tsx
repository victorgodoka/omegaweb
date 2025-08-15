import { DuelWrapper } from "@/components/DuelWrapper";
import type { Player, Round } from "@/pages/Live/types";
const ByeRoom = (player: string, round: number) => ({ room_id: 0, round_id: round, duelist1: player, duelist2: '0', end: '2025-12-12', result: 0 });

type BracketsSectionProps = { rounds: Round[]; players: Player[] };
import { useTranslation } from "react-i18next";

export const  BracketsSection = ({ rounds, players }: BracketsSectionProps) => {
  const { t } = useTranslation();
  return (
    <>
      {rounds.map((round, i) => (
        <div key={round.id}>
          <h2 className="py-4 text-2xl text-white nunito-sans">{t('round')} {i + 1}</h2>
          <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
            {round.rooms.map(room => <DuelWrapper key={room.room_id + '__' + room.duelist1 + '__' + room.duelist2} room={room} players={players} />)}
            {round.bye && <DuelWrapper room={ByeRoom(round.bye, round.id)} players={players} />}
          </div>
        </div>
      ))}
    </>
  );
};
