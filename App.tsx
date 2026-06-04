
import React, { useState, useEffect } from 'react';
import { transliterateHinglish } from './services/geminiService.ts';
import { HindiResult, HistoryItem, WordMetadata } from './types.ts';
import Header from './components/Header.tsx';
import InputArea from './components/InputArea.tsx';
import ResultDisplay from './components/ResultDisplay.tsx';
import HistoryPanel from './components/HistoryPanel.tsx';
import Toast from './components/Toast.tsx';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<HindiResult[]>([]);
  const [words, setWords] = useState<WordMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      return 'dark';
    }
    return 'light';
  });

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('hinglish_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Error loading history", e);
      }
    }
  }, []);

  // Save history when it changes
  useEffect(() => {
    localStorage.setItem('hinglish_history', JSON.stringify(history.slice(0, 10)));
  }, [history]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleTransliterate = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    try {
      const data = await transliterateHinglish(input);
      setResults(data.results);
      setWords(data.words);
      
      if (data.words.length > 0) {
        const newItem: HistoryItem = {
          id: Date.now().toString(),
          input,
          results: data.results,
          words: data.words,
          timestamp: Date.now()
        };
        setHistory(prev => [newItem, ...prev].slice(0, 10));
      }
    } catch (error) {
      showToast("Conversion failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!");
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setInput(item.input);
    setResults(item.results);
    setWords(item.words || []);
  };

  const handleUpdateWordSelection = (wordIndex: number, hindiSpelling: string) => {
    setWords(prev => {
      const updated = [...prev];
      if (updated[wordIndex]) {
        updated[wordIndex] = {
          ...updated[wordIndex],
          selectedHindi: hindiSpelling
        };
      }
      return updated;
    });
  };

  const finalHindiText = words.map(w => w.selectedHindi).join(' ');

  return (
    <div className="min-h-screen pb-20 bg-slate-50 dark:bg-slate-950">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      
      <main className="max-w-5xl mx-auto px-4 mt-8 space-y-8">
        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 md:p-8">
          <InputArea 
            value={input}
            onChange={(val) => {
              setInput(val);
              if (!val) {
                setResults([]);
                setWords([]);
              }
            }}
            onSubmit={handleTransliterate}
            isLoading={isLoading}
            finalHindiText={finalHindiText}
            onCopy={handleCopy}
          />
        </section>

        {/* Full-width Devanagari Output & History stacked vertically */}
        <section className="space-y-8">
          <ResultDisplay 
            results={results} 
            words={words}
            onUpdateWordSelection={handleUpdateWordSelection}
            onCopy={handleCopy} 
            isLoading={isLoading} 
          />
          
          <HistoryPanel 
            history={history} 
            onSelect={handleSelectHistory} 
            onClear={() => {
              setHistory([]);
              localStorage.removeItem('hinglish_history');
            }}
          />
        </section>
      </main>

      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
};

export default App;
