import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { useCardsSearch } from '@/contexts/CardsSearchContext';
import type { Card, CardsSearchParams } from '@/utils/ApiTypes';
import { useToast } from '@/contexts/ToastContext';
import { COPY_LIMITS } from '@/utils/const';
import { isExtraDeckCard } from '@/utils/Functions';

type DeckSection = 'main' | 'extra' | 'side';
type DeckRegion = 'TCG' | 'OCG' | 'WCS' | 'Genesys';
type BanStatus = 0 | 1 | 2;
const GENESYS_POINTS_CAP = 100;

interface DeckEntry {
  card: Card;
  count: number;
}

const SECTION_LIMITS: Record<DeckSection, number> = {
  main: 60,
  extra: 15,
  side: 15,
};

const MIN_MAIN_DECK = 40;
const DEBOUNCE_DELAY = 400;
const CARDS_PER_PAGE = 24;

const attributeOptions: Array<{ label: string; value: CardsSearchParams['attribute'] }> = [
  { label: 'EARTH', value: 'EARTH' },
  { label: 'WATER', value: 'WATER' },
  { label: 'FIRE', value: 'FIRE' },
  { label: 'WIND', value: 'WIND' },
  { label: 'LIGHT', value: 'LIGHT' },
  { label: 'DARK', value: 'DARK' },
  { label: 'DIVINE', value: 'DIVINE' },
];

const typeOptions: Array<{ label: string; value: 'Monster' | 'Spell' | 'Trap' }> = [
  { label: 'Monster', value: 'Monster' },
  { label: 'Spell', value: 'Spell' },
  { label: 'Trap', value: 'Trap' },
];

const spellSubtypeOptions: Array<{ labelKey: string; value: string }> = [
  { labelKey: 'normal', value: 'Normal' },
  { labelKey: 'quick', value: 'Quick-Play' },
  { labelKey: 'field', value: 'Field' },
  { labelKey: 'equip', value: 'Equip' },
  { labelKey: 'continuous', value: 'Continuous' },
];

const trapSubtypeOptions: Array<{ labelKey: string; value: string }> = [
  { labelKey: 'normal', value: 'Normal' },
  { labelKey: 'counter', value: 'Counter' },
  { labelKey: 'continuous', value: 'Continuous' },
];

const monsterTypeOptions: string[] = [
  'Normal',
  'Effect',
  'Fusion',
  'Ritual',
  'Spirit',
  'Union',
  'Gemini',
  'Tuner',
  'Synchro',
  'Flip',
  'Toon',
  'Xyz',
  'Pendulum',
  'Link',
];

type CardCategory = '' | 'Monster' | 'Spell' | 'Trap';

const regionOptions: Array<{ label: string; value: DeckRegion }> = [
  { label: 'TCG', value: 'TCG' },
  { label: 'OCG', value: 'OCG' },
  { label: 'WCS', value: 'WCS' },
  { label: 'Genesys', value: 'Genesys' },
];

type AdvancedFilters = {
  type: CardCategory;
  attribute: CardsSearchParams['attribute'] | '';
  levelMin: string;
  levelMax: string;
  atkMin: string;
  atkMax: string;
  defMin: string;
  defMax: string;
  fname: string;
  desc: string;
  spellSubtype: string;
  trapSubtype: string;
  monsterTypes: string[];
  race: string;
  pScale: string;
};

const createAdvancedDefaults = (): AdvancedFilters => ({
  type: '',
  attribute: '',
  levelMin: '',
  levelMax: '',
  atkMin: '',
  atkMax: '',
  defMin: '',
  defMax: '',
  fname: '',
  desc: '',
  spellSubtype: '',
  trapSubtype: '',
  monsterTypes: [],
  race: '',
  pScale: '',
});

const createEmptyDeck = (): Record<DeckSection, DeckEntry[]> => ({
  main: [],
  extra: [],
  side: [],
});

