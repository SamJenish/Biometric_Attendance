"use client"

import React, { useState } from 'react';
import { Fingerprint, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface BiometricButtonProps {
  onSuccess: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function BiometricButton({ onSuccess, isLoading, disabled }: BiometricButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const { toast } = useToast();

  const verifyWebAuthn = async () => {
    if (isLoading || isSuccess || disabled) return;
    
    setIsError(false);

    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "WebAuthn is not supported on this browser/device."
      });
      setIsError(true);
      return;
    }

    try {
      // Mock challenge data for prototype purposes
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const userID = new Uint8Array(16);
      window.crypto.getRandomValues(userID);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "Biometric Presence Pro",
          id: window.location.hostname,
        },
        user: {
          id: userID,
          name: "student@university.edu",
          displayName: "Student User",
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "none",
      };

      // Trigger the browser's biometric prompt
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      });

      if (credential) {
        setIsSuccess(true);
        onSuccess();
        setTimeout(() => setIsSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error("WebAuthn Error:", err);
      setIsError(true);
      toast({
        variant: "destructive",
        title: "Verification Cancelled",
        description: "Identity could not be verified via biometrics."
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        onClick={verifyWebAuthn}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={disabled || isLoading}
        className={cn(
          "relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500",
          "bg-white shadow-2xl border-4",
          disabled ? "opacity-50 grayscale cursor-not-allowed border-slate-100" : (isHovered ? "border-secondary" : "border-slate-100"),
          isSuccess ? "bg-secondary/10" : "",
          isError ? "border-destructive animate-shake" : "",
          "active:scale-95 group overflow-hidden"
        )}
      >
        <div className={cn(
          "absolute inset-0 rounded-full animate-glow opacity-0 transition-opacity duration-500",
          isHovered && !isLoading && !isSuccess && !disabled ? "opacity-100" : ""
        )} />
        
        {isLoading ? (
          <Loader2 className="w-20 h-20 text-secondary animate-spin" />
        ) : isSuccess ? (
          <CheckCircle2 className="w-24 h-24 text-secondary animate-in zoom-in duration-300" />
        ) : isError ? (
          <ShieldAlert className="w-24 h-24 text-destructive" />
        ) : (
          <Fingerprint className={cn(
            "w-24 h-24 transition-colors duration-300",
            isHovered && !disabled ? "text-secondary" : "text-primary/40"
          )} />
        )}
      </button>
      
      <p className={cn(
        "text-sm font-medium uppercase tracking-widest",
        disabled ? "text-slate-300" : (isError ? "text-destructive" : "text-slate-500 animate-pulse")
      )}>
        {isLoading ? 'Processing...' : isSuccess ? 'Confirmed' : isError ? 'Try Again' : disabled ? 'Select Session First' : 'Tap to Verify Identity'}
      </p>
    </div>
  );
}
