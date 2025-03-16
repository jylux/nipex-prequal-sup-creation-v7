// frontend/src/pages/dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

import CompanySearch from '@/components/CompanySearch';
import SelectedCompaniesTable from '@/components/SelectedCompaniesTable';
import BidderNumberInput from '@/components/BidderNumberInput';

interface Company {
  id: number;
  fldcompany_name: string;
  fldi_vendor_id: string;
  fldaddress: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
  const [bidderStart, setBidderStart] = useState('0000000000');

  // (Optional) Check if user is logged in on mount
  useEffect(() => {
    // Example: call an /api/auth-check or similar route
    // If unauthorized, you might do something like router.push('/')
  }, [router]);

  // Triggered when the user submits the search form
  async function handleSearch(query: string) {
    if (!query) return;
    try {
      const res = await axios.get(
        `http://localhost:4000/api/companies/search?query=${query}`,
        { withCredentials: true }
      );
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
      alert('Search failed');
    }
  }

  // Add a company to the "selected" list if its vendor ID isn't purely numeric
  function addCompany(company: Company) {
    if (/^\d+$/.test(company.fldi_vendor_id)) {
      alert('This company is excluded due to numeric fldi_vendor_id');
      return;
    }
    setSelectedCompanies((prev) => [...prev, company]);
  }

  // Remove a company from the selected list
  function removeCompany(id: number) {
    setSelectedCompanies((prev) => prev.filter((c) => c.id !== id));
  }

  // Send selected companies + bidderStart to the server
  async function insertIntoDB() {
    try {
      await axios.post(
        'http://localhost:4000/api/companies/insert',
        {
          companies: selectedCompanies,
          startBidderNumber: bidderStart
        },
        { withCredentials: true }
      );
      alert('Insert successful');
    } catch (err) {
      console.error(err);
      alert('Insert error');
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      {/* Company Search */}
      <div className="mt-4">
        <CompanySearch onSearch={handleSearch} />
      </div>

      {/* Search Results */}
      <div className="mt-4">
        <h2 className="font-semibold mb-2">Search Results</h2>
        {searchResults.map((company) => (
          <div key={company.id} className="flex items-center mb-2">
            <span className="flex-1">{company.fldcompany_name}</span>
            <button
              className="bg-blue-100 px-2"
              onClick={() => addCompany(company)}
            >
              +
            </button>
          </div>
        ))}
      </div>

      {/* Bidder Number */}
      <div className="mt-4">
        <BidderNumberInput value={bidderStart} onChange={setBidderStart} />
      </div>

      {/* Selected Companies Table */}
      <div className="mt-4">
        <h2 className="font-semibold mb-2">Selected Companies</h2>
        <SelectedCompaniesTable
          companies={selectedCompanies}
          onRemove={removeCompany}
        />
      </div>

      {/* Insert Button */}
      <button
        className="mt-4 bg-green-200 px-4 py-2"
        onClick={insertIntoDB}
      >
        Insert to Database
      </button>
    </div>
  );
}
