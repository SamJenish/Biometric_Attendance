"use client"

import React, { useState } from 'react';
import { Fingerprint, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BiometricButtonProps {
  onSuccess: () => void;
  isLoading?: boolean;
}

export default function BiometricButton({ onSuccess, isLoading }: BiometricButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleClick = async () => {
    if (isLoading || isSuccess) return;
    
    // Simulating biometric check
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSuccess(true);
    onSuccess();
    
    // Reset after success animation
    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500",
          "bg-white shadow-2xl border-4",
          isHovered ? "border-secondary" : "border-slate-100",
          isSuccess ? "bg-secondary/10" : "",
          "active:scale-95 group overflow-hidden"
        )}
      >
        <div className={cn(
          "absolute inset-0 rounded-full animate-glow opacity-0 transition-opacity duration-500",
          isHovered && !isLoading && !isSuccess ? "opacity-100" : ""
        )} />
        
        {isLoading ? (
          <Loader2 className="w-20 h-20 text-secondary animate-spin" />
        ) : isSuccess ? (
          <CheckCircle2 className="w-24 h-24 text-secondary animate-in zoom-in duration-300" />
        ) : (
          <Fingerprint className={cn(
            "w-24 h-24 transition-colors duration-300",
            isHovered ? "text-secondary" : "text-primary/40"
          )} />
        )}
      </button>
      
      <p className="text-sm font-medium text-slate-500 uppercase tracking-widest animate-pulse">
        {isLoading ? 'Verifying location...' : isSuccess ? 'Identity Confirmed' : 'Touch to Authenticate'}
      </p>
    </div>
  );
}
