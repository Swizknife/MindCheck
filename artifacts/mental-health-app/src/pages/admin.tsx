import { useListSessions, useGetScreeningStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, AlertCircle, FileSpreadsheet, Activity } from "lucide-react";
import { format } from "date-fns";

export default function AdminPage() {
  const { data: sessions, isLoading: loadingSessions } = useListSessions({ query: { queryKey: ['sessions'] } });
  const { data: stats, isLoading: loadingStats } = useGetScreeningStats({ query: { queryKey: ['stats'] } });

  const getRiskColor = (level: string) => {
    switch (level) {
      case "High Risk": return "bg-destructive text-destructive-foreground hover:bg-destructive";
      case "Needs Attention": return "bg-orange-500 text-white hover:bg-orange-600";
      case "Keep an Eye On It": return "bg-yellow-500 text-white hover:bg-yellow-600";
      case "Chill": return "bg-emerald-500 text-white hover:bg-emerald-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loadingSessions || loadingStats) {
    return <div className="flex-1 p-8 flex items-center justify-center animate-pulse text-muted-foreground">Loading admin data...</div>;
  }

  return (
    <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of all screening sessions and aggregate statistics.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-panel border-0 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl text-primary"><Users className="w-6 h-6" /></div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-panel border-0 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-destructive/10 rounded-xl text-destructive"><AlertCircle className="w-6 h-6" /></div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Risk</p>
                <p className="text-3xl font-bold">{stats.byRiskLevel['High Risk'] || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-panel border-0 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-secondary/20 rounded-xl text-secondary-foreground"><Activity className="w-6 h-6" /></div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
                <p className="text-3xl font-bold">{Math.round(stats.averageScore)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-panel border-0 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-accent/20 rounded-xl text-accent-foreground"><FileSpreadsheet className="w-6 h-6" /></div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold">{stats.completed}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 glass-panel border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border bg-white/40 dark:bg-black/40 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Risk Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions?.map(session => {
                    const res = session.results as any;
                    return (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">{session.name}</TableCell>
                        <TableCell>{format(new Date(session.createdAt), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{session.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {res?.riskLevel ? (
                            <Badge className={getRiskColor(res.riskLevel)}>{res.riskLevel}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!sessions?.length && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No sessions found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 glass-panel border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Top Issues</CardTitle>
            <CardDescription>Most commonly flagged modules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.topIssues?.map((issue, i) => (
              <div key={issue.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-muted flex items-center justify-center text-xs font-medium">{i+1}</span>
                  <span className="font-medium">{issue.name}</span>
                </div>
                <span className="text-muted-foreground">{issue.count} cases</span>
              </div>
            ))}
            {!stats?.topIssues?.length && (
              <div className="text-center py-4 text-muted-foreground">Not enough data</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}