"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle, FileUpload, SplashAnimation, GoogleSignInButton } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { useRouter } from "next/navigation";
import { Zap, Mail, Lock, User, GraduationCap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const dynamic = "force-dynamic";

type Step = "register" | "verify-email" | "verify-id";

export default function SignupPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>("register");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    college: "",
    otp: "",
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          college: formData.college,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setUserId(data.user.id);
      // In development, the OTP is returned for testing
      if (data.otp) {
        setFormData((prev) => ({ ...prev, otp: data.otp }));
      }
      setStep("verify-email");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setStep("verify-id");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyId = async () => {
    setLoading(true);
    setError(null);

    try {
      // In a real app, this would upload the image to storage first
      const mockIdPhotoUrl = "https://example.com/student-id.jpg";

      const res = await fetch("/api/auth/verify-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          idPhotoUrl: mockIdPhotoUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "ID verification failed");
      }

      // Redirect to home page on success
      window.location.href = "/home";
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
        throw new Error(data.error || "Google sign-up failed");
      }

      // Store the token using auth context
      if (data.token && data.user) {
        login(data.token, data.user);
      }

      // If this is a new user, go to ID verification step
      if (data.isNewUser) {
        setUserId(data.user.id);
        setStep("verify-id");
      } else {
        // Existing user, redirect to home
        router.push("/home");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-up failed");
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Zap className="h-8 w-8 text-orange-500" />
            <span className="text-2xl font-bold text-foreground">QuickGrab</span>
          </div>
          <CardTitle>
            {step === "register" && "Create Your Account"}
            {step === "verify-email" && "Verify Your Email"}
            {step === "verify-id" && "Verify Your Student ID"}
          </CardTitle>
          <CardDescription>
            {step === "register" && "Join the verified student marketplace"}
            {step === "verify-email" && "Enter the OTP sent to your email"}
            {step === "verify-id" && "Upload your student ID for AI verification"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}

          {step === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">College Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                <Label htmlFor="college">College/University</Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="college"
                    placeholder="State University"
                    className="pl-10"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>

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
                text="signup"
                disabled={loading}
              />
            </form>
          )}

          {step === "verify-email" && (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  placeholder="123456"
                  className="text-center text-2xl tracking-widest"
                  value={formData.otp}
                  onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                  maxLength={6}
                  required
                />
                <p className="text-xs text-muted-foreground text-center">
                  Check your email for the 6-digit code
                </p>
              </div>
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={loading}>
                {loading ? "Verifying..." : "Verify Email"}
              </Button>
            </form>
          )}

          {step === "verify-id" && (
            <div className="space-y-4">
              <FileUpload
                accept="image/*"
                maxSize={10}
                onFileSelect={setIdFile}
                placeholder="Upload your student ID card photo"
                hint="AI will verify your name, college, and expiry date"
              />
              <Button onClick={handleVerifyId} className="w-full bg-orange-500 hover:bg-orange-600" disabled={loading || !idFile}>
                {loading ? "Verifying ID..." : "Verify Student ID"}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => (window.location.href = "/home")}
              >
                Skip for now
              </Button>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/signin" className="text-orange-500 hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
