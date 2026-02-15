"use client"
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  Users, 
  Play, 
  Square, 
  Loader2,
  BookOpen,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { startSession, endSession, subscribeToActiveSessions, ActiveSession } from '@/lib/attendance';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const SUBJECTS = [
  "Computer Science 101",
  "Digital Marketing",
  "Advanced Mathematics",
  "Modern Architecture"
];

export default function TeacherDashboard() {
  const [activeSession, setActiveSession] = useState<any>(null);
  const [presentStudents, setPresentStudents] = useState<any[]>([]);

  const [loadingSubject, setLoadingSubject] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const startSession = async () => {
  const sessionRef = await addDoc(collection(db, "sessions"), {
    teacherId: user.uid,
    subject: "Class Session",
    isActive: true,
    startTime: serverTimestamp(),
  });

  setActiveSession({ id: sessionRef.id });
};
const endSession = async () => {
  if (!activeSession) return;

  await updateDoc(doc(db, "sessions", activeSession.id), {
    isActive: false,
    endTime: serverTimestamp(),
  });

  setActiveSession(null);
  setPresentStudents([]);
};
useEffect(() => {
  if (!activeSession) return;

  const unsub = onSnapshot(
    collection(db, "sessions", activeSession.id, "attendance"),
    (snapshot) => {
      const students = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPresentStudents(students);
    }
  );

  return () => unsub();
}, [activeSession]);


  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const id = localStorage.getItem('teacherId');
    if (role !== 'teacher' || !id) {
      router.push('/login');
      return;
    }
    setTeacherId(id);

    const unsubscribe = subscribeToActiveSessions((sessions) => {
      setActiveSessions(sessions);
    });

    return () => unsubscribe();
  }, [router]);

  const handleToggleSession = async (subject: string) => {
    const isActive = activeSessions.find(s => s.id === subject);
    setLoadingSubject(subject);
    try {
      if (isActive) {
        await endSession(subject);
        toast({ title: "Session Stopped", description: `Attendance closed for ${subject}` });
      } else {
        await startSession(subject, teacherId);
        toast({ title: "Session Started", description: `Students can now mark attendance for ${subject}` });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: err.message
      });
    } finally {
      setLoadingSubject(null);
    }
  };

  const handleLogout = () => {
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SUBJECTS.map((subject) => {
            const session = activeSessions.find(s => s.id === subject);
            const isActive = !!session;
            const isLoading = loadingSubject === subject;

            return (
              <Card key={subject} className="rounded-3xl border-none shadow-sm bg-white overflow-hidden group">
                <CardHeader className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="bg-primary/5 p-3 rounded-2xl group-hover:bg-primary/10 transition-colors">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    {isActive && (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-1 rounded-full animate-pulse">
                        LIVE NOW
                      </span>
                    )}
                  </div>
                  <CardTitle className="mt-4 text-xl font-bold">{subject}</CardTitle>
                  <CardDescription>
                    {isActive ? (
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3" />
                        Started at {session.startTime?.toDate ? format(session.startTime.toDate(), 'HH:mm') : 'Just now'}
                      </span>
                    ) : (
                      "No active session"
                    )}
                  </CardDescription>
                </CardHeader>
                <button onClick={startSession}>Start Session</button>
                    <button onClick={endSession}>End Session</button>

                    <h3>Live Attendance</h3>
                    <ul>
                      {presentStudents.map((s) => (
                        <li key={s.id}>{s.studentName}</li>
                      ))}
                    </ul>

                <CardContent className="p-6 pt-0">
                  <Button 
                    className={`w-full h-12 rounded-2xl transition-all ${
                      isActive 
                        ? "bg-destructive hover:bg-destructive/90 text-white" 
                        : "bg-secondary hover:bg-secondary/90 text-white"
                    }`}
                    onClick={() => handleToggleSession(subject)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isActive ? (
                      <>
                        <Square className="w-4 h-4 mr-2 fill-current" />
                        End Attendance
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2 fill-current" />
                        Start Attendance
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
