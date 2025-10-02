import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import Modal from '@/components/ui/Modal';

interface DeckBuilderInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeckBuilderInfoModal: React.FC<DeckBuilderInfoModalProps> = ({
  isOpen,
  onClose
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      // Store preference to not show again for 7 days
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      localStorage.setItem('deckbuilder_modal_hidden_until', nextWeek.toISOString());
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Deck Builder - Alpha Version"
      size="xl"
      closeOnOverlayClick={true}
      closeOnEscape={true}
    >
      <div className="space-y-6 text-zinc-300">
        {/* Alpha Warning */}
        <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icon icon="mdi:alert" className="text-orange-400 text-xl flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-orange-400 font-semibold mb-2">Alpha Version - Work in Progress</h3>
              <p className="text-sm leading-relaxed mb-2">
                This deck builder is currently in alpha development. Features may be incomplete or contain bugs.
              </p>
              <p className="text-sm leading-relaxed">
                Please report any bugs or errors on our Discord server. Translations will be added over time.
              </p>
            </div>
          </div>
        </div>

        {/* Deck Builder Introduction */}
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icon icon="mdi:cards" className="text-blue-400 text-xl flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-blue-400 font-semibold mb-2">Yu-Gi-Oh! Deck Builder</h3>
              <p className="text-sm leading-relaxed mb-3">
                Build competitive Yu-Gi-Oh! decks with our advanced deck builder. Follow standard deck construction rules:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-4">
                <li><strong>Main Deck:</strong> 40-60 cards</li>
                <li><strong>Extra Deck:</strong> 0-15 cards (Fusion, Synchro, Xyz, Link monsters)</li>
                <li><strong>Side Deck:</strong> 0-15 cards for tournament play</li>
                <li><strong>Card Limits:</strong> Maximum 3 copies of any card (unless banned/limited)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Genesys Format */}
        <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icon icon="mdi:star" className="text-purple-400 text-xl flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-purple-400 font-semibold mb-2">TCG Genesys Format</h3>
              <p className="text-sm leading-relaxed mb-3">
                The Genesys rules are simple:
              </p>
              
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold text-purple-300 mb-1">Card Restrictions:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>No Link Monsters</strong> or <strong>Pendulum Monsters</strong> are allowed</li>
                    <li>All other cards are allowed</li>
                    <li>The original field layout is used (no Extra Monster Zones or Pendulum Zones)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-purple-300 mb-1">Banlist:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>The standard Forbidden & Limited Cards list is <strong>not used</strong></li>
                    <li>All those cards can be used (except Link and Pendulum Monsters)</li>
                    <li>Usual limit of <strong>3 copies max</strong> of any card still applies</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-purple-300 mb-1">Point System:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Deck construction uses a <strong>point system</strong></li>
                    <li>Some cards are assigned a point value; most cards cost zero points</li>
                    <li>Total point cost of all cards (Main + Extra + Side) cannot exceed the point cap</li>
                    <li>Standard point cap is <strong>100 points</strong></li>
                    <li>Events can use any point cap, or even zero-point cap</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Search & Filters */}
        <div className="bg-cyan-900/30 border border-cyan-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icon icon="mdi:filter" className="text-cyan-400 text-xl flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-cyan-400 font-semibold mb-2">Advanced Search & Filters</h3>
              <p className="text-sm leading-relaxed mb-3">
                Use powerful search and filtering tools to find exactly the cards you need:
              </p>
              
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold text-cyan-300 mb-1">Search Features:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Text Search:</strong> Search by card name or description</li>
                    <li><strong>Independent Filtering:</strong> Use filters without search text</li>
                    <li><strong>Real-time Results:</strong> See results as you type (300ms delay)</li>
                    <li><strong>Performance Optimized:</strong> Shows 50 cards initially, load more as needed</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-cyan-300 mb-1">Filter Categories:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Card Types:</strong> Monsters, Spells, Traps, Extra Deck (quick buttons)</li>
                    <li><strong>Monster Properties:</strong> Attribute, Race, Level, ATK/DEF ranges</li>
                    <li><strong>Monster Types:</strong> Effect, Normal, Fusion, Synchro, Xyz, Link, etc.</li>
                    <li><strong>Spell/Trap Subtypes:</strong> Normal, Quick-Play, Continuous, Counter, etc.</li>
                    <li><strong>Banlist Status:</strong> Unlimited, Forbidden, Limited, Semi-Limited</li>
                    <li><strong>Genesys Points:</strong> Filter by point values in TCG Genesys format</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-cyan-300 mb-1">Filter Interface:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Visual Indicators:</strong> Filter button turns purple with red dot when active</li>
                    <li><strong>Mobile:</strong> Fullscreen filter panel with backdrop</li>
                    <li><strong>Desktop:</strong> Side panel slides from right (384px width)</li>
                    <li><strong>Format Aware:</strong> Shows relevant options for selected format</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How to Use */}
        <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icon icon="mdi:help-circle" className="text-green-400 text-xl flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-green-400 font-semibold mb-2">How to Use the Deck Builder</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold text-green-300 mb-1">Card Interactions:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Left Click:</strong> Add cards to main/extra deck (based on card type)</li>
                    <li><strong>Ctrl+Click:</strong> Force add cards directly to side deck</li>
                    <li><strong>Right Click:</strong> Open detailed card modal with full information</li>
                    <li><strong>Deck Cards:</strong> Click deck cards to remove them</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-green-300 mb-1">Search & Filter Tips:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Search Only:</strong> Type card names or descriptions</li>
                    <li><strong>Filter Only:</strong> Use filters without entering search text</li>
                    <li><strong>Combined:</strong> Use search + filters together for precise results</li>
                    <li><strong>Quick Filters:</strong> Use card type buttons for instant filtering</li>
                    <li><strong>Clear Filters:</strong> "Clear All" button resets all filter options</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-green-300 mb-1">Format Selection:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>TCG/OCG:</strong> Standard formats with banlist restrictions</li>
                    <li><strong>TCG Genesys:</strong> Point system, no Link/Pendulum cards</li>
                    <li><strong>Auto-Filtering:</strong> Illegal cards hidden in selected format</li>
                    <li><strong>Visual Feedback:</strong> Toast notifications for all actions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Don't show again option */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-700">
          <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            Don't show this for 7 days
          </label>
          
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeckBuilderInfoModal;
