"use client";
import { useState } from "react";
import Link from "next/link";
import { Button, OAuthButton } from "@/app/telehealth/components/ui/Button";
import { EmailInput, TextDivider } from "@/app/telehealth/components/ui/Input";

// Initial signup card with Google auth option or email entry
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
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
      // Handle successful log in
    }, 1000);
  }

  return (
    <div className="flex flex-col items-center  ">
      <div className="md:hidden w-80 h-80 flex items-center justify-center">
        <div className=" w-56 h-56  bg-gray-300 rounded-full"></div>
      </div>

      <div className="  w-full  bg-white rounded-3xl shadow-sm px-8 py-16 md:m-0 md:px-20 md:py-28 md:mt-14">
        {/* Logo or avatar placeholder */}
        <div className="flex flex-col items-center mb-6">
          <div className=" hidden w-20 h-20 bg-gray-200 rounded-full mb-6"></div>
          <h1 className=" text-2xl md:text-3xl  font-bold text-center text-secondary/80">
            Forgot Password
          </h1>
          <p className="text-xs md:text-sm  text-secondary/50 mt-2">
            Remembered your password?{" "}
            <Link
              href={ "/medical-supplies/auth/login"
              }
              className="text-secondary hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <EmailInput
            label="Email address"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}          
            placeholder="Enter your email address"
            fullWidth
            className="mb-5"
          />
          <div className="mb-4 flex ">
            <p className="w-full  text-xs md:text-sm text-left text-secondary/50  ">
              {" "}
              Don't recive link? 
              <Link
                href={ "/medical-supplies/auth/login"
                }
                className="text-secondary hover:underline"
              >
                Resend
              </Link>
            </p>
          </div>

          <Button type="submit" variant="fill" color="primary" fullWidth>
            Log in
          </Button>
        </form>
      </div>
    </div>
  );
}
