import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { api } from '@/utils/Api';
import { useToast } from '@/contexts/ToastContext';
import type { Lobby } from './types';

const GenesysRoomLobby: React.FC = () => {
  const [rooms, setRooms] = useState<Lobby[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningRoom, setJoiningRoom] = useState<number | null>(null);
  const { showError, showSuccess, showInfo } = useToast();

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await api.external.localDeckServer.fetchRooms();
      
      if (!response.ok) {
        showError(response.message || 'Failed to fetch rooms', {
          title: 'Connection Error',
          duration: 5000
        });
        setRooms([]);
        return;
      }

      // Filter rooms based on the specified criteria
      const filteredRooms = (response.data.Rooms as Lobby[]).filter(room => 
        room.LFListHash === 2113728106 &&
        room.Settings.MasterRule === 5 &&
        room.Settings.IsPublic === true &&
        // room.Settings.Budget === 7660000 &&
        room.DuelCount === 0 &&
        (room.Settings.Mode === 0 || room.Settings.Mode === 1)
      );

      // Sort rooms: State 0 (open) first, then by State
      const sortedRooms = filteredRooms.sort((a, b) => {
        if (a.State === 0 && b.State !== 0) return -1;
        if (a.State !== 0 && b.State === 0) return 1;
        return a.State - b.State;
      });

      setRooms(sortedRooms);
    } catch (error) {
      showError('Failed to connect to room server', {
        title: 'Network Error',
        duration: 5000
      });
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getModeText = (mode: number): string => {
    return mode === 0 ? 'Single' : 'Match';
  };

  const getRoomStateInfo = (state: number) => {
    switch (state) {
      case 0:
        return {
          text: 'Open',
          color: 'text-green-400',
          bgColor: 'bg-green-400',
          description: 'Available to join'
        };
      case 1:
        return {
          text: 'In Progress',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400',
          description: 'Game in progress'
        };
      case 2:
        return {
          text: 'Finished',
          color: 'text-blue-400',
          bgColor: 'bg-blue-400',
          description: 'Game completed'
        };
      default:
        return {
          text: 'Unknown',
          color: 'text-zinc-400',
          bgColor: 'bg-zinc-400',
          description: 'Unknown state'
        };
    }
  };

  const handleRoomClick = async (room: Lobby) => {
    if (room.State === 0) {
      // Join open room
      setJoiningRoom(room.RoomID);
      
      try {
        showInfo(`Joining room hosted by ${room.HostName}...`, {
          title: 'Joining Room',
          duration: 3000
        });

        const response = await api.external.localDeckServer.joinRoom(room.RoomID);
        
        if (response.ok) {
          showSuccess(`Successfully joined room hosted by ${room.HostName}!`, {
            title: 'Room Joined',
            duration: 4000
          });
          
          // Refresh room list to update states
          await fetchRooms();
        } else {
          // Handle specific error codes
          if (response.code === 403) {
            showError('Unable to join room: You may already be in a room or not online', {
              title: 'Join Failed',
              duration: 5000
            });
          } else {
            showError(response.message || 'Failed to join room', {
              title: 'Join Failed',
              duration: 5000
            });
          }
        }
      } catch (error) {
        showError('Failed to connect to room server', {
          title: 'Connection Error',
          duration: 5000
        });
      } finally {
        setJoiningRoom(null);
      }
    } else {
      // TODO: Implement spectating logic for ongoing games
      showInfo(`Spectating functionality coming soon for room ${room.RoomID}`, {
        title: 'Spectate Mode',
        duration: 3000
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 p-8 mt-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-purple-400 mb-2">Genesys Room Lobby</h1>
            <p className="text-zinc-400">Finding available rooms...</p>
          </div>
          
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Icon icon="mdi:loading" className="text-purple-400 text-2xl animate-spin" />
              <span className="text-zinc-300">Loading rooms...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 p-8 mt-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-purple-400 mb-2">Genesys Room Lobby</h1>
              <p className="text-zinc-400">
                {rooms.length > 0 
                  ? `${rooms.length} room${rooms.length === 1 ? '' : 's'} available`
                  : 'No rooms available'
                }
              </p>
            </div>
            
            <button
              onClick={fetchRooms}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Icon icon="mdi:refresh" className="text-lg" />
              Refresh
            </button>
          </div>
        </div>

        {/* Room List */}
        {rooms.length === 0 ? (
          <div className="text-center py-12">
            <Icon icon="mdi:gamepad-variant-outline" className="text-6xl text-zinc-600 mb-4 mx-auto" />
            <h3 className="text-xl font-semibold text-zinc-300 mb-2">No Rooms Available</h3>
            <p className="text-zinc-500 mb-6">
              There are currently no Genesys rooms available. Check back later or create your own room.
            </p>
            <button
              onClick={fetchRooms}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Check Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => {
              const stateInfo = getRoomStateInfo(room.State);
              const isOpen = room.State === 0;
              const isJoining = joiningRoom === room.RoomID;
              
              return (
                <div
                  key={room.RoomID}
                  onClick={() => !isJoining && handleRoomClick(room)}
                  className={`bg-zinc-800 border rounded-lg p-6 transition-all duration-200 group ${
                    isJoining 
                      ? 'border-purple-500 cursor-wait opacity-75' 
                      : isOpen 
                      ? 'border-zinc-700 hover:border-purple-500 hover:bg-zinc-750 cursor-pointer' 
                      : 'border-zinc-600 hover:border-yellow-500 hover:bg-zinc-750 opacity-75 cursor-pointer'
                  }`}
                >
                  {/* Room Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Icon 
                        icon={isOpen ? "mdi:account" : "mdi:eye"} 
                        className={`text-lg ${isOpen ? 'text-purple-400' : 'text-yellow-400'}`} 
                      />
                      <span className="text-white font-medium truncate">
                        {room.HostName}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-zinc-400">
                      <Icon icon="mdi:timer" className="text-sm" />
                      {formatTimer(room.Settings.Timer)}
                    </div>
                  </div>

                  {/* Room Stats */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-sm">Mode</span>
                      <span className="text-white font-medium">
                        {getModeText(room.Settings.Mode)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-sm">Duels</span>
                      <span className="text-white font-medium">
                        {room.DuelCount}/2
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-sm">Players</span>
                      <span className="text-white font-medium">
                        {room.PlayerCount}/2
                      </span>
                    </div>
                  </div>

                  {/* Room Status */}
                  <div className="mt-4 pt-4 border-t border-zinc-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 ${stateInfo.bgColor} rounded-full`}></div>
                        <div className="flex flex-col">
                          <span className={`text-sm font-medium ${stateInfo.color}`}>
                            {stateInfo.text}
                          </span>
                          <span className="text-xs text-zinc-400">
                            {stateInfo.description}
                          </span>
                        </div>
                      </div>
                      
                      {isJoining ? (
                        <Icon 
                          icon="mdi:loading" 
                          className="text-purple-400 animate-spin" 
                        />
                      ) : (
                        <Icon 
                          icon={isOpen ? "mdi:login" : "mdi:eye"} 
                          className={`group-hover:translate-x-1 transition-transform ${
                            isOpen ? 'text-purple-400' : 'text-yellow-400'
                          }`} 
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center text-zinc-500 text-sm">
          <p>Showing Genesys format rooms only (Master Rule 5, Budget 7.66M)</p>
          <p className="mt-1">Rooms refresh automatically every 10 seconds</p>
        </div>
      </div>
    </div>
  );
};

export default GenesysRoomLobby;
