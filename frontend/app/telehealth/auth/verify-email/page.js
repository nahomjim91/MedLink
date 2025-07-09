'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { Mail, Clock, CheckCircle, RefreshCw } from "lucide-react";

export default function THEmailVerificationPage() {
  const router = useRouter();
  const { user, sendVerificationEmail, checkEmailVerification } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [autoCheckInterval, setAutoCheckInterval] = useState(null);

  // Auto-check email verification every 3 seconds
  useEffect(() => {
    if (user && !user.emailVerified) {
      const interval = setInterval(async () => {
        try {
          const isVerified = await checkEmailVerification();
          if (isVerified) {
            setMessage("Email verified successfully! Redirecting...");
            clearInterval(interval);
            setTimeout(() => {
              router.push("/telehealth/auth/registering");
            }, 2000);
          }
        } catch (error) {
          console.error("Auto-check verification error:", error);
        }
      }, 3000);

      setAutoCheckInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [user, checkEmailVerification, router]);

  // Countdown timer for resend button
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    
    setIsLoading(true);
    setError("");
    setMessage("");
    
    try {
      await sendVerificationEmail();
      setMessage("Verification email sent! Please check your inbox.");
      setResendCooldown(60); // 60 second cooldown
    } catch (error) {
      console.error("Resend email error:", error);
      setError("Failed to send verification email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualCheck = async () => {
    setIsCheckingVerification(true);
    setError("");
    setMessage("");
    
    try {
      const isVerified = await checkEmailVerification();
      if (isVerified) {
        setMessage("Email verified successfully! Redirecting...");
        if (autoCheckInterval) {
          clearInterval(autoCheckInterval);
        }
        setTimeout(() => {
          user.profileCompleted == false
            ? router.push("/telehealth/auth/registering")
            : router.push(`/telehealth/${user.role}/`);
        }, 2000);
      } else {
        setMessage("Email not yet verified. Please check your inbox and click the verification link.");
      }
    } catch (error) {
      console.error("Manual verification check error:", error);
      setError("Failed to check verification status. Please try again.");
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const handleBackToSignup = () => {
    if (autoCheckInterval) {
      clearInterval(autoCheckInterval);
    }
    router.push("/telehealth/auth/signup");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className=" bg-gray-50 flex items-center justify-center py-5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-4">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 bg-primary/25 rounded-full flex items-center justify-center mb-3">
            <Mail className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-secondary mb-2">
            Verify your email
          </h2>
          <p className="text-gray-600 mb-6">
            We&apos;ve sent a verification link to
          </p>
          <p className="text-lg font-semibold text-secondary mb-4">
            {user.email}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
          {/* Status Messages */}
          {message && (
            <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <p className="text-green-800 text-sm">{message}</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Auto-checking indicator */}
          <div className="flex items-center justify-center p-4 bg-primary/10 border border-primary/50 rounded-md">
            <RefreshCw className="h-4 w-4 text-primary mr-2 animate-spin" />
            <p className="text-primary text-sm">
              Automatically checking for verification...
            </p>
          </div>

          {/* Instructions */}
          <div className="text-center text-gray-600 text-sm space-y-2">
            <p>Click the verification link in your email to continue.</p>
            <p>Don&apos;t see the email? Check your spam folder.</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleManualCheck}
              variant="fill"
              color="primary"
              fullWidth
              disabled={isCheckingVerification}
              className="flex items-center justify-center"
            >
              {isCheckingVerification ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                "I've verified my email"
              )}
            </Button>

            <Button
              onClick={handleResendEmail}
              variant="outline"
              color="primary"
              fullWidth
              disabled={isLoading || resendCooldown > 0}
              className="flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Resend in {resendCooldown}s
                </>
              ) : (
                "Resend verification email"
              )}
            </Button>

            <div className="pt-4 border-t border-gray-200">
              <Button
                onClick={handleBackToSignup}
                variant="ghost"
                color="secondary"
                fullWidth
              >
                Back to signup
              </Button>
            </div>
          </div>

          {/* Help text */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Having trouble? Contact our support team for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}