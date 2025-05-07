"use client";
import { ApolloWrapper } from "./api/apolloProvider";
import Navbar from "./components/layout/Navbar";
import { MSAuthProvider } from "./hooks/useMSAuth";
// import { ToastProvider } from "./components/ui/use-toast";
// import { VideoCallProvider } from "./hooks/useVideoCall";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <MSAuthProvider>
          <ApolloWrapper>
            <Navbar />
            {children}
          </ApolloWrapper>
        </MSAuthProvider>
      </body>
    </html>
  );
}