const DeckEditor = () => {
  const { t, i18n } = useTranslation();
  const { cards, isLoading, error, searchCards, clearSearch } = useCardsSearch();

  const [basicQuery, setBasicQuery] = useState('');
  const [deckRegion, setDeckRegion] = useState<DeckRegion>('TCG');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [advancedValues, setAdvancedValues] = useState<AdvancedFilters>(() => createAdvancedDefaults());
  const [appliedAdvanced, setAppliedAdvanced] = useState<AdvancedFilters>(() => createAdvancedDefaults());

  const [activeDeckTab, setActiveDeckTab] = useState<DeckSection>('main');
  const [inspectedCard, setInspectedCard] = useState<Card | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { showError, showWarning } = useToast();
  const warningsShownRef = useRef<string[]>([]);
  const mainDeckToastShownRef = useRef(false);
  const [deck, setDeck] = useState<Record<DeckSection, DeckEntry[]>>(() => createEmptyDeck());

  const isSpellTypeSelected = advancedValues.type === 'Spell';
  const isTrapTypeSelected = advancedValues.type === 'Trap';
  const isMonsterTypeSelected = advancedValues.type === 'Monster';
  const monsterTypesSelected = advancedValues.monsterTypes;
  const hasPendulumSelected = monsterTypesSelected.includes('Pendulum');
  const hasXyzSelected = monsterTypesSelected.includes('Xyz');
  const hasLinkSelected = monsterTypesSelected.includes('Link');

  const levelMinLabelKey = isMonsterTypeSelected
    ? hasLinkSelected
      ? 'deck_editor.filters.link_min'
      : hasXyzSelected
        ? 'deck_editor.filters.rank_min'
        : 'deck_editor.filters.level_min'
    : 'deck_editor.filters.level_min';

  const levelMaxLabelKey = isMonsterTypeSelected
    ? hasLinkSelected
      ? 'deck_editor.filters.link_max'
      : hasXyzSelected
        ? 'deck_editor.filters.rank_max'
        : 'deck_editor.filters.level_max'
    : 'deck_editor.filters.level_max';

  const deckTotals = useMemo(() => ({
    main: deck.main.reduce((acc, entry) => acc + entry.count, 0),
    extra: deck.extra.reduce((acc, entry) => acc + entry.count, 0),
    side: deck.side.reduce((acc, entry) => acc + entry.count, 0),
  }), [deck]);

  const getCardDisplayName = useCallback(
    (card: Card) => {
      const isPortuguese = i18n.language?.startsWith('pt');
      const preferredName = isPortuguese
        ? card.name_pt || card.name_en
        : card.name_en || card.name_pt;

      return (
        preferredName ||
        t('deck_editor.results.unnamed_card', {
          id: card.id,
        })
      );
    },
    [i18n.language, t]
  );

  const getCardDescription = useCallback(
    (card: Card) => {
      const isPortuguese = i18n.language?.startsWith('pt');
      return isPortuguese
        ? card.desc_pt || card.desc_en || ''
        : card.desc_en || card.desc_pt || '';
    },
    [i18n.language]
  );

  const getGenesysPointsForCard = useCallback((card: Card) => card.banlist_data?.genesys?.value || 0, []);

  const calculateDeckGenesysPoints = useCallback(
    (targetDeck: Record<DeckSection, DeckEntry[]>) => {
      return (['main', 'extra', 'side'] as DeckSection[]).reduce((total, section) => {
        return (
          total +
          targetDeck[section].reduce((sectionTotal, entry) => {
            return sectionTotal + (entry.card.banlist_data?.genesys?.value || 0) * entry.count;
          }, 0)
        );
      }, 0);
    },
    []
  );

  const genesysPointsUsed = useMemo(() => {
    if (deckRegion !== 'Genesys') {
      return 0;
    }
    return calculateDeckGenesysPoints(deck);
  }, [deck, deckRegion, calculateDeckGenesysPoints]);

  const genesysPointsRemaining = Math.max(0, GENESYS_POINTS_CAP - genesysPointsUsed);

  const getBanStatusForCard = useCallback(
    (card: Card): BanStatus | null => {
      if (deckRegion === 'Genesys' || !card.banlist_data) {
        return null;
      }

      const regionKey = deckRegion.toLowerCase() as keyof NonNullable<Card['banlist_data']>;
      const regionData = card.banlist_data[regionKey];

      if (!regionData || regionData.value === undefined || regionData.value === null) {
        return null;
      }

      const numericValue = typeof regionData.value === 'string'
        ? parseInt(regionData.value, 10)
        : regionData.value;

      if (numericValue === 0 || numericValue === 1 || numericValue === 2) {
        return numericValue as BanStatus;
      }

      return null;
    },
    [deckRegion]
  );

  const deckWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (deckTotals.main > 0 && deckTotals.main < MIN_MAIN_DECK) {
      warnings.push(t('deck_editor.limits.main_range', { min: MIN_MAIN_DECK }));
    }
    (['extra', 'side'] as DeckSection[]).forEach((section) => {
      if (deckTotals[section] > SECTION_LIMITS[section]) {
        warnings.push(
          t('deck_editor.limits.section_max', {
            section: t(`deck_editor.builder.section_${section}`),
            max: SECTION_LIMITS[section],
          })
        );
      }
    });
    if (deckRegion === 'Genesys' && genesysPointsUsed > GENESYS_POINTS_CAP) {
      warnings.push(
        t('deck_editor.genesys.points_warning', {
          used: genesysPointsUsed,
          cap: GENESYS_POINTS_CAP,
        })
      );
    }
    return warnings;
  }, [deckTotals, deckRegion, genesysPointsUsed, t]);

  const activeAdvancedCount = useMemo(() => {
    return Object.values(appliedAdvanced).reduce((count, value) => {
      if (Array.isArray(value)) {
        return value.length > 0 ? count + 1 : count;
      }
      if (typeof value === 'string') {
        return value.trim() !== '' ? count + 1 : count;
      }
      return count;
    }, 0);
  }, [appliedAdvanced]);

  const buildSearchParams = useCallback((): CardsSearchParams => {
    const params: CardsSearchParams = {};

    const trimmedQuery = basicQuery.trim();
    if (trimmedQuery) {
      params.q = trimmedQuery;
    }

    const trimmedFname = appliedAdvanced.fname.trim();
    if (trimmedFname) {
      params.fname = trimmedFname;
    }

    const trimmedDesc = appliedAdvanced.desc.trim();
    if (trimmedDesc) {
      params.desc = trimmedDesc;
    }

    if (appliedAdvanced.type) {
      params.type = appliedAdvanced.type as CardsSearchParams['type'];
    }
    if (appliedAdvanced.attribute) {
      params.attribute = appliedAdvanced.attribute as CardsSearchParams['attribute'];
    }

    const numericMap: Array<[keyof CardsSearchParams, string]> = [
      ['levelMin', appliedAdvanced.levelMin],
      ['levelMax', appliedAdvanced.levelMax],
      ['atkMin', appliedAdvanced.atkMin],
      ['atkMax', appliedAdvanced.atkMax],
      ['defMin', appliedAdvanced.defMin],
      ['defMax', appliedAdvanced.defMax],
    ];

    numericMap.forEach(([key, value]) => {
      if (value) {
        const parsed = parseInt(value, 10);
        if (!Number.isNaN(parsed)) {
          (params as Record<string, unknown>)[key as string] = parsed;
        }
      }
    });

    if (appliedAdvanced.pScale) {
      const parsed = parseInt(appliedAdvanced.pScale, 10);
      if (!Number.isNaN(parsed)) {
        params.pScale = parsed;
      }
    }

    let raceFilter = '';
    if (appliedAdvanced.type === 'Monster') {
      raceFilter = appliedAdvanced.race.trim();
    } else if (appliedAdvanced.type === 'Spell') {
      raceFilter = appliedAdvanced.spellSubtype;
    } else if (appliedAdvanced.type === 'Trap') {
      raceFilter = appliedAdvanced.trapSubtype;
    }

    if (raceFilter) {
      params.race = raceFilter;
    }

    return params;
  }, [appliedAdvanced, basicQuery]);

  useEffect(() => {
    const trimmedQuery = basicQuery.trim();
    const shouldSearch = trimmedQuery.length > 0 || activeAdvancedCount > 0;

    if (!shouldSearch) {
      clearSearch();
      setCurrentPage(1);
      return;
    }

    const timeout = setTimeout(() => {
      searchCards(buildSearchParams());
      setCurrentPage(1);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timeout);
  }, [basicQuery, activeAdvancedCount, buildSearchParams, searchCards, clearSearch]);

  const handleBasicChange = (value: string) => {
    setBasicQuery(value);
    setCurrentPage(1);
  };

  const handleClearQuery = () => {
    setBasicQuery('');
    setCurrentPage(1);
  };

  const handleAdvancedFieldChange = (name: keyof AdvancedFilters, value: string) => {
    setAdvancedValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeckRegionChange = (value: DeckRegion) => {
    setDeckRegion(value);
    setCurrentPage(1);
  };

  const handleTypeChange = (value: CardCategory) => {
    setAdvancedValues((prev) => {
      const next: AdvancedFilters = {
        ...prev,
        type: value,
      };

      if (value !== 'Spell') {
        next.spellSubtype = '';
      }

      if (value !== 'Trap') {
        next.trapSubtype = '';
      }

      if (value !== 'Monster') {
        next.attribute = '';
        next.levelMin = '';
        next.levelMax = '';
        next.atkMin = '';
        next.atkMax = '';
        next.defMin = '';
        next.defMax = '';
        next.monsterTypes = [];
        next.race = '';
        next.pScale = '';
      }

      return next;
    });
  };

  const handleMonsterTypeToggle = (typeLabel: string) => {
    setAdvancedValues((prev) => {
      const exists = prev.monsterTypes.includes(typeLabel);
      const nextTypes = exists
        ? prev.monsterTypes.filter((type) => type !== typeLabel)
        : [...prev.monsterTypes, typeLabel];

      return {
        ...prev,
        monsterTypes: nextTypes,
        pScale: nextTypes.includes('Pendulum') ? prev.pScale : '',
      };
    });
  };

  const handleAdvancedApply = () => {
    setAppliedAdvanced(advancedValues);
    setIsAdvancedOpen(false);
    setCurrentPage(1);
  };

  const handleAdvancedReset = () => {
    const defaults = createAdvancedDefaults();
    setAdvancedValues(defaults);
    setAppliedAdvanced(defaults);
    setCurrentPage(1);
  };

  useEffect(() => {
    warningsShownRef.current = warningsShownRef.current.filter((warning) =>
      deckWarnings.includes(warning)
    );

    deckWarnings.forEach((warning) => {
      if (!warningsShownRef.current.includes(warning)) {
        showWarning(warning);
        warningsShownRef.current.push(warning);
      }
    });
  }, [deckWarnings, showWarning]);

  useEffect(() => {
    const isMainIncomplete = deckTotals.main > 0 && deckTotals.main < MIN_MAIN_DECK;
    if (isMainIncomplete && !mainDeckToastShownRef.current) {
      mainDeckToastShownRef.current = true;
      showWarning(t('deck_editor.limits.main_range', { min: MIN_MAIN_DECK }));
    }

    if (!isMainIncomplete && deckTotals.main >= MIN_MAIN_DECK) {
      mainDeckToastShownRef.current = false;
    }
  }, [deckTotals.main, showWarning, t]);

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  const getAllowedCopiesForCard = useCallback(
    (card: Card) => {
      if (deckRegion === 'Genesys') {
        return COPY_LIMITS.UNLIMITED;
      }

      const status = getBanStatusForCard(card);
      if (status === 0) return COPY_LIMITS.FORBIDDEN;
      if (status === 1) return COPY_LIMITS.LIMITED;
      if (status === 2) return COPY_LIMITS.SEMI_LIMITED;
      return COPY_LIMITS.UNLIMITED;
    },
    [deckRegion, getBanStatusForCard]
  );

  const showCopyLimitToast = useCallback(
    (card: Card) => {
      const status = deckRegion === 'Genesys' ? null : getBanStatusForCard(card);
      const regionLabel = t(`deck_editor.filters.region_${deckRegion.toLowerCase()}`);
      const name = getCardDisplayName(card);

      if (status === 0) {
        showError(
          t('deck_editor.banlist.forbidden_toast', {
            name,
            region: regionLabel,
          })
        );
        return;
      }

      if (status === 1) {
        showWarning(
          t('deck_editor.banlist.limited_toast', {
            name,
            region: regionLabel,
          })
        );
        return;
      }

      if (status === 2) {
        showWarning(
          t('deck_editor.banlist.semi_limited_toast', {
            name,
            region: regionLabel,
          })
        );
        return;
      }

      showWarning(
        t('deck_editor.builder.copy_limit', {
          limit: COPY_LIMITS.UNLIMITED,
        })
      );
    },
    [deckRegion, getBanStatusForCard, getCardDisplayName, showError, showWarning, t]
  );

  const exceedsGenesysCap = useCallback(
    (deckState: Record<DeckSection, DeckEntry[]>, card: Card, copiesToAdd: number) => {
      if (deckRegion !== 'Genesys' || copiesToAdd <= 0) {
        return false;
      }

      const currentPoints = calculateDeckGenesysPoints(deckState);
      const addedPoints = getGenesysPointsForCard(card) * copiesToAdd;

      if (currentPoints + addedPoints > GENESYS_POINTS_CAP) {
        showError(
          t('deck_editor.genesys.limit_toast', {
            name: getCardDisplayName(card),
            cap: GENESYS_POINTS_CAP,
            used: currentPoints,
          })
        );
        return true;
      }

      return false;
    },
    [calculateDeckGenesysPoints, deckRegion, getCardDisplayName, getGenesysPointsForCard, showError, t]
  );

  const addCardToSection = (card: Card, sectionOverride?: DeckSection) => {
    const section = sectionOverride || (isExtraDeckCard(card) ? 'extra' : 'main');

    if (deckTotals[section] >= SECTION_LIMITS[section]) {
      showWarning(
        t('deck_editor.builder.limit_reached', {
          section: t(`deck_editor.builder.section_${section}`),
        })
      );
      return;
    }

    const allowedCopies = getAllowedCopiesForCard(card);
    if (allowedCopies === COPY_LIMITS.FORBIDDEN) {
      showCopyLimitToast(card);
      return;
    }

    setDeck((prev) => {
      const sectionEntries = prev[section];
      const existingIndex = sectionEntries.findIndex((entry) => entry.card.id === card.id);

      if (existingIndex !== -1) {
        const existingEntry = sectionEntries[existingIndex];
        if (existingEntry.count >= allowedCopies) {
          showCopyLimitToast(card);
          return prev;
        }

        if (exceedsGenesysCap(prev, card, 1)) {
          return prev;
        }

        const updatedSection = [...sectionEntries];
        updatedSection[existingIndex] = {
          ...existingEntry,
          count: existingEntry.count + 1,
        };
        return { ...prev, [section]: updatedSection };
      }

      if (exceedsGenesysCap(prev, card, 1)) {
        return prev;
      }

      const updatedSection = [...sectionEntries, { card, count: 1 }];
      return { ...prev, [section]: updatedSection };
    });
  };

  const updateCardCount = (cardId: number, section: DeckSection, delta: number) => {
    setDeck((prev) => {
      const sectionEntries = prev[section];
      const entryIndex = sectionEntries.findIndex((entry) => entry.card.id === cardId);
      if (entryIndex === -1) return prev;

      const updatedSection = [...sectionEntries];
      const current = updatedSection[entryIndex];
      const allowedCopies = getAllowedCopiesForCard(current.card);
      const newCount = current.count + delta;

      if (delta > 0 && newCount > allowedCopies) {
        showCopyLimitToast(current.card);
        return prev;
      }

      if (delta > 0 && exceedsGenesysCap(prev, current.card, delta)) {
        return prev;
      }

      if (newCount <= 0) {
        updatedSection.splice(entryIndex, 1);
      } else if (newCount <= allowedCopies) {
        updatedSection[entryIndex] = { ...current, count: newCount };
      }

      return { ...prev, [section]: updatedSection };
    });
  };

  const clearDeck = () => {
    setDeck(createEmptyDeck());
  };

  const handlePageChange = (direction: number, totalPages: number) => {
    if (!totalPages) return;
    const nextPage = currentPage + direction;
    if (nextPage < 1 || nextPage > totalPages) return;
    setCurrentPage(nextPage);
  };

  const deckEntries = deck[activeDeckTab];

  const filteredCards = useMemo(() => {
    if (appliedAdvanced.type === 'Monster' && appliedAdvanced.monsterTypes.length > 0) {
      const selectedTypes = appliedAdvanced.monsterTypes;
      return cards.filter((card) => {
        const tags = card.type_tags || [];
        return selectedTypes.some((selected) => tags.includes(selected));
      });
    }
    return cards;
  }, [cards, appliedAdvanced.type, appliedAdvanced.monsterTypes]);

  const totalResults = filteredCards.length;
  const totalPages = totalResults === 0 ? 1 : Math.ceil(totalResults / CARDS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedCards = useMemo(() => {
    const start = (currentPage - 1) * CARDS_PER_PAGE;
    return filteredCards.slice(start, start + CARDS_PER_PAGE);
  }, [filteredCards, currentPage]);

  const renderAdvancedNumberInput = (
    labelKey: string,
    name: keyof AdvancedFilters,
    placeholderKey: string
  ) => (
    <div className="space-y-2">
      <label className="text-sm text-gray-400">{t(labelKey)}</label>
      <input
        type="number"
        value={advancedValues[name]}
        onChange={(event) => handleAdvancedFieldChange(name, event.target.value)}
        placeholder={t(placeholderKey)}
        className="w-full px-4 py-2 bg-black border border-zinc-800 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-zinc-600"
      />
    </div>
  );

  const banlistStatusConfig: Record<BanStatus, { icon: string; bg: string; text: string; labelKey: string }> = {
    0: {
      icon: 'tabler:ban',
      bg: 'bg-rose-600',
      text: 'text-white',
      labelKey: 'deck_editor.banlist.forbidden',
    },
    1: {
      icon: 'bi:1-circle',
      bg: 'bg-amber-400',
      text: 'text-black',
      labelKey: 'deck_editor.banlist.limited',
    },
    2: {
      icon: 'bi:2-circle',
      bg: 'bg-yellow-300',
      text: 'text-black',
      labelKey: 'deck_editor.banlist.semi_limited',
    },
  };

  const renderCardConstraintBadge = useCallback(
    (card: Card) => {
      if (deckRegion === 'Genesys' && card.banlist_data?.genesys) {
        return (
          <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-emerald-400/90 text-black text-xs font-semibold shadow-md">
            {t('deck_editor.genesys.points_badge', { points: card.banlist_data.genesys.value })}
          </div>
        );
      }

      const status = getBanStatusForCard(card);
      if (status === null) {
        return null;
      }

      const config = banlistStatusConfig[status];
      return (
        <div className={`absolute top-2 left-2 w-9 h-9 rounded-full flex items-center justify-center shadow-md ${config.bg}`}>
          <Icon icon={config.icon} className={`text-xl ${config.text}`} />
          <span className="sr-only">{t(config.labelKey)}</span>
        </div>
      );
    },
    [banlistStatusConfig, deckRegion, getBanStatusForCard, getGenesysPointsForCard, t]
  );

  const renderSkeletonGrid = (count = CARDS_PER_PAGE) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`skeleton-${index}`} className="space-y-2">
          <div className="relative aspect-4/6 rounded-xl overflow-hidden bg-zinc-800 animate-pulse" />
          <div className="flex gap-2">
            <div className="flex-1 h-10 rounded-lg bg-zinc-800 animate-pulse" />
            <div className="w-20 h-10 rounded-lg bg-zinc-800 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-col gap-3">
          <p className="text-zinc-500 text-sm uppercase tracking-[0.2em]">
            {t("deck_editor.page_label")}
          </p>
          <h1 className="text-3xl font-bold text-white">
            {t("deck_editor.title")}
          </h1>
          <p className="text-gray-400 max-w-3xl">{t("deck_editor.subtitle")}</p>
        </div>

        <section className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-sm font-semibold text-zinc-300">
                  {t('deck_editor.deck_region.label')}
                </p>
                <p className="text-xs text-zinc-500">
                  {t('deck_editor.deck_region.description')}
                </p>
              </div>
              <span className="text-xs text-zinc-500">
                {t('deck_editor.deck_region.active', { region: t(`deck_editor.filters.region_${deckRegion.toLowerCase()}`) })}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {regionOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleDeckRegionChange(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                    deckRegion === option.value
                      ? 'bg-white text-black border-white'
                      : 'border-zinc-800 bg-black text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  {t(`deck_editor.filters.region_${option.value.toLowerCase()}`)}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-300">
                {t("deck_editor.builder.title")}
              </p>
              <p className="text-sm text-zinc-500">
                {t("deck_editor.builder.description")}
              </p>
            </div>
            <button
              onClick={clearDeck}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-zinc-700 text-sm text-zinc-200 hover:border-zinc-500"
            >
              <Icon icon="mdi:refresh" className="text-lg" />
              {t("deck_editor.builder.reset_button")}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-black/40 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs uppercase text-zinc-500">
                {t("deck_editor.builder.section_main")}
              </p>
              <p className="text-2xl font-semibold text-white">
                {deckTotals.main}
              </p>
              <p className="text-xs text-zinc-500">
                {t("deck_editor.limits.main_helper", {
                  min: MIN_MAIN_DECK,
                  max: SECTION_LIMITS.main,
                })}
              </p>
            </div>
            <div className="bg-black/40 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs uppercase text-zinc-500">
                {t("deck_editor.builder.section_extra")}
              </p>
              <p className="text-2xl font-semibold text-white">
                {deckTotals.extra}
              </p>
              <p className="text-xs text-zinc-500">
                {t("deck_editor.limits.section_helper", {
                  max: SECTION_LIMITS.extra,
                })}
              </p>
            </div>
            <div className="bg-black/40 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs uppercase text-zinc-500">
                {t("deck_editor.builder.section_side")}
              </p>
              <p className="text-2xl font-semibold text-white">
                {deckTotals.side}
              </p>
              <p className="text-xs text-zinc-500">
                {t("deck_editor.limits.section_helper", {
                  max: SECTION_LIMITS.side,
                })}
              </p>
            </div>
          </div>

          {deckWarnings.length > 0 && (
            <div className="p-3 rounded-md border border-zinc-800 bg-black/40 text-sm text-zinc-300 space-y-1">
              {deckWarnings.map((warning, index) => (
                <p key={`warning-${index}`}>{warning}</p>
              ))}
            </div>
          )}

          {deckRegion === 'Genesys' && (
            <div className="grid grid-cols-1">
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">
                  {t('deck_editor.genesys.points_label')}
                </p>
                <p className="text-2xl font-semibold text-white">
                  {t('deck_editor.genesys.points_total', {
                    used: genesysPointsUsed,
                    cap: GENESYS_POINTS_CAP,
                  })}
                </p>
                <p className="text-xs text-emerald-200/80">
                  {t('deck_editor.genesys.points_remaining', {
                    remaining: genesysPointsRemaining,
                  })}
                </p>
              </div>
            </div>
          )}

          <div>
            <div className="inline-flex flex-wrap gap-2 bg-zinc-900/60 border border-zinc-800 rounded-xl p-1">
              {(["main", "extra", "side"] as DeckSection[]).map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveDeckTab(section)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeDeckTab === section
                      ? "bg-white text-black"
                      : "text-zinc-300 hover:text-white"
                  }`}
                >
                  {t(`deck_editor.builder.tab_${section}`)}
                  <span className="ml-2 text-xs text-zinc-500">
                    {deckTotals[section]}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4">
              {deckEntries.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl text-sm text-zinc-500">
                  {t("deck_editor.builder.empty_tab")}
                </div>
              ) : (
                <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {deckEntries.map((entry) => (
                    <li key={entry.card.id} className="relative group">
                      <div className="aspect-4/6 overflow-hidden border border-zinc-800 relative">
                        {renderCardConstraintBadge(entry.card)}
                        <img
                          src={`https://ygopro.online/assets/card-images/common/${entry.card.id}.jpg`}
                          alt={getCardDisplayName(entry.card)}
                          className="w-full h-full object-cover"
                          onClick={() => setInspectedCard(entry.card)}
                          onError={(event) => {
                            event.currentTarget.src = "/back.webp";
                          }}
                        />
                        <div className="absolute inset-0 flex flex-col justify-end p-2 bg-linear-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition">
                          <div className="flex items-center justify-between text-white text-sm font-semibold mb-2">
                            <span>{entry.count}x</span>
                            <button
                              onClick={() =>
                                updateCardCount(
                                  entry.card.id,
                                  activeDeckTab,
                                  -entry.count
                                )
                              }
                              className="p-1 rounded-full bg-black/60 hover:bg-red-600"
                              aria-label={t("deck_editor.builder.remove_card")}
                            >
                              <Icon icon="mdi:close" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateCardCount(
                                  entry.card.id,
                                  activeDeckTab,
                                  -1
                                )
                              }
                              className="flex-1 py-1 rounded-md border border-zinc-500 text-white text-sm"
                              aria-label={t(
                                "deck_editor.builder.decrease_card"
                              )}
                            >
                              -
                            </button>
                            <button
                              onClick={() =>
                                updateCardCount(entry.card.id, activeDeckTab, 1)
                              }
                              disabled={entry.count >= 3}
                              className="flex-1 py-1 rounded-md bg-white text-black text-sm font-semibold disabled:bg-zinc-600 disabled:text-zinc-400"
                              aria-label={t(
                                "deck_editor.builder.increase_card"
                              )}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="flex-1">
                <label className="text-sm text-zinc-400">
                  {t("deck_editor.filters.simple_label")}
                </label>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={basicQuery}
                    onChange={(event) => handleBasicChange(event.target.value)}
                    placeholder={t("deck_editor.filters.simple_placeholder")}
                    className="flex-1 px-4 py-2 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                  />
                  {basicQuery && (
                    <button
                      onClick={handleClearQuery}
                      className="px-3 py-2 rounded-lg border border-zinc-800 text-zinc-300 hover:text-white"
                      aria-label={t("deck_editor.filters.clear_input")}
                    >
                      <Icon icon="mdi:close" />
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsAdvancedOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 text-sm text-zinc-200 hover:border-zinc-600"
              >
                <Icon icon="mdi:tune" />
                <span>
                  {isAdvancedOpen
                    ? t("deck_editor.filters.hide_advanced")
                    : t("deck_editor.filters.show_advanced")}
                </span>
                {activeAdvancedCount > 0 && (
                  <span className="ml-1 text-xs text-emerald-300">
                    {t("deck_editor.filters.advanced_active", {
                      count: activeAdvancedCount,
                    })}
                  </span>
                )}
              </button>
            </div>

            {isAdvancedOpen && (
              <div className="border-t border-zinc-800 pt-4 space-y-4">
                <p className="text-sm text-zinc-400">
                  {t("deck_editor.filters.advanced_description")}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">
                      {t("deck_editor.filters.type_label")}
                    </label>
                    <select
                      value={advancedValues.type}
                      onChange={(event) =>
                        handleTypeChange(event.target.value as CardCategory)
                      }
                      className="w-full px-4 py-2 bg-black border border-zinc-800 rounded-md text-white focus:outline-none focus:border-zinc-600"
                    >
                      <option value="">
                        {t("deck_editor.filters.any_option")}
                      </option>
                      {typeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(
                            `deck_editor.filters.type_${option.value.toLowerCase()}`
                          )}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">
                      {t("deck_editor.filters.advanced_name")}
                    </label>
                    <input
                      type="text"
                      value={advancedValues.fname}
                      onChange={(event) =>
                        handleAdvancedFieldChange("fname", event.target.value)
                      }
                      placeholder={t(
                        "deck_editor.filters.advanced_name_placeholder"
                      )}
                      className="w-full px-4 py-2 bg-black border border-zinc-800 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-zinc-600"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm text-gray-400">
                      {t("deck_editor.filters.advanced_desc")}
                    </label>
                    <textarea
                      value={advancedValues.desc}
                      onChange={(event) =>
                        handleAdvancedFieldChange("desc", event.target.value)
                      }
                      placeholder={t(
                        "deck_editor.filters.advanced_desc_placeholder"
                      )}
                      rows={2}
                      className="w-full px-4 py-2 bg-black border border-zinc-800 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-zinc-600"
                    />
                  </div>

                  {isSpellTypeSelected && (
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">
                        {t("deck_editor.filters.spell_subtype")}
                      </label>
                      <select
                        value={advancedValues.spellSubtype}
                        onChange={(event) =>
                          handleAdvancedFieldChange(
                            "spellSubtype",
                            event.target.value
                          )
                        }
                        className="w-full px-4 py-2 bg-black border border-zinc-800 rounded-md text-white focus:outline-none focus:border-zinc-600"
                      >
                        <option value="">
                          {t("deck_editor.filters.any_option")}
                        </option>
                        {spellSubtypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {t(
                              `deck_editor.filters.spell_subtype_${option.labelKey}`
                            )}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {isTrapTypeSelected && (
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">
                        {t("deck_editor.filters.trap_subtype")}
                      </label>
                      <select
                        value={advancedValues.trapSubtype}
                        onChange={(event) =>
                          handleAdvancedFieldChange(
                            "trapSubtype",
                            event.target.value
                          )
                        }
                        className="w-full px-4 py-2 bg-black border border-zinc-800 rounded-md text-white focus:outline-none focus:border-zinc-600"
                      >
                        <option value="">
                          {t("deck_editor.filters.any_option")}
                        </option>
                        {trapSubtypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {t(
                              `deck_editor.filters.trap_subtype_${option.labelKey}`
                            )}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {isMonsterTypeSelected && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400">
                          {t("deck_editor.filters.attribute_label")}
                        </label>
                        <select
                          value={advancedValues.attribute}
                          onChange={(event) =>
                            handleAdvancedFieldChange(
                              "attribute",
                              event.target.value
                            )
                          }
                          className="w-full px-4 py-2 bg-black border border-zinc-800 rounded-md text-white focus:outline-none focus:border-zinc-600"
                        >
                          <option value="">
                            {t("deck_editor.filters.any_option")}
                          </option>
                          {attributeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-gray-400">
                          {t("deck_editor.filters.race_label")}
                        </label>
                        <input
                          type="text"
                          value={advancedValues.race}
                          onChange={(event) =>
                            handleAdvancedFieldChange("race", event.target.value)
                          }
                          placeholder={t("deck_editor.filters.race_placeholder")}
                          className="w-full px-4 py-2 bg-black border border-zinc-800 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-zinc-600"
                        />
                      </div>

                      {renderAdvancedNumberInput(
                        levelMinLabelKey,
                        "levelMin",
                        "deck_editor.filters.number_placeholder"
                      )}
                      {renderAdvancedNumberInput(
                        levelMaxLabelKey,
                        "levelMax",
                        "deck_editor.filters.number_placeholder"
                      )}
                      {renderAdvancedNumberInput(
                        "deck_editor.filters.atk_min",
                        "atkMin",
                        "deck_editor.filters.number_placeholder"
                      )}
                      {renderAdvancedNumberInput(
                        "deck_editor.filters.atk_max",
                        "atkMax",
                        "deck_editor.filters.number_placeholder"
                      )}
                      {renderAdvancedNumberInput(
                        "deck_editor.filters.def_min",
                        "defMin",
                        "deck_editor.filters.number_placeholder"
                      )}
                      {renderAdvancedNumberInput(
                        "deck_editor.filters.def_max",
                        "defMax",
                        "deck_editor.filters.number_placeholder"
                      )}

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm text-gray-400">
                          {t("deck_editor.filters.monster_type_label")}
                        </label>
                        <p className="text-xs text-zinc-500">
                          {t("deck_editor.filters.monster_type_hint")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {monsterTypeOptions.map((typeLabel) => {
                            const isSelected = monsterTypesSelected.includes(
                              typeLabel
                            );
                            return (
                              <button
                                type="button"
                                key={typeLabel}
                                onClick={() =>
                                  handleMonsterTypeToggle(typeLabel)
                                }
                                className={`px-3 py-1 rounded-full text-sm border transition ${
                                  isSelected
                                    ? "bg-white text-black border-white"
                                    : "border-zinc-700 text-zinc-300 hover:text-white"
                                }`}
                              >
                                {typeLabel}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {hasPendulumSelected && (
                        <div className="space-y-2">
                          <label className="text-sm text-gray-400">
                            {t("deck_editor.filters.pendulum_scale")}
                          </label>
                          <input
                            type="number"
                            value={advancedValues.pScale}
                            onChange={(event) =>
                              handleAdvancedFieldChange("pScale", event.target.value)
                            }
                            placeholder={t(
                              "deck_editor.filters.number_placeholder"
                            )}
                            className="w-full px-4 py-2 bg-black border border-zinc-800 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-zinc-600"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleAdvancedApply}
                    className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold"
                  >
                    {t("deck_editor.filters.apply")}
                  </button>
                  <button
                    onClick={handleAdvancedReset}
                    className="px-4 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-200"
                  >
                    {t("deck_editor.filters.reset")}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-zinc-400">
                <Icon icon="mdi:cards-outline" />
                <span>{t("deck_editor.results.title")}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                <span>
                  {t("deck_editor.results.total", { count: totalResults })}
                </span>
                {totalPages > 1 && (
                  <span>
                    {t("deck_editor.results.pagination", { page: Math.min(currentPage, totalPages), totalPages })}
                  </span>
                )}
              </div>
            </div>

            {isLoading ? (
              renderSkeletonGrid()
            ) : filteredCards.length === 0 ? (
              <div className="text-center text-gray-500 border border-dashed border-zinc-800 rounded-2xl py-12">
                <p className="text-lg text-gray-300">
                  {t("deck_editor.results.empty_title")}
                </p>
                <p className="text-sm text-gray-500">
                  {t("deck_editor.results.empty_subtitle")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {paginatedCards.map((card) => (
                  <article key={card.id} className="space-y-2">
                    <div className="relative aspect-4/6 rounded-xl overflow-hidden border border-zinc-900">
                      {renderCardConstraintBadge(card)}
                      <img
                        src={`https://ygopro.online/assets/card-images/common/${card.id}.jpg`}
                        alt={
                          card.name_en ||
                          card.name_pt ||
                          t("deck_editor.results.unnamed_card", { id: card.id })
                        }
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setInspectedCard(card)}
                        onError={(event) => {
                          event.currentTarget.src = "/back.webp";
                        }}
                      />
                      <button
                        className="absolute top-2 right-2 p-2 rounded-full bg-black/70 text-white"
                        onClick={() => setInspectedCard(card)}
                        aria-label={t("deck_editor.results.title")}
                      >
                        <Icon icon="mdi:eye" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addCardToSection(card)}
                        className="flex-1 px-3 py-2 rounded-lg bg-white text-black text-sm font-semibold transition-colors hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                      >
                        {isExtraDeckCard(card)
                          ? t("deck_editor.results.add_to_extra")
                          : t("deck_editor.results.add_to_main")}
                      </button>
                      <button
                        onClick={() => addCardToSection(card, "side")}
                        className="px-3 py-2 rounded-lg border border-zinc-800 text-sm text-zinc-200 bg-zinc-900/50 transition-colors hover:border-zinc-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                      >
                        {t("deck_editor.results.add_to_side")}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {totalResults > 0 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => handlePageChange(-1, totalPages)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-zinc-700 text-zinc-200 rounded-md disabled:opacity-40"
                >
                  {t("common.previous")}
                </button>
                <span className="text-sm text-zinc-400">
                  {t("deck_editor.results.pagination", { page: Math.min(currentPage, totalPages), totalPages })}
                </span>
                <button
                  onClick={() => handlePageChange(1, totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-zinc-700 text-zinc-200 rounded-md disabled:opacity-40"
                >
                  {t("common.next")}
                </button>
              </div>
            )}
          </div>
        </section>
        {inspectedCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="max-w-4xl w-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/2 bg-black">
                  <img
                    src={`https://ygopro.online/assets/card-images/common/${inspectedCard.id}.jpg`}
                    alt={
                      getCardDisplayName(inspectedCard)
                    }
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = "/back.webp";
                    }}
                  />
                </div>
                <div className="md:w-1/2 p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {getCardDisplayName(inspectedCard)}
                      </h2>
                      {inspectedCard.type_primary && (
                        <p className="text-sm text-zinc-400">
                          {t('deck_editor.results.card_type', {
                            value: inspectedCard.type_primary,
                          })}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setInspectedCard(null)}
                      className="p-2 rounded-md bg-zinc-900 text-zinc-300 hover:text-white"
                      aria-label={t("deck_editor.builder.remove_card")}
                    >
                      <Icon icon="mdi:close" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-zinc-300">
                    {inspectedCard.attribute && (
                      <span>
                        {t("deck_editor.results.attribute", {
                          value: inspectedCard.attribute,
                        })}
                      </span>
                    )}
                    {inspectedCard.race && (
                      <span>
                        {t("deck_editor.results.race", {
                          value: inspectedCard.race,
                        })}
                      </span>
                    )}
                    {typeof inspectedCard.level === "number" && (
                      <span>
                        {t("deck_editor.results.level", {
                          value: inspectedCard.level,
                        })}
                      </span>
                    )}
                    {typeof inspectedCard.atk === "number" && (
                      <span>
                        {t("deck_editor.results.atk", {
                          value: inspectedCard.atk,
                        })}
                      </span>
                    )}
                    {typeof inspectedCard.def === "number" && (
                      <span>
                        {t("deck_editor.results.def", {
                          value: inspectedCard.def,
                        })}
                      </span>
                    )}
                  </div>
                  {(() => {
                    const localizedDescription = getCardDescription(inspectedCard);
                    if (!localizedDescription) return null;
                    return (
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wide text-zinc-500">
                          {t('deck_editor.results.description')}
                        </p>
                        <p className="text-sm text-zinc-400 whitespace-pre-line max-h-56 overflow-auto">
                          {localizedDescription}
                        </p>
                      </div>
                    );
                  })()}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        addCardToSection(inspectedCard);
                        setInspectedCard(null);
                      }}
                      className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold transition-colors hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    >
                      {isExtraDeckCard(inspectedCard)
                        ? t("deck_editor.results.add_to_extra")
                        : t("deck_editor.results.add_to_main")}
                    </button>
                    <button
                      onClick={() => {
                        addCardToSection(inspectedCard, "side");
                        setInspectedCard(null);
                      }}
                      className="px-4 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-200 bg-zinc-900/50 transition-colors hover:border-zinc-500 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                    >
                      {t("deck_editor.results.add_to_side")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeckEditor;
