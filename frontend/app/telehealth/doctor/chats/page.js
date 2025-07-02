'use client'
import { useSearchParams } from "next/navigation";
import  MedicalChatInterface from "../../components/ui/Chat";

export default function ChatPage() {
    const searchParams = useSearchParams();
      const appointmentId = searchParams.get("appointmentId");
    return <MedicalChatInterface appointmentId={appointmentId} />;
}