// frontend/src/components/BidderNumberInput.tsx
import React, { useState } from 'react';

interface BidderNumberInputProps {
  value: string;              // e.g., "0000000000"
  onChange: (val: string) => void;
}

export default function BidderNumberInput({ value, onChange }: BidderNumberInputProps) {
  const [internalValue, setInternalValue] = useState(value);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let inputVal = e.target.value.replace(/\D/g, ''); // remove non-digits
    // Enforce max length of 10
    if (inputVal.length > 10) {
      inputVal = inputVal.slice(0, 10);
    }
    setInternalValue(inputVal);
    onChange(inputVal);
  }

  return (
    <div>
      <label>Bidder Number (10 digits): </label>
      <input
        type="text"
        value={internalValue}
        onChange={handleChange}
        maxLength={10}
        className="border px-2"
      />
    </div>
  );
}
