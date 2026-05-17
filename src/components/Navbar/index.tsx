import { useState, useRef, useEffect, type JSX } from 'react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { PlayerAvatar } from '../PlayerAvatar';
import { useAuthContext } from '@/contexts/AuthContext';

const VITE_DISCORD_URL = import.meta.env.VITE_DISCORD_URL;

interface NavLink {
  to: string;
  label: string;
  icon: JSX.Element;
}

const Navbar: React.FC = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const navLinks: NavLink[] = [
    {
      to: '/',
      label: t('nav.home'),
      icon: <Icon icon="fluent:home-20-filled" />,
    },
    {
      to: '/tournament/live',
      label: t('nav.live_tournament'),
      icon: <Icon icon="fluent:live-20-filled" />,
    },
    {
      to: '/history',
      label: t('nav.past_tournaments'),
      icon: <Icon icon="material-symbols:trophy" />,
    },
    {
      to: '/leaderboards',
      label: t('nav.leaderboard'),
      icon: <Icon icon="material-symbols:leaderboard" />,
    },
    {
      to: '/statistics',
      label: t('nav.statistics'),
      icon: <Icon icon="picon:chart" />,
    },
    {
      to: '/calculator',
      label: t('nav.calculator'),
      icon: <Icon icon="tabler:math" />,
    },
    { 
      to: '/decks', 
      label: t('nav.decks'), 
      icon: <Icon icon="mdi:cards" /> 
    },
    {
      to: '/pdf-decklist',
      label: t('nav.pdf_decklist'),
      icon: <Icon icon="teenyicons:pdf-outline" />,
    },
    {
      to: '/konami-decklist',
      label: t('nav.konami_decklist'),
      icon: <Icon icon="si:json-alt-1-line" />,
    },
  ];

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const changeLanguage = (lng: string) => {
    const langMap: Record<string, string> = {
      'en': 'en-US',
      'pt': 'pt-BR',
      'de': 'de-DE',
      'fr': 'fr-FR',
      'es': 'es-ES',
    };
    i18n.changeLanguage(langMap[lng] || lng);
    setLangMenuOpen(false);
  };

  const currentLang = i18n.language?.startsWith('pt') ? 'pt' : i18n.language?.startsWith('de') ? 'de' : i18n.language?.startsWith('fr') ? 'fr' : i18n.language?.startsWith('es') ? 'es' : 'en';

  return (
    <nav className="sticky top-0 z-50 bg-zinc-950 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img src="/logo.png" alt="Omega" className="h-10 w-auto" />
            <span className="text-xl font-bold text-white hidden sm:block">Omega</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`group relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'text-white bg-zinc-800'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <span className="text-lg">{link.icon}</span>
                {/* Tooltip */}
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs font-medium text-white bg-zinc-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-zinc-700 z-50">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <Icon icon="mdi:translate" className="text-lg" />
                <span className="text-xs font-medium uppercase">{currentLang}</span>
              </button>
              
              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl py-1 z-50">
                  <button
                    onClick={() => changeLanguage('en')}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                      currentLang === 'en' ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <span>🇺🇸</span>
                    <span>English</span>
                  </button>
                  <button
                    onClick={() => changeLanguage('pt')}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                      currentLang === 'pt' ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <span>🇧🇷</span>
                    <span>Português</span>
                  </button>
                  <button
                    onClick={() => changeLanguage('de')}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                      currentLang === 'de' ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <span>🇩🇪</span>
                    <span>Deutsch</span>
                  </button>
                  <button
                    onClick={() => changeLanguage('fr')}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                      currentLang === 'fr' ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <span>🇫🇷</span>
                    <span>Français</span>
                  </button>
                  <button
                    onClick={() => changeLanguage('es')}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                      currentLang === 'es' ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <span>🇪🇸</span>
                    <span>Español</span>
                  </button>
                </div>
              )}
            </div>

            {/* User Menu / Login */}
            {user && user.id !== '0' ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-md hover:bg-zinc-800 transition-colors"
                >
                  <PlayerAvatar 
                    size="sm" 
                    id={user.id} 
                    avatar={user.avatar}
                    className="ring-2 ring-zinc-700"
                  />
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl py-1 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-zinc-800">
                      <p className="text-sm font-medium text-white truncate">
                        {user.displayname || user.username}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">@{user.username}</p>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        to={`/profile/${user.id}`}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                      >
                        <Icon icon="mdi:account" className="text-lg text-zinc-500" />
                        <span>{t('profile.my_profile')}</span>
                      </Link>
                      <Link
                        to="/decks/me"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                      >
                        <Icon icon="mdi:cards" className="text-lg text-zinc-500" />
                        <span>{t('profile.my_decks')}</span>
                      </Link>
                      <Link
                        to="/profile/edit"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                      >
                        <Icon icon="mdi:account-edit" className="text-lg text-zinc-500" />
                        <span>{t('profile.edit_profile')}</span>
                      </Link>
                    </div>
                    
                    {/* Logout */}
                    <div className="border-t border-zinc-800 py-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-zinc-800 transition-colors"
                      >
                        <Icon icon="material-symbols:logout" className="text-lg" />
                        <span>{t('profile.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <a
                href={VITE_DISCORD_URL}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium rounded-md transition-colors"
              >
                <Icon icon="ic:baseline-discord" className="text-lg" />
                <span className="hidden sm:block">{t('nav.login')}</span>
              </a>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <Icon icon={mobileMenuOpen ? 'mdi:close' : 'mdi:menu'} className="text-2xl" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-800 bg-zinc-950">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'text-white bg-zinc-800'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <span className="text-lg">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
