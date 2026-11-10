import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { Open_Sans } from "next/font/google";
import { AppMuiTheme } from "@/components/AppMuiTheme";
import { ThemeMode } from "@/components/ThemeMode";
import "./globals.css";

const themeBootScript = `(function(){try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}})()`;

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
});

export const metadata: Metadata = {
  title: "5 Across Judge Scoring App",
  description: "Fast judge-friendly scoring and results tracking for Awesome Inc's 5 Across pitch competition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${openSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className={`${openSans.className} flex min-h-full flex-col`}>
        {/* Puts MUI/Emotion in @layer mui so globals.css icon rules win in production */}
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeMode>
            <AppMuiTheme>{children}</AppMuiTheme>
          </ThemeMode>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
