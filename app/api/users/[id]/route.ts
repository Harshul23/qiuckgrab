import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        photo: true,
        college: true,
        verificationStatus: true,
        trustScore: true,
        badges: true,
        avgRating: true,
        completedDeals: true,
        cancellationRate: true,
        createdAt: true,
        // Include ratings received
        ratingsReceived: {
          select: {
            id: true,
            stars: true,
            comment: true,
            createdAt: true,
            fromUser: {
              select: {
                id: true,
                name: true,
                photo: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        // Include items listed by user
        items: {
          where: {
            availabilityStatus: "AVAILABLE",
          },
          select: {
            id: true,
            name: true,
            price: true,
            photo: true,
            condition: true,
            availabilityStatus: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user,
      ratings: user.ratingsReceived,
      items: user.items,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
