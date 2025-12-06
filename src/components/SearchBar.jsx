import React, { useState } from 'react';
import { Search } from 'lucide-react';

const SearchBar = () => {
    const [query, setQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) {
            window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        }
    };

    return (
        <form onSubmit={handleSearch} className="w-full max-w-2xl mb-4">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 group-focus-within:text-white transition-colors" />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-black/20 hover:bg-black/30 
                     border border-white/10 rounded-full 
                     text-white placeholder-white/70 focus:outline-none focus:bg-black/40 
                     focus:ring-2 focus:ring-white/20 focus:border-transparent backdrop-blur-xl
                     transition-all duration-300 shadow-lg text-lg"
                    placeholder="Search Google..."
                />
            </div>
        </form>
    );
};

export default SearchBar;
