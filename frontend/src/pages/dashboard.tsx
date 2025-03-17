// frontend/src/pages/dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { companyApi, searchAddress } from '@/utils/api';
import CompanySearch from '@/components/CompanySearch';
import SelectedCompaniesTable from '@/components/SelectedCompaniesTable';
import BidderNumberInput from '@/components/BidderNumberInput';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, PlusCircle, CheckCircle, LogOut } from 'lucide-react';
import { Company } from '@/types';
import DuplicateAlert from '@/components/DuplicateAlert';
import { DuplicateEntry } from '@/types';




export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
  const [bidderStart, setBidderStart] = useState('0000000000');
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [duplicateEntries, setDuplicateEntries] = useState<DuplicateEntry[]>([]);
const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);

  // (Optional) Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
    }
  }, [router]);

  // Handle company search
  async function handleSearch(query: string) {
    if (!query) return;
    
    setIsSearching(true);
    try {
      const results = await companyApi.searchCompanies(query);
      console.log('Search results:', results);
      setSearchResults(results);
      
      if (results.length === 0) {
        toast({
          title: "No results found",
          description: "Try a different search term",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "An error occurred while searching companies",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }

  // Add a company to the selected list with address lookup
  async function addCompany(company: Company) {
    // Check if already added
    if (selectedCompanies.some(comp => comp.suppuserid === company.suppuserid)) {
      toast({
        title: "Already selected",
        description: `${company.SUP_NAME} is already in your selection`,
        variant: "default",
      });
      return;
    }
    
    // Create a copy of the company to modify
    const companyToAdd = { ...company };
    
    // Try to get town from address if not already set
    if (!companyToAdd.SUP_Town && companyToAdd.SUP_Address1) {
      setIsProcessing(true);
      try {
        toast({
          title: "Fetching town information",
          description: "Looking up location from address...",
        });
        
        const addressData = await searchAddress(companyToAdd.SUP_Address1);
        if (addressData && addressData.town) {
          companyToAdd.SUP_Town = addressData.town;
          
          toast({
            title: "Town found",
            description: `Found town: ${addressData.town}`,
          });
        } else {
          companyToAdd.SUP_Town = "Unknown";
          
          toast({
            title: "Town not found",
            description: "Could not determine town from address",
            variant: "warning",
          });
        }
      } catch (error) {
        console.error('Error fetching town:', error);
        companyToAdd.SUP_Town = "Unknown";
        
        toast({
          title: "Address lookup failed",
          description: "Could not fetch town information",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    }
    
    // Auto-generate bidder number for the new company
    const nextBidderNumber = (selectedCompanies.length > 0)
      ? (parseInt(selectedCompanies[selectedCompanies.length - 1].BIDDER_NUMBER || bidderStart) + 2).toString().padStart(10, '0')
      : bidderStart;
    
    companyToAdd.BIDDER_NUMBER = nextBidderNumber;
    
    setSelectedCompanies([...selectedCompanies, companyToAdd]);
    
    toast({
      title: "Company added",
      description: `${company.SUP_NAME} has been added to your selection`,
    });
  }

  // Remove a company from the selected list
  function removeCompany(id: string | number) {
    setSelectedCompanies(selectedCompanies.filter(comp => comp.suppuserid !== id));
  }

  // Update a company in the selected list
  async function updateCompany(updatedCompany: Company) {
    // Special handling for town updates - if user enters "refresh" in town field
    if (updatedCompany.SUP_Town === "refresh" && updatedCompany.SUP_Address1) {
      try {
        setIsProcessing(true);
        toast({
          title: "Refreshing town information",
          description: "Looking up location from address...",
        });
        
        const addressData = await searchAddress(updatedCompany.SUP_Address1);
        if (addressData && addressData.town) {
          updatedCompany.SUP_Town = addressData.town;
          
          toast({
            title: "Town updated",
            description: `Updated town to: ${addressData.town}`,
          });
        } else {
          updatedCompany.SUP_Town = "Unknown";
          
          toast({
            title: "Town not found",
            description: "Could not determine town from address",
            variant: "warning",
          });
        }
      } catch (error) {
        console.error('Error refreshing town:', error);
        updatedCompany.SUP_Town = "Unknown";
        
        toast({
          title: "Address lookup failed",
          description: "Could not fetch town information",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    }
    
    // Also attempt lookup if town is blank but address exists
    if (!updatedCompany.SUP_Town && updatedCompany.SUP_Address1) {
      try {
        setIsProcessing(true);
        const addressData = await searchAddress(updatedCompany.SUP_Address1);
        if (addressData && addressData.town) {
          updatedCompany.SUP_Town = addressData.town;
        } else {
          updatedCompany.SUP_Town = "Unknown";
        }
      } catch (error) {
        console.error('Error fetching town:', error);
        updatedCompany.SUP_Town = "Unknown";
      } finally {
        setIsProcessing(false);
      }
    }
    
    setSelectedCompanies(
      selectedCompanies.map(comp => 
        comp.suppuserid === updatedCompany.suppuserid ? updatedCompany : comp
      )
    );
  }

  // Export selected companies to Excel
  const handleExportExcel = async () => {
    if (selectedCompanies.length === 0) {
      toast({
        title: "No companies selected",
        description: "Please select at least one company to export",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      // Make sure you're sending both companies and bidderStartNumber
      await companyApi.exportToExcel(selectedCompanies, bidderStart);
      
      toast({
        title: "Export successful",
        description: "Data exported to Excel successfully",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Failed to export data to Excel",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Export selected companies to text
  async function handleExportText() {
    if (selectedCompanies.length === 0) {
      toast({
        title: "No companies selected",
        description: "Please select at least one company to export",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      await companyApi.exportToText(selectedCompanies, bidderStart);
      
      toast({
        title: "Export successful",
        description: `Exported ${selectedCompanies.length} companies to text format`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "An error occurred while exporting to text",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  // Insert selected companies into the database
  async function handleInsertCompanies() {
    console.log("handleInsertCompanies started");
    
    if (selectedCompanies.length === 0) {
      toast({
        title: "No companies selected",
        description: "Please select at least one company to insert",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Make API call
      await companyApi.insertCompanies(selectedCompanies);
      
      // If we get here, the insert was successful
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      toast({
        title: "Success!",
        description: "Companies inserted successfully",
        variant: "default",
      });
      
    } catch (error: any) {
      console.error('Insert error:', error);
      
      // Check if it's a duplicate entry error
      const axiosError = error as {
        response?: {
          status?: number;
          data?: { error?: string; duplicateId?: string; message?: string; companyName?: string };
        };
      };
      
      if (
        axiosError.response?.status === 409 &&
        axiosError.response.data?.error === 'DUPLICATE_ENTRY'
      ) {
        const duplicateId = axiosError.response.data.duplicateId;
        const companyName = axiosError.response.data.companyName || 'Unknown company';
        const errorMessage = axiosError.response.data.message || 
                            `Duplicate entry found: "${companyName}" (ID: ${duplicateId}). Please remove this row and try again.`;
        
        // Mark the duplicate entry in the table
        setSelectedCompanies(prev => 
          prev.map(company => ({
            ...company,
            isDuplicate: company.suppuserid === duplicateId
          }))
        );
        
        // Show more informative error toast
        toast({
          title: "Duplicate Entry Detected",
          description: errorMessage,
          variant: "destructive",
        });
        
        // Optional: Scroll to the duplicate entry
        setTimeout(() => {
          const duplicateRow = document.querySelector(`.isDuplicate-${duplicateId}`);
          if (duplicateRow) {
            duplicateRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    } finally {
      setIsProcessing(false);
    }
  }
  // Update bidder numbers when starting number changes
  useEffect(() => {
    if (selectedCompanies.length === 0 || !bidderStart) return;
    
    // Update all bidder numbers based on the new starting point
    let currentBidder = parseInt(bidderStart);
    if (isNaN(currentBidder)) return;
    
    const updatedCompanies = selectedCompanies.map((company, index) => {
      const bidderNumber = (currentBidder + (index * 2)).toString().padStart(10, '0');
      return { ...company, BIDDER_NUMBER: bidderNumber };
    });
    
    setSelectedCompanies(updatedCompanies);
  }, [bidderStart]);

  return (
    <>
      <Head>
        <title>Company Dashboard | NIPEX JQS</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto py-4 px-4">
            <h1 className="text-2xl font-bold text-gray-900">NIPEX JQS Dashboard</h1>
            <Button 
      variant="outline" 
      onClick={() => {
        // Clear token from localStorage
        localStorage.removeItem('token');
        // Redirect to login page
        router.push('/');
      }}
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-6">
  {showSuccess && (
    <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center">
      <CheckCircle className="h-5 w-5 mr-2" />
      Companies inserted successfully!
    </div>
  )}
  
  {/* Top section: Search Companies and Bidder Number side by side */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    {/* Search Component */}
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Search Companies</CardTitle>
        <CardDescription>
          Search for companies and click to add them
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CompanySearch 
          onAddCompany={addCompany} 
          isProcessing={isProcessing}
        />
      </CardContent>
    </Card>
    
    {/* Bidder Number Input */}
    <BidderNumberInput 
      value={bidderStart} 
      onChange={setBidderStart} 
    />
  </div>
  
  {/* Bottom section: Selected Companies Table full width */}
  <div className="w-full">
    <SelectedCompaniesTable 
      companies={selectedCompanies}
      onRemove={removeCompany}
      onUpdate={updateCompany}
      onExportExcel={handleExportExcel}
      onExportText={handleExportText}
      onInsert={handleInsertCompanies}
      loading={isProcessing}
    />
  </div>
</main>
      </div>
    </>
  );
}