"use client";
import { useState } from "react";
import Image from "next/image";
import {
  MSSignupStartCard,
  MSSignupFormCard,
} from "../../components/auth/signup/SignupCards";

export default function SignupPage() {
  const [step, setStep] = useState(1);

  // Function to determine which signup card to display based on the current step
  const renderStep = () => {
    switch (step) {
      case 1:
        return <MSSignupStartCard onNextStep={() => setStep(2)} />;
      case 2:
        return <MSSignupFormCard />;
      default:
        return <MSSignupStartCard onNextStep={() => setStep(2)} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row  ">
      {/* Left side - Sign-up form */}
      <div className="hidden md:flex md:w-1/2 relative items-center justify-center py-8 px-8 ">
        <div className="relative w-full h-full">
          <Image
            src="/image/Medicine-amico.svg"
            alt="Healthcare professional using MedLink platform"
            fill
            style={{ objectFit: "cover" }}
            className=""
            priority
          />
        </div>
      </div>
      {/* Right side - Image */}
      <div className=" w-full md:w-1/2  p-4  md:p-8">{renderStep()}</div>
    </div>
  );
}
