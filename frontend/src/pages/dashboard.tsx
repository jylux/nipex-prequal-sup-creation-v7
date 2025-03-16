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
import { Loader2, PlusCircle } from 'lucide-react';
import { Company } from '@/types';


// interface Company {
//   suppuserid: string | number;
//   SUP_NAME: string;
//   SUP_Address1: string;
//   SUP_Town: string;
//   SUP_Phone: string;
//   SUP_Email: string;
//   SUP_Website: string;
//   date_prequal: string;
//   BIDDER_NUMBER: string;
//   [key: string]: any; // For additional fields
// }

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
  const [bidderStart, setBidderStart] = useState('0000000000');
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
    if (selectedCompanies.length === 0) {
      toast({
        title: "No companies selected",
        description: "Please select at least one company to insert",
        variant: "destructive",
      });
      return;
    }
    
    // Make sure all companies have required fields
    const invalidCompanies = selectedCompanies.filter(
      comp => !comp.SUP_NAME || !comp.BIDDER_NUMBER
    );
    
    if (invalidCompanies.length > 0) {
      toast({
        title: "Invalid companies",
        description: `${invalidCompanies.length} companies are missing required fields`,
        variant: "destructive",
      });
      return;
    }
    
    // Check if any town fields are empty and show a warning
    const companiesWithoutTown = selectedCompanies.filter(comp => !comp.SUP_Town);
    if (companiesWithoutTown.length > 0) {
      if (!window.confirm(`${companiesWithoutTown.length} companies do not have town information. Do you want to continue?`)) {
        return;
      }
    }
    
    setIsProcessing(true);
    try {
      const result = await companyApi.insertCompanies(selectedCompanies);
      
      // Handle results
      if (result.inserted && result.inserted.length > 0) {
        toast({
          title: "Insert successful",
          description: `Successfully inserted ${result.inserted.length} companies`,
        });
      }
      
      if (result.duplicates && result.duplicates.length > 0) {
        toast({
          title: "Duplicates detected",
          description: `${result.duplicates.length} companies were duplicates and not inserted`,
          variant: "warning",
        });
      }
      
      if (result.errors && result.errors.length > 0) {
        toast({
          title: "Insert errors",
          description: `${result.errors.length} companies had errors during insertion`,
          variant: "destructive",
        });
      }
      
      // Clear selected companies if at least one was successfully inserted
      if (result.inserted && result.inserted.length > 0) {
        setSelectedCompanies([]);
      }
    } catch (error) {
      console.error('Insert error:', error);
      toast({
        title: "Insert failed",
        description: "An error occurred while inserting companies",
        variant: "destructive",
      });
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
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column */}
            <div className="md:col-span-4 space-y-6">
              {/* Search Component */}
              {/* <CompanySearch onSearch={handleSearch} isLoading={isSearching} /> */}
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
              
              {/* Search Results
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium">Search Results</CardTitle>
                  <CardDescription>
                    {isSearching 
                      ? 'Searching...' 
                      : searchResults.length > 0 
                        ? `Found ${searchResults.length} companies` 
                        : 'Enter a company name to search'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isSearching ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ScrollArea className="h-96">
                      <div className="space-y-2">
                        {searchResults.length === 0 ? (
                          <p className="text-center text-muted-foreground py-6">
                            No results to display
                          </p>
                        ) : (
                          searchResults.map((company) => (
                            <Card key={company.suppuserid} className="overflow-hidden">
                              <CardContent className="p-3">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-medium truncate" title={company.SUP_NAME}>
                                      {company.SUP_NAME}
                                    </h3>
                                    <p className="text-sm text-muted-foreground truncate" title={company.SUP_Address1}>
                                      {company.SUP_Address1}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      ID: {company.suppuserid}
                                    </p>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => addCompany(company)}
                                    className="shrink-0"
                                    disabled={isProcessing}
                                  >
                                    <PlusCircle className="h-4 w-4 mr-1" />
                                    Add
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card> */}
            </div>
            
            {/* Right Column - Selected Companies Table */}
            <div className="md:col-span-8">
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
          </div>
        </main>
      </div>
    </>
  );
}