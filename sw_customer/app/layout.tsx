import RootStyleRegistry from "./emotion";
import MainAppShell from "./MainAppShell";

import Provider from "./Components/Provider";

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
            {/* <Provider> */}
            <MainAppShell>{children}</MainAppShell>
            {/* </Provider> */}
          </RootStyleRegistry>
        </main>
      </body>
    </html>
  );
}
