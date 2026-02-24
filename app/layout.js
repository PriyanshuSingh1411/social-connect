import "./globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import Providers from "../components/Providers";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

export const metadata = {
  title: "SocialConnect - Connect with Friends",
  description:
    "A modern social media platform for connecting with friends and sharing moments",
  keywords: ["social media", "connect", "friends", "posts", "networking"],
  authors: [{ name: "SocialConnect" }],
  openGraph: {
    title: "SocialConnect - Connect with Friends",
    description: "A modern social media platform for connecting with friends",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={plusJakarta.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
