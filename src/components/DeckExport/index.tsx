import React from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { copyToClipboard } from '@/utils/Functions';
import { downloadFile } from '@/utils/Functions';
import { prepareDecklist } from '@/utils/Cards';
import { addToOmega } from '@/utils/Cards';
import { API_ENDPOINTS } from '@/utils/Api';
import type { Decklist } from '@/utils/ApiTypes';

interface DeckExportProps {
  deck: Decklist;
  code: string;
  deckName?: string;
  className?: string;
}

const DeckExport: React.FC<DeckExportProps> = ({ deck, code, deckName, className = '' }) => {
  const { t } = useTranslation();

  const handleDownloadYDK = () => {
    const ydkContent = prepareDecklist(
      [...deck.mainDeck.map((c) => c.id), ...deck.extraDeck.map((c) => c.id)],
      deck.sideDeck.map((c) => c.id)
    );
    downloadFile(ydkContent, `${deckName || 'Deck'}.ydk`);
  };

  const handleImportToOmega = () => {
    addToOmega(code, deckName);
  };

  return (
    <div
      className={`bg-zinc-800/60 mb-4 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Icon icon="mdi:export" className="text-2xl text-blue-400" />
        <h2 className="text-xl font-semibold text-zinc-100">
          {t("deck_export.title", { defaultValue: "Export Deck" })}
        </h2>
      </div>

      {/* Deck Code Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-zinc-400 mb-2">
          {t("deck_export.deck_code_label", { defaultValue: "Deck Code" })}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={code}
            className="flex-1 bg-zinc-900/50 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-200 text-sm font-mono focus:outline-none focus:border-blue-500/50 transition-colors"
          />
          <button
            onClick={() => copyToClipboard(code, t)}
            className="px-4 py-3 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 rounded-lg transition-all flex items-center gap-2 text-zinc-200 hover:text-white"
            title={t("deck_export.copy_tooltip", {
              defaultValue: "Copy to clipboard",
            })}
          >
            <Icon icon="mdi:content-copy" className="text-lg" />
            <span className="hidden sm:inline text-sm font-medium">
              {t("deck_export.copy", { defaultValue: "Copy" })}
            </span>
          </button>
        </div>
      </div>

      {/* Export Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
        {/* Download YDK */}
        <button
          onClick={handleDownloadYDK}
          className="flex items-center justify-center gap-3 px-4 py-3 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-lg transition-all group"
        >
          <Icon
            icon="mdi:download"
            className="text-xl text-cyan-400 group-hover:text-cyan-300 transition-colors"
          />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
              {t("deck_export.download_ydk", { defaultValue: "Download YDK" })}
            </span>
            <span className="text-xs text-zinc-500">
              {t("deck_export.download_ydk_desc", {
                defaultValue: "For YGO Omega",
              })}
            </span>
          </div>
        </button>

        {/* Import to Omega */}
        <button
          onClick={handleImportToOmega}
          className="flex items-center justify-center gap-3 px-4 py-3 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-lg transition-all group"
        >
          <Icon
            icon="mdi:application-import"
            className="text-xl text-purple-400 group-hover:text-purple-300 transition-colors"
          />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
              {t("deck_export.import_omega", {
                defaultValue: "Import to Omega",
              })}
            </span>
            <span className="text-xs text-zinc-500">
              {t("deck_export.import_omega_desc", {
                defaultValue: "Direct import",
              })}
            </span>
          </div>
        </button>

        {/* Get Image */}
        <a
          href={`${
            API_ENDPOINTS.DUELISTS_UNITE_V3
          }/deck-image?code=${encodeURIComponent(code)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 px-4 py-3 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-lg transition-all group"
        >
          <Icon
            icon="mdi:image"
            className="text-xl text-amber-400 group-hover:text-amber-300 transition-colors"
          />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
              {t("deck_export.get_image", { defaultValue: "Get Image" })}
            </span>
            <span className="text-xs text-zinc-500">
              {t("deck_export.get_image_desc", {
                defaultValue: "Visual decklist",
              })}
            </span>
          </div>
        </a>

        {/* Export to PDF */}
        <Link
          to={`/pdf-decklist?code=${encodeURIComponent(code)}`}
          target="_blank"
          className="flex items-center justify-center gap-3 px-4 py-3 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-lg transition-all group"
        >
          <Icon
            icon="mdi:file-pdf-box"
            className="text-xl text-red-400 group-hover:text-red-300 transition-colors"
          />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
              {t("deck_export.export_pdf", { defaultValue: "Export to PDF" })}
            </span>
            <span className="text-xs text-zinc-500">
              {t("deck_export.export_pdf_desc", {
                defaultValue: "Printable format",
              })}
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default DeckExport;
