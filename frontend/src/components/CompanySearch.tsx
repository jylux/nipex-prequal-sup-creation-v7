// frontend/src/components/CompanySearch.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { companyApi } from '@/utils/api';
import { useDebounce } from '@/utils/hooks'; // We'll create this hook
import { Company } from '@/types';

interface CompanySearchProps {
  onAddCompany: (company: Company) => void;
  isProcessing?: boolean;
}

export default function CompanySearch({ onAddCompany, isProcessing = false }: CompanySearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search when the debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm) {
      searchCompanies(debouncedSearchTerm);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [debouncedSearchTerm]);

  async function searchCompanies(query: string) {
    if (!query) return;
    
    setIsLoading(true);
    try {
      const companies = await companyApi.searchCompanies(query);
      setResults(companies);
      setIsOpen(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleAddCompany(company: Company) {
    onAddCompany(company);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
          onFocus={() => debouncedSearchTerm && setIsOpen(true)}
        />
        {isLoading && (
          <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      
      {isOpen && results.length > 0 && (
        <Card className="absolute mt-1 w-full z-10 shadow-md max-h-96 overflow-hidden">
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto py-1">
              {results.map((company) => (
                <div 
                  key={company.suppuserid}
                  className="px-4 py-2 hover:bg-muted flex justify-between items-start cursor-pointer"
                  onClick={() => handleAddCompany(company)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" title={company.SUP_NAME}>
                      {company.SUP_NAME}
                    </p>
                    <p className="text-sm text-muted-foreground truncate" title={company.SUP_Address1}>
                      {company.SUP_Address1}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID: {company.suppuserid}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    disabled={isProcessing}
                    className="ml-2 h-8 w-8 p-0"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}