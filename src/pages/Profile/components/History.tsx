import { Icon } from "@iconify/react"
import { t } from "i18next"
import { lazy, Suspense, useCallback } from "react"
import type { ProfileCustomizationData, ProfileStatsData } from "../types"
const MatchHistoryCard = lazy(() => import('./MatchHistoryCard'));
const MatchHistorySkeleton = lazy(() => import('./MatchHistorySkeleton'));

const History = ({ 
  customizationData, 
  isOwnProfile, 
  statsData,
  isLoading = false 
}: { 
  customizationData?: ProfileCustomizationData, 
  isOwnProfile: boolean, 
  statsData?: ProfileStatsData,
  isLoading?: boolean
}) => {
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  if (isLoading) {
    return <MatchHistorySkeleton />;
  }

  return (
    <div className="space-y-4">
      {customizationData?.hide_history === 1 && !isOwnProfile && statsData ? (
          <div className="text-center py-12 bg-zinc-800/50 rounded-lg border-2 border-dashed border-zinc-700/50">
            <Icon icon="mdi:lock" className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
            <p className="text-zinc-400">{t('profile.match_history_private')}</p>
          </div>
        ) : statsData?.matchHistory && statsData?.matchHistory?.length > 0 ? (
          statsData.matchHistory.slice(0, 10).map((match: any, index: any) => (
            <Suspense
              key={index}
              fallback={
                <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50 animate-pulse h-20"></div>
              }
            >
              <MatchHistoryCard match={match} formatDate={formatDate} />
            </Suspense>
          ))
        ) : (
          <div className="text-center py-12 bg-zinc-800/30 rounded-lg border-2 border-dashed border-zinc-700/50">
            <Icon icon="mdi:ghost-off" className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
            <p className="text-zinc-400">No match history found</p>
          </div>
        )}
      </div>
  )
}

export default History