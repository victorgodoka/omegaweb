import type { Player, Round, Table } from "@/pages/Live/types";

interface TournamentData {
  players: Player[];
  rounds: Round[];
  table: Table[];
}

export interface PlayerStats {
  id: string;
  avatar?: string;
  username: string;
  displayname?: string;
  wins: number;
  winPercentage: string;
  draws: number;
  losses: number;
  tiebreaker: string;
}

export function calculateTiebreakers(data: TournamentData): PlayerStats[] {
  const playerStats = data.players.map(player => {
    // Get match results from table data (already includes BYEs)
    const tableData = data.table.find(t => t.id === player.id);
    const wins = tableData?.wins || 0;
    const draws = tableData?.draws || 0;
    const losses = tableData?.loses || 0;

    // Get all opponents this player faced and track lost rounds
    const opponents: string[] = [];
    const lostRounds: number[] = [];

    data.rounds.forEach((round, roundIndex) => {
      // Skip BYE rounds (no opponent to track)
      if (round.bye === player.id) {
        return;
      }

      // Check each room in the round
      round.rooms.forEach(room => {
        if (room.duelist1 === player.id) {
          opponents.push(room.duelist2);
          // Check if this player lost (result 0 means duelist1 lost)
          if (room.result === 0) {
            lostRounds.push(roundIndex + 1); // Round numbers are 1-indexed
          }
        } else if (room.duelist2 === player.id) {
          opponents.push(room.duelist1);
          // Check if this player lost (result 1 means duelist2 lost)
          if (room.result === 1) {
            lostRounds.push(roundIndex + 1); // Round numbers are 1-indexed
          }
        }
      });
    });

    // Calculate total match points (AA): Win = 3, Draw = 1, Loss = 0
    const totalPoints = (wins * 3) + (draws * 1);

    // Calculate opponent's match-win percentage (BBB)
    let totalOpponentWinPercentage = 0;
    if (opponents.length > 0) {
      opponents.forEach(opponentId => {
        const opponentWinPercentage = calculatePlayerWinPercentage(opponentId, data);
        totalOpponentWinPercentage += opponentWinPercentage;
      });
      totalOpponentWinPercentage = totalOpponentWinPercentage / opponents.length;
    }

    // Calculate opponent's opponent's match-win percentage (CCC)
    let totalOpponentOpponentWinPercentage = 0;
    if (opponents.length > 0) {
      opponents.forEach(opponentId => {
        const opponentOpponentWinPercentage = calculateOpponentOpponentWinPercentage(opponentId, data);
        totalOpponentOpponentWinPercentage += opponentOpponentWinPercentage;
      });
      totalOpponentOpponentWinPercentage = totalOpponentOpponentWinPercentage / opponents.length;
    }

    // Calculate sum of squares of lost rounds (DDD)
    const sumOfSquaresOfLostRounds = lostRounds.reduce((sum, round) => sum + (round * round), 0);

    // Format tiebreaker: AABBBCCCDDD (exactly 11 digits)
    // AA: Always 2 digits (00-99, cap at 99)
    const AA = Math.min(totalPoints, 99).toString().padStart(2, '0');
    
    // BBB: Convert percentage to tenths and cap at 999 (e.g., 72.6% becomes 726, max 999)
    const BBB = Math.min(Math.round(totalOpponentWinPercentage * 10), 999).toString().padStart(3, '0');
    
    // CCC: Convert percentage to tenths and cap at 999
    const CCC = Math.min(Math.round(totalOpponentOpponentWinPercentage * 10), 999).toString().padStart(3, '0');
    
    // DDD: Cap at 999 to ensure 3 digits max
    const DDD = Math.min(sumOfSquaresOfLostRounds, 999).toString().padStart(3, '0');
    
    const tiebreaker = `${AA}${BBB}${CCC}${DDD}`;

    // Calculate win percentage for display
    const totalMatches = wins + draws + losses;
    const winPercentage = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(2) : "0.00";

    return {
      id: player.id,
      username: player.username,
      displayname: player.displayname,
      avatar: player.avatar,
      wins,
      draws,
      losses,
      winPercentage,
      tiebreaker,
    };
  });

  // Sort by tiebreaker (higher is better)
  return playerStats.sort((a, b) => {
    const tiebreakerA = parseInt(a.tiebreaker);
    const tiebreakerB = parseInt(b.tiebreaker);
    return tiebreakerB - tiebreakerA;
  });
}

function calculatePlayerWinPercentage(playerId: string, data: TournamentData): number {
  const tableData = data.table.find(t => t.id === playerId);
  if (!tableData) return 0;

  const wins = tableData.wins || 0;
  const draws = tableData.draws || 0;
  const losses = tableData.loses || 0;
  const totalMatches = wins + draws + losses;

  if (totalMatches === 0) return 0;

  return (wins / totalMatches) * 100;
}

function calculateOpponentOpponentWinPercentage(playerId: string, data: TournamentData): number {
  // Get all opponents this player faced
  const opponents: string[] = [];

  data.rounds.forEach(round => {
    // Skip BYE rounds
    if (round.bye === playerId) {
      return;
    }

    round.rooms.forEach(room => {
      if (room.duelist1 === playerId) {
        opponents.push(room.duelist2);
      } else if (room.duelist2 === playerId) {
        opponents.push(room.duelist1);
      }
    });
  });

  if (opponents.length === 0) return 0;

  // For each opponent, get their opponents' win percentages
  let totalOpponentOpponentWinPercentage = 0;
  let totalOpponentOpponents = 0;

  opponents.forEach(opponentId => {
    // Get all opponents that this opponent faced
    const opponentOpponents: string[] = [];
    
    data.rounds.forEach(round => {
      // Skip BYE rounds
      if (round.bye === opponentId) {
        return;
      }

      round.rooms.forEach(room => {
        if (room.duelist1 === opponentId) {
          opponentOpponents.push(room.duelist2);
        } else if (room.duelist2 === opponentId) {
          opponentOpponents.push(room.duelist1);
        }
      });
    });

    // Calculate average win percentage of this opponent's opponents
    opponentOpponents.forEach(opponentOpponentId => {
      const winPercentage = calculatePlayerWinPercentage(opponentOpponentId, data);
      totalOpponentOpponentWinPercentage += winPercentage;
      totalOpponentOpponents++;
    });
  });

  return totalOpponentOpponents > 0 ? totalOpponentOpponentWinPercentage / totalOpponentOpponents : 0;
}


