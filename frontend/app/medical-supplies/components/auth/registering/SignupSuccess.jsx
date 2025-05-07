import Link from "next/link";
import { Button } from "../../ui/Button";
import { Check } from "lucide-react";

export default function SignupSuccess({ userData }) {
  return (
    <div className="px-6 ">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="w-10 h-10 text-primary" />
      </div>
      
      <h2 className="text-2xl font-bold text-secondary/80 mb-4">
        Registration Complete!
      </h2>
      
      <p className="text-secondary/60 mb-8">
        Welcome to MedLink! Your account has been successfully created.
        {userData.role === "doctor" && " Your credentials will be reviewed by our team."}
      </p>
      
      <div className="mb-8 bg-gray-50 rounded-lg p-4 text-left">
        <h3 className="font-medium text-secondary/80 mb-2">Account Summary</h3>
        <ul className="space-y-2 text-sm text-secondary/70">
          <li><span className="font-medium">Role:</span> {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}</li>
          <li><span className="font-medium">Name:</span> {userData.firstName} {userData.lastName}</li>
          <li><span className="font-medium">Email:</span> {userData.email}</li>
          {userData.role === "doctor" && (
            <li><span className="font-medium">Specialization:</span> {userData.specialization}</li>
          )}
        </ul>
      </div>

      <div className="space-y-4">
        <Link href="/dashboard">
          <Button variant="fill" color="primary" fullWidth>
            Go to Dashboard
          </Button>
        </Link>
        
      
      </div>
    </div>
  );
}