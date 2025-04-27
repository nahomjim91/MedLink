"use client";
import React from "react";
import { StepButtons } from "@/components/ui/Button";
import IconCard from "@/components/ui/Card";
import { TextDivider } from "@/components/ui/Input";
import { FaUserMd, FaUserInjured, FaUserCog } from "react-icons/fa";

export default function RoleSelection({ selectedRole, onRoleSelect, onNext }) {
  return (
    <div className="px-6">
      <div className="text-center mb-10 md:mb-3">
        <h2 className="text-xl font-semibold text-secondary/80 mb-2">
          Choose your role
        </h2>
        <p className="text-sm text-secondary/60">
          Select how you'll be using MedLink
        </p>
      </div>

      <div className="grid grid-cols-2 gap- ">
        <IconCard
          icon={<FaUserInjured size={52} />}
          label="Patient"
          onClick={() => onRoleSelect("patient")}
          isSelected={selectedRole === "patient"}
        />
        <IconCard
          icon={<FaUserMd size={52} />}
          label="Doctor"
          onClick={() => onRoleSelect("doctor")}
          isSelected={selectedRole === "doctor"}
        />
      </div>

      <TextDivider className="text-secondary/50" text="OR" />

      <div className="flex justify-center ">
        <IconCard
          icon={<FaUserCog size={52} />}
          label="Admin"
          onClick={() => onRoleSelect("admin")}
          isSelected={selectedRole === "admin"}
        />
      </div>

      <StepButtons showPrevious={false} onNext={onNext} />
    </div>
  );
}