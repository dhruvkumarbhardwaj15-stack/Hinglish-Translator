import React, { useState } from 'react';
import { HindiResult, WordMetadata } from '../types';

interface ResultDisplayProps {
  results: HindiResult[];
  words: WordMetadata[];
  onUpdateWordSelection: (wordIdx: number, hindiSpelling: string) => void;
  onCopy: (text: string) => void;
  isLoading: boolean;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
  results, 
  words, 
  onUpdateWordSelection, 
  onCopy, 
  isLoading 
}) => {
  const [activeWordIdx, setActiveWordIdx] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-md w-1/4 animate-pulse"></div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-1/5 animate-pulse"></div>
          </div>
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl w-24 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
        <div className="mx-auto w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </div>
        <p className="text-slate-400 dark:text-slate-500 font-medium">Devanagari output will appear here...</p>
      </div>
    );
  }

  const countWAlternatives = words.filter(w => w.alternatives && w.alternatives.length > 1).length;

  return (
    <div className="space-y-6">
      {/* Absolute transparent helper backdrop to close popovers when clicking outside */}
      {activeWordIdx !== null && (
        <div 
          className="fixed inset-0 z-15 bg-transparent cursor-default" 
          onClick={() => setActiveWordIdx(null)}
        />
      )}

      {/* Primary Devanagari Output Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm relative z-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div className="flex items-center space-x-2">
            <span className="text-indigo-500 dark:text-indigo-400 font-bold font-mono text-base bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded">T</span>
            <h3 className="font-bold text-slate-850 dark:text-slate-200 text-lg">Devanagari Output</h3>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {countWAlternatives > 0 && (
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/45 px-2.5 py-1 rounded-full border border-amber-100 dark:border-amber-900/40">
                {countWAlternatives} word{countWAlternatives === 1 ? '' : 's'} have alternatives
              </span>
            )}
            
            <button
              type="button"
              onClick={() => onCopy(words.map(w => w.selectedHindi || '').join(' ').trim())}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200/50 dark:shadow-none transition-all active:transform active:scale-95 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2500/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>Copy Sentence</span>
            </button>
          </div>
        </div>

        {/* Word Bubbles Canvas */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-4 min-h-[5rem] p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100/80 dark:border-slate-850">
          {words.map((word, wordIdx) => {
            const hasAlternatives = word.alternatives && word.alternatives.length > 1;
            const isWordActive = activeWordIdx === wordIdx;
            
            return (
              <div key={wordIdx} className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setActiveWordIdx(isWordActive ? null : wordIdx)}
                  className={`relative cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-indigo-550/20 rounded-xl font-bold font-hindi text-[32px] select-none inline-flex items-center justify-center leading-normal
                    ${hasAlternatives 
                      ? 'bg-[#fee9d1]/90 hover:bg-[#fedeb6] dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-300/60 dark:border-amber-900/60 py-2.5 px-4' 
                      : 'bg-transparent border-none text-slate-800 dark:text-slate-100 py-2 px-3 hover:bg-slate-200/50 dark:hover:bg-slate-850/60'
                    }`}
                >
                  <span>{word.selectedHindi}</span>
                  {hasAlternatives && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-500/80 dark:text-amber-500 ml-1.5 mt-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>

                {/* Micro alternatives popover */}
                {isWordActive && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-4 z-40 min-w-[280px] md:min-w-[320px]">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Alternatives for "{word.original}"
                      </span>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveWordIdx(null);
                        }}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-1 max-h-[220px] overflow-y-auto">
                      {word.alternatives.map((alt, altIdx) => {
                        const isCurrentSelection = word.selectedHindi === alt.hindi;
                        return (
                          <button
                            key={altIdx}
                            type="button"
                            onClick={() => onUpdateWordSelection(wordIdx, alt.hindi)}
                            className={`w-full hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl p-3 flex items-center justify-between transition-all text-left group
                              ${isCurrentSelection ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30' : 'border border-transparent'}`}
                          >
                            <div className="flex items-baseline space-x-2.5">
                              <span className="hindi-font text-2xl font-bold text-slate-900 dark:text-white leading-none">
                                {alt.hindi}
                              </span>
                              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 italic">
                                {alt.meaning}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1.5">
                              {alt.isDefault && (
                                <span className="text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 py-0.5 px-1.5 rounded uppercase tracking-wider">
                                  Default
                                </span>
                              )}
                              
                              {isCurrentSelection && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional full-sentence suggestions if available */}
      {results.length > 0 && (
        <div className="bg-slate-50/55 dark:bg-slate-950/10 p-4 rounded-2xl border border-slate-100 dark:border-slate-900">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1 mb-3">Overall Sentence Options</h4>
          <div className="grid grid-cols-1 gap-3">
            {results.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => onCopy(item.hindi)}
                className="cursor-pointer group p-3 bg-white dark:bg-slate-900/60 hover:bg-slate-105 active:bg-slate-100 dark:active:bg-slate-800 border border-slate-150 dark:border-slate-800/80 hover:border-indigo-200 dark:hover:border-indigo-900/60 rounded-xl flex items-center justify-between transition-all"
              >
                <div>
                  <div className="hindi-font text-lg text-slate-800 dark:text-slate-200">
                    {item.hindi}
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {item.context}
                  </span>
                </div>
                <button 
                  type="button"
                  title="Copy variation"
                  className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
