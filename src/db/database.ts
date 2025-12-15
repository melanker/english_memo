// LocalStorage-based database for GitHub Pages deployment

export type Word = {
  id: number;
  english: string;
  hebrew: string;
  listId: number;
};

export type WordList = {
  id: number;
  name: string;
  createdAt: string;
};

export type Player = {
  name: string;
  totalScore: number;
  level: 'bronze' | 'silver' | 'gold' | 'diamond';
  gamesPlayed: number;
};

type StorageData = {
  lists: WordList[];
  words: Word[];
  player: Player;
  initialized: boolean;
};

const STORAGE_KEY = 'english-teach-data';

// Get data from localStorage
const getData = (): StorageData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    lists: [],
    words: [],
    player: {
      name: '',
      totalScore: 0,
      level: 'bronze',
      gamesPlayed: 0
    },
    initialized: false
  };
};

// Save data to localStorage
const saveData = (data: StorageData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Initialize with default data from JSON files
export const initializeDatabase = async (): Promise<void> => {
  const data = getData();
  
  // Only load defaults if not already initialized
  if (!data.initialized) {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}data/lists.json`);
      if (response.ok) {
        const defaultData = await response.json();
        data.lists = defaultData.lists || [];
        data.words = defaultData.words || [];
        data.initialized = true;
        saveData(data);
      }
    } catch (error) {
      console.log('No default data found, starting fresh');
      data.initialized = true;
      saveData(data);
    }
  }
};

// Generate next ID for a collection
const getNextId = (items: { id: number }[]): number => {
  if (items.length === 0) return 1;
  return Math.max(...items.map(item => item.id)) + 1;
};

// Word List operations
export const getAllLists = (): WordList[] => {
  return getData().lists;
};

export const getList = (id: number): WordList | undefined => {
  return getData().lists.find(list => list.id === id);
};

export const addList = (name: string): number => {
  const data = getData();
  const newList: WordList = {
    id: getNextId(data.lists),
    name,
    createdAt: new Date().toISOString()
  };
  data.lists.push(newList);
  saveData(data);
  return newList.id;
};

export const deleteList = (id: number): void => {
  const data = getData();
  data.lists = data.lists.filter(list => list.id !== id);
  data.words = data.words.filter(word => word.listId !== id);
  saveData(data);
};

// Word operations
export const getWordsByList = (listId: number): Word[] => {
  return getData().words.filter(word => word.listId === listId);
};

export const addWord = (english: string, hebrew: string, listId: number): number => {
  const data = getData();
  const newWord: Word = {
    id: getNextId(data.words),
    english,
    hebrew,
    listId
  };
  data.words.push(newWord);
  saveData(data);
  return newWord.id;
};

export const updateWord = (id: number, updates: Partial<Pick<Word, 'english' | 'hebrew'>>): void => {
  const data = getData();
  const wordIndex = data.words.findIndex(word => word.id === id);
  if (wordIndex !== -1) {
    data.words[wordIndex] = { ...data.words[wordIndex], ...updates };
    saveData(data);
  }
};

export const deleteWord = (id: number): void => {
  const data = getData();
  data.words = data.words.filter(word => word.id !== id);
  saveData(data);
};

// Player operations
export const getPlayer = (): Player => {
  return getData().player;
};

export const updatePlayer = (updates: Partial<Player>): Player => {
  const data = getData();
  data.player = { ...data.player, ...updates };
  saveData(data);
  return data.player;
};

export const calculateLevel = (score: number): 'bronze' | 'silver' | 'gold' | 'diamond' => {
  if (score >= 500) return 'diamond';
  if (score >= 200) return 'gold';
  if (score >= 50) return 'silver';
  return 'bronze';
};

export const getLevelInfo = (level: 'bronze' | 'silver' | 'gold' | 'diamond') => {
  const levels = {
    bronze: { name: 'ארד', emoji: '🥉', color: '#CD7F32', nextAt: 50 },
    silver: { name: 'כסף', emoji: '🥈', color: '#9CA3AF', nextAt: 200 },
    gold: { name: 'זהב', emoji: '🥇', color: '#F59E0B', nextAt: 500 },
    diamond: { name: 'יהלום', emoji: '💎', color: '#06B6D4', nextAt: null }
  };
  return levels[level];
};

export const setPlayerName = (name: string): Player => {
  const data = getData();
  data.player.name = name;
  saveData(data);
  return data.player;
};

export const addScore = (points: number): Player => {
  const data = getData();
  data.player.totalScore = Math.max(0, data.player.totalScore + points);
  data.player.level = calculateLevel(data.player.totalScore);
  saveData(data);
  return data.player;
};

export const incrementGamesPlayed = (): void => {
  const data = getData();
  data.player.gamesPlayed += 1;
  saveData(data);
};

// Export data for backup
export const exportData = (): string => {
  return JSON.stringify(getData(), null, 2);
};

export const exportListsJson = (): string => {
  const data = getData();
  return JSON.stringify({ lists: data.lists, words: data.words }, null, 2);
};

export const exportScoresJson = (): string => {
  const data = getData();
  return JSON.stringify({ player: data.player }, null, 2);
};

// Import data from backup
export const importData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString) as StorageData;
    if (data.lists && data.words && data.player) {
      saveData(data);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

// Reset all data
export const resetData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
