import { DM_Serif_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: ["400"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "bench-marked! — Track your sits",
  description: "A personal log of all the benches you've graced with your presence.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${dmSerif.variable} ${dmSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
