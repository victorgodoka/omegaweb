import { api } from './Api';
import { toast } from "react-toastify";

export const prepareDecklist = (main: number[], side: number[]) => {
  const lines = `#created by Duelist Unite\n`
  const mainLines = `#main & extra\n${main.join('\n')}`
  const sideLines = `!side\n${side.join('\n')}`
  return `${lines}\n${mainLines}\n${sideLines}`
}

export const addToOmega = async (code: string, deckname?: string) => {
  const deckName = deckname || `New Deck`
  try {
    const response = await api.external.localDeckServer.addDeck(deckName, code);
    if (response.ok) {
      toast('Deck imported with success.')
    } else {
      toast.error('Failed to import deck. Make sure your YGO Omega is open and logged!')
    }
  } catch (error) {
    toast.error('Make sure your YGO Omega is open and logged!')
  }
}

