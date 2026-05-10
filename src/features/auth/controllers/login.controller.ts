"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { loginWithGoogleUseCase } from "@/features/auth/usecases/login-with-google.usecase";
import { loginWithPasswordUseCase } from "@/features/auth/usecases/login-with-password.usecase";
import { requestOtpUseCase } from "@/features/auth/usecases/request-otp.usecase";
import { verifyOtpUseCase } from "@/features/auth/usecases/verify-otp.usecase";
import { getApiBaseUrl } from "@/lib/env";
import { useAuthStore } from "@/stores/auth-store";

/** Orchestrates login view: owns transient UI state and calls use cases (never repos). */
export function useLoginController() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [googleToken, setGoogleToken] = useState("");

  const passwordMutation = useMutation({
    mutationFn: () => loginWithPasswordUseCase(username, password),
    onSuccess: (body) => {
      setSession(body);
      void queryClient.invalidateQueries();
      toast.success("Welcome back");
      router.replace("/dashboard");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const googleMutation = useMutation({
    mutationFn: () => loginWithGoogleUseCase(googleToken.trim()),
    onSuccess: (body) => {
      setSession(body);
      void queryClient.invalidateQueries();
      toast.success("Signed in with Google");
      router.replace("/dashboard");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const requestOtpMutation = useMutation({
    mutationFn: () => requestOtpUseCase(email.trim()),
    onSuccess: () => {
      setOtpSent(true);
      toast.message("Check your email for the code (dev: see API logs).");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: () => verifyOtpUseCase(email.trim(), code.trim()),
    onSuccess: (body) => {
      setSession(body);
      void queryClient.invalidateQueries();
      toast.success("Signed in");
      router.replace("/dashboard");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    viewState: {
      username,
      password,
      email,
      code,
      otpSent,
      googleToken,
      apiBaseUrl: getApiBaseUrl(),
    },
    actions: {
      setUsername,
      setPassword,
      setEmail,
      setCode,
      setGoogleToken,
      sendOtp: () => requestOtpMutation.mutate(),
      verifyOtp: () => verifyOtpMutation.mutate(),
      loginPassword: () => passwordMutation.mutate(),
      loginGoogle: () => googleMutation.mutate(),
      resetOtpFlow: () => {
        setOtpSent(false);
        setCode("");
      },
    },
    pending: {
      password: passwordMutation.isPending,
      google: googleMutation.isPending,
      sendOtp: requestOtpMutation.isPending,
      verifyOtp: verifyOtpMutation.isPending,
    },
  };
}

export type LoginViewModel = ReturnType<typeof useLoginController>;
