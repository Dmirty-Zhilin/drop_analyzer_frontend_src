import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = params?.reportId;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReportDetail = async () => {
      if (!reportId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`http://45.155.207.218:8012/api/v1/reports/${reportId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch report details');
        }
        
        const data = await response.json();
        setReport(data);
      } catch (error) {
        console.error('Error fetching report details:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetail();
  }, [reportId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  // Function to determine row styling based on domain data
  const getRowStyle = (domain) => {
    const currentYear = new Date().getFullYear();
    
    // Check if last_snapshot is in current year (orange highlight)
    const lastSnapshot = domain.last_snapshot ? new Date(domain.last_snapshot) : null;
    const isCurrentYear = lastSnapshot && lastSnapshot.getFullYear() === currentYear;
    
    // Check if domain meets "long-live" criteria (green highlight)
    const isLongLive = 
      domain.total_snapshots >= 5 && 
      domain.years_covered >= 3 && 
      domain.avg_interval_days < 90 && 
      domain.max_gap_days < 180 && 
      domain.timemap_count > 200;
    
    if (isLongLive) {
      return "bg-green-50";
    } else if (isCurrentYear) {
      return "bg-orange-50";
    }
    
    return "";
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-12 w-3/4 mb-6" />
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Error</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Report Not Found</h1>
        <Card>
          <CardContent className="pt-6">
            <p>The requested report could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{report.report_name}</h1>
        <Badge variant={report.report_type === 'filtered' ? "secondary" : "default"}>
          {report.report_type === 'filtered' ? 'Filtered Report' : 'General Report'}
        </Badge>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Report Information</CardTitle>
          <CardDescription>Details about this report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Created</p>
              <p>{formatDate(report.created_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Domains</p>
              <p>{report.domains_count}</p>
            </div>
            {report.report_type === 'filtered' && report.filter_criteria && (
              <div className="col-span-2">
                <p className="text-sm font-medium">Filter Criteria</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <p className="text-xs">Min Snapshots: {report.filter_criteria.min_snapshots}</p>
                  </div>
                  <div>
                    <p className="text-xs">Min Years: {report.filter_criteria.min_years}</p>
                  </div>
                  <div>
                    <p className="text-xs">Max Avg Interval: {report.filter_criteria.max_avg_interval} days</p>
                  </div>
                  <div>
                    <p className="text-xs">Max Gap: {report.filter_criteria.max_gap} days</p>
                  </div>
                  <div>
                    <p className="text-xs">Min Timemap: {report.filter_criteria.min_timemap}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Domain Analysis Results</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-50 border border-green-200 mr-2"></div>
                <span className="text-xs">Long-live domains</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-orange-50 border border-orange-200 mr-2"></div>
                <span className="text-xs">Last snapshot in current year</span>
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Snapshots</TableHead>
                  <TableHead>First Snapshot</TableHead>
                  <TableHead>Last Snapshot</TableHead>
                  <TableHead>Years</TableHead>
                  <TableHead>Avg Interval</TableHead>
                  <TableHead>Max Gap</TableHead>
                  <TableHead>Recommended</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.results.map((domain) => (
                  <TableRow key={domain.domain} className={getRowStyle(domain)}>
                    <TableCell className="font-medium">{domain.domain}</TableCell>
                    <TableCell>{domain.total_snapshots}</TableCell>
                    <TableCell>{formatDate(domain.first_snapshot)}</TableCell>
                    <TableCell>{formatDate(domain.last_snapshot)}</TableCell>
                    <TableCell>{domain.years_covered}</TableCell>
                    <TableCell>{domain.avg_interval_days?.toFixed(2)}</TableCell>
                    <TableCell>{domain.max_gap_days}</TableCell>
                    <TableCell>
                      {domain.recommended ? (
                        <Badge variant="success">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
