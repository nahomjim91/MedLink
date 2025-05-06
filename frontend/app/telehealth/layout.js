'use client'
import { ApolloWrapper } from "./api/apolloProvider";
import Navbar from "./components/layout/Navbar";
import { AuthProvider } from "./hooks/useAuth"; // Updated path to match your new structure
import { usePathname } from "next/navigation";
// import { ToastProvider } from "./components/ui/use-toast";
// import { VideoCallProvider } from "./hooks/useVideoCall";

const NavbarWrapper = ({ children }) => {
  const pathname = usePathname();
  
  // Define paths where navbar should be hidden
  const hideNavbarPaths = [
    '/telehealth/admin',
    '/telehealth/admin/',
    '/telehealth/doctor',
    '/telehealth/doctor/',
    '/telehealth/patient',
    '/telehealth/patient/',
  ];
  
  // Check if the current path starts with any of the paths in hideNavbarPaths
  const shouldHideNavbar = hideNavbarPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  // Also hide navbar in auth paths
  const isAuthPath = pathname.includes('/telehealth/auth/');
  
  // Render navbar only if not in a protected area
  return (
    <>
      {!shouldHideNavbar && !isAuthPath && <Navbar />}
      {children}
    </>
  );
};

export default function TelehealthLayout({ children }) {
  return (
    <ApolloWrapper>
      <AuthProvider>
        <NavbarWrapper>
          {children}
        </NavbarWrapper>
      </AuthProvider>
    </ApolloWrapper>
  );
}