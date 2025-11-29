import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Badge, Avatar, AvatarFallback } from "@/components/ui";
import { Star, Clock } from "lucide-react";

interface Item {
  id: string;
  name: string;
  price: number;
  photo: string | null;
  condition: string;
  aiPriceRating: string | null;
  category: string;
  createdAt: string;
  seller: {
    id: string;
    name: string;
    photo: string | null;
    verificationStatus: string;
    trustScore: number;
    avgRating: number;
    badges: string[];
    isOnline: boolean;
  };
}

interface ItemCardProps {
  item: Item;
  getPriceRatingColor: (rating: string) => string;
}

const ItemCard = React.memo<ItemCardProps>(({ item, getPriceRatingColor }) => {
  return (
    <Link href={`/item/${item.id}`}>
      <Card className="hover:shadow-lg transition-shadow h-full">
        {/* Item Image */}
        <div className="aspect-square bg-gray-100 relative overflow-hidden rounded-t-lg">
          {item.photo ? (
            <img
              src={item.photo}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
          {/* Price Rating Badge */}
          {item.aiPriceRating && (
            <Badge
              variant={getPriceRatingColor(item.aiPriceRating) as "success" | "secondary" | "destructive"}
              className="absolute top-2 right-2"
            >
              {item.aiPriceRating}
            </Badge>
          )}
        </div>

        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg line-clamp-2">{item.name}</CardTitle>
            <span className="text-xl font-bold text-blue-600">
              ₹{item.price.toFixed(2)}
            </span>
          </div>
        </CardHeader>

        <CardContent>
          {/* Condition & Category */}
          <div className="flex gap-2 mb-3">
            <Badge variant="outline">{item.condition}</Badge>
            <Badge variant="outline">{item.category}</Badge>
          </div>

          {/* Seller Info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {item.seller.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center">
                  <span className="font-medium">{item.seller.name}</span>
                  {item.seller.verificationStatus === "VERIFIED" && (
                    <span className="ml-1 text-blue-600">✓</span>
                  )}
                </div>
                <div className="flex items-center text-gray-500 text-xs">
                  <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                  {item.seller.avgRating.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Online Status */}
            <div className="flex items-center">
              {item.seller.isOnline ? (
                <span className="flex items-center text-green-600 text-xs">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Online
                </span>
              ) : (
                <span className="flex items-center text-gray-400 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Offline
                </span>
              )}
            </div>
          </div>

          {/* Location */}
          {item.seller.badges.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.seller.badges.slice(0, 2).map((badge, i) => (
                <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {badge}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
});

ItemCard.displayName = "ItemCard";

export { ItemCard };
export type { Item };

