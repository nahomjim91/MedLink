"use client";
import { useRouter } from "next/navigation";

import MultiStepSignup from "../../components/auth/registering/MultiStepSignup";

export default function RegisterPage() {
  const router = useRouter();
  const email = router?.state?.email; // Access the passed state
  return (
  <div className="flex items-center justify-center w-full py-2 px-3 md:py-0 md:px-0">

    <MultiStepSignup email={email} />
  </div>
  );
}
