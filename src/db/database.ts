// Database using REST API for lists/words and localStorage for player data

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

// API base URL - use localhost:3001 for dev, or relative path for production
const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

// Fallback to JSON files if API is not available
const JSON_BASE = import.meta.env.BASE_URL + 'data';

// Cache for lists data
let listsCache: WordList[] = [];
let wordsCache: Word[] = [];
let useApi = true;

// Initialize database - fetch lists from API or JSON file
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Try API first
    const response = await fetch(`${API_BASE}/lists`);
    if (response.ok) {
      listsCache = await response.json();
      // Fetch all words
      const wordsPromises = listsCache.map(async (list) => {
        const res = await fetch(`${API_BASE}/lists/${list.id}/words`);
        return res.ok ? res.json() : [];
      });
      const wordsArrays = await Promise.all(wordsPromises);
      wordsCache = wordsArrays.flat();
      useApi = true;
      await initializePlayer();
      return;
    }
  } catch {
    // API not available, fall back to JSON
  }

  // Fallback to JSON files
  try {
    const response = await fetch(`${JSON_BASE}/lists.json`);
    if (response.ok) {
      const data = await response.json();
      listsCache = data.lists || [];
      wordsCache = data.words || [];
    }
  } catch (error) {
    console.error('Failed to load data:', error);
  }
  useApi = false;
  await initializePlayer();
};

// Word List operations
export const getAllLists = (): WordList[] => {
  return listsCache;
};

export const getList = (id: number): WordList | undefined => {
  return listsCache.find(list => list.id === id);
};

export const addList = async (name: string): Promise<number> => {
  if (!useApi) return -1;
  
  const response = await fetch(`${API_BASE}/lists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  
  if (response.ok) {
    const newList = await response.json();
    listsCache.push(newList);
    return newList.id;
  }
  return -1;
};

export const deleteList = async (id: number): Promise<void> => {
  if (!useApi) return;
  
  await fetch(`${API_BASE}/lists/${id}`, { method: 'DELETE' });
  listsCache = listsCache.filter(l => l.id !== id);
  wordsCache = wordsCache.filter(w => w.listId !== id);
};

// Word operations
export const getWordsByList = (listId: number): Word[] => {
  return wordsCache.filter(word => word.listId === listId);
};

export const addWord = async (english: string, hebrew: string, listId: number): Promise<number> => {
  if (!useApi) return -1;
  
  const response = await fetch(`${API_BASE}/lists/${listId}/words`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ english, hebrew })
  });
  
  if (response.ok) {
    const newWord = await response.json();
    wordsCache.push(newWord);
    return newWord.id;
  }
  return -1;
};

export const updateWord = async (id: number, updates: Partial<Pick<Word, 'english' | 'hebrew'>>): Promise<void> => {
  if (!useApi) return;
  
  const response = await fetch(`${API_BASE}/words/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  
  if (response.ok) {
    const updated = await response.json();
    const index = wordsCache.findIndex(w => w.id === id);
    if (index !== -1) wordsCache[index] = updated;
  }
};

export const deleteWord = async (id: number): Promise<void> => {
  if (!useApi) return;
  
  await fetch(`${API_BASE}/words/${id}`, { method: 'DELETE' });
  wordsCache = wordsCache.filter(w => w.id !== id);
};

// Player operations - use API if available, fallback to localStorage
const PLAYER_STORAGE_KEY = 'english-teach-player';

let playerCache: Player = {
  name: '',
  totalScore: 0,
  level: 'bronze',
  gamesPlayed: 0
};

// Load player data during initialization
export const initializePlayer = async (): Promise<void> => {
  if (useApi) {
    try {
      const response = await fetch(`${API_BASE}/scores`);
      if (response.ok) {
        playerCache = await response.json();
        return;
      }
    } catch {
      // Fall back to localStorage
    }
  }
  
  // Fallback to localStorage
  const stored = localStorage.getItem(PLAYER_STORAGE_KEY);
  if (stored) {
    playerCache = JSON.parse(stored);
  }
};

const savePlayerData = async (player: Player): Promise<void> => {
  playerCache = player;
  
  if (useApi) {
    try {
      await fetch(`${API_BASE}/scores`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(player)
      });
      return;
    } catch {
      // Fall back to localStorage
    }
  }
  
  localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(player));
};

export const getPlayer = (): Player => {
  return playerCache;
};

export const updatePlayer = (updates: Partial<Player>): Player => {
  const player = { ...playerCache, ...updates };
  savePlayerData(player);
  return player;
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
  const player = { ...playerCache, name };
  savePlayerData(player);
  return player;
};

export const addScore = (points: number): Player => {
  const player = { ...playerCache };
  player.totalScore = Math.max(0, player.totalScore + points);
  player.level = calculateLevel(player.totalScore);
  savePlayerData(player);
  return player;
};

export const incrementGamesPlayed = (): void => {
  const player = { ...playerCache };
  player.gamesPlayed += 1;
  savePlayerData(player);
};

export const resetData = async (): Promise<void> => {
  if (useApi) {
    try {
      await fetch(`${API_BASE}/scores/reset`, { method: 'POST' });
      playerCache = { name: '', totalScore: 0, level: 'bronze', gamesPlayed: 0 };
      return;
    } catch {
      // Fall back to localStorage
    }
  }
  localStorage.removeItem(PLAYER_STORAGE_KEY);
  playerCache = { name: '', totalScore: 0, level: 'bronze', gamesPlayed: 0 };
};

// Check if API is available
export const isApiAvailable = (): boolean => useApi;
