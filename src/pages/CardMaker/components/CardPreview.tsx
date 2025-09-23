import React from 'react';
import { Icon } from '@iconify/react';
import type { CardPreviewProps } from '../types';

const CardPreview: React.FC<CardPreviewProps> = ({ cardData }) => {
  // Get subtype icon path
  const getSubtypeIcon = () => {
    if (cardData.type === 'Spell') {
      const spellIcons = {
        'Normal': null, // Normal spells don't have an icon
        'Quick-Play': '/effect_icon_quick-play.png',
        'Continuous': '/effect_icon_continuous.png',
        'Ritual': '/effect_icon_ritual.png'
      };
      return spellIcons[cardData.spellType];
    } else if (cardData.type === 'Trap') {
      const trapIcons = {
        'Normal': null, // Normal traps don't have an icon
        'Continuous': '/effect_icon_continuous.png',
        'Counter': '/effect_icon_counter.png'
      };
      return trapIcons[cardData.trapType];
    }
    return null;
  };

  // Get card frame image based on type
  const getFrameImage = () => {
    if (cardData.type === 'Monster') {
      // Default to normal monster frame for now
      return '/frames/card-normal.png';
    } else if (cardData.type === 'Spell') {
      return '/frames/card-spell.png';
    } else if (cardData.type === 'Trap') {
      return '/frames/card-trap.png';
    }
    return '/frames/card-normal.png';
  };

  // Render stars for level
  const renderStars = (level: number) => {
    return Array.from({ length: Math.min(level, 12) }, (_, i) => (
      <img src="/star.png" className="w-[26px]" alt="Star" key={i} />
    ));
  };

  // Get display image
  const getDisplayImage = () => {
    if (cardData.artworkFile) {
      return URL.createObjectURL(cardData.artworkFile);
    }
    return cardData.artworkUrl || '/placeholder-card-art.png';
  };

  const getDynamicFontSize = (text: string) => {
    const baseSize = 40; // Base font size in pixels (text-5xl equivalent)
    const maxWidth = 350; // Maximum width available for text
    const charWidth = 20; // Approximate character width at base size

    const textWidth = text.length * charWidth;

    if (textWidth <= maxWidth) {
      return baseSize;
    }

    // Calculate scale factor to fit text
    const scaleFactor = maxWidth / textWidth;
    const newSize = Math.max(baseSize * scaleFactor, 12); // Minimum 16px

    return Math.floor(newSize);
  };

  // Get attribute or spell/trap icon for top right
  const getTopRightIcon = () => {
    if (cardData.type === 'Monster') {
      return `/attributes/${cardData.attribute.toLowerCase()}.png`;
    } else if (cardData.type === 'Spell') {
      return '/attributes/spell.png';
    } else if (cardData.type === 'Trap') {
      return '/attributes/trap.png';
    }
    return null;
  };

  return (
    <div className="relative rounded-lg shadow-2xl overflow-hidden border-4 border-zinc-800" style={{ width: '421px', height: '614px' }}>
      {/* Card Frame */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${getFrameImage()})` }}
      ></div>

      <div className="absolute h-[40px] top-[28px] px-1 left-[24px] flex items-center w-[320px]">
        <h3
          className="capitalize font-['MatrixBoldSmallCaps'] text-black"
          style={{ fontSize: `${getDynamicFontSize(cardData.name || 'Card Name')}px` }}
        >
          {cardData.name}
        </h3>
      </div>
      {/* Attribute/Type Icon - Top Right */}
      {getTopRightIcon() && (
        <div className="absolute top-[29px] right-[28px]">
          <img 
            src={getTopRightIcon()!} 
            alt={cardData.type === 'Monster' ? `${cardData.attribute} attribute` : `${cardData.type} card`}
            className="w-[36px] h-[36px]"
          />
        </div>
      )}

      {cardData.type === 'Monster' && (
        <div className="absolute top-[67px] right-[40px] flex flex-row-reverse items-center w-full gap-0.5 mt-1.75">
          {renderStars(cardData.level)}
        </div>
      )}

      <span className="text-xs text-black absolute top-[332px] left-[26px]">[{cardData.monsterType}]</span>
      {/* Card Art - Different positioning for Monster vs Spell/Trap */}
      <div className={`relative overflow-hidden w-[235px] h-[237px] mt-[5px] ml-[39px]`}>
        {(cardData.artworkUrl || cardData.artworkFile) ? (
          <img
            src={getDisplayImage()}
            alt="Card artwork"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-zinc-600">
              <Icon icon="mdi:image-outline" className="text-6xl mb-2" />
              <p className="text-sm">No artwork</p>
            </div>
          </div>
        )}

        {/* Spell/Trap Type Indicator and Icon - positioned in top right */}
        {(cardData.type === 'Spell' || cardData.type === 'Trap') && (
          <div className="absolute top-2 right-2 flex items-center gap-2">
            {getSubtypeIcon() && (
              <img
                src={getSubtypeIcon()!}
                alt={`${cardData.type === 'Spell' ? cardData.spellType : cardData.trapType} icon`}
                className="w-6 h-6"
              />
            )}
          </div>
        )}
      </div>

      {/* Spell/Trap Type Text - positioned below artwork */}
      {(cardData.type === 'Spell' || cardData.type === 'Trap') && (
        <div className="bg-zinc-800 text-white absolute w-full top-[70px] h-[36px] flex items-center justify-end px-[46px]">
          <span className="text-sm font-semibold">
            [{cardData.type === 'Spell' ? `Spell Card/${cardData.spellType}` : `Trap Card/${cardData.trapType}`}]
          </span>
        </div>
      )}

      {/* Card Description */}
      <div className="absolute text-black leading-tight left-[26px] bottom-[56px] h-[56px] width-[260px]">
        {cardData.description}
      </div>

      {/* Monster Stats */}
      {cardData.type === 'Monster' && (
        <>
          <div className="absolute bottom-[17.5px] right-[87px] text-[.85rem] text-black">
            <span>{cardData.atk}000</span>
          </div>
          <div className="absolute bottom-[17.5px] right-[24px] text-[.85rem] text-black">
            <span>{cardData.def}000</span>
          </div>
        </>
      )}

      {/* Card Border Effect */}
      <div className="absolute inset-0 rounded-lg border-2 border-zinc-800 pointer-events-none"></div>

      {/* Holographic Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default CardPreview;
