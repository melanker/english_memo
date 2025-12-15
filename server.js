import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(express.json());

// Enable CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const LISTS_FILE = path.join(__dirname, 'public/data/lists.json');
const SCORES_FILE = path.join(__dirname, 'public/data/scores.json');

// Helper functions
const readLists = () => JSON.parse(fs.readFileSync(LISTS_FILE, 'utf-8'));
const writeLists = (data) => fs.writeFileSync(LISTS_FILE, JSON.stringify(data, null, 2));
const readScores = () => JSON.parse(fs.readFileSync(SCORES_FILE, 'utf-8'));
const writeScores = (data) => fs.writeFileSync(SCORES_FILE, JSON.stringify(data, null, 2));

// ==================== LISTS API ====================

// GET all lists
app.get('/api/lists', (req, res) => {
  const data = readLists();
  res.json(data.lists);
});

// POST create new list
app.post('/api/lists', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  
  const data = readLists();
  const newId = data.lists.length > 0 ? Math.max(...data.lists.map(l => l.id)) + 1 : 1;
  const newList = { id: newId, name, createdAt: new Date().toISOString() };
  data.lists.push(newList);
  writeLists(data);
  res.status(201).json(newList);
});

// DELETE list
app.delete('/api/lists/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const data = readLists();
  data.lists = data.lists.filter(l => l.id !== id);
  data.words = data.words.filter(w => w.listId !== id);
  writeLists(data);
  res.json({ success: true });
});

// ==================== WORDS API ====================

// GET words by list
app.get('/api/lists/:listId/words', (req, res) => {
  const listId = parseInt(req.params.listId);
  const data = readLists();
  res.json(data.words.filter(w => w.listId === listId));
});

// POST add word to list
app.post('/api/lists/:listId/words', (req, res) => {
  const listId = parseInt(req.params.listId);
  const { english, hebrew } = req.body;
  if (!english) return res.status(400).json({ error: 'English word is required' });
  
  const data = readLists();
  const newId = data.words.length > 0 ? Math.max(...data.words.map(w => w.id)) + 1 : 1;
  const newWord = { id: newId, english, hebrew: hebrew || '', listId };
  data.words.push(newWord);
  writeLists(data);
  res.status(201).json(newWord);
});

// PUT update word
app.put('/api/words/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { english, hebrew } = req.body;
  const data = readLists();
  const word = data.words.find(w => w.id === id);
  if (!word) return res.status(404).json({ error: 'Word not found' });
  
  if (english !== undefined) word.english = english;
  if (hebrew !== undefined) word.hebrew = hebrew;
  writeLists(data);
  res.json(word);
});

// DELETE word
app.delete('/api/words/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const data = readLists();
  data.words = data.words.filter(w => w.id !== id);
  writeLists(data);
  res.json({ success: true });
});

// ==================== SCORES API ====================

// GET player scores
app.get('/api/scores', (req, res) => {
  const data = readScores();
  res.json(data.player);
});

// PUT update player scores
app.put('/api/scores', (req, res) => {
  const data = readScores();
  Object.assign(data.player, req.body);
  writeScores(data);
  res.json(data.player);
});

// POST reset scores
app.post('/api/scores/reset', (req, res) => {
  const data = { player: { name: '', totalScore: 0, level: 'bronze', gamesPlayed: 0 } };
  writeScores(data);
  res.json(data.player);
});

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  GET    /api/lists              - Get all lists');
  console.log('  POST   /api/lists              - Create list {name}');
  console.log('  DELETE /api/lists/:id          - Delete list');
  console.log('  GET    /api/lists/:id/words    - Get words in list');
  console.log('  POST   /api/lists/:id/words    - Add word {english, hebrew}');
  console.log('  PUT    /api/words/:id          - Update word {english, hebrew}');
  console.log('  DELETE /api/words/:id          - Delete word');
  console.log('  GET    /api/scores             - Get player scores');
  console.log('  PUT    /api/scores             - Update scores');
  console.log('  POST   /api/scores/reset       - Reset scores');
});

