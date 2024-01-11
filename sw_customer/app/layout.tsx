import RootStyleRegistry from "./emotion";
import MainAppShell from "./MainAppShell";
import { SessionProvider } from "../Components/Provider";
import { GlobalProvider } from "@/Context/globalContext";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html>
      <body>
        <main style={{ backgroundColor: "#F1F3F5" }}>
          <RootStyleRegistry>
            <GlobalProvider>
              <SessionProvider>
                <MainAppShell>{children}</MainAppShell>
              </SessionProvider>
            </GlobalProvider>
          </RootStyleRegistry>
        </main>
      </body>
    </html>
  );
}
