"use client";
import { Button } from "../Button";
import Image from "next/image";

export default function SuccessUpload({ onComplete }) {
  return (
    <div className="px-6">
      <div className="flex flex-col items-center justify-center py-10">
        <Image
          src={`/Image/certificate-success-filled.svg`} // Assuming you have a 'No data-cuate.svg' for rejected
          alt={`success`}
          width={300}
          height={200}
          className="mx-auto"
        />
        <p className="text-xl text-secondary">
          Your product has been successfully uploaded.
        </p>
      </div>

      <div className="space-y-4">
        <Button onClick={onComplete} variant="fill" color="primary" fullWidth>
          Go to Inventory
        </Button>
      </div>
    </div>
  );
}
