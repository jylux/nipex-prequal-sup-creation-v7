// frontend/src/components/SelectedCompaniesTable.tsx
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Download, FileText, Save, AlertCircle } from "lucide-react";
import { searchAddress } from "@/utils/api";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Company {
  suppuserid: string | number;
  SUP_NAME: string;
  SUP_Address1: string;
  SUP_Town: string;
  SUP_Phone: string;
  SUP_Email: string;
  SUP_Website: string;
  date_prequal: string;
  BIDDER_NUMBER: string;
  [key: string]: any; // For additional fields
}

interface SelectedCompaniesTableProps {
  companies: Company[];
  onRemove?: (id: string | number) => void;
  onUpdate?: (updatedCompany: Company) => void;
  onExportExcel?: () => Promise<void>;
  onExportText?: () => Promise<void>;
  onInsert?: () => Promise<void>;
  loading?: boolean;
}

export default function SelectedCompaniesTable({
  companies,
  onRemove,
  onUpdate,
  onExportExcel,
  onExportText,
  onInsert,
  loading = false,
}: SelectedCompaniesTableProps) {
  const [editingCell, setEditingCell] = useState<{ id: string | number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Start editing a cell
  const startEditing = (company: Company, field: string) => {
    setEditingCell({ id: company.suppuserid, field });
    setEditValue(company[field] || '');
  };

  // Save the edited value
  const saveEdit = async (company: Company) => {
    if (!editingCell) return;
    
    const updatedCompany = { ...company };
    
    // If editing town, try to get from OpenStreetMap
    if (editingCell.field === 'SUP_Town' && onUpdate) {
      try {
        // If town field is empty, try to fetch from address
        if (!editValue.trim() && company.SUP_Address1) {
          const townData = await searchAddress(company.SUP_Address1);
          if (townData) {
            updatedCompany.SUP_Town = townData.town || 'Unknown';
          }
        } else {
          updatedCompany.SUP_Town = editValue;
        }
      } catch (error) {
        console.error('Error fetching town data:', error);
        updatedCompany.SUP_Town = editValue;
      }
    } else {
      updatedCompany[editingCell.field] = editValue;
    }
    
    onUpdate && onUpdate(updatedCompany);
    setEditingCell(null);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Selected Companies</CardTitle>
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onExportExcel}
                  disabled={loading || companies.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export as Excel (.xlsx) file</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onExportText}
                  disabled={loading || companies.length === 0}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export Text
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export as tab-delimited text file</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="default" 
                size="sm"
                disabled={loading || companies.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Insert to Database
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Insert Companies</AlertDialogTitle>
                <AlertDialogDescription>
                  This will insert {companies.length} companies into the database. Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onInsert}>
                  Insert Companies
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="bg-muted/50">Town (Editable)</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="bg-muted/50">Bidder # (Editable)</TableHead>
                {onRemove && <TableHead>Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={onRemove ? 10 : 9} className="text-center text-muted-foreground h-24">
                    No companies selected. Search and add companies to see them here.
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow key={company.suppuserid}
                            className={company.isDuplicate ? "bg-red-50 border-red-200" : ""}
                  >
                    <TableCell className="font-mono text-xs">{company.suppuserid}</TableCell>
                    <TableCell>{company.isDuplicate && (
                                  <span className="inline-flex items-center mr-2 text-red-500">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    Duplicate
                                  </span>
                )}
    {company.SUP_NAME}</TableCell>
                    <TableCell className="max-w-xs truncate" title={company.SUP_Address1}>
                      {company.SUP_Address1}
                    </TableCell>
                    <TableCell>
                      {editingCell?.id === company.suppuserid && editingCell.field === 'SUP_Town' ? (
                        <div className="flex space-x-1">
                          <Input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(company);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="h-8"
                          />
                          <Button size="sm" variant="ghost" onClick={() => saveEdit(company)} className="h-8 w-8 p-0">
                            ✓
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 w-8 p-0">
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="ghost" 
                          className="h-8 px-2 justify-start font-normal"
                          onClick={() => startEditing(company, 'SUP_Town')}
                        >
                          {company.SUP_Town || 'Click to edit'}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>{company.SUP_Phone}</TableCell>
                    <TableCell className="max-w-xs truncate" title={company.SUP_Email}>
                      {company.SUP_Email}
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={company.SUP_Website}>
                      {company.SUP_Website}
                    </TableCell>
                    <TableCell>{company.date_prequal}</TableCell>
                    <TableCell>
                      {editingCell?.id === company.suppuserid && editingCell.field === 'BIDDER_NUMBER' ? (
                        <div className="flex space-x-1">
                          <Input
                            autoFocus
                            value={editValue}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              setEditValue(value.slice(0, 10));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(company);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="h-8 font-mono"
                          />
                          <Button size="sm" variant="ghost" onClick={() => saveEdit(company)} className="h-8 w-8 p-0">
                            ✓
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 w-8 p-0">
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="ghost" 
                          className="h-8 px-2 justify-start font-mono"
                          onClick={() => startEditing(company, 'BIDDER_NUMBER')}
                        >
                          {company.BIDDER_NUMBER || 'Click to edit'}
                        </Button>
                      )}
                    </TableCell>
                    {onRemove && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemove(company.suppuserid)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {companies.length > 0 && (
          <div className="flex justify-between items-center mt-2">
            <Badge variant="outline">
              {companies.length} {companies.length === 1 ? 'company' : 'companies'} selected
            </Badge>
            <div className="text-xs text-muted-foreground">
              Click on Town or Bidder # cells to edit
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}