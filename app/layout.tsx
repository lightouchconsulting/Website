import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lightouch™ Consulting",
  description: "GenAI-native, challenger management consultancy for CIOs and technology leaders.",
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
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          integrity="sha512-Avb2QiuDEEvB4bZJYdft2mNjVShBftLdPG8FJ0V7irTLQ8Uo0qcPxh4Plh7eecyn6CpoSND0sRMujp0JkH5A=="
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-black text-gray-200 font-sans">
        {children}
      </body>
    </html>
  );
}
