'use client'
import { ApolloWrapper } from "./api/apolloProvider";
import Navbar from "./components/layout/Navbar";
import { AuthProvider } from "./hooks/useAuth";
// import { ToastProvider } from "./components/ui/use-toast";
// import { VideoCallProvider } from "./hooks/useVideoCall";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
            <Navbar />
            {children}
      </body>
    </html>
  );
}
