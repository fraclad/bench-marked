import { Inter, Fredoka } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "bench-marked! - Track where ur ass have sat on",
  description: "A fun app to track and remember all the benches you've sat on during your adventures!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${fredoka.variable} antialiased font-fredoka`}
      >
        {children}
      </body>
    </html>
  );
}
