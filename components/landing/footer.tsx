export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        {/* Links */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6">
          <a
            href="https://docs.google.com/document/d/1ING8e7e3KW005sOyKIqyx26Nr9J0SxSl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Privacy&nbsp;Policy
          </a>

          {/* Separator (shown only on wider screens) */}
          <span className="hidden sm:inline text-muted-foreground">•</span>

          <a
            href="https://docs.google.com/document/d/1hWpvm63VdUvptpyKWlyRa3pXcZfuVBjz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Terms&nbsp;of&nbsp;Service
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
