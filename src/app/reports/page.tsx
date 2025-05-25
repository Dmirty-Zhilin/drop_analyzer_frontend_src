"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, ArrowUpDown, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://45.155.207.218:8012/api/v1/reports');
        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }
        const data = await response.json();
        setReports(data);
        setFilteredReports(data);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setError('Failed to load reports. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Фильтрация отчетов по поисковому запросу
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredReports(reports);
    } else {
      const filtered = reports.filter(report => 
        report.report_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.report_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredReports(filtered);
    }
  }, [searchTerm, reports]);

  // Сортировка отчетов
  useEffect(() => {
    const sortedReports = [...filteredReports].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    setFilteredReports(sortedReports);
  }, [sortConfig]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleViewReport = (reportId) => {
    router.push(`/reports/${reportId}`);
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <h1 className="text-3xl font-bold mb-6">Domain Analysis Reports</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : reports.length > 0 ? (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Reports</CardTitle>
              <CardDescription>View and manage your domain analysis reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reports..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select
                  value={`${sortConfig.key}-${sortConfig.direction}`}
                  onValueChange={(value) => {
                    const [key, direction] = value.split('-');
                    setSortConfig({ key, direction });
                  }}
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at-desc">Newest first</SelectItem>
                    <SelectItem value="created_at-asc">Oldest first</SelectItem>
                    <SelectItem value="report_name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="report_name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="domains_count-desc">Most domains</SelectItem>
                    <SelectItem value="domains_count-asc">Least domains</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('report_name')}>
                        <div className="flex items-center">
                          Report Name
                          {sortConfig.key === 'report_name' && (
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('report_type')}>
                        <div className="flex items-center">
                          Type
                          {sortConfig.key === 'report_type' && (
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('domains_count')}>
                        <div className="flex items-center">
                          Domains
                          {sortConfig.key === 'domains_count' && (
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>
                        <div className="flex items-center">
                          Created
                          {sortConfig.key === 'created_at' && (
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.report_name}</TableCell>
                        <TableCell>{report.report_type}</TableCell>
                        <TableCell>{report.domains_count}</TableCell>
                        <TableCell>{formatDate(report.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewReport(report.id)}
                            >
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => {
                                // Здесь будет функционал удаления отчета
                                alert(`Delete report ${report.id} functionality will be implemented`);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {filteredReports.length === 0 && searchTerm && (
                <div className="text-center py-4 text-muted-foreground">
                  No reports found matching "{searchTerm}"
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={() => router.push('/')}>
                Back to Analysis
              </Button>
              <Button onClick={() => router.push('/reports/create')}>
                Create New Report
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Reports Found</CardTitle>
            <CardDescription>
              You haven't created any reports yet. Complete a domain analysis first, then create a report.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/')}>
              Go to Domain Analysis
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
