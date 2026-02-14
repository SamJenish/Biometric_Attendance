"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { GraduationCap, Lock, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Dummy logic as per requirement: admin@gmail.com -> Admin, others -> Student
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (email === 'admin@gmail.com') {
        localStorage.setItem('userRole', 'admin');
        router.push('/admin');
      } else if (email) {
        localStorage.setItem('userRole', 'student');
        localStorage.setItem('studentId', email.split('@')[0]);
        router.push('/student');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Please check your email and password."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background Orbs for futuristic feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />

      <Card className="w-full max-w-md border-white/20 bg-white/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto bg-primary w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <GraduationCap className="text-white w-7 h-7" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Biometric Presence</CardTitle>
          <CardDescription className="text-slate-500">Secure attendance management system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@university.edu"
                  className="pl-10 bg-white/50 border-slate-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 bg-white/50 border-slate-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-white h-11 rounded-lg transition-all"
              disabled={isLoading}
            >
              {isLoading ? "Authenticating..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-400">
              Demo: admin@gmail.com / student@gmail.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
