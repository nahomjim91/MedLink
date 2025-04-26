import { Button } from "@/components/ui/Button";

export default function RoleSelection({ selectedRole, onRoleSelect, onNext }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm px-6 py-8">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-secondary/80 mb-2">
          Choose your role
        </h2>
        <p className="text-sm text-secondary/60">
          Select how you'll be using MedLink
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div 
          className={`border-2 rounded-xl p-4 flex flex-col items-center cursor-pointer transition-all ${
            selectedRole === 'patient' 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onRoleSelect('patient')}
        >
          <div className="w-16 h-16 flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-primary/80" 
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 5v14m-7-7h14" />
            </svg>
          </div>
          <span className="mt-2 font-medium">Patient</span>
        </div>

        <div 
          className={`border-2 rounded-xl p-4 flex flex-col items-center cursor-pointer transition-all ${
            selectedRole === 'doctor' 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onRoleSelect('doctor')}
        >
          <div className="w-16 h-16 flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-primary/80" 
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 5v14m-7-7h14" />
            </svg>
          </div>
          <span className="mt-2 font-medium">Doctor</span>
        </div>
      </div>

      <div className="text-center mt-4 mb-6">
        <div className="inline-flex items-center">
          <span className="bg-gray-300 h-px w-12"></span>
          <span className="mx-4 text-xs text-gray-500">OR</span>
          <span className="bg-gray-300 h-px w-12"></span>
        </div>
      </div>

      <div
        className={`border-2 rounded-xl p-4 flex items-center cursor-pointer transition-all mb-8 ${
          selectedRole === 'admin' 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => onRoleSelect('admin')}
      >
        <div className="w-12 h-12 flex items-center justify-center mr-4">
          <svg 
            className="w-8 h-8 text-primary/80" 
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 5v14m-7-7h14" />
          </svg>
        </div>
        <span className="font-medium">Admin</span>
      </div>

      <Button
        variant="fill"
        color="primary"
        fullWidth
        onClick={onNext}
        disabled={!selectedRole}
      >
        Next Step
      </Button>
    </div>
  );
}