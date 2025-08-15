import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import Modal from '@/components/ui/Modal';

interface HypergeometricModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HypergeometricModal: React.FC<HypergeometricModalProps> = ({
  isOpen,
  onClose
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      // Store preference to not show again for 24 hours
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      localStorage.setItem('hypergeometric_modal_hidden_until', tomorrow.toISOString());
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Understanding Hypergeometric Distribution"
      size="xl"
      closeOnOverlayClick={true}
      closeOnEscape={true}
    >
      <div className="space-y-6 text-zinc-300">
        {/* Introduction */}
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icon icon="mdi:lightbulb" className="text-blue-400 text-xl flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-blue-400 font-semibold mb-2">What is Hypergeometric Distribution?</h3>
              <p className="text-sm leading-relaxed">
                The hypergeometric distribution calculates the probability of drawing a specific number of "success" cards 
                from a deck without replacement. It's perfect for Yu-Gi-Oh! because once you draw a card, it's no longer 
                available in your deck.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div>
          <h3 className="text-zinc-200 font-semibold mb-3 flex items-center gap-2">
            <Icon icon="mdi:cog" className="text-orange-400" />
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-700/50 rounded-lg p-4">
              <h4 className="text-orange-400 font-medium mb-2">The Formula</h4>
              <div className="bg-zinc-900 rounded p-3 font-mono text-sm mb-2">
                P(X = k) = C(K,k) × C(N-K,n-k) / C(N,n)
              </div>
              <ul className="text-xs space-y-1">
                <li><strong>N:</strong> Total deck size (usually 40)</li>
                <li><strong>K:</strong> Number of target cards in deck</li>
                <li><strong>n:</strong> Cards drawn (hand size)</li>
                <li><strong>k:</strong> Target cards you want to draw</li>
              </ul>
            </div>
            <div className="bg-zinc-700/50 rounded-lg p-4">
              <h4 className="text-green-400 font-medium mb-2">Example Calculation</h4>
              <p className="text-sm mb-2">
                Drawing exactly 1 Ash Blossom from 3 copies in a 40-card deck with 5-card hand:
              </p>
              <div className="bg-zinc-900 rounded p-2 text-xs font-mono">
                P = C(3,1) × C(37,4) / C(40,5)<br/>
                P = 3 × 58,905 / 658,008<br/>
                P ≈ 26.8%
              </div>
            </div>
          </div>
        </div>

        {/* Key Concepts */}
        <div>
          <h3 className="text-zinc-200 font-semibold mb-3 flex items-center gap-2">
            <Icon icon="mdi:key" className="text-yellow-400" />
            Key Concepts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3">
                <h4 className="text-green-400 font-medium mb-1 flex items-center gap-2">
                  <Icon icon="mdi:check-circle" className="text-sm" />
                  Exactly N Cards
                </h4>
                <p className="text-sm">Probability of drawing exactly the specified number of target cards.</p>
              </div>
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
                <h4 className="text-blue-400 font-medium mb-1 flex items-center gap-2">
                  <Icon icon="mdi:greater-than-or-equal" className="text-sm" />
                  At Least N Cards
                </h4>
                <p className="text-sm">Probability of drawing the specified number or more target cards.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-3">
                <h4 className="text-purple-400 font-medium mb-1 flex items-center gap-2">
                  <Icon icon="mdi:target" className="text-sm" />
                  Target Cards
                </h4>
                <p className="text-sm">The specific cards you want to draw (e.g., combo pieces, hand traps).</p>
              </div>
              <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-3">
                <h4 className="text-orange-400 font-medium mb-1 flex items-center gap-2">
                  <Icon icon="mdi:magnify" className="text-sm" />
                  Searcher Cards
                </h4>
                <p className="text-sm">Cards that can find your targets, effectively increasing your success rate.</p>
              </div>
            </div>
          </div>
        </div>

        {/* How to Use This Calculator */}
        <div>
          <h3 className="text-zinc-200 font-semibold mb-3 flex items-center gap-2">
            <Icon icon="mdi:calculator" className="text-blue-400" />
            How to Use This Calculator
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-700/50 rounded-lg p-4 text-center">
              <Icon icon="mdi:code-braces" className="text-3xl text-blue-400 mb-2 mx-auto" />
              <h4 className="font-semibold mb-2">1. Load Your Deck</h4>
              <p className="text-sm">Paste your deck code and validate it to load your deck list. Only main deck cards are used for calculations.</p>
            </div>
            <div className="bg-zinc-700/50 rounded-lg p-4 text-center">
              <Icon icon="mdi:target" className="text-3xl text-orange-400 mb-2 mx-auto" />
              <h4 className="font-semibold mb-2">2. Create Card Groups</h4>
              <p className="text-sm">Group related cards together (e.g., "Hand Traps", "Combo Starters") and set how many you want to draw.</p>
            </div>
            <div className="bg-zinc-700/50 rounded-lg p-4 text-center">
              <Icon icon="mdi:chart-line" className="text-3xl text-green-400 mb-2 mx-auto" />
              <h4 className="font-semibold mb-2">3. Analyze Results</h4>
              <p className="text-sm">View probability breakdowns and optimize your deck ratios based on the calculations.</p>
            </div>
          </div>
        </div>

        {/* Advanced Features */}
        <div>
          <h3 className="text-zinc-200 font-semibold mb-3 flex items-center gap-2">
            <Icon icon="mdi:star" className="text-yellow-400" />
            Advanced Features
          </h3>
          <div className="space-y-3">
            <div className="bg-zinc-700/50 rounded-lg p-4">
              <h4 className="text-yellow-400 font-medium mb-2 flex items-center gap-2">
                <Icon icon="mdi:group" className="text-sm" />
                Card Groups & Desired Counts
              </h4>
              <p className="text-sm mb-2">
                Create groups of related cards and specify how many you want to see. For example:
              </p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• <strong>Hand Traps:</strong> Want to see at least 1 from Ash Blossom, Maxx "C", etc.</li>
                <li>• <strong>Combo Starters:</strong> Want exactly 1-2 combo pieces in opening hand</li>
                <li>• <strong>Engine Cards:</strong> Want to avoid drawing too many engine pieces</li>
              </ul>
            </div>
            <div className="bg-zinc-700/50 rounded-lg p-4">
              <h4 className="text-purple-400 font-medium mb-2 flex items-center gap-2">
                <Icon icon="mdi:magnify" className="text-sm" />
                Searcher Integration
              </h4>
              <p className="text-sm">
                Assign searcher cards to specific groups to get more accurate probabilities. The calculator 
                considers that drawing a searcher is almost as good as drawing the target card itself.
              </p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
          <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
            <Icon icon="mdi:lightbulb-on" />
            Pro Tips
          </h3>
          <ul className="text-sm space-y-2">
            <li className="flex items-start gap-2">
              <Icon icon="mdi:check" className="text-green-400 flex-shrink-0 mt-0.5" />
              <span>Use realistic hand sizes (5 for going first, 6 for going second)</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon="mdi:check" className="text-green-400 flex-shrink-0 mt-0.5" />
              <span>Group cards by function rather than by name for better insights</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon="mdi:check" className="text-green-400 flex-shrink-0 mt-0.5" />
              <span>Consider searchers when calculating combo piece probabilities</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon="mdi:check" className="text-green-400 flex-shrink-0 mt-0.5" />
              <span>Save and share your configurations to compare different deck builds</span>
            </li>
          </ul>
        </div>

        {/* Footer with checkbox */}
        <div className="border-t border-zinc-700 pt-4 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            Don't show this again for 24 hours
          </label>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Icon icon="mdi:check" />
            Got it!
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default HypergeometricModal;
