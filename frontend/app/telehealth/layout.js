"use client";
import { ApolloWrapper } from "./api/apolloProvider";
import Navbar from "../layout/Navbar";
import { AuthProvider } from "./hooks/useAuth"; // Updated path to match your new structure
import { usePathname } from "next/navigation";
import MedLinkChatBot from "./components/ui/ChatBot";
import { useState } from "react";
// import { ToastProvider } from "./components/ui/use-toast";
// import { VideoCallProvider } from "./hooks/useVideoCall";

const NavbarWrapper = ({ children, pathname }) => {
  // Define paths where navbar should be hidden
  const hideNavbarPaths = [
    "/telehealth/admin",
    "/telehealth/admin/",
    "/telehealth/doctor",
    "/telehealth/doctor/",
    "/telehealth/patient",
    "/telehealth/patient/",
  ];

  // Check if the current path starts with any of the paths in hideNavbarPaths
  const shouldHideNavbar = hideNavbarPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // Also hide navbar in auth paths

  // Render navbar only if not in a protected area
  return (
    <>
      {!shouldHideNavbar && <Navbar service="telehealth" />}
      {children}
    </>
  );
};

export default function TelehealthLayout({ children }) {
  const pathname = usePathname();
  const [isOpener, setIsOpener] = useState(false);
  return (
    <ApolloWrapper>
      <AuthProvider>
        <NavbarWrapper pathname={pathname}>
          {children}
          {pathname.includes("/telehealth") && (
            <MedLinkChatBot
              isOpener={isOpener}
              setIsOpener={(value) => setIsOpener(value)}
              lang="english"
            />
          )}
        </NavbarWrapper>
      </AuthProvider>
    </ApolloWrapper>
  );
}
