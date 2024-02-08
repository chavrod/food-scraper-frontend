import dynamic from "next/dynamic";
import React from "react";

// Define the prop types for NoSsr
interface NoSsrProps {
  children: React.ReactNode; // 'children' can be of type ReactNode which includes elements, strings, numbers, fragments, etc.
}

// Define NoSsr as a functional component with typed props
const NoSsr: React.FC<NoSsrProps> = (props) => (
  <React.Fragment>{props.children}</React.Fragment>
);

// Use dynamic import with 'ssr: false' to disable server-side rendering for NoSsr
export default dynamic<NoSsrProps>(() => Promise.resolve(NoSsr), {
  ssr: false,
});
