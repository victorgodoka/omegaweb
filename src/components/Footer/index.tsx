import moment from "moment";
import { Icon } from "@iconify/react";

const FooterContainer = () => {
  return (
    <footer className="w-full bg-zinc-900 border-t border-zinc-800 py-4 px-4 mt-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between">
        <div className="text-zinc-300 text-sm flex items-center mb-2 sm:mb-0">
          <a href="https://duelistsunite.org/" className="font-semibold text-white hover:text-orange-bg-orange-500 transition-colors" target="_blank" rel="noopener noreferrer">
            Duelists Unite
          </a>
          <span className="mx-2">©</span>
          <span>{moment().format('YYYY')}</span>
        </div>
        <div className="flex space-x-2 text-white text-xl">
          <a className="hover:bg-orange-500 w-10 h-10 flex items-center justify-center rounded-full transition-colors" href="https://discord.gg/duelistsunite" target="_blank" rel="noopener noreferrer">
            <Icon icon="fa6-brands:discord" className="w-6 h-6" />
          </a>
          <a className="hover:bg-orange-500 w-10 h-10 flex items-center justify-center rounded-full transition-colors" href="https://twitter.com/duelists_u" target="_blank" rel="noopener noreferrer">
            <Icon icon="iconoir:x" className="w-6 h-6" />
          </a>
          <a className="hover:bg-orange-500 w-10 h-10 flex items-center justify-center rounded-full transition-colors" href="https://www.twitch.tv/duelists_unite" target="_blank" rel="noopener noreferrer">
            <Icon icon="icomoon-free:twitch" className="w-6 h-6" />
          </a>
          <a className="hover:bg-orange-500 w-10 h-10 flex items-center justify-center rounded-full transition-colors" href="https://www.youtube.com/channel/UCiozlBh8DnlxtoiWLoKZ4Ew" target="_blank" rel="noopener noreferrer">
            <Icon icon="mdi:youtube" className="w-6 h-6" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default FooterContainer;
