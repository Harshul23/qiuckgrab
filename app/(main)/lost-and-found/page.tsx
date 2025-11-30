"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Badge, Avatar, AvatarFallback, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui";
import { Search, Zap, MapPin, Calendar, User, LogOut, Plus, Package, Filter, ShoppingBag, HelpCircle } from "lucide-react";

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

type TabType = "marketplace" | "campus-relay" | "lost-found";

const TABS: { id: TabType; label: string; icon: React.ReactNode; href: string }[] = [
  { id: "marketplace", label: "Marketplace", icon: <ShoppingBag className="h-5 w-5" />, href: "/home" },
  { id: "campus-relay", label: "Campus Relay", icon: <Zap className="h-5 w-5" />, href: "/home" },
  { id: "lost-found", label: "Lost & Found", icon: <HelpCircle className="h-5 w-5" />, href: "/lost-and-found" },
];

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
          <div className="flex items-center justify-between">
            <Link href="/home" className="flex items-center space-x-2">
              <div className="bg-orange-600 p-2 rounded-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">QuickGrab</span>
                <span className="text-xs text-gray-500">Campus Marketplace</span>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              {currentUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-full">
                      <Avatar>
                        <AvatarFallback className="bg-orange-100 text-orange-600">{currentUser.name?.charAt(0) || "U"}</AvatarFallback>
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
                    <AvatarFallback className="bg-orange-100 text-orange-600">U</AvatarFallback>
                  </Avatar>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8">
            {TABS.map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  tab.id === "lost-found"
                    ? "border-orange-600 text-orange-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lost & Found</h1>
            <p className="text-gray-600">Help fellow students find their lost items or report items you&apos;ve found</p>
          </div>
          <Link href="/report-item">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-full">
              <Plus className="h-4 w-4 mr-2" />
              Report Item
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search for items... (e.g., 'lost iPhone charger near library')"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button type="button" variant="outline">
            <Filter className="h-4 w-4" />
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
              className={activeType === type ? "bg-orange-600 hover:bg-orange-700" : ""}
            >
              {type === "ALL" ? "All Items" : type === "LOST" ? "🔍 Lost Items" : "✅ Found Items"}
            </Button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setActiveCategory(cat);
                setPage(1);
              }}
              className={`whitespace-nowrap ${activeCategory === cat ? "bg-orange-600 hover:bg-orange-700" : ""}`}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Items Grid */}
        {loading && posts.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error && posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => fetchPosts(1, false)} className="bg-orange-600 hover:bg-orange-700">Retry</Button>
          </div>
        ) : filteredPosts.length === 0 && !loading ? (
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No posts found</p>
            <Link href="/report-item">
              <Button className="bg-orange-600 hover:bg-orange-700">Report a Lost or Found Item</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Post Image */}
                  <Link href={`/lost-and-found/${post.id}`}>
                    <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                      {post.photo ? (
                        <img
                          src={post.photo}
                          alt={post.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="h-16 w-16" />
                        </div>
                      )}
                      {/* Category Badge */}
                      <Badge className="absolute top-3 right-3 bg-white text-gray-800 border-0 shadow-sm">
                        {post.category}
                      </Badge>
                    </div>
                  </Link>

                  {/* Post Details */}
                  <div className="p-4">
                    <Link href={`/lost-and-found/${post.id}`}>
                      <h3 className="font-semibold text-gray-900 text-lg mb-1 hover:text-orange-600 transition-colors line-clamp-1">
                        {post.title}
                      </h3>
                    </Link>
                    
                    {/* Type Badge */}
                    <div className="mb-2">
                      <Badge
                        variant={post.type === "LOST" ? "destructive" : "success"}
                      >
                        {post.type === "LOST" ? "🔍 Lost" : "✅ Found"}
                      </Badge>
                      {post.status === "RESOLVED" && (
                        <Badge variant="secondary" className="ml-2">
                          Resolved
                        </Badge>
                      )}
                    </div>
                    
                    {/* Location */}
                    <div className="flex items-center text-gray-500 text-sm mb-4">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{post.location || "On Campus"}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/lost-and-found/${post.id}`} className="flex-1">
                        <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-lg">
                          View Details
                        </Button>
                      </Link>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-sm">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-orange-100 text-orange-600">
                            {post.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center">
                          <span className="font-medium text-gray-700">{post.user.name}</span>
                          {post.user.verificationStatus === "VERIFIED" && (
                            <span className="ml-1 text-orange-500">✓</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center text-gray-400 text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Infinite scroll trigger */}
            {hasMore && (
              <div ref={observerTarget} className="h-10 flex items-center justify-center py-8">
                {loadingMore && (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
