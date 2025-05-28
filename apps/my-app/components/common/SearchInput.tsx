
"use client";

import { useState, useEffect, type ChangeEvent } from 'react';
import { Input } from '@99packages/ui/components/input';
import { Button } from '@99packages/ui/components/button';
import { Search, XCircle } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchInputProps {
  initialValue?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceDelay?: number;
}

export default function SearchInput({
  initialValue = '',
  onSearch,
  placeholder = "Search...",
  className,
  debounceDelay = 500, // Default debounce delay of 500ms
}: SearchInputProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay);

  useEffect(() => {
    // Only call onSearch if debouncedSearchTerm is not the initial empty string
    // or if it has actually changed from initialValue
    if (debouncedSearchTerm !== initialValue || initialValue === '') {
        onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearch, initialValue]);

  useEffect(() => {
    // Update internal state if initialValue changes from parent (e.g. URL param)
    setSearchTerm(initialValue);
  }, [initialValue]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    // onSearch(''); // Optionally trigger search immediately on clear
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <Input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        className="pr-10 pl-4 py-2 w-full" // Added some padding
      />
      {searchTerm && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-10 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={handleClearSearch}
        >
          <XCircle className="h-4 w-4" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-primary"
        onClick={() => onSearch(searchTerm)} // Allow immediate search on icon click
      >
        <Search className="h-4 w-4" />
        <span className="sr-only">Search</span>
      </Button>
    </div>
  );
}

// Example useDebounce hook (could be in src/hooks/useDebounce.ts)
// "use client";
// import { useState, useEffect } from 'react';
// export function useDebounce<T>(value: T, delay: number): T {
//   const [debouncedValue, setDebouncedValue] = useState<T>(value);
//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedValue(value);
//     }, delay);
//     return () => {
//       clearTimeout(handler);
//     };
//   }, [value, delay]);
//   return debouncedValue;
// }
    