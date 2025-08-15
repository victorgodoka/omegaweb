import { tcgHref } from "@/utils/Functions"
import { Popover } from "flowbite-react"
import Image from "@/ui/Image"

const CardLink = ({ c }: { c: TournamentDeckData }) =>
  <li className="text-black cursor-pointer border-b border-zinc-950/15">
    <Popover placement="right" content={<Image className="w-60" defaultSrc="/back.png" src={`https://ygopro.online/assets/card-images/common/${c.id}.jpg`} />} trigger="hover">
      <a className="p-4 inline-block" href={tcgHref(c.name)} target="_blank">{c.qtd} {c.name}</a>
    </Popover>
  </li>

export default CardLink