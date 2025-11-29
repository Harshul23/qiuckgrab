import { Card, CardContent, CardHeader } from "./card";

export function ItemCardSkeleton() {
  return (
    <Card className="h-full">
      {/* Image skeleton */}
      <div className="aspect-square bg-gray-200 animate-pulse rounded-t-lg" />

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
      </CardHeader>

      <CardContent>
        {/* Badges skeleton */}
        <div className="flex gap-2 mb-3">
          <div className="h-5 bg-gray-200 rounded w-16 animate-pulse" />
          <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
        </div>

        {/* Seller info skeleton */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse" />
            <div>
              <div className="h-4 bg-gray-200 rounded w-20 mb-1 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-12 animate-pulse" />
            </div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

