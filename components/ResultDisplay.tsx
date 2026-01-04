
import React from 'react';
import { HindiResult } from '../types';

interface ResultDisplayProps {
  results: HindiResult[];
  onCopy: (text: string) => void;
  isLoading: boolean;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ results, onCopy, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 animate-pulse flex justify-between">
            <div className="space-y-2 w-full">
              <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-md w-1/2"></div>
              <div className="h-4 bg-slate-50 dark:bg-slate-800/50 rounded-md w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl p-12 text-center">
        <div className="mx-auto w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </div>
        <p className="text-slate-400 dark:text-slate-500 font-medium">Results will appear here...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {results.map((item, idx) => (
        <div 
          key={idx} 
          className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-all hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900 flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
              {item.context}
            </span>
            <div className="hindi-font text-4xl font-bold text-slate-900 dark:text-white leading-tight">
              {item.hindi}
            </div>
          </div>
          
          <button
            onClick={() => onCopy(item.hindi)}
            className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-sm border border-slate-100 dark:border-slate-700 hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white dark:hover:text-white hover:border-indigo-600 dark:hover:border-indigo-600 transition-all shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            <span>Copy</span>
          </button>
        </div>
      ))}
    </div>
  );
};

export default ResultDisplay;