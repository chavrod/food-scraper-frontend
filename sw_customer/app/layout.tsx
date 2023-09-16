import RootStyleRegistry from "./emotion";
import MainAppShell from "./MainAppShell";

import { SessionProvider } from "next-auth/react";

interface RootLayoutProps {
  children: React.ReactNode;
  session: any; // Define a more specific type for session if needed
}

export default function RootLayout({ children, session }: RootLayoutProps) {
  return (
    <html>
      <body>
        <main>
          <RootStyleRegistry>
            <SessionProvider session={session}>
              <MainAppShell>{children}</MainAppShell>
            </SessionProvider>
          </RootStyleRegistry>
        </main>
      </body>
    </html>
  );
}
