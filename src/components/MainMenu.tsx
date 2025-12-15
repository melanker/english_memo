import { useState, useEffect } from 'react';
import { getAllLists, getPlayer, getLevelInfo, initializeDatabase } from '../db/database';
import type { WordList, Player } from '../db/database';
import { soundManager } from '../services/sounds';

interface MainMenuProps {
  onStartGame: (listId: number, playerName: string) => void;
  onManageLists: () => void;
  onShowScoreboard: () => void;
}

export const MainMenu = ({ onStartGame, onManageLists, onShowScoreboard }: MainMenuProps) => {
  const [lists, setLists] = useState<WordList[]>([]);
  const [selectedList, setSelectedList] = useState<number | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [player, setPlayer] = useState<Player | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    await initializeDatabase();
    const allLists = getAllLists();
    setLists(allLists);
    
    const playerData = getPlayer();
    if (playerData.name) {
      setPlayer(playerData);
      setPlayerName(playerData.name);
    }
    setIsLoading(false);
  };

  const handleListSelect = (listId: number) => {
    soundManager.playClick();
    setSelectedList(listId);
    setShowNameInput(true);
  };

  const handleStartGame = () => {
    if (selectedList && playerName.trim()) {
      soundManager.playClick();
      onStartGame(selectedList, playerName.trim());
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">טוען... ⏳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Floating decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 text-6xl animate-float" style={{ animationDelay: '0s' }}>📚</div>
        <div className="absolute top-20 right-20 text-5xl animate-float" style={{ animationDelay: '0.5s' }}>✨</div>
        <div className="absolute bottom-20 left-20 text-5xl animate-float" style={{ animationDelay: '1s' }}>🎮</div>
        <div className="absolute bottom-10 right-10 text-6xl animate-float" style={{ animationDelay: '1.5s' }}>🌟</div>
      </div>

      {/* Main Card */}
      <div className="card max-w-lg w-full text-center animate-bounce-in relative z-10">
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold mb-2 gradient-text">
          🎯 לומדים אנגלית! 🎯
        </h1>
        <p className="text-gray-600 text-lg mb-8">משחק הזיכרון הכי כיף!</p>

        {/* Player Badge */}
        {player && player.totalScore > 0 && (
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">🏆 השחקן שלנו</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">{getLevelInfo(player.level).emoji}</span>
              <span className="font-bold text-xl">{player.name}</span>
              <span className="text-purple-600 font-bold">{player.totalScore} נק׳</span>
            </div>
          </div>
        )}

        {!showNameInput ? (
          <>
            {/* List Selection */}
            {lists.length > 0 ? (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-4 text-gray-700">בחר/י רשימה לתרגול:</h2>
                <div className="grid gap-3 max-h-60 overflow-y-auto">
                  {lists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => handleListSelect(list.id)}
                      className={`p-4 rounded-2xl text-lg font-medium transition-all duration-200 
                        ${selectedList === list.id 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white scale-105' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:scale-102'
                        }`}
                    >
                      📝 {list.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 rounded-2xl p-6 mb-6">
                <p className="text-yellow-700 text-lg">
                  🌟 עדיין אין רשימות מילים!
                  <br />
                  <span className="text-sm">לחץ/י על ״ניהול רשימות״ כדי להתחיל</span>
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  soundManager.playClick();
                  onManageLists();
                }}
                className="btn-game bg-gradient-to-r from-teal-400 to-cyan-500 text-white"
              >
                📋 ניהול רשימות
              </button>
              <button
                onClick={() => {
                  soundManager.playClick();
                  onShowScoreboard();
                }}
                className="btn-game bg-gradient-to-r from-amber-400 to-orange-500 text-white"
              >
                🏆 הניקוד שלי
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Name Input */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4 text-gray-700">מה השם שלך? 🎤</h2>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="הכנס/י את השם שלך..."
                className="w-full p-4 text-xl text-center rounded-2xl border-2 border-purple-300 
                  focus:border-purple-500 focus:outline-none transition-all"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && playerName.trim()) {
                    handleStartGame();
                  }
                }}
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleStartGame}
                disabled={!playerName.trim()}
                className={`btn-game text-white ${
                  playerName.trim() 
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                🚀 יאללה מתחילים!
              </button>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setShowNameInput(false);
                  setSelectedList(null);
                }}
                className="btn-game bg-gray-200 text-gray-700"
              >
                ⬅️ חזרה
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
