
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DownloadForm } from "@/components/DownloadForm";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Download Videos & Music
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Convert and download media from your favorite platforms in high quality.
          </p>
        </div>

        <div className="flex justify-center">
          <DownloadForm />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
