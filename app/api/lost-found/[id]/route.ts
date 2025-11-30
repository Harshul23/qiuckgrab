import { NextRequest, NextResponse } from "next/server";
import { updateLostFoundSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/lost-found/[id] - Get a single post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const post = await prisma.lostFoundPost.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            photo: true,
            verificationStatus: true,
            college: true,
            isOnline: true,
            lastSeen: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ post });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/lost-found/[id] - Update a post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check ownership
    const existingPost = await prisma.lostFoundPost.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    if (existingPost.userId !== userId) {
      return NextResponse.json(
        { error: "You can only update your own posts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = updateLostFoundSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Handle date conversion if provided
    const dataToUpdate: Record<string, unknown> = { ...updateData };
    if (updateData.date) {
      dataToUpdate.date = new Date(updateData.date);
    }

    const post = await prisma.lostFoundPost.update({
      where: { id },
      data: dataToUpdate,
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

    return NextResponse.json({
      message: "Post updated successfully",
      post,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/lost-found/[id] - Delete a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check ownership
    const existingPost = await prisma.lostFoundPost.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    if (existingPost.userId !== userId) {
      return NextResponse.json(
        { error: "You can only delete your own posts" },
        { status: 403 }
      );
    }

    await prisma.lostFoundPost.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Post deleted successfully",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
