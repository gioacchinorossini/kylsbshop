import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import Topbar from "@/components/Topbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sizzling Grill POS",
  description: "Premium Point of Sale System for Sizzling Grill",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Roboto:wght@400;500;700&family=Poppins:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body>
        <AuthProvider>
          <Topbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
