import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Business Command Center",
  description: "Business Command Center Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
