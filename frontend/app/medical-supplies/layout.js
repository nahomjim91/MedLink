"use client";
import { usePathname } from "next/navigation";
import { ApolloWrapper } from "./api/apolloProvider";
import RouteProtection from "./components/auth/RouteProtection";
import Navbar from "../layout/Navbar";
import { MSAuthProvider } from "./hooks/useMSAuth";
const NavbarWrapper = ({ children }) => {
  const pathname = usePathname();

  // Define paths where navbar should be hidden
  const hideNavbarPaths = [
    "/medical-supplies/admin",
    "/medical-supplies/admin/",
    "/medical-supplies/supplier",
    "/medical-supplies/supplier/",
    "/medical-supplies/healthcare-facility",
    "/medical-supplies/healthcare-facility/",
    "/medical-supplies/importer",
    "/medical-supplies/importer/",
  ];

  // Check if the current path starts with any of the paths in hideNavbarPaths
  const shouldHideNavbar = hideNavbarPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // Also hide navbar in auth paths

  // Render navbar only if not in a protected area
  return (
    <>
      {!shouldHideNavbar && <Navbar service="medical-supply" />}
      {children}
    </>
  );
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <MSAuthProvider>
          <ApolloWrapper>
            <RouteProtection>
              <NavbarWrapper>{children}</NavbarWrapper>
            </RouteProtection>
          </ApolloWrapper>
        </MSAuthProvider>
      </body>
    </html>
  );
}
