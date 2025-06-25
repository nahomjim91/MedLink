"use client";
import Image from "next/image";
import { MSLogInFormCard } from "../../components/auth/login/LoginCards";


export default function LoginPage() {


  return (
    <div className="flex flex-col md:flex-row  ">
      {/* Left side - Sign-up form */}
      <div className=" w-full md:w-1/2  p-4  md:p-8">
      <MSLogInFormCard/>
      </div>
      
     {/* Right side - Image */}
          <div className="hidden md:flex md:w-1/2 relative items-center justify-center py-8 pr-8 ">
            <div className="relative w-full h-full">
              <Image
                src="/image/Medicine-rafiki.svg"
                alt="Healthcare professional using MedLink platform"
                fill
                style={{ objectFit: "cover" }}
                className=""
                priority
              />
            </div>
          </div>
    </div>
  );
}