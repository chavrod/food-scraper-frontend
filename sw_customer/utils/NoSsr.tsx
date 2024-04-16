import dynamic from "next/dynamic";
import React from "react";

// Define the prop types for NoSsr
interface NoSsrProps {
  children: React.ReactNode;
}

// Define NoSsr as a functional component with typed props
// eslint-disable-next-line react/function-component-definition
const NoSsr: React.FC<NoSsrProps> = ({ children }) => (
  // eslint-disable-next-line react/jsx-no-useless-fragment
  <React.Fragment>{children}</React.Fragment>
);
// Use dynamic import with 'ssr: false' to disable server-side rendering for NoSsr
export default dynamic<NoSsrProps>(() => Promise.resolve(NoSsr), {
  ssr: false,
});
