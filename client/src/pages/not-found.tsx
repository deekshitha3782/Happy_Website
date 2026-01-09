import { Link } from "wouter";
import { CloudOff } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md mx-auto glass-panel p-12 rounded-3xl">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground">
          <CloudOff size={40} />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The page you're looking for seems to have drifted away like a cloud.
        </p>
        <Link href="/" className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0">
          Return Home
        </Link>
      </div>
    </div>
  );
}
