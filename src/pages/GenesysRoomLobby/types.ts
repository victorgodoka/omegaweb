export interface Lobby {
  RoomID: number;
  LFListHash: number;
  HostID: number;
  State: number;
  IsRanked: boolean;
  HostName: string;
  PlayerCount: number;
  DuelCount: number;
  Winner: number[];
  Settings: LobbySettings;
}

export interface LobbySettings {
  Region: number;
  MasterRule: number;
  Mode: number;
  StartHand: number;
  DrawCount: number;
  Timer: number;
  StartLP: number;
  DuelRule: number;
  IsPublic: boolean;
  Budget: number;
}

export interface RoomError {
  Code: number;
  Reason: string;
}
