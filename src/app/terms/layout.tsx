import Link from "next/link";
import { Frame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 text-primary font-bold text-xl font-headline"
    >
      <Frame className="w-6 h-6" />
      <span>MirrorNet™</span>
    </Link>
  );
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center shadow-sm bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <Logo />
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
          <ThemeToggle />
        </nav>
      </header>
      <main className="flex-1 bg-secondary py-12 md:py-24 lg:py-32">
        <div className="container mx-auto max-w-3xl px-4 md:px-6">
            {children}
        </div>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          &copy; 2025 MirrorNet™. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link
            href="/public-faq"
            className="text-xs hover:underline underline-offset-4"
          >
            FAQ
          </Link>
        </nav>
      </footer>
    </div>
    </ThemeProvider>
  );
}
