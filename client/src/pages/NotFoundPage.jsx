import React from 'react';
import { Link } from 'react-router-dom';
import { Ghost, ArrowLeft, Home } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFoundPage = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center animate-fade-in">
      <div className="text-center max-w-md">
        <div className="relative mb-8">
          <div className="text-[120px] font-black text-slate-100 dark:text-slate-800 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Ghost className="w-16 h-16 text-slate-400 dark:text-slate-600 animate-float" />
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">Page Not Found</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex justify-center gap-3">
          <Link to="/">
            <Button variant="primary" icon={Home}>
              Go Home
            </Button>
          </Link>
          <button onClick={() => window.history.back()}>
            <Button variant="secondary" icon={ArrowLeft}>
              Go Back
            </Button>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
