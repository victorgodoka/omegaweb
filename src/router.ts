import { createHashRouter } from "react-router";
import { lazy } from "react";
import App from "./App";

// Lazy load page components for code splitting
const Home = lazy(() => import("@/pages/Home"));
const Live = lazy(() => import("@/pages/Live"));
const Statistics = lazy(() => import("@/pages/Statistics"));
const History = lazy(() => import("@/pages/History"));
const Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const Profile = lazy(() => import("@/pages/Profile"));
const ProfileEdit = lazy(() => import("@/pages/ProfileEdit"));
const Discord = lazy(() => import("@/pages/Discord"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const CatchDiscordError = lazy(() => import("@/components/CatchDiscord"));
const PDFGenerator = lazy(() => import("@/pages/PDFGenerator"));
const HypergeometricCalculator = lazy(() => import("@/pages/HypergeometricCalculator"));
const SmallWorldResolver = lazy(() => import("@/pages/SmallWorldResolver"));

export const router = createHashRouter([
  {
    path: "/",
    Component: App,
    children: [
      { path: "/", Component: Home },
      { path: "/tournament/live", Component: Live },
      { path: "/tournament/:id", Component: Live },
      { path: "/statistics", Component: Statistics },
      { path: "/history", Component: History },
      { path: "/leaderboards", Component: Leaderboard },
      { path: "/profile/:id", Component: Profile },
      { path: "/profile/edit", Component: ProfileEdit },
      { path: "/discord", Component: Discord },
      { path: "/not-found", Component: NotFound, id: "notfound" },
      { path: "/pdf-decklist", Component: PDFGenerator },
      { path: "/calculator", Component: HypergeometricCalculator },
      { path: "/small-world", Component: SmallWorldResolver },
      { path: "*", Component: CatchDiscordError },
    ],
  },
]); 
