import "./globals.css";
import { Outfit } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import MobileNav from "@/components/MobileNav";
import AudioPlayer from "@/components/AudioPlayer";
import RecommendationSidebar from "@/components/RecommendationSidebar";
import AuthInitializer from "@/components/AuthInitializer";
import CartOverlay from "@/components/CartOverlay";

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata = {
  title: "Te Rurubene – Pacific Music Ecosystem",
  description: "Discover, stream, and support Pacific Island artists.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.className} bg-[#0a0d14] text-white mesh-gradient`}>
        <AuthInitializer />
        <CartOverlay />

        {/* ── Full-height app shell ── */}
        <div className="flex h-screen overflow-hidden">

          {/* Left Sidebar — full height */}
          <Sidebar />

          {/* Center column — TopNav + Player + scrollable content */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <TopNav />
            <AudioPlayer />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>

          {/* Right Sidebar — full height, starts from top aligned with player */}
          <RecommendationSidebar />

        </div>

        {/* Mobile bottom nav */}
        <MobileNav />

      </body>
    </html>
  );
}
