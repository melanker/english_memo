import { useState, useEffect, useCallback, useRef } from 'react';
import { getWordsByList, setPlayerName, addScore, getLevelInfo, incrementGamesPlayed } from '../db/database';
import type { Word, Player } from '../db/database';
import { speakWord } from '../services/translation';
import { soundManager } from '../services/sounds';
import eyalImage from '../assets/eyal.png';

interface GameProps {
  listId: number;
  playerName: string;
  onExit: () => void;
}

interface GameState {
  currentWord: Word | null;
  options: string[];
  answered: boolean;
  isCorrect: boolean | null;
  correctAnswer: string;
}

// 200+ common Hebrew words as distractors
const DISTRACTOR_WORDS = [
  // Furniture & Home
  'שולחן', 'כיסא', 'חלון', 'דלת', 'ספר', 'עיפרון', 'מחברת', 'תיק',
  'מיטה', 'כרית', 'שמיכה', 'מזרן', 'ארון', 'מדף', 'מראה', 'שטיח',
  'מקרר', 'תנור', 'כיור', 'ברז', 'אמבטיה', 'מקלחת', 'שירותים', 'סבון',
  'מגבת', 'מברשת', 'מסרק', 'קיר', 'תקרה', 'רצפה', 'גג', 'מרפסת',
  // Nature
  'בית', 'רחוב', 'עץ', 'פרח', 'שמש', 'ירח', 'כוכב', 'ענן',
  'מים', 'אש', 'רוח', 'אדמה', 'שמיים', 'ים', 'הר', 'נהר',
  'יער', 'מדבר', 'אגם', 'מעיין', 'גשם', 'שלג', 'ברק', 'רעם',
  'קשת', 'טל', 'ערפל', 'סערה', 'חול', 'סלע', 'אבן', 'עשב',
  // Animals
  'כלב', 'חתול', 'ציפור', 'דג', 'פרפר', 'נמלה', 'דבורה', 'ארנב',
  'פיל', 'אריה', 'נמר', 'זברה', 'ג׳ירפה', 'קוף', 'דוב', 'זאב',
  'שועל', 'צב', 'נחש', 'לטאה', 'עכביש', 'זבוב', 'יתוש', 'פרה',
  'סוס', 'חמור', 'כבש', 'עז', 'תרנגול', 'ברווז', 'אווז', 'יונה',
  'עורב', 'נשר', 'ינשוף', 'תוכי', 'דולפין', 'לוויתן', 'כריש', 'צדף',
  // Family
  'אבא', 'אמא', 'אח', 'אחות', 'סבא', 'סבתא', 'דוד', 'דודה',
  'בן', 'בת', 'נכד', 'נכדה', 'חבר', 'חברה', 'שכן', 'שכנה',
  // Colors
  'אדום', 'כחול', 'ירוק', 'צהוב', 'לבן', 'שחור', 'כתום', 'סגול',
  'ורוד', 'חום', 'אפור', 'זהב', 'כסף', 'תכלת', 'טורקיז', 'בז׳',
  // Adjectives
  'גדול', 'קטן', 'יפה', 'חזק', 'מהיר', 'איטי', 'חכם', 'טוב',
  'רע', 'חדש', 'ישן', 'צעיר', 'זקן', 'גבוה', 'נמוך', 'רחב',
  'צר', 'עמוק', 'רדוד', 'חם', 'קר', 'רטוב', 'יבש', 'קשה',
  'רך', 'חלק', 'מחוספס', 'כבד', 'קל', 'מלא', 'ריק', 'פתוח',
  'סגור', 'נקי', 'מלוכלך', 'בהיר', 'כהה', 'חזק', 'חלש', 'ארוך',
  'קצר', 'עגול', 'מרובע', 'חד', 'קהה', 'מתוק', 'מלוח', 'חמוץ',
  // Food
  'אוכל', 'שתייה', 'לחם', 'חלב', 'גבינה', 'ביצה', 'תפוח', 'בננה',
  'תפוז', 'ענב', 'אבטיח', 'מלון', 'תות', 'דובדבן', 'אפרסק', 'שזיף',
  'גזר', 'מלפפון', 'עגבנייה', 'בצל', 'שום', 'תפוח אדמה', 'פלפל', 'חסה',
  'אורז', 'פסטה', 'בשר', 'עוף', 'דג', 'מרק', 'סלט', 'עוגה',
  'עוגייה', 'שוקולד', 'גלידה', 'סוכר', 'מלח', 'פלפל', 'שמן', 'חומץ',
  // Technology
  'שעון', 'טלפון', 'מחשב', 'טלוויזיה', 'רדיו', 'מנורה', 'מצלמה', 'מקלדת',
  'עכבר', 'מסך', 'אוזניות', 'רמקול', 'מטען', 'כבל', 'שלט', 'מדפסת',
  // Clothing
  'נעליים', 'חולצה', 'מכנסיים', 'כובע', 'משקפיים', 'טבעת', 'שרשרת', 'צמיד',
  'שמלה', 'חצאית', 'מעיל', 'סוודר', 'ז׳קט', 'גרביים', 'כפפות', 'צעיף',
  'חגורה', 'עניבה', 'בגד ים', 'פיג׳מה', 'כפכפים', 'מגפיים', 'סנדלים', 'תחתונים',
  // Professions
  'רופא', 'אחות', 'שוטר', 'נהג', 'טייס', 'שחקן', 'זמר', 'צייר',
  'מורה', 'מהנדס', 'עורך דין', 'שופט', 'חקלאי', 'טבח', 'אופה', 'קצב',
  'ספר', 'נגר', 'חשמלאי', 'שרברב', 'צלם', 'עיתונאי', 'סופר', 'משורר',
  // Time
  'בוקר', 'צהריים', 'ערב', 'לילה', 'יום', 'שבוע', 'חודש', 'שנה',
  'שנייה', 'דקה', 'שעה', 'אתמול', 'היום', 'מחר', 'עכשיו', 'תמיד',
  'לפעמים', 'אף פעם', 'מוקדם', 'מאוחר', 'ראשון', 'שני', 'שלישי', 'רביעי',
  // Numbers
  'אחד', 'שניים', 'שלושה', 'ארבעה', 'חמישה', 'שישה', 'שבעה', 'שמונה',
  'תשעה', 'עשר', 'עשרים', 'שלושים', 'ארבעים', 'חמישים', 'מאה', 'אלף',
  // Emotions & States
  'שמח', 'עצוב', 'כועס', 'עייף', 'רעב', 'צמא', 'חולה', 'בריא',
  'מפחד', 'אמיץ', 'גאה', 'נבוך', 'מופתע', 'משועמם', 'מתרגש', 'רגוע',
  'עצבני', 'סקרן', 'מאוהב', 'בודד', 'מאושר', 'מתוסכל', 'מבולבל', 'בטוח',
  // Body Parts
  'ראש', 'פנים', 'עין', 'אוזן', 'אף', 'פה', 'שן', 'לשון',
  'צוואר', 'כתף', 'זרוע', 'יד', 'אצבע', 'ציפורן', 'חזה', 'בטן',
  'גב', 'רגל', 'ברך', 'כף רגל', 'בוהן', 'לב', 'ריאה', 'מוח',
  // Places
  'בית ספר', 'גן', 'חנות', 'מסעדה', 'בית חולים', 'תחנה', 'שדה תעופה', 'מלון',
  'בנק', 'דואר', 'ספרייה', 'מוזיאון', 'קולנוע', 'תיאטרון', 'פארק', 'חוף',
  'הר', 'עמק', 'כפר', 'עיר', 'מדינה', 'יבשת', 'אי', 'מדרחוב',
  // Actions (as nouns)
  'הליכה', 'ריצה', 'קפיצה', 'שחייה', 'טיסה', 'נסיעה', 'קריאה', 'כתיבה',
  'ציור', 'שירה', 'ריקוד', 'משחק', 'לימוד', 'עבודה', 'מנוחה', 'שינה',
  // School
  'תלמיד', 'מורה', 'כיתה', 'לוח', 'גיר', 'מחק', 'סרגל', 'מספריים',
  'דבק', 'צבעים', 'מברשת', 'בד', 'נייר', 'מעטפה', 'בול', 'תעודה'
];

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const Game = ({ listId, playerName, onExit }: GameProps) => {
  const [words, setWords] = useState<Word[]>([]);
  const [remainingWords, setRemainingWords] = useState<Word[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    currentWord: null,
    options: [],
    answered: false,
    isCorrect: null,
    correctAnswer: ''
  });
  const [player, setPlayer] = useState<Player | null>(null);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState<string>('');
  const [showEyalWin, setShowEyalWin] = useState(false);
  const spinTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        window.clearTimeout(spinTimeoutRef.current);
        spinTimeoutRef.current = null;
      }
    };
  }, []);

  const initGame = () => {
    const loadedWords = getWordsByList(listId);
    const validWords = loadedWords.filter(w => w.hebrew && w.hebrew.trim());
    
    if (validWords.length < 2) {
      alert('צריך לפחות 2 מילים עם תרגום כדי לשחק!');
      onExit();
      return;
    }
    
    setWords(validWords);
    const shuffled = shuffleArray(validWords);
    setRemainingWords(shuffled);
    
    const playerData = setPlayerName(playerName);
    setPlayer(playerData);
    setPreviousLevel(playerData.level);
    
    incrementGamesPlayed();
    nextWord(shuffled, validWords);
  };

  const generateOptions = useCallback((correctWord: Word, allWords: Word[]): string[] => {
    const correctAnswer = correctWord.hebrew;
    const otherListWords = allWords
      .filter(w => w.id !== correctWord.id && w.hebrew !== correctAnswer)
      .map(w => w.hebrew);

    const listOptions = shuffleArray(otherListWords).slice(0, 4);
    const usedWords = new Set([correctAnswer, ...listOptions]);
    const availableDistractors = DISTRACTOR_WORDS.filter(word => !usedWords.has(word));
    const neededDistractors = Math.max(0, 9 - listOptions.length);
    const distractors = shuffleArray(availableDistractors).slice(0, neededDistractors);

    const options = [correctAnswer, ...listOptions, ...distractors];
    return shuffleArray(options);
  }, []);

  const nextWord = useCallback((remaining: Word[], allWords: Word[]) => {
    let wordsToUse = remaining;
    
    if (remaining.length === 0) {
      wordsToUse = shuffleArray(allWords);
      setRemainingWords(wordsToUse);
      setRoundNumber(r => r + 1);
    }
    
    const currentWord = wordsToUse[0];
    const newRemaining = wordsToUse.slice(1);
    setRemainingWords(newRemaining);
    
    const options = generateOptions(currentWord, allWords);
    
    setGameState({
      currentWord,
      options,
      answered: false,
      isCorrect: null,
      correctAnswer: currentWord.hebrew
    });
    
    // Speak the word
    setTimeout(() => {
      speakWord(currentWord.english);
    }, 300);
  }, [generateOptions]);

  const handleAnswer = (selectedAnswer: string) => {
    if (gameState.answered) return;
    
    const isCorrect = selectedAnswer === gameState.correctAnswer;
    
    setGameState(prev => ({
      ...prev,
      answered: true,
      isCorrect
    }));
    
    if (isCorrect) {
      soundManager.playFart();
      setShowEyalWin(true);
      if (spinTimeoutRef.current) window.clearTimeout(spinTimeoutRef.current);
      spinTimeoutRef.current = window.setTimeout(() => setShowEyalWin(false), 1500);

      setSessionScore(s => s + 1);
      setSessionCorrect(c => c + 1);
      
      const updatedPlayer = addScore(1);
      
      // Check for level up
      if (updatedPlayer.level !== previousLevel) {
        setShowLevelUp(true);
        soundManager.playLevelUp();
        setPreviousLevel(updatedPlayer.level);
      }
      
      setPlayer(updatedPlayer);
    } else {
      soundManager.playWrong();
      setSessionScore(s => s - 1);
      setSessionWrong(w => w + 1);
      
      const updatedPlayer = addScore(-1);
      setPlayer(updatedPlayer);
    }
  };

  const handleNext = () => {
    soundManager.playClick();
    setShowLevelUp(false);
    nextWord(remainingWords, words);
  };

  const handleSpeak = () => {
    if (gameState.currentWord) {
      speakWord(gameState.currentWord.english);
    }
  };

  if (!gameState.currentWord || !player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-3xl animate-pulse flex items-center gap-3">
          <span className="text-4xl">⏳</span>
          <span>טוען את המשחק...</span>
        </div>
      </div>
    );
  }

  const levelInfo = getLevelInfo(player.level);
  const wordsInRound = words.length;
  const wordsRemaining = remainingWords.length;
  const wordNumber = wordsInRound - wordsRemaining;

  return (
    <div className="min-h-screen p-4 flex flex-col">
      {/* Correct Celebration */}
      {showEyalWin && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center p-4">
          <div className="eyal-celebrate">
            <div className="eyal-sparkle eyal-sparkle-1">✨</div>
            <div className="eyal-sparkle eyal-sparkle-2">⭐</div>
            <div className="eyal-sparkle eyal-sparkle-3">💥</div>
            <img src={eyalImage} alt="" className="eyal-spin" draggable={false} />
            <div className="mt-3 text-2xl md:text-3xl font-extrabold text-white drop-shadow">
              אלוף/ה!!! 🎉
            </div>
          </div>
        </div>
      )}

      {/* Level Up Overlay */}
      {showLevelUp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card text-center animate-bounce-in">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold mb-2 gradient-text">עלית רמה!</h2>
            <div className="text-5xl my-4">{levelInfo.emoji}</div>
            <p className="text-2xl font-bold" style={{ color: levelInfo.color }}>
              {levelInfo.name}
            </p>
            <button
              onClick={() => setShowLevelUp(false)}
              className="mt-6 btn-game bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              יאללה נמשיך! 🚀
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="card mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <button
            onClick={() => {
              soundManager.playClick();
              if (confirm('בטוח/ה שרוצה לצאת?')) {
                onExit();
              }
            }}
            className="py-2 px-4 bg-gray-200 text-gray-700 rounded-xl font-medium
              hover:bg-gray-300 transition-colors"
          >
            ⬅️ יציאה
          </button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-xl">
              <span className="text-2xl">{levelInfo.emoji}</span>
              <span className="font-bold">{player.name}</span>
            </div>
            <div className="bg-green-100 px-4 py-2 rounded-xl">
              <span className="font-bold text-green-700">{player.totalScore} נק׳</span>
            </div>
          </div>
          
          <div className="text-gray-600">
            סיבוב {roundNumber} | מילה {wordNumber}/{wordsInRound}
          </div>
        </div>
      </div>

      {/* Session Stats */}
      <div className="flex justify-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-5 py-3 rounded-2xl shadow-lg">
          <span className="text-2xl">✓</span>
          <span className="text-2xl font-bold">{sessionCorrect}</span>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-red-400 to-rose-500 text-white px-5 py-3 rounded-2xl shadow-lg">
          <span className="text-2xl">✗</span>
          <span className="text-2xl font-bold">{sessionWrong}</span>
        </div>
        <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl shadow-lg text-white ${
          sessionScore >= 0
            ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
            : 'bg-gradient-to-r from-gray-400 to-gray-500'
        }`}>
          <span className="text-2xl">⭐</span>
          <span className="text-2xl font-bold">
            {sessionScore >= 0 ? '+' : ''}{sessionScore}
          </span>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Word Display */}
        <div 
          className={`card max-w-md w-full text-center mb-8 cursor-pointer hover:scale-105 transition-transform
            ${gameState.answered ? (gameState.isCorrect ? 'ring-4 ring-green-400' : 'ring-4 ring-red-400') : ''}`}
          onClick={handleSpeak}
        >
          <p className="text-gray-500 mb-2">לחץ/י להאזנה 🔊</p>
          <h2 
            className="text-5xl md:text-6xl font-bold text-gray-800 mb-4"
            dir="ltr"
          >
            {gameState.currentWord.english}
          </h2>
          
          {gameState.answered && !gameState.isCorrect && (
            <div className="mt-4 bg-red-50 rounded-xl p-4 animate-bounce-in">
              <p className="text-red-600 font-medium">התשובה הנכונה:</p>
              <p className="text-2xl font-bold text-red-700">{gameState.correctAnswer}</p>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3 w-full max-w-4xl px-2">
          {gameState.options.map((option, index) => {
            let buttonClass = 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:scale-105';
            
            if (gameState.answered) {
              if (option === gameState.correctAnswer) {
                buttonClass = 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-2 border-green-300 scale-105 shadow-lg shadow-green-200';
              } else {
                buttonClass = 'bg-gray-100 text-gray-400 border-2 border-gray-200 opacity-60';
              }
            }
            
            return (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                disabled={gameState.answered}
                className={`p-3 md:p-4 rounded-xl text-lg md:text-xl font-bold 
                  shadow-md transform transition-all duration-200 ${buttonClass}
                  ${gameState.answered ? 'cursor-default' : 'active:scale-95'} game-option`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        {gameState.answered && (
          <button
            onClick={handleNext}
            className="mt-8 btn-game bg-gradient-to-r from-purple-500 to-pink-500 text-white 
              animate-bounce-in text-2xl"
          >
            {gameState.isCorrect ? '🎉 מעולה! הבא →' : '💪 נמשיך! הבא →'}
          </button>
        )}
      </div>
    </div>
  );
};

