import SearchForm from "./SearchForm";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main
        style={{
          display: "flex",
          flexDirection: "column", // Stack children vertically
          justifyContent: "center", // Center children vertically
          alignItems: "center", // Center children horizontally
        }}
      >
        <SearchForm />
        {children}
      </main>
    </>
  );
}
