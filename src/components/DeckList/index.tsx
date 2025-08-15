import CardLink from "@/components/CardLink"

const DeckList = ({ deck }: { deck: DeckLists }) => <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 col-span-4 gap-x-2 gap-y-4">
  <ul className="bg-zinc-200 rounded-2xl">
    <li className="bg-zinc-950 text-white p-4 rounded-t-xl">
      <p className="text-xl">Main Deck ({deck?.mainDeck.reduce((a, b) => b.qtd + a, 0)})</p>
    </li>
    {deck?.mainDeck.map(c => <CardLink c={c} key={c.id} />)}
  </ul>
  <ul className="bg-zinc-200 rounded-2xl">
    <li className="bg-zinc-950 text-white p-4 rounded-t-xl">
      <p className="text-xl">Extra Deck ({deck?.extraDeck.reduce((a, b) => b.qtd + a, 0)})</p>
    </li>
    {deck?.extraDeck.map(c => <CardLink c={c} key={c.id} />)}
  </ul>
  <ul className="bg-zinc-200 rounded-2xl">
    <li className="bg-zinc-950 text-white p-4 rounded-t-xl">
      <p className="text-xl">Side Deck ({deck?.sideDeck.reduce((a, b) => b.qtd + a, 0)})</p>
    </li>
    {deck?.sideDeck.map(c => <CardLink c={c} key={c.id} />)}
  </ul>
</div>

export default DeckList
