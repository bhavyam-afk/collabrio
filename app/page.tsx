import Features from "@/components/landing/Features";
import Footer from "@/components/landing/Footer";
import Hero from "@/components/landing/Hero";
import Navbar from "@/components/landing/Navbar";

export default function Home() {
  return (
    <main className="bg-linear-to-br from-[#0a0f2c] via-[#1a1f3c] to-[#232946]">

      <Navbar />
      <Hero />
      <Features />
      <Footer />
     
    </main>
  );
}

