// frontend/src/components/CompanySearch.tsx
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CompanySearchProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export default function CompanySearch({ onSearch, isLoading = false }: CompanySearchProps) {
  const [searchTerm, setSearchTerm] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Search Companies</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter company name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button type="submit" disabled={isLoading || !searchTerm.trim()}>
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}