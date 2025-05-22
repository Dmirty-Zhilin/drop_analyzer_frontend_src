import Link from 'next/link';
import { Button } from "@/components/ui/button";

export default function CreateReportPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Report</h1>
      
      <div className="grid gap-6">
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Create Report from Analysis</h2>
          <p className="mb-4">
            To create a new report, you need to first complete a domain analysis. 
            Once the analysis is complete, you can create a report from the results.
          </p>
          <Button asChild>
            <Link href="/">Go to Domain Analysis</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
