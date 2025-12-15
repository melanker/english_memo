import { useState, useEffect } from 'react';
import { 
  getAllLists, getWordsByList, addList, deleteList as removeList,
  addWord, updateWord, deleteWord as removeWord, exportData, exportListsJson, exportScoresJson, importData
} from '../db/database';
import type { WordList, Word } from '../db/database';
import { translateToHebrew } from '../services/translation';
import { soundManager } from '../services/sounds';

interface ListManagerProps {
  onBack: () => void;
}

export const ListManager = ({ onBack }: ListManagerProps) => {
  const [lists, setLists] = useState<WordList[]>([]);
  const [selectedList, setSelectedList] = useState<WordList | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [newListName, setNewListName] = useState('');
  const [newWord, setNewWord] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showNewListForm, setShowNewListForm] = useState(false);

  useEffect(() => {
    loadLists();
  }, []);

  useEffect(() => {
    if (selectedList) {
      loadWords(selectedList.id);
    }
  }, [selectedList]);

  const loadLists = () => {
    const allLists = getAllLists();
    setLists(allLists);
  };

  const loadWords = (listId: number) => {
    const listWords = getWordsByList(listId);
    setWords(listWords);
  };

  const createList = () => {
    if (!newListName.trim()) return;
    
    soundManager.playClick();
    const id = addList(newListName.trim());
    
    setNewListName('');
    setShowNewListForm(false);
    loadLists();
    
    const allLists = getAllLists();
    const newList = allLists.find(l => l.id === id);
    if (newList) {
      setSelectedList(newList);
    }
  };

  const handleDeleteList = (listId: number) => {
    soundManager.playClick();
    removeList(listId);
    
    if (selectedList?.id === listId) {
      setSelectedList(null);
      setWords([]);
    }
    loadLists();
  };

  const handleAddWord = async () => {
    if (!newWord.trim() || !selectedList) return;
    
    setIsTranslating(true);
    const result = await translateToHebrew(newWord.trim());
    
    addWord(newWord.trim(), result.success ? result.translation : '', selectedList.id);
    
    soundManager.playClick();
    setNewWord('');
    setIsTranslating(false);
    loadWords(selectedList.id);
  };

  const handleUpdateWord = (wordId: number, field: 'english' | 'hebrew', value: string) => {
    updateWord(wordId, { [field]: value });
    loadWords(selectedList!.id);
  };

  const handleDeleteWord = (wordId: number) => {
    soundManager.playClick();
    removeWord(wordId);
    loadWords(selectedList!.id);
  };

  const retranslateWord = async (word: Word) => {
    setIsTranslating(true);
    const result = await translateToHebrew(word.english);
    if (result.success) {
      updateWord(word.id, { hebrew: result.translation });
      loadWords(selectedList!.id);
    }
    setIsTranslating(false);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'english-teach-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    soundManager.playClick();
  };

  const downloadTextFile = (contents: string, filename: string) => {
    const blob = new Blob([contents], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    soundManager.playClick();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        if (importData(text)) {
          soundManager.playClick();
          loadLists();
          setSelectedList(null);
          setWords([]);
          alert('הנתונים יובאו בהצלחה!');
        } else {
          alert('שגיאה בייבוא הנתונים');
        }
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="card mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <button
              onClick={() => {
                soundManager.playClick();
                onBack();
              }}
              className="btn-game bg-gray-200 text-gray-700 text-base py-2 px-4"
            >
              ⬅️ חזרה
            </button>
            <h1 className="text-2xl font-bold gradient-text">📋 ניהול רשימות</h1>
            <div className="flex gap-2">
              <button
                onClick={() => downloadTextFile(exportListsJson(), 'lists.json')}
                className="py-2 px-3 bg-purple-100 text-purple-700 rounded-xl text-sm font-medium
                  hover:bg-purple-200 transition-colors"
                title="הורד lists.json (כדי לעדכן את GitHub)"
              >
                📄 lists.json
              </button>
              <button
                onClick={() => downloadTextFile(exportScoresJson(), 'scores.json')}
                className="py-2 px-3 bg-amber-100 text-amber-800 rounded-xl text-sm font-medium
                  hover:bg-amber-200 transition-colors"
                title="הורד scores.json (כדי לעדכן את GitHub)"
              >
                📄 scores.json
              </button>
              <button
                onClick={handleExport}
                className="py-2 px-3 bg-blue-100 text-blue-700 rounded-xl text-sm font-medium
                  hover:bg-blue-200 transition-colors"
                title="ייצא נתונים"
              >
                📤 ייצוא
              </button>
              <button
                onClick={handleImport}
                className="py-2 px-3 bg-green-100 text-green-700 rounded-xl text-sm font-medium
                  hover:bg-green-200 transition-colors"
                title="ייבא נתונים"
              >
                📥 ייבוא
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Lists Panel */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 text-gray-700">📚 הרשימות שלי</h2>
            
            {!showNewListForm ? (
              <button
                onClick={() => {
                  soundManager.playClick();
                  setShowNewListForm(true);
                }}
                className="w-full btn-game bg-gradient-to-r from-green-400 to-emerald-500 text-white mb-4"
              >
                ➕ רשימה חדשה
              </button>
            ) : (
              <div className="bg-green-50 rounded-2xl p-4 mb-4">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="שם הרשימה..."
                  className="w-full p-3 rounded-xl border-2 border-green-300 focus:border-green-500 
                    focus:outline-none mb-3"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') createList();
                    if (e.key === 'Escape') setShowNewListForm(false);
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={createList}
                    className="flex-1 py-2 px-4 bg-green-500 text-white rounded-xl font-medium
                      hover:bg-green-600 transition-colors"
                  >
                    ✓ צור
                  </button>
                  <button
                    onClick={() => {
                      setShowNewListForm(false);
                      setNewListName('');
                    }}
                    className="py-2 px-4 bg-gray-200 text-gray-700 rounded-xl font-medium
                      hover:bg-gray-300 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {lists.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  אין רשימות עדיין 📝
                </p>
              ) : (
                lists.map((list) => (
                  <div
                    key={list.id}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer
                      transition-all duration-200 ${
                        selectedList?.id === list.id
                          ? 'bg-purple-100 border-2 border-purple-400'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    onClick={() => {
                      soundManager.playClick();
                      setSelectedList(list);
                    }}
                  >
                    <span className="font-medium text-gray-700">{list.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`למחוק את הרשימה "${list.name}"?`)) {
                          handleDeleteList(list.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Words Panel */}
          <div className="card">
            {selectedList ? (
              <>
                <h2 className="text-xl font-bold mb-4 text-gray-700">
                  📝 מילים ב-{selectedList.name}
                </h2>

                {/* Add Word Form */}
                <div className="bg-blue-50 rounded-2xl p-4 mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      placeholder="מילה באנגלית..."
                      className="flex-1 p-3 rounded-xl border-2 border-blue-300 focus:border-blue-500 
                        focus:outline-none text-left"
                      dir="ltr"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isTranslating) handleAddWord();
                      }}
                    />
                    <button
                      onClick={handleAddWord}
                      disabled={isTranslating || !newWord.trim()}
                      className={`py-2 px-4 rounded-xl font-medium transition-colors ${
                        isTranslating || !newWord.trim()
                          ? 'bg-gray-200 text-gray-400'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {isTranslating ? '⏳' : '➕'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 התרגום יתווסף אוטומטית - ניתן לערוך אותו
                  </p>
                </div>

                {/* Words List */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {words.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      הוסף/י מילים לרשימה ✏️
                    </p>
                  ) : (
                    words.map((word) => (
                      <div
                        key={word.id}
                        className="bg-gray-50 rounded-xl p-3 flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={word.english}
                          onChange={(e) => handleUpdateWord(word.id, 'english', e.target.value)}
                          className="flex-1 p-2 rounded-lg border border-gray-200 text-left text-sm"
                          dir="ltr"
                        />
                        <span className="text-gray-400">→</span>
                        <input
                          type="text"
                          value={word.hebrew}
                          onChange={(e) => handleUpdateWord(word.id, 'hebrew', e.target.value)}
                          className="flex-1 p-2 rounded-lg border border-gray-200 text-sm"
                          placeholder="תרגום..."
                        />
                        <button
                          onClick={() => retranslateWord(word)}
                          className="text-blue-500 hover:text-blue-700 p-1"
                          title="תרגם מחדש"
                        >
                          🔄
                        </button>
                        <button
                          onClick={() => handleDeleteWord(word.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <p className="text-center">
                  👈 בחר/י רשימה מהצד
                  <br />
                  או צור/י רשימה חדשה
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
