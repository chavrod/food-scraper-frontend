import RootStyleRegistry from "./emotion";
import MainAppShell from "./MainAppShell";

import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <main>
          <RootStyleRegistry>
            <MainAppShell>{children}</MainAppShell>
          </RootStyleRegistry>
        </main>
      </body>
    </html>
  );
}
