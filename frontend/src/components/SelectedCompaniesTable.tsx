// frontend/src/components/SelectedCompaniesTable.tsx
import React from 'react';

interface Company {
  id: number;
  fldcompany_name: string;
  fldi_vendor_id: string;
  fldaddress: string;
  // more fields if needed...
}

interface SelectedCompaniesTableProps {
  companies: Company[];
  onRemove?: (id: number) => void; // Optional callback if you want row removal
}

export default function SelectedCompaniesTable({
  companies,
  onRemove,
}: SelectedCompaniesTableProps) {
  return (
    <table className="w-full border">
      <thead>
        <tr>
          <th>ID</th>
          <th>Company Name</th>
          <th>Vendor ID</th>
          <th>Address</th>
          {onRemove && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {companies.map((comp) => (
          <tr key={comp.id}>
            <td className="border p-1">{comp.id}</td>
            <td className="border p-1">{comp.fldcompany_name}</td>
            <td className="border p-1">{comp.fldi_vendor_id}</td>
            <td className="border p-1">{comp.fldaddress}</td>
            {onRemove && (
              <td className="border p-1">
                <button
                  onClick={() => onRemove(comp.id)}
                  className="bg-red-200 px-2 py-1"
                >
                  Remove
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
