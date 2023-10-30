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
        <main>
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
