import React, { useState } from 'react';
import { searchRAGDocuments } from '../services/mockApi';
import { Search, BrainCircuit, ExternalLink, FileText, Users, ListTodo } from 'lucide-react';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';

const typeIcons = {
  document: FileText,
  contact: Users,
  task: ListTodo,
};

const SearchPage = () => {
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
    // Enrich with types for display
    const enriched = data.map((d, i) => ({
      ...d,
      type: i === 0 ? 'document' : 'document',
    }));
    setResults(enriched);
    setLoading(false);
  };

  const suggestions = [
    'Who is the contact person for TCS campus placements?',
    'What is the internship policy for 6th semester students?',
    'Show me the latest placement MoU documents',
    'How many students were placed in 2025?',
  ];

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-10 mt-6">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl mb-4">
          <BrainCircuit className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
          Ask the Institutional Brain
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-lg">
          Search across years of historical handovers, syllabi, contact directories, and policy documents using natural language.
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative mb-8 group">
        <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-50" />
        <div className="relative glass dark:glass-dark rounded-2xl p-2 flex items-center shadow-lg transition-transform focus-within:scale-[1.01]">
          <Search className="w-6 h-6 text-slate-400 ml-4" />
          <input
            id="search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about institutional knowledge..."
            className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-4 text-lg outline-none text-slate-900 dark:text-slate-100"
          />
          <button
            id="search-submit"
            type="submit"
            disabled={loading}
            className="btn-primary px-8 py-3 text-base rounded-xl flex items-center gap-2"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Suggestions */}
      {!hasSearched && (
        <div className="max-w-3xl mx-auto mb-12 animate-fade-in">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
            Try asking
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => { setQuery(s); }}
                className="text-left px-4 py-3 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-all"
              >
                "{s}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4 max-w-3xl mx-auto">
          {[1, 2].map((i) => (
            <div key={i} className="glass dark:glass-dark rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && results.length > 0 && (
        <div className="space-y-4 max-w-3xl mx-auto animate-slide-up">
          <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
            {results.length} Retrieved Sources
          </div>
          {results.map((result) => {
            const TypeIcon = typeIcons[result.type] || FileText;
            return (
              <Card key={result.id} hover={true} padding="p-6" className="group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <TypeIcon className="text-blue-500 w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {result.title}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={result.type} size="xs" showDot={false} />
                    <div className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-bold">
                      {(result.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed italic">
                  "{result.snippet}"
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all">
                    View full document <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* No results */}
      {!loading && hasSearched && results.length === 0 && (
        <div className="max-w-3xl mx-auto">
          <Card hover={false}>
            <EmptyState
              icon={Search}
              title="No results found"
              description="Try rephrasing your query or using different keywords."
            />
          </Card>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
