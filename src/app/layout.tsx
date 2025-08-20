import type { Metadata } from "next";
import "./globals.css";
import {ReactNode} from "react";

export const metadata: Metadata = {
  title: "Ur Own Dashboard",
  description: "Try this mini app to create your own mini dashboard, still in development ...",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={'antialiased'}>
        {children}
      </body>
    </html>
  );
}
