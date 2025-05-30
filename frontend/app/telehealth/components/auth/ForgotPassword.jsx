"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "../../ui/Button";
import { EmailInput } from "../../ui/Input";
import { useMSAuth } from "../../../hooks/useMSAuth";

export default function MSForgotPassword() {
  const { sendPasswordReset } = useMSAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await sendPasswordReset(email);
      setSuccess(true);
      setCanResend(false);
      
      // Start 60-second countdown for resend
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error("Password reset error:", error);
      setError(getPasswordResetErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    setError(null);

    try {
      await sendPasswordReset(email);
      setCanResend(false);
      
      // Start countdown again
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error("Password reset resend error:", error);
      setError(getPasswordResetErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordResetErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/user-not-found':
        return 'No account found with this email address';
      case 'auth/too-many-requests':
        return 'Too many requests. Please try again later';
      default:
        return 'An error occurred. Please try again';
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center">
        <div className="md:hidden w-80 h-80 flex items-center justify-center">
          <div className="w-56 h-56 bg-gray-300 rounded-full"></div>
        </div>

        <div className="w-full bg-white rounded-3xl shadow-sm px-8 py-16 md:m-0 md:px-20 md:py-28 md:mt-14">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-center text-secondary/80">
              Check Your Email
            </h1>
            <p className="text-xs md:text-sm text-secondary/50 mt-2 text-center">
              We've sent a password reset link to<br />
              <span className="font-medium">{email}</span>
            </p>
          </div>

          <div className="mb-6 flex justify-center">
            <p className="text-xs md:text-sm text-secondary/50">
              Didn't receive the email?{" "}
              {canResend ? (
                <button
                  onClick={handleResend}
                  disabled={isLoading}
                  className="text-secondary hover:underline disabled:opacity-50"
                >
                  {isLoading ? "Sending..." : "Resend"}
                </button>
              ) : (
                <span className="text-secondary/30">
                  Resend in {countdown}s
                </span>
              )}
            </p>
          </div>

          <Link href="/medical-supplies/auth/login">
            <Button variant="outline" color="primary" fullWidth>
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="md:hidden w-80 h-80 flex items-center justify-center">
        <div className="w-56 h-56 bg-gray-300 rounded-full"></div>
      </div>

      <div className="w-full bg-white rounded-3xl shadow-sm px-8 py-16 md:m-0 md:px-20 md:py-28 md:mt-14">
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-center text-secondary/80">
            Forgot Password
          </h1>
          <p className="text-xs md:text-sm text-secondary/50 mt-2">
            Remembered your password?{" "}
            <Link
              href="/medical-supplies/auth/login"
              className="text-secondary hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <EmailInput
            label="Email address"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            fullWidth
            className="mb-5"
            required
            disabled={isLoading}
          />

          <Button 
            type="submit" 
            variant="fill" 
            color="primary" 
            fullWidth
            disabled={isLoading || !email.trim()}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      </div>
    </div>
  );
}