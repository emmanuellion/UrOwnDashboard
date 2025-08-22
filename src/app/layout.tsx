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
        <head>
            <link rel="preconnect" href="https://open-meteo.com"/>
            <link rel="preconnect" href="https://api.open-meteo.com"/>
        </head>
        <body className={'antialiased'}>
            {children}
        </body>
    </html>
  );
}
