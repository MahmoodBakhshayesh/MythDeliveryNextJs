"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { LoginViewModel } from "@/features/auth/controllers/login.controller";

/** Presentational: reads only `viewState` + invokes `actions`. No repos / use cases. */
export function LoginFormView({ viewState, actions, pending }: LoginViewModel) {
  return (
    <Card className="w-full max-w-md border shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Sign in
        </CardTitle>
        <CardDescription>
          Connect to your Myth Delivery API ({viewState.apiBaseUrl})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="password" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="otp">Email code</TabsTrigger>
            <TabsTrigger value="google">Google</TabsTrigger>
          </TabsList>

          <TabsContent value="password" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                value={viewState.username}
                onChange={(e) => actions.setUsername(e.target.value)}
                placeholder="admin or your username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={viewState.password}
                onChange={(e) => actions.setPassword(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={pending.password}
              onClick={() => actions.loginPassword()}
            >
              {pending.password ? "Signing in…" : "Sign in"}
            </Button>
          </TabsContent>

          <TabsContent value="otp" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={viewState.email}
                onChange={(e) => actions.setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            {!viewState.otpSent ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={pending.sendOtp || !viewState.email.trim()}
                onClick={() => actions.sendOtp()}
              >
                {pending.sendOtp ? "Sending…" : "Send code"}
              </Button>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="code">6-digit code</Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    value={viewState.code}
                    onChange={(e) => actions.setCode(e.target.value)}
                    placeholder="000000"
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={pending.verifyOtp}
                  onClick={() => actions.verifyOtp()}
                >
                  {pending.verifyOtp ? "Verifying…" : "Verify & sign in"}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm"
                  onClick={() => actions.resetOtpFlow()}
                >
                  Use a different email
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="google" className="mt-4 space-y-4">
            <p className="text-muted-foreground text-sm">
              Paste the Google ID token from your client (GIS / One Tap). Ensure{" "}
              <code className="rounded bg-muted px-1">Google:ClientId</code> is
              set on the API.
            </p>
            <div className="space-y-2">
              <Label htmlFor="idToken">ID token</Label>
              <Textarea
                id="idToken"
                className="min-h-[120px] font-mono text-xs"
                value={viewState.googleToken}
                onChange={(e) => actions.setGoogleToken(e.target.value)}
                placeholder="eyJhbGciOiJSUzI1NiIs..."
              />
            </div>
            <Button
              className="w-full"
              disabled={pending.google || !viewState.googleToken.trim()}
              onClick={() => actions.loginGoogle()}
            >
              {pending.google ? "Signing in…" : "Sign in with Google"}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
