// app/telehealth/patient/[locale]/layout.js (Server Component)
import { notFound } from 'next/navigation';
import { getMessages } from 'next-intl/server';
import PatientLocaleLayoutClient from './patientLocaleLayoutClient.js';

const locales = ['en', 'am', 'ti'];

export default async function PatientLocaleLayout({ children, params }) {
  const { locale } = await params;
  
  // Validate locale
  if (!locales.includes(locale)) {
    notFound();
  }
  
  // Get messages for this locale
  let messages = {};
  try {
    messages = await getMessages({ locale });
    // console.log("Loaded messages:", messages);
  } catch (error) {
    console.error("Error loading messages:", error);
  }
  
  return (
    <PatientLocaleLayoutClient 
      locale={locale} 
      messages={messages}
      params={params}
    >
      {children}
    </PatientLocaleLayoutClient>
  );
}