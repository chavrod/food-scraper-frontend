"use client";
import { useState, useEffect } from "react";
import { Pagination } from "@mantine/core";
import { useRouter } from "next/navigation";
// Intenral Utils
import { SearchMetaData } from "@/utils/types";

interface PaginationFormProps {
  searchMetaData: SearchMetaData | {};
}

export default function PaginationForm({
  searchMetaData,
}: PaginationFormProps) {
  const router = useRouter();

  // Add this type guard function
  function isSearchMetaData(obj: any): obj is SearchMetaData {
    return "currentPage" in obj;
  }

  if (!isSearchMetaData(searchMetaData)) {
    // Handle the case where searchMetaData is not of type SearchMetaData
    return null;
  }

  const [activePage, setPage] = useState(searchMetaData.currentPage);

  useEffect(() => {
    setPage(searchMetaData.currentPage);
  }, [searchMetaData]);

  const handlePageChange = (p: number) => {
    // Scroll smoothly to the top of the page
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Wait for the scroll to complete (you can adjust the timeout as needed)
    setTimeout(() => {
      router.push(`?q=${searchMetaData.keyword}&p=${p}`);
    }, 500); // Adjust this time based on your scrolling speed
  };

  return (
    <>
      {searchMetaData.totalPages && (
        <Pagination
          mb={30}
          py="xl"
          spacing={5}
          value={activePage}
          onChange={(p) => {
            handlePageChange(p);
            setPage(p);
          }}
          total={searchMetaData.totalPages}
        />
      )}
    </>
  );
}
