"use client";
import { useState } from "react";
import Image from "next/image";
import {
  SignupStartCard,
  SignupFormCard,
  
} from "@/components/auth/signup/SignupCards";

export default function SignupPage() {
  const [step, setStep] = useState(1);

  // Function to determine which signup card to display based on the current step
  const renderStep = () => {
    switch (step) {
      case 1:
        return <SignupStartCard fromTelehealth={false} onNextStep={() => setStep(2)} />;
      case 2:
        return <SignupFormCard  fromTelehealth={false} />;
          default:
        return <SignupStartCard onNextStep={() => setStep(2)} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row  ">
      {/* Left side - Sign-up form */}
      <div className=" w-full md:w-1/2  p-4  md:p-8">{renderStep()}</div>

      {/* Right side - Image */}
           <div className="hidden md:flex md:w-1/2 relative items-center justify-center py-8 pr-8 ">
             <div className="relative w-full h-full">
               <Image
                 src="/image/trees.jpg"
                 alt="Healthcare professional using MedLink platform"
                 fill
                 style={{ objectFit: "cover" }}
                 className="rounded-3xl shadow-lg"
                 priority
               />
             </div>
           </div>
    </div>
  );
}

