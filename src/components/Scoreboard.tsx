import { useState, useEffect } from 'react';
import { getPlayer, getLevelInfo, resetData } from '../db/database';
import type { Player } from '../db/database';
import { soundManager } from '../services/sounds';

interface ScoreboardProps {
  onBack: () => void;
}

export const Scoreboard = ({ onBack }: ScoreboardProps) => {
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    loadPlayer();
  }, []);

  const loadPlayer = () => {
    const playerData = getPlayer();
    setPlayer(playerData);
  };

  const handleReset = () => {
    if (confirm('בטוח/ה שרוצה לאפס את כל הנתונים? פעולה זו לא ניתנת לביטול!')) {
      resetData();
      soundManager.playClick();
      window.location.reload();
    }
  };

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">טוען... ⏳</div>
      </div>
    );
  }

  const levelInfo = getLevelInfo(player.level);
  const hasPlayed = player.gamesPlayed > 0;

  // Calculate progress to next level
  const getProgressToNextLevel = () => {
    const thresholds = { bronze: 0, silver: 50, gold: 200, diamond: 500 };
    const nextThresholds = { bronze: 50, silver: 200, gold: 500, diamond: 1000 };
    
    const current = thresholds[player.level];
    const next = nextThresholds[player.level];
    const progress = ((player.totalScore - current) / (next - current)) * 100;
    
    return Math.min(100, Math.max(0, progress));
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center">
      {/* Header */}
      <div className="card max-w-2xl w-full mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              soundManager.playClick();
              onBack();
            }}
            className="btn-game bg-gray-200 text-gray-700 text-base py-2 px-4"
          >
            ⬅️ חזרה
          </button>
          <h1 className="text-2xl font-bold gradient-text">🏆 הניקוד שלי</h1>
          <div className="w-24"></div>
        </div>
      </div>

      {/* Trophy Animation */}
      <div className="text-8xl mb-6 animate-float">🏆</div>

      {/* Player Stats Card */}
      <div className="card max-w-2xl w-full mb-6">
        {hasPlayed ? (
          <div className="text-center">
            {/* Level Badge */}
            <div 
              className="inline-flex items-center justify-center w-32 h-32 rounded-full mb-4"
              style={{ backgroundColor: `${levelInfo.color}20` }}
            >
              <span className="text-7xl">{levelInfo.emoji}</span>
            </div>
            
            {/* Player Name */}
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{player.name || 'שחקן'}</h2>
            
            {/* Level Name */}
            <p className="text-xl font-bold mb-6" style={{ color: levelInfo.color }}>
              רמת {levelInfo.name}
            </p>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-4">
                <p className="text-gray-500 text-sm">סה״כ נקודות</p>
                <p className="text-4xl font-bold text-purple-600">{player.totalScore}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl p-4">
                <p className="text-gray-500 text-sm">משחקים</p>
                <p className="text-4xl font-bold text-blue-600">{player.gamesPlayed}</p>
              </div>
            </div>
            
            {/* Progress to Next Level */}
            {player.level !== 'diamond' && (
              <div className="mb-6">
                <p className="text-gray-500 text-sm mb-2">התקדמות לרמה הבאה</p>
                <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${getProgressToNextLevel()}%`,
                      background: `linear-gradient(90deg, ${levelInfo.color}, ${
                        player.level === 'bronze' ? '#9CA3AF' : 
                        player.level === 'silver' ? '#F59E0B' : '#06B6D4'
                      })`
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {player.level === 'bronze' && `${50 - player.totalScore} נקודות לרמת כסף`}
                  {player.level === 'silver' && `${200 - player.totalScore} נקודות לרמת זהב`}
                  {player.level === 'gold' && `${500 - player.totalScore} נקודות לרמת יהלום`}
                </p>
              </div>
            )}
            
            {player.level === 'diamond' && (
              <div className="bg-gradient-to-r from-cyan-100 to-blue-100 rounded-2xl p-4 mb-6">
                <p className="text-cyan-700 font-bold text-lg">🎉 הגעת לרמה הגבוהה ביותר!</p>
                <p className="text-cyan-600 text-sm">את/ה אלוף/ה אמיתי/ת!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎮</div>
            <p className="text-xl text-gray-600">עוד לא שיחקת!</p>
            <p className="text-gray-400">התחל/י לשחק כדי לצבור נקודות</p>
          </div>
        )}
      </div>

      {/* Level Legend */}
      <div className="card max-w-2xl w-full mb-6">
        <h3 className="font-bold text-gray-700 mb-4 text-center">📊 הרמות במשחק</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['bronze', 'silver', 'gold', 'diamond'] as const).map((level) => {
            const info = getLevelInfo(level);
            const isCurrentLevel = player.level === level;
            return (
              <div 
                key={level}
                className={`text-center p-3 rounded-xl transition-all ${
                  isCurrentLevel ? 'scale-105 ring-2 ring-offset-2' : ''
                }`}
                style={{ 
                  backgroundColor: `${info.color}20`,
                  ...(isCurrentLevel ? { boxShadow: `0 0 0 2px ${info.color}` } : {})
                }}
              >
                <div className="text-3xl mb-1">{info.emoji}</div>
                <p className="font-bold" style={{ color: info.color }}>{info.name}</p>
                <p className="text-xs text-gray-500">
                  {info.nextAt ? `עד ${info.nextAt} נק׳` : '500+ נק׳'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={handleReset}
        className="text-red-400 hover:text-red-600 text-sm transition-colors"
      >
        🗑️ אפס את כל הנתונים
      </button>
    </div>
  );
};
