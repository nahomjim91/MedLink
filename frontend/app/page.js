import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {Button} from '@/components/ui/Button';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col">
    <main className="min-h-screen">
      {/* Hero section */}
      <section className="py-12 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Integrated Healthcare Management System
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Streamline your healthcare operations with our comprehensive telehealth and 
                medical supply management platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
              
                <Button href="/telehealth" variant="outline" size="lg">
                Explore Telehealth
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <Image 
                src="/images/hero-image.png" 
                alt="Healthcare professional using telehealth platform" 
                width={600} 
                height={500}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Comprehensive Healthcare Solutions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500">
                  <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"></path>
                  <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Virtual Consultations</h3>
              <p className="text-gray-600">Connect with healthcare professionals from anywhere through secure video consultations.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500">
                  <path d="m16 16 2 2 4-4"></path>
                  <path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Inventory Management</h3>
              <p className="text-gray-600">Efficiently track and manage medical supplies with our advanced inventory system.</p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500">
                  <path d="M3 8a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Patient Records</h3>
              <p className="text-gray-600">Keep patient information secure and accessible with our HIPAA-compliant system.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
     {/* <Footer /> */}
  </div>
  );
}