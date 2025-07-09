import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        {/* Links */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6">
          <Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground">
            Privacy&nbsp;Policy
          </Link>

          {/* Separator (shown only on wider screens) */}
          <span className="hidden sm:inline text-muted-foreground">•</span>

          <Link href="/terms-of-service" className="text-sm text-muted-foreground hover:text-foreground">
            Terms&nbsp;of&nbsp;Service
          </Link>

          {/* Separator (shown only on wider screens) */}
          <span className="hidden sm:inline text-muted-foreground">•</span>

          <a
            href="https://mail.google.com/mail/?view=cm&to=sultantemuruly@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Contact
          </a>
        </div>

        {/* Copyright */}
        <div className="mt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Silhouette. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
