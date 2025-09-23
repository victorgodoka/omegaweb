import React, { type JSX } from "react";
import { Link, useLinkClickHandler, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Navbar, NavbarBrand, NavbarToggle, NavbarCollapse, NavbarLink, Popover, DropdownItem, Dropdown, DropdownHeader, DropdownDivider } from "flowbite-react";
import { theme } from "./theme";
import { Icon } from "@iconify/react";
import LanguageSwitcher from "./LanguageSwitcher";
import { PlayerAvatar } from "../PlayerAvatar";
import { useAuthContext } from "@/contexts/AuthContext";

const VITE_DISCORD_URL = import.meta.env.VITE_DISCORD_URL;

interface NavLink {
  to: string;
  label: string;
  icon: JSX.Element;
}

const NavbarWrapper: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuthContext();
  const navLinks: NavLink[] = [
    { to: "/", label: t("nav.home"), icon: <Icon icon="fluent:home-20-filled" /> },
    { to: "/tournament/live", label: t("nav.live_tournament"), icon: <Icon icon="fluent:live-20-filled" /> },
    { to: "/history", label: t("nav.past_tournaments"), icon: <Icon icon="material-symbols:trophy" /> },
    { to: "/leaderboards", label: t("nav.leaderboard"), icon: <Icon icon="material-symbols:leaderboard" /> },
    { to: "/statistics", label: t("nav.statistics"), icon: <Icon icon="picon:chart" /> },
    { to: "/calculator", label: t("nav.calculator"), icon: <Icon icon="tabler:math" /> },
    { to: "/pdf-decklist", label: t("nav.pdf_decklist"), icon: <Icon icon="teenyicons:pdf-outline" /> },
  ];

  // Precompute click handlers to comply with hooks rules
  const clickHandlers = navLinks.reduce<Record<string, ReturnType<typeof useLinkClickHandler>>>((acc, link) => {
    acc[link.to] = useLinkClickHandler(link.to);
    return acc;
  }, {});

  return (
    <Navbar theme={theme} applyTheme={{ root: { base: "replace", inner: { base: "replace" } }, collapse: { list: "replace" } }}>
      <NavbarBrand as={Link} href="/">
        <img src="/logo.png" alt={t("alt_texts.logo")} className="h-12 w-auto mr-4" />
        <span className="font-bold text-xl text-white">Omega</span>
      </NavbarBrand>
      <div className="flex md:order-2 gap-4">
        <LanguageSwitcher />
        {user && user.id !== '0'
          ?
          <Dropdown arrowIcon={false}
            inline
            label={
              <PlayerAvatar rounded bordered size="md" color="success" id={user.id} avatar={user.avatar} />
            }
          >
            <DropdownHeader>
              <span className="block text-sm">
                {user.displayname ? user.displayname + " — " : ""}@{user.username}
              </span>
            </DropdownHeader>
            <DropdownDivider />
            <DropdownItem>
              <Link
                to={`/profile/${user.id}`}
                className="flex items-center space-x-2"
              >
                <Icon icon="mdi:account" />
                <span>{t("profile.my_profile")}</span>
              </Link>
            </DropdownItem>
            <DropdownItem>
              <Link
                to={`/profile/edit`}
                className="flex items-center space-x-2"
              >
                <Icon icon="mdi:account-edit" />
                <span>{t("profile.edit_profile")}</span>
              </Link>
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem>
              <a
                href="#"
                onClick={logout}
                className="flex items-center space-x-2"
              >
                <Icon icon="material-symbols:logout" />
                <span className="text-white">{t("profile.logout")}</span>
              </a>
            </DropdownItem>
          </Dropdown>
          : <a href={VITE_DISCORD_URL}>
            <span className="w-8 h-8 rounded-full text-white text-5xl p-1 hover:bg-orange-500 flex items-center justify-center">
              <Icon icon="prime:discord" />
            </span>
          </a>
        }
        <NavbarToggle />
      </div>
      <NavbarCollapse>
        {navLinks.map((link) => (
          <Popover aria-labelledby={link.label} content={<span className="text-white p-2 text-lg">{link.label}</span>} trigger="hover" placement="bottom" key={link.to}>
            {/* @ts-ignore */}
            <NavbarLink as={Link} title={link.label} active={location.pathname === link.to} to={link.to} className="flex items-center gap-1" onClick={clickHandlers[link.to]}>
              <span className="w-8 h-8 rounded-full text-white text-lg hover:bg-orange-500 flex items-center justify-center">{link.icon}</span>
              <span className="md:hidden text-white uppercase font-semibold">{link.label}</span>
            </NavbarLink>
          </Popover>
        ))}
      </NavbarCollapse>
    </Navbar>
  );
};

export default NavbarWrapper;

