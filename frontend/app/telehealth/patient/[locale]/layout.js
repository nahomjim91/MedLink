"use client";

import { useAuth } from "../../hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SharedLayout from "../../components/layout/SharedLayout";
import { ChatProvider } from "../../context/ChatContext";
import { auth } from "../../api/firebase/config";
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { getMessages } from 'next-intl/server';

const locales = ['en', 'am', 'ti'];

export default function PatientLocaleLayout({ children, params }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [messages, setMessages] = useState(null);
  const [locale, setLocale] = useState(null);

  // Extract locale from params
  useEffect(() => {
    const extractLocale = async () => {
      const { locale: paramLocale } = await params;
      
      // Validate locale
      if (!locales.includes(paramLocale)) {
        notFound();
        return;
      }
      
      setLocale(paramLocale);
      
      // Get messages for this locale
      try {
        const localeMessages = await getMessages({ locale: paramLocale });
        setMessages(localeMessages);
      } catch (error) {
        console.error("Error loading messages:", error);
        setMessages({});
      }
    };
    
    extractLocale();
  }, [params]);

  // Check if user is a patient
  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Not authenticated
      router.push("/telehealth/auth/login");
      return;
    }

    // Verify that the user is a patient
    if (user.role !== "patient") {
      console.log(
        `User with role ${user.role} attempted to access patient route - redirecting`
      );

      // Redirect to their correct role path
      const correctRolePath = `/telehealth/${user.role}`;
      router.push(correctRolePath);
    }
  }, [user, loading, router]);

  // Get the current user token
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        user
          .getIdToken()
          .then((token) => {
            setToken(token);
          })
          .catch((error) => {
            console.error("Error getting token:", error);
            setToken(null);
          });
      } else {
        setToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Loading state
  if (loading || !locale || !messages) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If user is not patient, don't render anything while redirecting
  if (!user || user.role !== "patient") {
    return null;
  }

  return (
    <div className="min-h-screen">
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ChatProvider token={token}>
          <SharedLayout locale={locale} allowedRoles={["PATIENT", "patient"]}>
            <main className="px-2">{children}</main>
          </SharedLayout>
        </ChatProvider>
      </NextIntlClientProvider>
    </div>
  );
}