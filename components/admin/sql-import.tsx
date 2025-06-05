"use client"

import { useState } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { 
  AlertCircle, 
  Check, 
  Database, 
  Loader2, 
  Upload 
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

interface SqlImportProps {}

export function SqlImport({}: SqlImportProps) {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [tableType, setTableType] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [importedCount, setImportedCount] = useState(0)
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.sql')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a valid SQL file');
        setFile(null);
      }
    }
  };
  
  const handleImport = async () => {
    if (!file) {
      setError("Please select an SQL file to upload");
      return;
    }
    
    if (!tableType) {
      setError("Please select the type of data you're importing");
      return;
    }
    
    try {
      setIsUploading(true);
      setError(null);
      setSuccess(null);
      
      const formData = new FormData();
      formData.append('sqlFile', file);
      formData.append('tableType', tableType);
      
      const response = await fetch('/api/admin/import-sql', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to import SQL data');
      }
      
      setImportedCount(data.count);
      setSuccess(data.message);
        toast({
        title: "Import successful",
        description: data.message,
        variant: "success",
      });
      
      // Reset form after a short delay to show the success message
      setTimeout(() => {
        setFile(null);
        setTableType("");
        
        // Reset file input
        const fileInput = document.getElementById('sql-file-input') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        
        // Reload dashboard statistics
        window.dispatchEvent(new CustomEvent('refreshDashboardData'));
      }, 2000);
        } catch (error) {
      console.error("Import error:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Import failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5" /> 
          SQL Data Import
        </CardTitle>
        <CardDescription>
          Import data from MySQL SQL dump files into the system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
          {success && (
          <Alert variant="default" className="bg-green-50 border-green-600 text-green-800 dark:bg-green-900/20 dark:border-green-500 dark:text-green-300">
            <Check className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <label htmlFor="sql-file-input" className="text-sm font-medium">
            SQL File
          </label>
          <Input
            id="sql-file-input"
            type="file"
            accept=".sql"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <p className="text-xs text-muted-foreground">
            Upload an SQL file containing INSERT statements for a single table
          </p>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="table-type" className="text-sm font-medium">
            Table Type
          </label>
          <Select 
            value={tableType} 
            onValueChange={setTableType}
            disabled={isUploading}
          >
            <SelectTrigger id="table-type">
              <SelectValue placeholder="Select the type of data to import" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="registrations">Registrations</SelectItem>
              <SelectItem value="chapters">Chapters</SelectItem>
              <SelectItem value="schools">Schools</SelectItem>
              <SelectItem value="centers">Centers</SelectItem>
              <SelectItem value="coordinators">Coordinators</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Choose the type of data you're importing to ensure correct processing
          </p>
        </div>
        
        {isUploading && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Importing data...</p>
            <Progress value={45} className="h-2" />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleImport} 
          disabled={isUploading || !file || !tableType} 
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Import Data
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
