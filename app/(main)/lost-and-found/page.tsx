"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge, Avatar, AvatarFallback, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui";
import { Search, Zap, MapPin, Calendar, User, LogOut, Plus, Eye, Package } from "lucide-react";

interface LostFoundPost {
  id: string;
  type: "LOST" | "FOUND";
  title: string;
  description: string | null;
  category: string;
  photo: string | null;
  location: string | null;
  date: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    photo: string | null;
    verificationStatus: string;
    college: string | null;
  };
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  photo: string | null;
}

const CATEGORIES = [
  "All",
  "Electronics",
  "Books",
  "Clothing",
  "Accessories",
  "Keys",
  "ID Cards",
  "Bags",
  "Other",
];

export default function LostAndFoundPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<LostFoundPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"ALL" | "LOST" | "FOUND">("ALL");
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && typeof user.id === "string" && typeof user.name === "string") {
          setCurrentUser(user);
        }
      } catch {
        // Invalid JSON
      }
    }
  }, []);

  // Fetch posts with pagination
  const fetchPosts = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      let url = `/api/lost-found?page=${pageNum}&limit=12`;
      if (activeType !== "ALL") {
        url += `&type=${activeType}`;
      }
      if (activeCategory !== "All") {
        url += `&category=${encodeURIComponent(activeCategory)}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch posts");
      }
      const data = await res.json();
      const newPosts = data.posts || [];

      if (append) {
        setPosts((prev) => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      setHasMore(newPosts.length === 12 && pageNum < (data.pagination?.totalPages || 1));
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posts");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeType, activeCategory]);

  // Initial fetch on mount
  useEffect(() => {
    fetchPosts(1, false);
  }, [fetchPosts]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    router.push("/signin");
  };

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled client-side by filtering posts, server-side search can be added later
    fetchPosts(1, false);
  }, [fetchPosts]);

  // Infinite scroll observer
  useEffect(() => {
    if (!observerTarget.current || !hasMore || loadingMore || loading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore) {
          fetchPosts(page + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerTarget.current);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingMore, loading, page, fetchPosts]);

  const filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/home" className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-orange-500" />
              <span className="text-2xl font-bold">QuickGrab</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/report-item">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Report Item
                </Button>
              </Link>
              {currentUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-full">
                      <Avatar>
                        <AvatarFallback>{currentUser.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                        <p className="text-xs leading-none text-gray-500">{currentUser.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${currentUser.id}`} className="flex items-center cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/signin">
                  <Avatar>
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Link>
              )}
            </div>
          </div>

          {/* Title and Search */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold mb-2">Lost & Found</h1>
            <p className="text-gray-600 text-sm">Help fellow students find their lost items or report items you&apos;ve found</p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search lost & found items..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>

          {/* Type Filter */}
          <div className="flex gap-2 mb-4">
            {(["ALL", "LOST", "FOUND"] as const).map((type) => (
              <Button
                key={type}
                variant={activeType === type ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setActiveType(type);
                  setPage(1);
                }}
              >
                {type === "ALL" ? "All" : type === "LOST" ? "🔍 Lost Items" : "✅ Found Items"}
              </Button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setActiveCategory(cat);
                  setPage(1);
                }}
                className="whitespace-nowrap"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading && posts.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="aspect-video bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error && posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => fetchPosts(1, false)}>Retry</Button>
          </div>
        ) : filteredPosts.length === 0 && !loading ? (
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No posts found</p>
            <Link href="/report-item">
              <Button>Report a Lost or Found Item</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <Link key={post.id} href={`/lost-and-found/${post.id}`}>
                  <Card className="hover:shadow-lg transition-shadow h-full">
                    {/* Post Image */}
                    <div className="aspect-video bg-gray-100 relative overflow-hidden rounded-t-lg">
                      {post.photo ? (
                        <img
                          src={post.photo}
                          alt={post.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Eye className="h-12 w-12" />
                        </div>
                      )}
                      {/* Type Badge */}
                      <Badge
                        variant={post.type === "LOST" ? "destructive" : "success"}
                        className="absolute top-2 left-2"
                      >
                        {post.type === "LOST" ? "🔍 Lost" : "✅ Found"}
                      </Badge>
                      {/* Status Badge */}
                      {post.status === "RESOLVED" && (
                        <Badge variant="secondary" className="absolute top-2 right-2">
                          Resolved
                        </Badge>
                      )}
                    </div>

                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                    </CardHeader>

                    <CardContent>
                      {post.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.description}</p>
                      )}

                      {/* Category */}
                      <div className="flex gap-2 mb-3">
                        <Badge variant="outline">{post.category}</Badge>
                      </div>

                      {/* Location & Date */}
                      <div className="text-sm text-gray-500 space-y-1 mb-3">
                        {post.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span className="truncate">{post.location}</span>
                          </div>
                        )}
                        {post.date && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{formatDate(post.date)}</span>
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {post.user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center">
                              <span className="font-medium">{post.user.name}</span>
                              {post.user.verificationStatus === "VERIFIED" && (
                                <span className="ml-1 text-orange-500">✓</span>
                              )}
                            </div>
                            {post.user.college && (
                              <span className="text-xs text-gray-400">{post.user.college}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{formatDate(post.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Infinite scroll trigger */}
            {hasMore && (
              <div ref={observerTarget} className="h-10 flex items-center justify-center py-8">
                {loadingMore && (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
