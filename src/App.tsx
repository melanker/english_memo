import { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { ListManager } from './components/ListManager';
import { Game } from './components/Game';
import { Scoreboard } from './components/Scoreboard';

type Screen = 'menu' | 'lists' | 'game' | 'scoreboard';

interface GameConfig {
  listId: number;
  playerName: string;
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);

  const handleStartGame = (listId: number, playerName: string) => {
    setGameConfig({ listId, playerName });
    setCurrentScreen('game');
  };

  const handleExitGame = () => {
    setGameConfig(null);
    setCurrentScreen('menu');
  };

  return (
    <>
      {currentScreen === 'menu' && (
        <MainMenu
          onStartGame={handleStartGame}
          onManageLists={() => setCurrentScreen('lists')}
          onShowScoreboard={() => setCurrentScreen('scoreboard')}
        />
      )}
      
      {currentScreen === 'lists' && (
        <ListManager onBack={() => setCurrentScreen('menu')} />
      )}
      
      {currentScreen === 'game' && gameConfig && (
        <Game
          listId={gameConfig.listId}
          playerName={gameConfig.playerName}
          onExit={handleExitGame}
        />
      )}
      
      {currentScreen === 'scoreboard' && (
        <Scoreboard onBack={() => setCurrentScreen('menu')} />
      )}
    </>
  );
}

export default App;
