// components/DuplicateAlert.tsx
import React from 'react';
import { AlertCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DuplicateEntry } from '@/types';

interface DuplicateAlertProps {
  duplicates: DuplicateEntry[];
  onClose: () => void;
  onRemove: (id: string | number) => void;
}

export default function DuplicateAlert({ 
  duplicates, 
  onClose, 
  onRemove 
}: DuplicateAlertProps) {
  if (duplicates.length === 0) return null;
  
  return (
    <Card className="border-red-300 bg-red-50 mb-4">
      <CardContent className="p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-red-800">
              {duplicates.length} duplicate {duplicates.length === 1 ? 'entry' : 'entries'} detected
            </h3>
            <p className="text-sm text-red-700 mt-1">
              The following supplier IDs already exist in the database and cannot be inserted:
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {duplicates.map((dup, index) => (
                <li key={index} className="flex items-center justify-between bg-white p-2 rounded border border-red-200">
                  <span>
                    <span className="font-medium">{dup.company.suppuserid}</span>
                    {' - '}
                    <span className="text-gray-600">{dup.company.SUP_NAME}</span>
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onRemove(dup.company.suppuserid)}
                    className="h-7 text-red-600 hover:text-red-800 hover:bg-red-100"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClose}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}