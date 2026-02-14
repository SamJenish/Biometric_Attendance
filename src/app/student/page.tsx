"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, MapPin, BookOpen, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BiometricButton from '@/components/BiometricButton';
import { recordAttendance } from '@/lib/attendance';

export default function StudentDashboard() {
  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
  }, [router]);

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
    
    // Attempting to get geolocation
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
      {/* Header */}
      <div className="w-full max-w-2xl flex justify-between items-start mb-12">
        <div className="space-y-1">
          <p className="text-secondary font-semibold text-sm tracking-widest uppercase">Dashboard</p>
          <h1 className="text-4xl font-bold text-primary tracking-tight">Welcome, {studentId}!</h1>
          <p className="text-slate-500">{currentDate}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full text-slate-400 hover:text-destructive">
          <LogOut className="w-6 h-6" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-2xl space-y-8">
        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="p-0 space-y-8">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-primary ml-1">Select Active Class</label>
              <Select onValueChange={setSubject} value={subject}>
                <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-200 shadow-sm text-lg px-6">
                  <SelectValue placeholder="Which subject are you attending?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Computer Science 101">Computer Science 101</SelectItem>
                  <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
                  <SelectItem value="Advanced Mathematics">Advanced Mathematics</SelectItem>
                  <SelectItem value="Modern Architecture">Modern Architecture</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center py-10">
              <BiometricButton onSuccess={handleMarkAttendance} isLoading={isLoading} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-3xl shadow-sm flex flex-col gap-3">
                <div className="bg-secondary/10 w-10 h-10 rounded-xl flex items-center justify-center">
                  <BookOpen className="text-secondary w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">Status</p>
                  <p className="text-primary font-bold">Ready to Scan</p>
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
