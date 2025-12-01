"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, Textarea, FileUpload } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Zap, IndianRupee, Tag, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const CATEGORIES = [
  "Electronics",
  "Books",
  "Furniture",
  "Clothing",
  "Accessories",
  "Sports",
  "Kitchen",
  "Transportation",
  "Other",
];

const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "POOR", label: "Poor" },
];

export default function ListItemPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    condition: "GOOD",
    photo: "",
  });

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [authLoading, isAuthenticated, router]);

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
      const res = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          description: formData.description || undefined,
          price: parseFloat(formData.price),
          condition: formData.condition,
          photo: formData.photo || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to list item");
      }

      // Clear cache to show new item in home page
      try {
        sessionStorage.removeItem("homeItems");
        sessionStorage.removeItem("homePage");
      } catch {
        // Ignore storage errors
      }

      // Redirect to item page after successful creation
      router.push(`/item/${data.item.id}`);
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

  // Don't render the form if not authenticated (will redirect)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Link href="/home" className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Link>
          <div className="flex-1 flex items-center justify-center">
            <Zap className="h-6 w-6 text-orange-500 mr-2" />
            <span className="font-bold text-foreground">QuickGrab</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">List an Item for Sale</CardTitle>
          </CardHeader>
          <CardContent>
            {success && !error && (
              <div className="bg-green-500/10 text-green-500 p-3 rounded-md mb-6 text-sm flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Item listed successfully! Redirecting...
              </div>
            )}
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Item Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="e.g., iPhone 13 Charger, TI-84 Calculator"
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm"
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

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-10"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  AI will analyze your price against campus averages
                </p>
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <Label htmlFor="condition">Condition *</Label>
                <div className="grid grid-cols-5 gap-2">
                  {CONDITIONS.map((cond) => (
                    <button
                      key={cond.value}
                      type="button"
                      className={`p-2 text-sm rounded-md border transition-colors ${
                        formData.condition === cond.value
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-card hover:bg-accent border-border text-foreground"
                      }`}
                      onClick={() => setFormData({ ...formData, condition: cond.value })}
                    >
                      {cond.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your item (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Photo</Label>
                <FileUpload
                  accept="image/*"
                  maxSize={10}
                  onFileSelect={handleFileSelect}
                  placeholder="Click to upload or drag and drop"
                  hint="PNG, JPG up to 10MB"
                />
              </div>

              {/* Submit */}
              <div className="pt-4">
                <Button type="submit" size="lg" className="w-full bg-orange-500 hover:bg-orange-600" disabled={loading}>
                  {loading ? "Listing Item..." : "List Item for Sale"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
