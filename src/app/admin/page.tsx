"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  Users, 
  Search, 
  ArrowUpRight, 
  Sparkles,
  Loader2,
  MapPin,
  Calendar
} from 'lucide-react';
import { subscribeToAttendance, AttendanceRecord, CLASSROOM_LAT, CLASSROOM_LNG } from '@/lib/attendance';
import { adminDailyAttendanceSummary } from '@/ai/flows/admin-daily-attendance-summary';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'admin') {
      router.push('/login');
      return;
    }

    const unsubscribe = subscribeToAttendance((data) => {
      setRecords(data);
    });

    return () => unsubscribe();
  }, [router]);

  const generateAiReport = async () => {
    setIsSummarizing(true);
    try {
      const result = await adminDailyAttendanceSummary({
        date: format(new Date(), 'yyyy-MM-dd'),
        totalStudentsRegistered: 50, // Mocked registration count
        dailyAttendanceRecords: records.map(r => ({
          studentId: r.studentId,
          subject: r.subject,
          timestamp: r.timestamp?.toDate ? r.timestamp.toDate().toISOString() : new Date().toISOString(),
          latitude: r.latitude,
          longitude: r.longitude
        })),
        classroomCoordinates: {
          latitude: CLASSROOM_LAT,
          longitude: CLASSROOM_LNG
        }
      });
      setAiSummary(result.summary);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Report Failed",
        description: "Could not generate AI summary at this time."
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="bg-primary text-white p-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-secondary rounded-lg p-1.5">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Admin Console</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-slate-300 font-medium">REAL-TIME ACTIVE</span>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white hover:bg-white/10">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & AI */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="bg-secondary text-white border-none shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-white/70 font-medium uppercase tracking-widest text-xs">Total Presence Today</p>
                <ArrowUpRight className="w-5 h-5 text-white/50" />
              </div>
              <h2 className="text-6xl font-bold">{records.length}</h2>
              <div className="pt-4 flex items-center gap-2">
                <div className="h-1 flex-1 bg-white/20 rounded-full">
                  <div className="h-full bg-white rounded-full" style={{ width: `${(records.length/50)*100}%` }} />
                </div>
                <span className="text-xs font-bold">{Math.round((records.length/50)*100)}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50 bg-slate-50/50 p-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-secondary" />
                  Insights Engine
                </CardTitle>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={generateAiReport}
                  disabled={isSummarizing || records.length === 0}
                  className="rounded-full border-secondary text-secondary hover:bg-secondary hover:text-white"
                >
                  {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Summarize"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {aiSummary ? (
                <div className="prose prose-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {aiSummary}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <p className="text-sm">Click summarize to analyze today's patterns</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Attendance List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-primary flex items-center gap-2">
              Recent Logs
              <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-tighter">Latest Top</span>
            </h3>
            <div className="flex gap-2">
               <Button variant="outline" size="sm" className="rounded-full bg-white">
                 <Calendar className="w-4 h-4 mr-2" />
                 Today
               </Button>
            </div>
          </div>

          <div className="space-y-4">
            {records.length === 0 ? (
              <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-slate-100">
                <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400">No attendance records found for today.</p>
              </div>
            ) : (
              records.map((record) => (
                <Card key={record.id} className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden group">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-primary font-bold text-lg group-hover:bg-primary group-hover:text-white transition-colors">
                        {record.studentId.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-primary">{record.studentId}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center text-xs text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded-md">
                            <BookOpen className="w-3 h-3 mr-1" />
                            {record.subject}
                          </span>
                          <span className="flex items-center text-xs text-slate-400 font-medium">
                            <Clock className="w-3 h-3 mr-1" />
                            {record.timestamp?.toDate ? format(record.timestamp.toDate(), 'HH:mm:ss') : 'Just now'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Coordinates</p>
                        <p className="text-xs text-primary font-mono">{record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}</p>
                      </div>
                      <div className="bg-secondary/10 p-2 rounded-full">
                        <MapPin className="w-4 h-4 text-secondary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
