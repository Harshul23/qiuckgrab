"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Avatar, AvatarFallback } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, MapPin, Calendar, Clock, Shield, Zap, CheckCircle, MessageCircle } from "lucide-react";

interface LostFoundPostDetails {
  id: string;
  type: "LOST" | "FOUND";
  title: string;
  description: string | null;
  category: string;
  photo: string | null;
  photos: string[];
  location: string | null;
  date: string | null;
  contactInfo: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    photo: string | null;
    verificationStatus: string;
    college: string | null;
    isOnline: boolean;
    lastSeen: string;
  };
}

export default function LostFoundPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<LostFoundPostDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUserId(user?.id || null);
      } catch {
        // Invalid JSON
      }
    }
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/lost-found/${id}`);
      const data = await res.json();
      setPost(data.post);
    } catch {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const handleMarkResolved = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/lost-found/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "RESOLVED" }),
      });

      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update status");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/lost-found/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        router.push("/lost-and-found");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete post");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Post Not Found</h1>
          <Link href="/lost-and-found">
            <Button className="bg-orange-600 hover:bg-orange-700">Back to Lost & Found</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = currentUserId === post.user.id;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Link href="/lost-and-found" className="flex items-center text-muted-foreground hover:text-orange-600">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Link>
          <div className="flex-1 flex items-center justify-center">
            <Link href="/home" className="flex items-center space-x-2">
              <div className="bg-orange-600 p-1.5 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-foreground">QuickGrab</span>
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Image & Description */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="aspect-square bg-muted rounded-2xl overflow-hidden relative">
              {post.photo ? (
                <img src={post.photo} alt={post.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No Image Available
                </div>
              )}
              {/* Type Badge */}
              <Badge
                variant={post.type === "LOST" ? "destructive" : "success"}
                className="absolute top-4 left-4 text-lg py-1 px-3"
              >
                {post.type === "LOST" ? "🔍 Lost Item" : "✅ Found Item"}
              </Badge>
              {post.status === "RESOLVED" && (
                <Badge variant="secondary" className="absolute top-4 right-4 text-lg py-1 px-3">
                  ✓ Resolved
                </Badge>
              )}
            </div>

            {/* Additional Photos */}
            {post.photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {post.photos.map((photo, i) => (
                  <div key={i} className="w-20 h-20 bg-muted rounded-2xl overflow-hidden flex-shrink-0">
                    <img src={photo} alt={`${post.title} ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {post.description || "No description provided."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right: Details & Actions */}
          <div className="space-y-6">
            {/* Title & Details */}
            <Card>
              <CardContent className="pt-6">
                <h1 className="text-2xl font-bold text-foreground mb-4">{post.title}</h1>
                
                <div className="flex gap-2 mb-4">
                  <Badge variant="outline">{post.category}</Badge>
                  <Badge variant={post.status === "RESOLVED" ? "secondary" : "default"}>
                    {post.status}
                  </Badge>
                </div>

                {/* Location & Date Info */}
                <div className="bg-muted rounded-2xl p-4 mb-4 space-y-3">
                  {post.location && (
                    <div className="flex items-center text-sm">
                      <MapPin className="h-5 w-5 mr-2 text-muted-foreground" />
                      <div>
                        <span className="text-muted-foreground">{post.type === "LOST" ? "Last seen at:" : "Found at:"}</span>
                        <span className="font-medium text-foreground ml-2">{post.location}</span>
                      </div>
                    </div>
                  )}
                  {post.date && (
                    <div className="flex items-center text-sm">
                      <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                      <div>
                        <span className="text-muted-foreground">{post.type === "LOST" ? "Lost on:" : "Found on:"}</span>
                        <span className="font-medium text-foreground ml-2">{formatDate(post.date)}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Posted:</span>
                      <span className="font-medium text-foreground ml-2">{formatDate(post.createdAt)} at {formatTime(post.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                {post.contactInfo && (
                  <div className="bg-orange-500/10 rounded-2xl p-4 mb-4">
                    <div className="flex items-center text-sm">
                      <MessageCircle className="h-5 w-5 mr-2 text-orange-500" />
                      <div>
                        <span className="text-orange-600 dark:text-orange-400 font-medium">Contact Info:</span>
                        <span className="text-foreground ml-2">{post.contactInfo}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Owner Actions */}
                {isOwner && post.status === "ACTIVE" && (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                      onClick={handleMarkResolved}
                      disabled={updating}
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      {updating ? "Updating..." : "Mark as Resolved"}
                    </Button>
                    <Button
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={handleDelete}
                      disabled={updating}
                    >
                      Delete
                    </Button>
                  </div>
                )}

                {/* Non-owner CTA */}
                {!isOwner && post.status === "ACTIVE" && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-2">
                      {post.type === "LOST" 
                        ? "If you've found this item, contact the owner!"
                        : "If this is your item, contact the finder!"}
                    </p>
                    <Link href={`/profile/${post.user.id}`}>
                      <Button size="lg" className="w-full bg-orange-600 hover:bg-orange-700">
                        <MessageCircle className="h-5 w-5 mr-2" />
                        View Profile & Contact
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle>{post.type === "LOST" ? "Posted By" : "Found By"}</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/profile/${post.user.id}`}>
                  <div className="flex items-center space-x-4 hover:bg-accent p-2 rounded-2xl -m-2 transition-colors">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg bg-orange-500/20 text-orange-600">
                        {post.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-semibold text-lg text-foreground">{post.user.name}</span>
                        {post.user.verificationStatus === "VERIFIED" && (
                          <Badge variant="verified" className="ml-2">
                            <Shield className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      {post.user.college && (
                        <p className="text-sm text-muted-foreground">{post.user.college}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {post.user.isOnline ? (
                        <span className="flex items-center text-green-600 dark:text-green-500 text-sm">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                          Online
                        </span>
                      ) : (
                        <span className="flex items-center text-muted-foreground text-sm">
                          <Clock className="h-4 w-4 mr-1" />
                          Offline
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Safety Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-orange-500" />
                  Safety Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Meet in a public, well-lit campus location
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Verify the item details before meeting
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Ask for proof of ownership if claiming a found item
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Report suspicious activity to campus security
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
