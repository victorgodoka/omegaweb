import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import Modal from '@/components/ui/Modal';
import { useTranslation } from 'react-i18next';

interface HypergeometricModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HypergeometricModal: React.FC<HypergeometricModalProps> = ({
  isOpen,
  onClose
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { t } = useTranslation();

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
      title={t('calculator.modal.title')}
      size="xl"
      closeOnOverlayClick={true}
      closeOnEscape={true}
    >
      <div className="space-y-6 text-zinc-300">
        {/* Introduction */}
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icon icon="mdi:lightbulb" className="text-blue-400 text-xl shrink-0 mt-0.5" />
            <div>
              <h3 className="text-blue-400 font-semibold mb-2">{t('calculator.modal.intro.title')}</h3>
              <p className="text-sm leading-relaxed">{t('calculator.modal.intro.text')}</p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div>
          <h3 className="text-zinc-200 font-semibold mb-3 flex items-center gap-2">
            <Icon icon="mdi:cog" className="text-orange-400" />
            {t('calculator.modal.how_it_works.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-700/50 rounded-lg p-4">
              <h4 className="text-orange-400 font-medium mb-2">{t('calculator.modal.how_it_works.formula_title')}</h4>
              <div className="bg-zinc-900 rounded p-3 font-mono text-sm mb-2">
                P(X = k) = C(K,k) × C(N-K,n-k) / C(N,n)
              </div>
              <ul className="text-xs space-y-1">
                <li><strong>N:</strong> {t('calculator.modal.how_it_works.N')}</li>
                <li><strong>K:</strong> {t('calculator.modal.how_it_works.K')}</li>
                <li><strong>n:</strong> {t('calculator.modal.how_it_works.n')}</li>
                <li><strong>k:</strong> {t('calculator.modal.how_it_works.k')}</li>
              </ul>
            </div>
            <div className="bg-zinc-700/50 rounded-lg p-4">
              <h4 className="text-green-400 font-medium mb-2">{t('calculator.modal.how_it_works.example_title')}</h4>
              <p className="text-sm mb-2">{t('calculator.modal.how_it_works.example_desc')}</p>
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
            {t('calculator.modal.key_concepts.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3">
                <h4 className="text-green-400 font-medium mb-1 flex items-center gap-2">
                  <Icon icon="mdi:check-circle" className="text-sm" />
                  {t('calculator.modal.key_concepts.exact_title')}
                </h4>
                <p className="text-sm">{t('calculator.modal.key_concepts.exact_desc')}</p>
              </div>
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
                <h4 className="text-blue-400 font-medium mb-1 flex items-center gap-2">
                  <Icon icon="mdi:greater-than-or-equal" className="text-sm" />
                  {t('calculator.modal.key_concepts.atleast_title')}
                </h4>
                <p className="text-sm">{t('calculator.modal.key_concepts.atleast_desc')}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-3">
                <h4 className="text-purple-400 font-medium mb-1 flex items-center gap-2">
                  <Icon icon="mdi:target" className="text-sm" />
                  {t('calculator.modal.key_concepts.targets_title')}
                </h4>
                <p className="text-sm">{t('calculator.modal.key_concepts.targets_desc')}</p>
              </div>
              <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-3">
                <h4 className="text-orange-400 font-medium mb-1 flex items-center gap-2">
                  <Icon icon="mdi:magnify" className="text-sm" />
                  {t('calculator.modal.key_concepts.searchers_title')}
                </h4>
                <p className="text-sm">{t('calculator.modal.key_concepts.searchers_desc')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Odds (Shortcuts) */}
        <div>
          <h3 className="text-zinc-200 font-semibold mb-3 flex items-center gap-2">
            <Icon icon="mdi:flash" className="text-yellow-400" />
            {t('calculator.modal.quick_odds.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Destiny Draw */}
            <div className="bg-zinc-700/50 rounded-lg p-4">
              <h4 className="text-zinc-100 font-medium mb-2 flex items-center gap-2">
                <Icon icon="mdi:cards" className="text-blue-400" />
                {t('calculator.modal.quick_odds.destiny.title')}
              </h4>
              <p className="text-sm mb-2">{t('calculator.modal.quick_odds.destiny.desc')}</p>
              <div className="bg-zinc-900 rounded p-2 text-xs font-mono">
                P(at least 1) = 1 − C(N−K, h+1) / C(N, h+1)
              </div>
              <p className="text-xs mt-2 text-zinc-400">{t('calculator.modal.quick_odds.destiny.note')}</p>
            </div>

            {/* Pot of Greed */}
            <div className="bg-zinc-700/50 rounded-lg p-4">
              <h4 className="text-zinc-100 font-medium mb-2 flex items-center gap-2">
                <Icon icon="mdi:cards-playing-outline" className="text-green-400" />
                {t('calculator.modal.quick_odds.greed.title')}
              </h4>
              <p className="text-sm mb-2">{t('calculator.modal.quick_odds.greed.desc')}</p>
              <div className="bg-zinc-900 rounded p-2 text-xs font-mono">
                P(at least 1) = 1 − C(N−K, h+2) / C(N, h+2)
              </div>
            </div>

            {/* Prosperity */}
            <div className="bg-zinc-700/50 rounded-lg p-4">
              <h4 className="text-zinc-100 font-medium mb-2 flex items-center gap-2">
                <Icon icon="mdi:magnify" className="text-purple-400" />
                {t('calculator.modal.quick_odds.prosperity.title')}
              </h4>
              <p className="text-sm mb-2">{t('calculator.modal.quick_odds.prosperity.desc')}</p>
              <div className="bg-zinc-900 rounded p-2 text-xs font-mono">
                P = 1 − [ C(N−K, h) / C(N, h) ] × [ C((N−h)−K, m) / C(N−h, m) ]
              </div>
              <p className="text-xs mt-2 text-zinc-400">{t('calculator.modal.quick_odds.prosperity.note')}</p>
            </div>

            {/* Desires */}
            <div className="bg-zinc-700/50 rounded-lg p-4">
              <h4 className="text-zinc-100 font-medium mb-2 flex items-center gap-2">
                <Icon icon="mdi:cards-heart" className="text-orange-400" />
                {t('calculator.modal.quick_odds.desires.title')}
              </h4>
              <p className="text-sm mb-2">{t('calculator.modal.quick_odds.desires.desc')}</p>
              <div className="bg-zinc-900 rounded p-2 text-xs font-mono">
                P = 1 − [ C(N−K, h) / C(N, h) ] × [ C((N−h)−K, 2) / C(N−h, 2) ]
                <br/>≡ 1 − C(N−K, h+2) / C(N, h+2)
              </div>
            </div>
          </div>
        </div>

        {/* How to Use This Calculator */}
        <div>
          <h3 className="text-zinc-200 font-semibold mb-3 flex items-center gap-2">
            <Icon icon="mdi:calculator" className="text-blue-400" />
            {t('calculator.modal.how_to_use.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-700/50 rounded-lg p-4 text-center">
              <Icon icon="mdi:code-braces" className="text-3xl text-blue-400 mb-2 mx-auto" />
              <h4 className="font-semibold mb-2">{t('calculator.modal.how_to_use.step1_title')}</h4>
              <p className="text-sm">{t('calculator.modal.how_to_use.step1_desc')}</p>
            </div>
            <div className="bg-zinc-700/50 rounded-lg p-4 text-center">
              <Icon icon="mdi:target" className="text-3xl text-orange-400 mb-2 mx-auto" />
              <h4 className="font-semibold mb-2">{t('calculator.modal.how_to_use.step2_title')}</h4>
              <p className="text-sm">{t('calculator.modal.how_to_use.step2_desc')}</p>
            </div>
            <div className="bg-zinc-700/50 rounded-lg p-4 text-center">
              <Icon icon="mdi:chart-line" className="text-3xl text-green-400 mb-2 mx-auto" />
              <h4 className="font-semibold mb-2">{t('calculator.modal.how_to_use.step3_title')}</h4>
              <p className="text-sm">{t('calculator.modal.how_to_use.step3_desc')}</p>
            </div>
          </div>
        </div>

        {/* Advanced Features */}
        <div>
          <h3 className="text-zinc-200 font-semibold mb-3 flex items-center gap-2">
            <Icon icon="mdi:star" className="text-yellow-400" />
            {t('calculator.modal.advanced.title')}
          </h3>
          <div className="space-y-3">
            <div className="bg-zinc-700/50 rounded-lg p-4">
              <h4 className="text-yellow-400 font-medium mb-2 flex items-center gap-2">
                <Icon icon="mdi:group" className="text-sm" />
                {t('calculator.modal.advanced.groups_title')}
              </h4>
              <p className="text-sm mb-2">
                {t('calculator.modal.advanced.groups_desc')}
              </p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• <strong>{t('calculator.modal.advanced.examples.hand_traps.title')}:</strong> {t('calculator.modal.advanced.examples.hand_traps.desc')}</li>
                <li>• <strong>{t('calculator.modal.advanced.examples.combo_starters.title')}:</strong> {t('calculator.modal.advanced.examples.combo_starters.desc')}</li>
                <li>• <strong>{t('calculator.modal.advanced.examples.engine_cards.title')}:</strong> {t('calculator.modal.advanced.examples.engine_cards.desc')}</li>
              </ul>
            </div>
            <div className="bg-zinc-700/50 rounded-lg p-4">
              <h4 className="text-purple-400 font-medium mb-2 flex items-center gap-2">
                <Icon icon="mdi:magnify" className="text-sm" />
                {t('calculator.modal.advanced.searchers_title')}
              </h4>
              <p className="text-sm">
                {t('calculator.modal.advanced.searchers_desc')}
              </p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
          <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
            <Icon icon="mdi:lightbulb-on" />
            {t('calculator.modal.tips.title')}
          </h3>
          <ul className="text-sm space-y-2">
            <li className="flex items-start gap-2">
              <Icon icon="mdi:check" className="text-green-400 shrink-0 mt-0.5" />
              <span>{t('calculator.modal.tips.item1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon="mdi:check" className="text-green-400 shrink-0 mt-0.5" />
              <span>{t('calculator.modal.tips.item2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon="mdi:check" className="text-green-400 shrink-0 mt-0.5" />
              <span>{t('calculator.modal.tips.item3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon="mdi:check" className="text-green-400 shrink-0 mt-0.5" />
              <span>{t('calculator.modal.tips.item4')}</span>
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
            {t('calculator.modal.footer.dont_show')}
          </label>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Icon icon="mdi:check" />
            {t('calculator.modal.footer.got_it')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
;

export default HypergeometricModal;
