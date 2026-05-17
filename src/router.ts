import { createHashRouter } from "react-router";
import { lazy } from "react";
import App from "./App";

// Lazy load page components for code splitting
const Home = lazy(() => import("@/pages/Home"));
const tournament = lazy(() => import("@/pages/Tournament"));
const Statistics = lazy(() => import("@/pages/Statistics"));
const History = lazy(() => import("@/pages/History"));
const Leaderboard = lazy(() => import("@/pages/Leaderboards"));
const Profile = lazy(() => import("@/pages/Profile"));
const Discord = lazy(() => import("@/pages/Discord"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const CatchDiscordError = lazy(() => import("@/components/CatchDiscord"));
const PDFGenerator = lazy(() => import("@/pages/PDFGenerator"));
const HypergeometricCalculator = lazy(() => import("@/pages/HypergeometricCalculator"));
// const DeckEditor = lazy(() => import("@/pages/DeckEditor"));
const KonamiDecklistConverter = lazy(() => import("@/pages/KonamiDecklistConverter"));
const DeckWiki = lazy(() => import("@/pages/DeckWiki"));
const UserDecks = lazy(() => import("@/pages/SavedDecks").then(m => ({ default: m.UserDecks })));
const DeckDetails = lazy(() => import("@/pages/SavedDecks").then(m => ({ default: m.DeckDetails })));
const AllDecks = lazy(() => import("@/pages/SavedDecks").then(m => ({ default: m.AllDecks })));

// Protected route wrappers
const ProtectedProfileEdit = lazy(() => import("@/components/ProtectedRoute/ProtectedProfileEdit.tsx"));
const ProtectedMyDecks = lazy(() => import("@/components/ProtectedRoute/ProtectedMyDecks.tsx"));
const ProtectedEditDeck = lazy(() => import("@/components/ProtectedRoute/ProtectedEditDeck.tsx"));

export const router = createHashRouter([
  {
    path: "/",
    Component: App,
    children: [
      { path: "/", Component: Home },
      { path: "/tournament/live", Component: tournament },
      { path: "/tournament/:id", Component: tournament },
      { path: "/statistics", Component: Statistics },
      { path: "/history", Component: History },
      { path: "/leaderboards", Component: Leaderboard },
      { path: "/profile/:id", Component: Profile },
      { path: "/profile/edit", Component: ProtectedProfileEdit },
      { path: "/discord", Component: Discord },
      { path: "/not-found", Component: NotFound, id: "notfound" },
      { path: "/pdf-decklist", Component: PDFGenerator },
      { path: "/calculator", Component: HypergeometricCalculator },
      // { path: "/deck-editor", Component: DeckEditor },
      { path: "/konami-decklist", Component: KonamiDecklistConverter },
      { path: "/deck-wiki", Component: DeckWiki },
      { path: "/decks", Component: AllDecks },
      { path: "/decks/me", Component: ProtectedMyDecks },
      { path: "/decks/:userId", Component: UserDecks },
      { path: "/decks/details/:deckId", Component: DeckDetails },
      { path: "/decks/edit/:deckId", Component: ProtectedEditDeck },
      { path: "*", Component: CatchDiscordError },
    ],
  },
]); 
