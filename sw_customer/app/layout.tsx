import RootStyleRegistry from "./emotion";
import MainAppShell from "./MainAppShell";
import { SessionProvider } from "../Components/Provider";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html>
      <body>
        <main style={{ backgroundColor: "#F1F3F5" }}>
          <RootStyleRegistry>
            <SessionProvider>
              <MainAppShell>{children}</MainAppShell>
            </SessionProvider>
          </RootStyleRegistry>
        </main>
      </body>
    </html>
  );
}
