"use client";
import { Button } from "@/components/ui/button";
import { useFormStatus } from "react-dom";

export const FormButton = () => {
  const { pending } = useFormStatus();
  return (
    <div className="flex justify-end items-center mb-6">
      <Button loading={pending} disabled={pending} type="submit">
        Add
      </Button>
    </div>
  );
};
