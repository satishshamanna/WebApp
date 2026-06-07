import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Niyati & Sanjana AI Consultants LLP | Analytics Dashboard",
  description: "Beautiful, modern analytics dashboard for lead tracking and conversion metrics.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body>
        {children}
      </body>
    </html>
  );
}

