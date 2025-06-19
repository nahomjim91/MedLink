// app/medical-supplies/components/auth/MSLogInFormCard.js
'use client';
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, OAuthButton} from "../../ui/Button" 
import { EmailInput, PasswordInput, TextDivider } from "../../ui/Input" 
import { useMSAuth } from "../../../../../hooks/useMSAuth";

export function MSLogInFormCard() {
  const router = useRouter();
  const { login, signInWithGoogle } = useMSAuth(); 
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null); // Clear error when input changes
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await login(formData.email, formData.password);
      router.push(`/medical-supplies/${user.role}`); // MS dashboard route
    } catch (error) {
      console.error("Login error:", error);
      setError(getAuthErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await signInWithGoogle();
      router.push("/medical-supplies/auth/registering"); // MS registration route
    } catch (error) {
      console.error("Google login error:", error);
      setError(getAuthErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get user-friendly error messages
  const getAuthErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful login attempts. Please try again later';
      default:
        return 'An error occurred during login. Please try again';
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="md:hidden w-42 h-42 flex items-center justify-center">
        <div className="w-40 h-40 bg-gray-300 rounded-full"></div>
      </div>
      <div className="w-full bg-white rounded-3xl shadow-sm px-6 py-12 mt-3 md:mt-0 md:py-14 md:px-16">
        <div className="w-full flex flex-col items-center md:items-start mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-secondary/80 mb-2">
            Log in
          </h1>
          <p className="text-xs md:text-sm text-center text-secondary/50">
            Don&apos;t have an account?{" "}
            <Link
              href="/medical-supplies/auth/signup" // Updated signup route
              className="text-secondary hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <OAuthButton
          provider="google"
          onClick={handleGoogleLogin}
          fullWidth
          disabled={isLoading}
        />
        
        <TextDivider text="OR" className="my-6" />

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
            fullWidth
            required
            disabled={isLoading}
          />
          
          <div className="mb-4 flex justify-end items-end">
            <Link href="/medical-supplies/auth/forgotpassword" > {/* Updated password reset route */}
              <p className="w-full text-xs md:text-sm text-right text-secondary/50 hover:text-secondary hover:underline">
                Forgot Your Password?
              </p>
            </Link>
          </div>

          <Button 
            type="submit" 
            variant="fill" 
            color="primary" 
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Log in"}
          </Button>
        </form>
      </div>
    </div>
  );
}