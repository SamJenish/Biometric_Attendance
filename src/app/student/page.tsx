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
import { db, auth } from "@/lib/firebase";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, MapPin, BookOpen, AlertCircle, Fingerprint } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function StudentDashboard() {
  const [studentId, setStudentId] = useState('');
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState('');
  const router = useRouter();
  const { toast } = useToast();

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

    // Real-Time Session Listener
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
  }, [router]);

  const verifyBiometric = async (sessionId: string) => {
    try {
      // Fake verification by triggering WebAuthn without backend verification
      await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: { name: "Demo Attendance" },
          user: {
            id: new Uint8Array(16),
            name: auth.currentUser?.email || studentId || "student",
            displayName: auth.currentUser?.displayName || studentId || "Student",
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
        },
      });

      // If user completes fingerprint → mark attendance
      const uid = auth.currentUser?.uid || studentId;
      if (!uid) {
        toast({ variant: "destructive", title: "Error", description: "User ID missing" });
        return;
      }

      await setDoc(
        doc(db, "sessions", sessionId, "attendance", uid),
        {
          studentName: auth.currentUser?.email || studentId,
          verifiedAt: serverTimestamp(),
          method: "biometric_demo"
        }
      );

      toast({
        title: "Attendance Marked ✅",
        description: "Your attendance has been verified successfully."
      });

    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Biometric Cancelled",
        description: "Verification failed or was cancelled."
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
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Sessions currently valid for attendance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeSessions.length > 0 ? (
              activeSessions.map((session) => (
                <div key={session.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 rounded-xl gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <BookOpen className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-primary">{session.subject}</p>
                      <p className="text-xs text-slate-500">Started just now</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => verifyBiometric(session.id)}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 h-12"
                  >
                    <Fingerprint className="w-5 h-5" />
                    Verify Attendance
                  </Button>
                </div>
              ))
            ) : (
              <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex flex-col items-center gap-3 text-amber-800 text-center">
                <AlertCircle className="w-8 h-8 text-amber-500" />
                <p className="font-medium">No sessions are currently active.</p>
                <p className="text-sm opacity-80">Please wait for your teacher to start a session.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm flex flex-col gap-3">
            <div className="bg-secondary/10 w-10 h-10 rounded-xl flex items-center justify-center">
              <BookOpen className="text-secondary w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">Status</p>
              <p className="text-primary font-bold">{activeSessions.length > 0 ? 'Ready to Scan' : 'Waiting...'}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm flex flex-col gap-3">
            <div className="bg-primary/5 w-10 h-10 rounded-xl flex items-center justify-center">
              <MapPin className="text-primary w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">Location</p>
              <p className="text-primary font-bold">Biometric Verify</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
