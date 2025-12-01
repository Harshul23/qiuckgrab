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

    // Check if user exists by Google ID or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: payload.sub }, { email: payload.email }],
      },
    });

    let isNewUser = false;

    if (!user) {
      // Create new user with Google auth
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          name: payload.name,
          email: payload.email,
          password: "", // No password for Google auth users
          googleId: payload.sub,
          photo: payload.picture || null,
          emailVerified: true, // Google email is already verified
          verificationStatus: "UNVERIFIED",
        },
      });
    } else if (!user.googleId) {
      // Link Google account to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: payload.sub,
          photo: user.photo || payload.picture || null,
          emailVerified: true,
        },
      });
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
