import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row w-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden">
        <header className="h-16 border-b border-border bg-[#0A0D14] flex items-center px-4 md:hidden">
          <img src={`${import.meta.env.BASE_URL}logo-wordmark.png`} alt="Nebula TV" className="h-7 w-auto" />
        </header>
        <main className="flex-1 overflow-auto bg-muted/20 p-4 md:p-8">
          <div className="max-w-6xl mx-auto h-full w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
