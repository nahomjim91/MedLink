'use client';
import { useState } from "react";
import Link from "next/link";
import { Button, OAuthButton } from "@/components/ui/Button";
import { EmailInput, PasswordInput, TextDivider } from "@/components/ui/Input";
import { useRouter } from "next/navigation";



// Initial signup card with Google auth option or email entry
export function SignupStartCard({ onNextStep  , fromTelehealth = true}) {
  const [isLoading, setIsLoading] = useState(false);
  const handleContinueWithEmail = () => {
    setIsLoading(true);
    // Simulate API call or validation
    setTimeout(() => {
      setIsLoading(false);
      onNextStep();
    }, 800);
  };
  const handleGoogleSignup = () => {
    // Implement your Google OAuth logic here
    console.log("Signing up with Google");
  };

  return (
    <div className="flex flex-col items-center  ">
      <div className="md:hidden w-80 h-80 flex items-center justify-center">
        <div className=" w-56 h-56  bg-gray-300 rounded-full"></div>
      </div>

      <div className="  w-full  bg-white rounded-3xl shadow-sm px-8 py-16 md:m-0 md:px-16 md:py-28 md:mt-14">
        {/* Logo or avatar placeholder */}
        <div className="flex flex-col items-center mb-6">
          <div className=" hidden w-20 h-20 bg-gray-200 rounded-full mb-6"></div>
          <h1 className=" text-2xl md:text-3xl  font-bold text-center text-secondary/80">
            Create an account
          </h1>
          <p className="text-xs md:text-sm  text-secondary/50 mt-2">
            Already have an account?{" "}
            <Link href={fromTelehealth ? "/telehealth/auth/login" : "/medical-supplies/auth/login"} className="text-secondary hover:underline">
              Log in
            </Link>
          </p>
        </div>

        {/* Google OAuth Button */}
        <OAuthButton provider="google" onClick={handleGoogleSignup} fullWidth />

        {/* Divider */}
        <TextDivider text="OR" className="my-6" />

        {/* Create Account Button */}
        <Button
          variant="fill"
          color="primary"
          onClick={handleContinueWithEmail}
          fullWidth
          className="text-base"
        >
          Continue with Email
        </Button>
      </div>
    </div>
  );
}

// Detailed signup form with password and terms
export function SignupFormCard({ fromTelehealth = true }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "user@example.com", // Pre-filled from previous step
    password: "123456789",
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      gotoRegister();
    }, 1000);
  };
const gotoRegister = () => {
  router.push( fromTelehealth ? "/telehealth/auth/registering" :"/medical-supplies/auth/registering" , { state: { email: formData.email } });
};
  const isFormValid = formData.password.length >= 8 && agreeToTerms;

  return (
    <div className="  w-full  bg-white rounded-3xl shadow-sm px-6 py-12 mt-3  md:mt-0 md:py-4 md:px-14">
      <div className="w-full flex flex-col items-center md:items-start  mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-secondary/80 mb-4 ">
          Sign up
        </h1>
        <p className=" text-xs md:text-sm text-secondary/50 mb-2 text-center">
          Sign up for free to access to in any of our products
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <EmailInput
          label="Email address"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email address"
          fullWidth
          required
        />

        <PasswordInput
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          helperText="Use 8 or more characters with a mix of letters, numbers & symbols"
          fullWidth
          required
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
              />
            </div>
            <label htmlFor="newsletter" className="ml-2  text-secondary/70">
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
          Sign up
        </Button>
      </form>

      <TextDivider text="OR" className="my-6" />

      <OAuthButton
        provider="google"
        onClick={() => {console.log("Google signup");
          gotoRegister(); // Simulate successful signup
        }}
        fullWidth
      />

      <p className="text-xs md:text-sm text-center text-secondary/50 mt-6">
        Already have an account?{" "}
        <Link href= {fromTelehealth ? "/telehealth/auth/login" :"/medical-supplies/auth/login"} className="text-secondary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

// Success screen after signup completion
export function SignupSuccessCard() {
  return (
    <div className="flex flex-col items-center text-center  ">
      <div className="md:hidden w-80 h-80 flex items-center justify-center">
        <div className=" w-56 h-56  bg-gray-300 rounded-full"></div>
      </div>
      <div className=" w-full  bg-white rounded-3xl shadow-sm px-6 py-16  md:mt-0 md:px-32 md:py-40 ">
        <div className="px-8 md:px-0">
          <h1 className="text-2xl font-bold text-secondary/80 mb-4">
            Account created successfully
          </h1>

          <p className="text-secondary/60 mb-8">
            Welcome to MedLink! You can now access all our healthcare services.
          </p>
        </div>

        <Link href="/dashboard">
          <Button variant="fill" color="primary" fullWidth>
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}


