import { NextRequest, NextResponse } from "next/server";
import { createLostFoundSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// POST /api/lost-found - Create a new lost or found post
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = createLostFoundSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { type, title, description, category, photo, photos, location, date, contactInfo } = validationResult.data;

    // Create post
    const post = await prisma.lostFoundPost.create({
      data: {
        userId,
        type,
        title,
        description: description || null,
        category,
        photo: photo || null,
        photos: photos || [],
        location: location || null,
        date: date ? new Date(date) : null,
        contactInfo: contactInfo || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            photo: true,
            verificationStatus: true,
            college: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: `${type === "LOST" ? "Lost" : "Found"} item reported successfully`,
        post,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/lost-found - Get all lost and found posts (paginated)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type") as "LOST" | "FOUND" | null;
    const category = searchParams.get("category");
    const status = searchParams.get("status") || "ACTIVE";
    const userId = searchParams.get("userId");

    const where: Record<string, unknown> = {
      status,
    };

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    if (userId) {
      where.userId = userId;
    }

    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      prisma.lostFoundPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              photo: true,
              verificationStatus: true,
              college: true,
            },
          },
        },
      }),
      prisma.lostFoundPost.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
