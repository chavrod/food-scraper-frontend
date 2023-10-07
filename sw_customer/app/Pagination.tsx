"use client";
import { useState, useEffect } from "react";
import { Pagination } from "@mantine/core";
import { useRouter } from "next/navigation";
// Intenral Utils
import { SearchMetaData } from "@/utils/types";

interface PaginationFormProps {
  searchMetaData: SearchMetaData;
}

export default function PaginationForm({
  searchMetaData,
}: PaginationFormProps) {
  const router = useRouter();

  const [activePage, setPage] = useState(
    searchMetaData?.currentPage || undefined
  );

  // TODO: get rif of this effect
  useEffect(() => {
    setPage(searchMetaData.currentPage);
  }, [searchMetaData]);

  const handlePageChange = (page: number) => {
    // Scroll smoothly to the top of the page
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Wait for the scroll to complete (you can adjust the timeout as needed)
    setTimeout(() => {
      router.push(
        `?query=${searchMetaData.keyword}&page=${page}&is_relevant_only=${searchMetaData.isRelevantOnly}`
      );
    }, 500); // Adjust this time based on your scrolling speed
  };

  return (
    <>
      {searchMetaData?.totalPages && searchMetaData.totalPages > 0 ? (
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
      ) : null}
    </>
  );
}
