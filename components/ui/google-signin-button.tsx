"use client";

import { useEffect, useCallback, useId } from "react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          prompt: () => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              type?: "standard" | "icon";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              width?: number;
            }
          ) => void;
        };
      };
    };
    // Track number of GoogleSignInButton instances for cleanup
    __googleSignInButtonCount?: number;
  }
}

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  onError?: (error: string) => void;
  text?: "signin" | "signup";
  disabled?: boolean;
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  text = "signin",
  disabled = false,
}: GoogleSignInButtonProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  // Generate unique ID for this button instance
  const uniqueId = useId();
  const buttonContainerId = `google-signin-button-${uniqueId.replace(/:/g, "-")}`;

  const handleCredentialResponse = useCallback(
    (response: { credential: string }) => {
      if (response.credential) {
        onSuccess(response.credential);
      } else {
        onError?.("No credential received from Google");
      }
    },
    [onSuccess, onError]
  );

  useEffect(() => {
    if (!clientId) {
      return;
    }

    // Track button instances for cleanup
    window.__googleSignInButtonCount = (window.__googleSignInButtonCount || 0) + 1;

    // Check if script already exists
    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    const initializeButton = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });

        const buttonContainer = document.getElementById(buttonContainerId);
        if (buttonContainer) {
          window.google.accounts.id.renderButton(buttonContainer, {
            theme: "outline",
            size: "large",
            text: text === "signup" ? "signup_with" : "signin_with",
            width: 350,
          });
        }
      }
    };

    if (existingScript) {
      // Script already loaded, just initialize
      if (window.google) {
        initializeButton();
      } else {
        // Script is loading, wait for it
        existingScript.addEventListener("load", initializeButton);
      }
    } else {
      // Load Google Sign-In script
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeButton;
      document.head.appendChild(script);
    }

    return () => {
      // Decrement counter and only cleanup if no more instances
      window.__googleSignInButtonCount = (window.__googleSignInButtonCount || 1) - 1;
      
      if (window.__googleSignInButtonCount === 0) {
        const scriptToRemove = document.querySelector(
          'script[src="https://accounts.google.com/gsi/client"]'
        );
        if (scriptToRemove) {
          scriptToRemove.remove();
        }
      }
    };
  }, [clientId, handleCredentialResponse, text, buttonContainerId]);

  // If no client ID, don't show the button
  if (!clientId) {
    return null;
  }

  if (disabled) {
    return (
      <Button variant="outline" className="w-full" disabled>
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Loading...
      </Button>
    );
  }

  return (
    <div
      id={buttonContainerId}
      className="w-full flex justify-center"
    />
  );
}
