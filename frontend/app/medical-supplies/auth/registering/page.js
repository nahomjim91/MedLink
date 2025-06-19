"use client";
import { useRouter } from "next/navigation";

import MultiStepSignup from "../../components/auth/registering/MultiStepSignup";
import { useMSAuth } from "../../../../hooks/useMSAuth";

export default function RegisterPage() {
  const {user} = useMSAuth();
  const router = useRouter();
  if (!user) {
    router.push("/medical-supplies/auth/signup");
  }
  const email = router?.state?.email; // Access the passed state
  return (
  <div className="flex items-center justify-center w-full py-2 px-3 md:py-0 md:px-0">

    <MultiStepSignup email={email} />
  </div>
  );
}
