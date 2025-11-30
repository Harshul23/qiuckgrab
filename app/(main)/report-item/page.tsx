"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, Textarea, FileUpload } from "@/components/ui";
import { ArrowLeft, Zap, Tag, MapPin, Calendar, CheckCircle, Phone } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const CATEGORIES = [
  "Electronics",
  "Books",
  "Clothing",
  "Accessories",
  "Keys",
  "ID Cards",
  "Bags",
  "Other",
];

export default function ReportItemPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: "LOST" as "LOST" | "FOUND",
    title: "",
    category: "",
    description: "",
    location: "",
    date: "",
    contactInfo: "",
    photo: "",
  });

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Don't redirect, show sign-in prompt instead
    }
  }, [authLoading, isAuthenticated]);

  // Handle file selection and convert to data URL
  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) {
      setFormData((prev) => ({ ...prev, photo: "" }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setFormData((prev) => ({ ...prev, photo: dataUrl }));
    };
    reader.onerror = () => {
      setError("Failed to read the image file. Please try again.");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!token) {
      router.push("/signin");
      return;
    }

    // Show success state immediately (optimistic UI)
    setSuccess(true);
    setLoading(true);

    // Send request in background
    try {
      const res = await fetch("/api/lost-found", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: formData.type,
          title: formData.title,
          category: formData.category,
          description: formData.description || undefined,
          location: formData.location || undefined,
          date: formData.date || undefined,
          contactInfo: formData.contactInfo || undefined,
          photo: formData.photo || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create post");
      }

      // Redirect to the post page after successful creation
      router.push(`/lost-and-found/${data.post.id}`);
    } catch (err) {
      // Rollback optimistic state on error
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSuccess(false);
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center">
            <Link href="/lost-and-found" className="flex items-center text-gray-600 hover:text-orange-600">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Link>
            <div className="flex-1 flex items-center justify-center">
              <Link href="/home" className="flex items-center space-x-2">
                <div className="bg-orange-600 p-1.5 rounded-lg">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-gray-900">QuickGrab</span>
              </Link>
            </div>
            <div className="w-20"></div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-16 max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-sm border p-8">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
            <p className="text-gray-600 mb-6">
              You need to sign in to report a lost or found item.
            </p>
            <Link href="/signin">
              <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                Sign In to Continue
              </Button>
            </Link>
            <p className="mt-4 text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-orange-600 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Link href="/lost-and-found" className="flex items-center text-gray-600 hover:text-orange-600">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Link>
          <div className="flex-1 flex items-center justify-center">
            <Link href="/home" className="flex items-center space-x-2">
              <div className="bg-orange-600 p-1.5 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">QuickGrab</span>
            </Link>
          </div>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Report Lost or Found Item</CardTitle>
          </CardHeader>
          <CardContent>
            {success && !error && (
              <div className="bg-green-50 text-green-600 p-3 rounded-md mb-6 text-sm flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Post created successfully! Redirecting...
              </div>
            )}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Selection */}
              <div className="space-y-2">
                <Label>What would you like to report? *</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      formData.type === "LOST"
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setFormData({ ...formData, type: "LOST" })}
                  >
                    <div className="text-2xl mb-2">🔍</div>
                    <div className="font-medium">I Lost Something</div>
                    <div className="text-sm text-gray-500">Report an item you&apos;ve lost</div>
                  </button>
                  <button
                    type="button"
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      formData.type === "FOUND"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setFormData({ ...formData, type: "FOUND" })}
                  >
                    <div className="text-2xl mb-2">✅</div>
                    <div className="font-medium">I Found Something</div>
                    <div className="text-sm text-gray-500">Report an item you&apos;ve found</div>
                  </button>
                </div>
              </div>

              {/* Item Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Item Name/Title *</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="title"
                    placeholder="e.g., Blue Backpack, iPhone 14, Student ID Card"
                    className="pl-10"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">
                  {formData.type === "LOST" ? "Where did you lose it?" : "Where did you find it?"}
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="location"
                    placeholder="e.g., Library, Cafeteria, Room 301"
                    className="pl-10"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">
                  {formData.type === "LOST" ? "When did you lose it?" : "When did you find it?"}
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="date"
                    type="date"
                    className="pl-10"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide any additional details that might help identify the item..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <Label htmlFor="contactInfo">Contact Information (optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="contactInfo"
                    placeholder="e.g., Phone number, WhatsApp, or email"
                    className="pl-10"
                    value={formData.contactInfo}
                    onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  This will be visible to other users
                </p>
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Photo</Label>
                <FileUpload
                  accept="image/*"
                  maxSize={10}
                  onFileSelect={handleFileSelect}
                  placeholder="Click to upload or drag and drop"
                  hint="PNG, JPG up to 10MB - Adding a photo helps others identify the item"
                />
              </div>

              {/* Submit */}
              <div className="pt-4">
                <Button type="submit" size="lg" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
                  {loading ? "Submitting..." : `Report ${formData.type === "LOST" ? "Lost" : "Found"} Item`}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
