function firstCountValue(values, fallback = 0) {
  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      return value.length;
    }
    if (typeof value === "string" && value.trim() === "") {
      continue;
    }
    const count = Number(value);
    if (Number.isFinite(count) && count >= 0) {
      return Math.floor(count);
    }
  }
  return fallback;
}

export function getStakeTableCount(stake) {
  return firstCountValue([
    stake?.table_count,
    stake?.tableCount,
    stake?.current_table_count,
    stake?.currentTableCount,
    stake?.tables_count,
    stake?.tablesCount,
    stake?.tables,
  ]);
}

export function getStakePlayerCount(stake) {
  return firstCountValue([
    stake?.player_count,
    stake?.playerCount,
    stake?.current_player_count,
    stake?.currentPlayerCount,
    stake?.players_count,
    stake?.playersCount,
    stake?.players,
  ]);
}

export function getLobbyTotalTableCount(gameLobby) {
  const stakes = Array.isArray(gameLobby?.stakes) ? gameLobby.stakes : [];
  const fallback = stakes.reduce((sum, stake) => sum + getStakeTableCount(stake), 0);
  return firstCountValue([
    gameLobby?.total_table_count,
    gameLobby?.totalTableCount,
    gameLobby?.table_count,
    gameLobby?.tableCount,
    gameLobby?.tables_count,
    gameLobby?.tablesCount,
    gameLobby?.tables,
  ], fallback);
}

export function getLobbyTotalPlayerCount(gameLobby) {
  const stakes = Array.isArray(gameLobby?.stakes) ? gameLobby.stakes : [];
  const fallback = stakes.reduce((sum, stake) => sum + getStakePlayerCount(stake), 0);
  return firstCountValue([
    gameLobby?.total_player_count,
    gameLobby?.totalPlayerCount,
    gameLobby?.player_count,
    gameLobby?.playerCount,
    gameLobby?.players_count,
    gameLobby?.playersCount,
    gameLobby?.players,
  ], fallback);
}

export function formatLobbyCount(value) {
  return Number(value ?? 0).toLocaleString("zh-TW");
}
