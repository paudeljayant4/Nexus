'use client';

import { useState, useRef, useEffect, forwardRef } from 'react';
import { cn } from '../utils';

export interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  ({ value, onValueChange, options, placeholder = 'Select...', className }, ref) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selected = options.find((o) => o.value === value);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div ref={containerRef} className={cn('relative', className)}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm transition-colors',
            'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
            open && 'ring-2 ring-blue-500'
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={cn(!selected && 'text-gray-400')}>
            {selected?.label ?? placeholder}
          </span>
          <svg
            className={cn('h-4 w-4 text-gray-400 transition-transform', open && 'rotate-180')}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
        {open && (
          <ul
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
            role="listbox"
          >
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => {
                  onValueChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  'cursor-pointer px-3 py-2 text-sm transition-colors',
                  value === option.value
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                )}
                role="option"
                aria-selected={value === option.value}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
