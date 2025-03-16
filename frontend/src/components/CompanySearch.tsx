// frontend/src/components/CompanySearch.tsx
import React, { useState } from 'react';

interface CompanySearchProps {
  onSearch: (query: string) => void; // Callback to parent
}

export default function CompanySearch({ onSearch }: CompanySearchProps) {
  const [searchTerm, setSearchTerm] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch(searchTerm);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <input
        type="text"
        placeholder="Search companies..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border px-2"
      />
      <button type="submit" className="bg-gray-200 px-4 py-1">
        Search
      </button>
    </form>
  );
}
