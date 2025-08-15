// src/pages/HypergeometricCalculator/components/ShareResults.tsx
import React, { useState } from 'react';
import { Icon } from '@iconify/react';

interface ShareResultsProps {
  shareableId: string | null;
  shareUrl: string | null;
  onClearShare?: () => void;
}

export const ShareResults: React.FC<ShareResultsProps> = ({
  shareableId,
  shareUrl,
  onClearShare,
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!shareableId || !shareUrl) {
    return null;
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 my-4">
      <div className="flex items-center gap-3 mb-4">
        <Icon icon="mdi:check-circle" className="text-green-600 text-2xl" />
        <h3 className="text-green-800 text-lg font-semibold flex-1">Configuration Saved Successfully!</h3>
        {onClearShare && (
          <button 
            onClick={onClearShare}
            className="p-1 hover:bg-green-100 rounded text-green-800"
            title="Clear share results"
          >
            <Icon icon="mdi:close" />
          </button>
        )}
      </div>
      
      <div>
        <p className="text-green-800 mb-4 leading-relaxed">
          Your calculator configuration has been saved and can be shared with others.
        </p>
        
        <div className="mb-4">
          <label className="block mb-2 font-medium text-green-800 text-sm">Share ID:</label>
          <code className="block bg-green-100 p-2 rounded border border-green-200 font-mono text-sm text-green-800">
            {shareableId}
          </code>
        </div>
        
        <div className="mb-4">
          <label className="block mb-2 font-medium text-green-800 text-sm">Share URL:</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={shareUrl} 
              readOnly 
              className="flex-1 p-2 border border-green-200 rounded bg-green-100 text-green-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <button 
              onClick={copyToClipboard}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 active:bg-green-800 transition-colors flex items-center gap-1 whitespace-nowrap"
              title="Copy to clipboard"
            >
              <Icon icon={copied ? "mdi:check" : "mdi:content-copy"} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
