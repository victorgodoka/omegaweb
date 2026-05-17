import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DeckBreadcrumbsProps {
  items: BreadcrumbItem[];
  showBack?: boolean;
}

const DeckBreadcrumbs = ({ items, showBack = true }: DeckBreadcrumbsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/decks');
    }
  };

  return (
    <div className="flex items-center gap-3 mb-6">
      {showBack && (
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-md transition-colors text-sm"
        >
          <Icon icon="mdi:arrow-left" className="text-base" />
          {t('common.back')}
        </button>
      )}
      
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link to="/" className="hover:text-white transition-colors">
          {t('navigation.home')}
        </Link>
        
        {items.map((item, index) => (
          <span key={index} className="flex items-center gap-2">
            <Icon icon="mdi:chevron-right" className="text-gray-600" />
            {item.href ? (
              <Link to={item.href} className="hover:text-white transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-300">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    </div>
  );
};

export default DeckBreadcrumbs;
