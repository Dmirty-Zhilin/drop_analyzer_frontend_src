"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StructuredReportTable } from "@/components/reports/StructuredReportTable";

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
        </CardHeader>
        <CardContent>
          <StructuredReportTable data={report.results.map(result => ({
            domain: result.domain,
            has_snapshot: result.has_snapshot,
            availability_ts: result.availability_ts,
            total_snapshots: result.total_snapshots,
            timemap_count: result.timemap_count,
            first_snapshot: result.first_snapshot,
            last_snapshot: result.last_snapshot,
            avg_interval_days: result.avg_interval_days,
            max_gap_days: result.max_gap_days,
            years_covered: result.years_covered,
            snapshots_per_year: result.snapshots_per_year,
            unique_versions: result.unique_versions,
            is_good: result.is_good,
            recommended: result.recommended,
            analysis_time_sec: result.analysis_time_sec,
            wayback_history_summary: result.wayback_history_summary,
            seo_metrics: result.seo_metrics,
            thematic_analysis_result: result.thematic_analysis_result,
            assessment_score: result.assessment_score,
            assessment_summary: result.assessment_summary
          }))} />
        </CardContent>
      </Card>
    </div>
  );
}
