import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Business Command Center",
  description: "Business Command Center Dashboard",
};

import { AuthProvider } from "@/hooks/use-auth";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
