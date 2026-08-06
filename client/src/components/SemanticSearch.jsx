import React, { useState } from 'react';
import { searchRAGDocuments } from '../services/mockApi';
import { Search, BrainCircuit, ExternalLink, FileText } from 'lucide-react';

const SemanticSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    const data = await searchRAGDocuments(query);
    setResults(data);
    setLoading(false);
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="text-center mb-10 mt-6">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 text-blue-600 rounded-2xl mb-4">
          <BrainCircuit className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
          Ask the Institutional Brain
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-lg">
          Search across years of historical handovers, syllabi, contact directories, and policy documents using natural language.
        </p>
      </div>

      <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative mb-12 group">
        <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-50"></div>
        <div className="relative glass dark:glass-dark rounded-2xl p-2 flex items-center shadow-lg transition-transform focus-within:scale-[1.02]">
          <Search className="w-6 h-6 text-slate-400 ml-4" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. 'Who is the contact person for TCS campus placements?'"
            className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-4 text-lg outline-none text-slate-900 dark:text-slate-100"
          />
          <button type="submit" disabled={loading} className="btn-primary px-8 py-3 text-lg rounded-xl flex items-center gap-2">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {loading && (
        <div className="space-y-4 max-w-3xl mx-auto">
          {[1, 2].map(i => (
            <div key={i} className="glass dark:glass-dark rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      )}

      {!loading && hasSearched && results.length > 0 && (
        <div className="space-y-6 max-w-3xl mx-auto animate-slide-up">
          <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Retrieved Sources
          </div>
          {results.map((result) => (
            <div key={result.id} className="glass dark:glass-dark rounded-xl p-6 hover:shadow-xl transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <FileText className="text-blue-500 w-5 h-5" />
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                    {result.title}
                  </h3>
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-bold">
                  {(result.confidence * 100).toFixed(0)}% Match
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed italic">
                "{result.snippet}"
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
                  View full document <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && hasSearched && results.length === 0 && (
        <div className="text-center text-slate-500 mt-12 animate-fade-in">
          No institutional documents matched your query.
        </div>
      )}
    </div>
  );
};

export default SemanticSearch;
