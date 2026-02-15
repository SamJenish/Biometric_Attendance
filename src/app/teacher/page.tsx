"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LogOut,
  Users,
  Play,
  Square,
  BookOpen,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { sessionService } from '@/services/sessionService';

const SUBJECTS = [
  "Computer Science 101",
  "Digital Marketing",
  "Advanced Mathematics",
  "Modern Architecture"
];

export default function TeacherDashboard() {
  const [activeSession, setActiveSession] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingSubject, setLoadingSubject] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState('');

  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setTeacherId(user.id);

      // Check for existing active session
      const session = await sessionService.getActiveSession(user.id);

      if (session) {
        setActiveSession(session);
      }
    };

    checkAuth();
  }, [router]);

  const startSession = async (subjectName: string = "Demo Class") => {
    try {
      setLoadingSubject(subjectName);
      const data = await sessionService.startSession(teacherId, subjectName);

      setActiveSession(data);
      toast({ title: "Session Started", description: `Attendance open for ${subjectName}` });
    } catch (error: any) {
      console.error("Error starting session:", error);
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoadingSubject(null);
    }
  };

  const endSession = async () => {
    if (!activeSession) return;
    try {
      await sessionService.endSession(activeSession.id);

      setActiveSession(null);
      setStudents([]);
      toast({ title: "Session Ended", description: "Attendance closed." });
    } catch (error: any) {
      console.error("Error ending session:", error);
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  // Real-Time Attendance Listener
  useEffect(() => {
    if (!activeSession) return;

    // Initial fetch of existing attendance
    const fetchAttendance = async () => {
      const { data } = await supabase
        .from('attendance')
        .select(`
                *,
                profiles:student_id (full_name)
            `)
        .eq('session_id', activeSession.id);

      if (data) {
        const formatted = data.map(record => ({
          id: record.id,
          studentName: (record.profiles as any)?.full_name || 'Unknown',
          verifiedAt: record.verified_at
        }));
        setStudents(formatted);
      }
    };

    fetchAttendance();

    // Subscribe to new attendance records
    const channel = supabase
      .channel('attendance_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance',
          filter: `session_id=eq.${activeSession.id}`,
        },
        async (payload) => {
          // Fetch student name separately since payload is just the record
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', payload.new.student_id)
            .single();

          const newStudent = {
            id: payload.new.id,
            studentName: profile?.full_name || 'Unknown',
            verifiedAt: payload.new.verified_at
          };

          setStudents(prev => [...prev, newStudent]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSession]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-primary text-white p-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-secondary rounded-lg p-1.5">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Teacher Portal</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white hover:bg-white/10">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-primary">Classroom Management</h2>
          <p className="text-slate-500">Start a session to enable student biometric attendance.</p>
        </div>

        {/* Demo Controls Integration */}
        {activeSession && (
          <div className="bg-green-50 p-4 rounded-xl border border-green-200 mb-6">
            <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
              <Clock className="w-5 h-5" /> Live Session: {activeSession.subject}
            </h3>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SUBJECTS.map((subject) => {
            const isThisSessionActive = activeSession?.subject === subject;
            const isLoading = loadingSubject === subject;

            return (
              <Card key={subject} className="rounded-3xl border-none shadow-sm bg-white overflow-hidden group">
                <CardHeader className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="bg-primary/5 p-3 rounded-2xl group-hover:bg-primary/10 transition-colors">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    {isThisSessionActive && (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-1 rounded-full animate-pulse">
                        LIVE NOW
                      </span>
                    )}
                  </div>
                  <CardTitle className="mt-4 text-xl font-bold">{subject}</CardTitle>
                  <CardDescription>
                    {isThisSessionActive ? "Session Verified" : "No active session"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 pt-0">
                  <Button
                    className={`w-full h-12 rounded-2xl transition-all ${isThisSessionActive
                      ? "bg-destructive hover:bg-destructive/90 text-white"
                      : "bg-secondary hover:bg-secondary/90 text-white"
                      }`}
                    onClick={() => {
                      if (isThisSessionActive) {
                        endSession();
                      } else {
                        if (activeSession) {
                          toast({ title: "Session Active", description: "Please end the current session first.", variant: "destructive" });
                        } else {
                          startSession(subject);
                        }
                      }
                    }}
                    disabled={isLoading}
                  >
                    {isThisSessionActive ? (
                      <>
                        <Square className="w-4 h-4 mr-2 fill-current" />
                        End Session
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2 fill-current" />
                        Start Session
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Live Attendance Section */}
        <Card className="rounded-3xl border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Live Attendance</CardTitle>
            <CardDescription>Real-time updates of verified students</CardDescription>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-slate-500 italic">No attendance marked yet.</p>
            ) : (
              <ul className="space-y-2">
                {students.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="font-medium">{s.studentName}</span>
                    <span className="text-xs text-slate-400 ml-auto">
                      {s.verifiedAt ? format(new Date(s.verifiedAt), 'HH:mm:ss') : 'Just now'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
