"use client"
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, MapPin, BookOpen, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BiometricButton from '@/components/BiometricButton';
import { recordAttendance, subscribeToActiveSessions, ActiveSession } from '@/lib/attendance';

export default function StudentDashboard() {
  const [studentId, setStudentId] = useState('');
  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const router = useRouter();
  const { toast } = useToast();
useEffect(() => {
  const q = query(
    collection(db, "sessions"),
    where("isActive", "==", true)
  );

  const unsub = onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setActiveSessions(sessions);
  });

  return () => unsub();
}, []);
const markAttendance = async (sessionId: string) => {
  await setDoc(
    doc(db, "sessions", sessionId, "attendance", user.uid),
    {
      studentName: user.email,
      verifiedAt: serverTimestamp(),
      deviceInfo: navigator.userAgent
    }
  );
};

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const id = localStorage.getItem('studentId');
    if (role !== 'student' || !id) {
      router.push('/login');
    } else {
      setStudentId(id);
    }
    
    setCurrentDate(new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));

    const unsubscribe = subscribeToActiveSessions((sessions) => {
      setActiveSessions(sessions);
      // If currently selected subject session ends, reset selection
      if (subject && !sessions.find(s => s.id === subject)) {
        setSubject('');
      }
    });

    return () => unsubscribe();
  }, [router, subject]);
<h3>Active Sessions</h3>

{activeSessions.map((session) => (
  <div key={session.id}>
    <p>{session.subject}</p>
    <button onClick={() => handleBiometric(session.id)}>
      Verify Attendance
    </button>
  </div>
))}

  const handleMarkAttendance = () => {
    if (!subject) {
      toast({
        variant: "destructive",
        title: "Subject Required",
        description: "Please select a subject before marking attendance."
      });
      return;
    }

    setIsLoading(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await recordAttendance(
              studentId,
              subject,
              position.coords.latitude,
              position.coords.longitude
            );
            toast({
              title: "Attendance Successful",
              description: `Recorded for ${subject} at ${new Date().toLocaleTimeString()}`
            });
          } catch (err: any) {
            toast({
              variant: "destructive",
              title: "Attendance Failed",
              description: err.message
            });
          } finally {
            setIsLoading(false);
          }
        },
        (error) => {
          setIsLoading(false);
          toast({
            variant: "destructive",
            title: "Location Access Denied",
            description: "Please enable location services to mark attendance."
          });
        }
      );
    } else {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Your browser does not support geolocation."
      });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl flex justify-between items-start mb-12">
        <div className="space-y-1">
          <p className="text-secondary font-semibold text-sm tracking-widest uppercase">Student Portal</p>
          <h1 className="text-4xl font-bold text-primary tracking-tight">Welcome, {studentId}!</h1>
          <p className="text-slate-500">{currentDate}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full text-slate-400 hover:text-destructive">
          <LogOut className="w-6 h-6" />
        </Button>
      </div>

      <div className="w-full max-w-2xl space-y-8">
        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="p-0 space-y-8">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-primary ml-1">Available Classes</label>
              {activeSessions.length > 0 ? (
                <Select onValueChange={setSubject} value={subject}>
                  <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-200 shadow-sm text-lg px-6">
                    <SelectValue placeholder="Select a live session..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeSessions.map(session => (
                      <SelectItem key={session.id} value={session.id}>{session.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-3 text-amber-800">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <p className="text-sm font-medium">No sessions are currently active. Wait for your teacher to start one.</p>
                </div>
              )}
            </div>

            <div className="flex justify-center py-10">
              <BiometricButton 
                onSuccess={handleMarkAttendance} 
                isLoading={isLoading} 
                disabled={!subject}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-3xl shadow-sm flex flex-col gap-3">
                <div className="bg-secondary/10 w-10 h-10 rounded-xl flex items-center justify-center">
                  <BookOpen className="text-secondary w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">Status</p>
                  <p className="text-primary font-bold">{subject ? 'Ready to Scan' : 'Waiting for selection'}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm flex flex-col gap-3">
                <div className="bg-primary/5 w-10 h-10 rounded-xl flex items-center justify-center">
                  <MapPin className="text-primary w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">Location</p>
                  <p className="text-primary font-bold">Classroom A-12</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
