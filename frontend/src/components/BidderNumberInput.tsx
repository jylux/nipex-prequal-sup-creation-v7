// frontend/src/components/BidderNumberInput.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BidderNumberInputProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  description?: string;
}

export default function BidderNumberInput({ 
  value, 
  onChange, 
  label = "Starting Bidder Number",
  description = "Enter a 10-digit number. This will be the starting point for bidder numbers."
}: BidderNumberInputProps) {
  const [internalValue, setInternalValue] = useState(value);
  
  // Update internal value when prop changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Only allow digits
    let inputVal = e.target.value.replace(/\D/g, '');
    
    // Pad with leading zeros if needed
    if (inputVal.length > 0 && inputVal.length < 10) {
      inputVal = inputVal.padStart(10, '0');
    }
    
    // Enforce max length of 10
    if (inputVal.length > 10) {
      inputVal = inputVal.slice(0, 10);
    }
    
    setInternalValue(inputVal);
    onChange(inputVal);
  }

  // Format for display with dashes for readability
  const formattedValue = internalValue.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">{label}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-2">
          <Label htmlFor="bidderNumber">Bidder Number</Label>
          <Input
            id="bidderNumber"
            type="text"
            value={formattedValue}
            onChange={handleChange}
            placeholder="000-000-0000"
            className="font-mono"
          />
        </div>
      </CardContent>
    </Card>
  );
}