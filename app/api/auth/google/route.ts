import { NextRequest, NextResponse } from "next/server";
import { googleAuthSchema, isStudentEmail } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { createToken } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

interface GoogleTokenPayload {
  sub: string; // Google user ID
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

/**
 * Verify Google ID token by calling Google's tokeninfo endpoint
 */
async function verifyGoogleToken(
  credential: string
): Promise<GoogleTokenPayload | null> {
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );

    if (!response.ok) {
      console.error(
        `[Google Auth] Token verification failed with status: ${response.status}`
      );
      return null;
    }

    const payload = await response.json();

    // Verify the token is for our app
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId && payload.aud !== clientId) {
      console.error(
        `[Google Auth] Token audience mismatch: expected ${clientId}, got ${payload.aud}`
      );
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified === "true",
      name: payload.name,
      picture: payload.picture,
    };
  } catch (error) {
    console.error("[Google Auth] Token verification error:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = googleAuthSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { credential } = validationResult.data;

    // Verify Google token
    const payload = await verifyGoogleToken(credential);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid Google credential" },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!payload.email_verified) {
      return NextResponse.json(
        { error: "Google email is not verified" },
        { status: 403 }
      );
    }

    // Validate student email (must be .edu or .org)
    if (!isStudentEmail(payload.email)) {
      return NextResponse.json(
        {
          error:
            "Only student emails (.edu) or organization emails (.org) are allowed",
        },
        { status: 403 }
      );
    }

    // Check if user exists by email first (always works)
    // We'll check googleId separately using raw query to avoid TypeScript issues
    let user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    // If no user found by email, try to find by googleId using raw query
    // This approach works even if googleId column doesn't exist yet
    if (!user) {
      try {
        const users = await prisma.$queryRaw<Array<{ id: string; email: string; name: string; college: string | null; photo: string | null; verificationStatus: string; trustScore: number; badges: string[]; avgRating: number; googleId: string | null }>>`
          SELECT id, email, name, college, photo, "verificationStatus", "trustScore", badges, "avgRating", "googleId"
          FROM "User" 
          WHERE "googleId" = ${payload.sub}
          LIMIT 1
        `;
        if (users.length > 0) {
          user = await prisma.user.findUnique({
            where: { id: users[0].id },
          });
        }
      } catch (rawQueryError) {
        // googleId column might not exist, that's fine - we'll create a new user
        console.log("[Google Auth] googleId column may not exist yet:", rawQueryError);
      }
    }

    let isNewUser = false;

    // Check if user has googleId linked already (using type assertion since googleId might not be in type yet)
    const userWithGoogle = user as (typeof user & { googleId?: string | null }) | null;
    const hasGoogleLinked = userWithGoogle?.googleId === payload.sub;

    if (!user) {
      // Create new user with Google auth
      isNewUser = true;
      try {
        // Try to create with googleId first
        await prisma.$executeRaw`
          INSERT INTO "User" (id, name, email, password, "googleId", photo, "emailVerified", "verificationStatus", "trustScore", badges, "avgRating", "completedDeals", "cancellationRate", "lastSeen", "isOnline", "createdAt", "updatedAt")
          VALUES (${uuidv4()}, ${payload.name}, ${payload.email}, '', ${payload.sub}, ${payload.picture || null}, true, 'UNVERIFIED', 0, '{}', 0, 0, 0, NOW(), false, NOW(), NOW())
        `;
        user = await prisma.user.findUnique({
          where: { email: payload.email },
        });
      } catch (createError: unknown) {
        console.error("[Google Auth] Error creating user with googleId:", createError);
        // If googleId column doesn't exist, create without it
        user = await prisma.user.create({
          data: {
            name: payload.name,
            email: payload.email,
            password: "", // No password for Google auth users
            photo: payload.picture || null,
            emailVerified: true,
            verificationStatus: "UNVERIFIED",
          },
        });
      }
    } else if (!hasGoogleLinked) {
      // Link Google account to existing user
      // Save user id before try block since user might be reassigned
      const existingUserId = user.id;
      const existingPhoto = user.photo;
      try {
        await prisma.$executeRaw`
          UPDATE "User" SET "googleId" = ${payload.sub}, "emailVerified" = true, photo = COALESCE(photo, ${payload.picture || null}), "updatedAt" = NOW()
          WHERE id = ${existingUserId}
        `;
        user = await prisma.user.findUnique({
          where: { id: existingUserId },
        });
      } catch (updateError: unknown) {
        console.error("[Google Auth] Error linking Google account:", updateError);
        // If googleId field doesn't exist, just update email verification
        user = await prisma.user.update({
          where: { id: existingUserId },
          data: {
            photo: existingPhoto || payload.picture || null,
            emailVerified: true,
          },
        });
      }
    }

    // Ensure user is not null
    if (!user) {
      console.error("[Google Auth] Failed to create or find user");
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      );
    }

    // Generate JWT token
    const token = createToken(user.id);

    // Create session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Update last seen
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date(), isOnline: true },
    });

    return NextResponse.json({
      message: isNewUser
        ? "Account created successfully with Google"
        : "Login successful with Google",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        college: user.college,
        photo: user.photo,
        verificationStatus: user.verificationStatus,
        trustScore: user.trustScore,
        badges: user.badges,
        avgRating: user.avgRating,
      },
      isNewUser,
    });
  } catch (error) {
    console.error("[Google Auth] Internal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
