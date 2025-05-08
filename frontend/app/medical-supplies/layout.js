"use client";
import { usePathname } from "next/navigation";
import { ApolloWrapper } from "./api/apolloProvider";
import RouteProtection from "./components/auth/RouteProtection";
import Navbar from "./components/layout/Navbar";
import { MSAuthProvider } from "./hooks/useMSAuth";

const NavbarWrapper = ({ children }) => {
  const pathname = usePathname();
  
  // Define static paths where navbar should be hidden
  const staticHideNavbarPaths = [
    '/medical-supplies/admin',
    '/medical-supplies/admin/'
  ];
  
  // Define auth paths where navbar should be hidden
  const authPaths = [
    '/auth',
    '/auth/'
  ];
  
  // Check if the current path is a static path where navbar should be hidden
  const isStaticHiddenPath = staticHideNavbarPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  // Check if the current path is an auth path
  const isAuthPath = authPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  // Check if the current path is a dynamic [role] path
  // This checks if the path matches /medical-supplies/something/ pattern but excludes 'admin'
  const isDynamicRolePath = pathname.startsWith('/medical-supplies/') && 
    !pathname.startsWith('/medical-supplies/admin') &&
    pathname !== '/medical-supplies/';
  
  // Determine if navbar should be hidden
  const shouldHideNavbar = isStaticHiddenPath || isAuthPath || isDynamicRolePath;
  
  // Render navbar only if it shouldn't be hidden
  return (
    <>
      {!shouldHideNavbar && <Navbar />}
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
              <NavbarWrapper>
              {children}
              </NavbarWrapper>
            </RouteProtection>
          </ApolloWrapper>
        </MSAuthProvider>
      </body>
    </html>
  );
}