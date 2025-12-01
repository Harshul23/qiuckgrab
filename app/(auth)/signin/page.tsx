"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle, SplashAnimation, GoogleSignInButton } from "@/components/ui";
import { Zap, Mail, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function SigninPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Handle client-side mounting and splash timer
  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/home");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store the token using auth context
      if (data.token && data.user) {
        login(data.token, data.user);
      }

      // Redirect to home page on success
      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Google sign-in failed");
      }

      // Store the token using auth context
      if (data.token && data.user) {
        login(data.token, data.user);
      }

      // Redirect to home page on success
      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (error: string) => {
    setError(error);
  };

  // Show splash animation when mounted and showSplash is true
  if (mounted && showSplash) {
    return (
      <div 
        className="cursor-pointer" 
        onClick={() => setShowSplash(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setShowSplash(false)}
      >
        <SplashAnimation />
      </div>
    );
  }

  // Show loading state before mounting to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Zap className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold">QuickGrab</span>
          </div>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.edu"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signin"
            disabled={loading}
          />

          <div className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
