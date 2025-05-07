'use client';
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, OAuthButton } from "../../ui/Button";
import { EmailInput, PasswordInput, TextDivider } from "../../ui/Input";
import { useAuth } from "../../../hooks/useAuth";

// Initial signup card with Google auth option or email entry
export function SignupStartCard({ onNextStep, }) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleContinueWithEmail = () => {
    setIsLoading(true);
    // Simulate API call or validation
    setTimeout(() => {
      setIsLoading(false);
      onNextStep();
    }, 800);
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="md:hidden w-80 h-80 flex items-center justify-center">
        <div className="w-56 h-56 bg-gray-300 rounded-full"></div>
      </div>

      <div className="w-full bg-white rounded-3xl shadow-sm px-8 py-16 md:m-0 md:px-16 md:py-28 md:mt-14">
        {/* Logo or avatar placeholder */}
        <div className="flex flex-col items-center mb-6">
          <div className="hidden w-20 h-20 bg-gray-200 rounded-full mb-6"></div>
          <h1 className="text-2xl md:text-3xl font-bold text-center text-secondary/80">
            Create an account
          </h1>
          <p className="text-xs md:text-sm text-secondary/50 mt-2">
            Already have an account?{" "}
            <Link href="/telehealth/auth/login" className="text-secondary hover:underline">
              Log in
            </Link>
          </p>
        </div>

        {/* Google OAuth Button */}
        <OAuthButton 
          provider="google" 
          onClick={onNextStep} 
          fullWidth 
          disabled={isLoading}
        />

        {/* Divider */}
        <TextDivider text="OR" className="my-6" />

        {/* Create Account Button */}
        <Button
          variant="fill"
          color="primary"
          onClick={handleContinueWithEmail}
          fullWidth
          className="text-base"
          disabled={isLoading}
        >
          {isLoading ? "Please wait..." : "Continue with Email"}
        </Button>
      </div>
    </div>
  );
}

// Detailed signup form with password and terms
export function SignupFormCard({ }) {
  const router = useRouter();
  const { signup, signInWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null); // Clear error when input changes
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await signup(formData.email, formData.password, {
        email: formData.email,
        subscribeNewsletter,
        role: "" // Will be set during registration process
      });
      gotoRegister();
    } catch (error) {
      console.error("Signup error:", error);
      setError(getAuthErrorMessage(error.code));
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await signInWithGoogle();
      gotoRegister();
    } catch (error) {
      console.error("Google signup error:", error);
      setError(getAuthErrorMessage(error.code));
      setIsLoading(false);
    }
  };

  const gotoRegister = () => {
    router.push( "/telehealth/auth/registering" , 
      { state: { email: formData.email } }
    );
  };

  // Function to get user-friendly error messages
  const getAuthErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account already exists with this email address';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 8 characters';
      default:
        return 'An error occurred during signup. Please try again';
    }
  };

  const isFormValid = formData.password.length >= 8 && agreeToTerms && formData.email;

  return (
    <div className="w-full bg-white rounded-3xl shadow-sm px-6 py-12 mt-3 md:mt-0 md:py-4 md:px-14">
      <div className="w-full flex flex-col items-center md:items-start mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-secondary/80 mb-4">
          Sign up
        </h1>
        <p className="text-xs md:text-sm text-secondary/50 mb-2 text-center">
          Sign up for free to access to in any of our products
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
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email address"
          fullWidth
          required
          disabled={isLoading}
        />

        <PasswordInput
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          helperText="Use 8 or more characters with a mix of letters, numbers & symbols"
          fullWidth
          required
          disabled={isLoading}
        />

        <div className="mt-6 mb-4">
          <div className="flex items-start mb-4">
            <div className="flex items-center h-5">
              <input
                id="terms"
                type="checkbox"
                checked={agreeToTerms}
                onChange={() => setAgreeToTerms(!agreeToTerms)}
                className="w-4 h-4 text-primary"
                required
                disabled={isLoading}
              />
            </div>
            <label
              htmlFor="terms"
              className="ml-2 text-xs md:text-sm text-secondary/70"
            >
              Agree to our{" "}
              <Link href="/terms" className="text-primary underline">
                Terms of use
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary underline">
                Privacy Policy
              </Link>
            </label>
          </div>

          <div className="flex items-start text-xs md:text-sm">
            <div className="flex items-center h-5">
              <input
                id="newsletter"
                type="checkbox"
                checked={subscribeNewsletter}
                onChange={() => setSubscribeNewsletter(!subscribeNewsletter)}
                className="w-4 h-4 text-primary"
                disabled={isLoading}
              />
            </div>
            <label htmlFor="newsletter" className="ml-2 text-secondary/70">
              Subscribe to our monthly newsletter
            </label>
          </div>
        </div>

        <Button
          type="submit"
          variant="fill"
          color="primary"
          fullWidth
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? "Creating account..." : "Sign up"}
        </Button>
      </form>

      <TextDivider text="OR" className="my-6" />

      <OAuthButton
        provider="google"
        onClick={handleGoogleSignup}
        fullWidth
        disabled={isLoading}
      />

      <p className="text-xs md:text-sm text-center text-secondary/50 mt-6">
        Already have an account?{" "}
        <Link href= "/telehealth/auth/login" className="text-secondary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
