import { getAvatarUrl } from "@/utils/DiscordAvatar";
import { getDuelist } from "@/utils/Functions";
import { Avatar } from "flowbite-react";
import { Link } from "react-router";
import Image from "@/ui/Image";
import { useTranslation } from "react-i18next";
import type { Player, Room } from "@/pages/Live/types";

type DuelWrapperProps = {
  room: Room;
  players: Player[];
};

export const DuelWrapper = ({ room, players }: DuelWrapperProps) => {
  const { t } = useTranslation();
  return (
  <div className={`${!room.end ? 'bg-zinc-800' : room.result === 2 ? 'bg-cyan-900' : (room.result === 0 ? 'bg-gradient-to-r' : room.result === 1 ? 'bg-gradient-to-l' : 'bg-red-700')} z-0 from-green-500 to-red-700 via-zinc-500 px-4 py-2 rounded-md relative grid grid-cols-[1fr_64px_1fr] gap-4 items-center justify-center`}>
    <div style={{ backgroundSize: '100% auto', backgroundImage: `url(/texture.png)` }} className="-mt-1 bg-no-repeat absolute w-full top-0 right-0 rounded-md overflow-hidden [mask-image:linear-gradient(360deg,rgba(39,39,42,0),rgba(39,39,42,1))] h-[80px] -z-10"></div>
    <Link to={`/profile/${room.duelist1}`} className="flex items-center space-x-2 justify-end">
      <p className="text-white">{getDuelist(room.duelist1, players, t).displayname || getDuelist(room.duelist1, players, t).username}</p>
      <Avatar
        img={(props) => <Image {...props} defaultSrc="/default.png" src={getAvatarUrl(room.duelist1, getDuelist(room.duelist1, players, t).avatar!)} />}
        size="lg"
        bordered
        color={!room.end ? 'gray' : room.result === 0 ? 'success' : 'failure'}
        className="hidden md:block"
        rounded
      />
    </Link>
    <div className="text-center"><img className="inline-block" src="/vs.png" alt="vs" /></div>
    <Link to={`${room.duelist2 !== "0" ? `/profile/${room.duelist2}` : '#'}`} className="flex items-center space-x-2 justify-start">
      <Avatar
        img={(props) => <Image {...props} defaultSrc="/default.png" src={getAvatarUrl(room.duelist2, getDuelist(room.duelist2, players, t).avatar!)} />}
        size="lg"
        bordered
        color={!room.end ? 'gray' : room.result === 1 ? 'success' : 'failure'}
        className="hidden md:block"
        rounded
      />
      <p className="text-white">{getDuelist(room.duelist2, players, t).displayname || getDuelist(room.duelist2, players, t).username}</p>
    </Link>
  </div>
  );
};
