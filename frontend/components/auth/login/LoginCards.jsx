import { useState } from "react";
import Link from "next/link";
import { Button, OAuthButton } from "@/components/ui/Button";
import { EmailInput, PasswordInput, TextDivider } from "@/components/ui/Input";

// Detailed signup form with password and terms
export function LogInFormCard() {
  const [formData, setFormData] = useState({
    email: "user@example.com",
    password: "123456789",
  });
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
  };


  return (
    <div className="flex flex-col items-center  ">
      <div className="md:hidden w-42 h-42 flex items-center justify-center">
        <div className=" w-40 h-40  bg-gray-300 rounded-full"></div>
      </div>{" "}
      <div className="  w-full  bg-white rounded-3xl shadow-sm px-6 py-12 mt-3  md:mt-0 md:py-14 md:px-16">
        <div className="w-full flex flex-col items-center md:items-start  mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-secondary/80 mb-2 ">
            Log in
          </h1>
          <p className="text-xs md:text-sm text-center text-secondary/50">
            Don&apos;t have an account?{" "}
            <Link href="/login" className="text-secondary hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        <OAuthButton
          provider="google"
          onClick={() => console.log("Google signup")}
          fullWidth
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
          />

          <PasswordInput
            label="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth
            required
          />
          <div className="mb-4 flex justify-end items-end">

            <p className="w-full  text-xs md:text-sm text-right text-secondary/50 hover:text-secondary hover:underline ">
              {" "}
              Forgot Your Password ?
            </p>
          </div>

          <Button
            type="submit"
            variant="fill"
            color="primary"
            fullWidth
          >
            Log in
          </Button>
        </form>
      </div>
    </div>
  );
}
