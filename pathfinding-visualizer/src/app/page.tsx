import Visualizer from "@/components/Visualizer";
import Footer from "@/components/footer";
import { Analytics } from "@vercel/analytics/next";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-grow p-6">
        <Visualizer />
      </div>
      <Footer />
    </main>
  );
}
