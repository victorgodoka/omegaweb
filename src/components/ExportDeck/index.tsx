import { prepareDecklist, findPlayer, addToOmega } from "@/utils/Cards"
import { copyToClipboard, downloadFile } from "@/utils/Functions"
import { Button, TextInput, Tooltip } from "flowbite-react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next";
import type { Player } from "@/pages/Live/types";

const ExportDeck = ({ deck, players }: { deck: DeckLists, players: Player[] }) => {
  const { t } = useTranslation();
  return <div className="items-center grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 col-span-4 gap-2 bg-zinc-950 text-white p-4 rounded-xl">
    <TextInput
      className="w-full md:col-span-2 xl:col-span-4"
      readOnly
      addon={<Tooltip content={t('export_deck.copy_tooltip')}><span onClick={() => copyToClipboard(deck?.code, t)} className="cursor-pointer icon-[tabler--copy]" role="img" aria-hidden="true" /></Tooltip>}
      value={deck?.code}
    />
    <Button color="cyan" className="w-full" onClick={() => downloadFile(prepareDecklist(deck.passwords.mainDeck, deck.passwords.sideDeck, findPlayer(players, deck?.id)), 'Decklist.ydk')}>
      {t('export_deck.download_ydk')}
    </Button>
    <Button color="purple" className="w-full" onClick={() => addToOmega(deck?.code, findPlayer(players, deck?.id))}>
      {t('export_deck.import_omega')}
    </Button>
    <Button color="yellow" target="_blank" className="w-full cursor-pointer" as={'a'} href={`https://duelistsunite.org/omega-api-decks/imageify?quality=100&token=fc251ea703476dea9f037898611a14fa3d3e4cde99f6b3b81b4e25&list=${encodeURIComponent(deck?.code)}`}>
      {t('export_deck.get_image')}
    </Button>
    <Button color="indigo" target="_blank" className="w-full cursor-pointer" as={Link} to={`/export?code=${encodeURIComponent(deck?.code)}`}>
      {t('export_deck.export_pdf')}
    </Button>
  </div>
}

export default ExportDeck
