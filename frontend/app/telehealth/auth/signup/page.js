"use client";
import { useState } from "react";
import Image from "next/image";
import {
  SignupStartCard,
  SignupFormCard,
  SignupSuccessCard,
} from "@/components/auth/sign up/SignupCards";

export default function SignupPage() {
  const [step, setStep] = useState(1);

  // Function to determine which signup card to display based on the current step
  const renderStep = () => {
    switch (step) {
      case 1:
        return <SignupStartCard onNextStep={() => setStep(2)} />;
      case 2:
        return <SignupFormCard onComplete={() => setStep(3)} />;
     // after finishing the signup and register process, show the success card
        case 3:
        return <SignupSuccessCard />;
      default:
        return <SignupStartCard onNextStep={() => setStep(2)} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row  ">
      {/* Left side - Sign-up form */}
      <div className=" w-full md:w-1/2  p-4  md:p-8">{renderStep()}</div>

      {/* Right side - Image */}
      <div className="hidden md:flex md:w-1/2 relative items-center justify-center p-8">
        <div className="relative max-w-md">
          <Image
            src="/image/trees.jpg"
            alt="Healthcare professional using MedLink platform"
            width={400}
            height={800}
            className="rounded-3xl shadow-lg"
            priority
          />
        </div>
      </div>
    </div>
  );
}

