import React, { ReactElement } from "react";
import { TextInput, ActionIcon, Group } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconSearch, IconX } from "@tabler/icons-react";
import { useRouter } from "next/router";

interface SearchHeaderProps {
  isLargerThanSm: boolean;
  isSearchBarVisible: boolean;
  handleHideSearchBar: () => void;
}

export default function SearchHeader({
  isLargerThanSm,
  isSearchBarVisible,
  handleHideSearchBar,
}: SearchHeaderProps): ReactElement {
  const router = useRouter();

  const form = useForm({
    initialValues: {
      query: "",
      page: "1",
    },

    validate: {
      query: (value: string) => (value.length <= 0 ? "Invalid name" : null),
    },

    transformValues: (values) => ({
      ...values,
      query: values.query.replace(/\s+/g, " ").trim().toLowerCase(),
    }),
  });

  const handleSubmit = (values: { query: string; page: string }) => {
    const searchParams = `?query=${values.query}&page=${values.page}`;

    // Check if the current pathname is not the index page
    if (router.pathname !== "/") {
      // Navigate to the index page with the search parameters
      router.push(`/${searchParams}`);
    } else {
      // If already on the index page, just push the search parameters
      router.push(searchParams);
    }
  };

  return (
    <Group
      style={{
        width: isSearchBarVisible && !isLargerThanSm ? "100%" : undefined,
      }}
      noWrap
    >
      <form
        onSubmit={form.onSubmit(handleSubmit)}
        style={{
          width: isSearchBarVisible && !isLargerThanSm ? "100%" : undefined,
        }}
      >
        <TextInput
          id="1"
          placeholder="Search..."
          style={{
            width: isLargerThanSm
              ? 250
              : isSearchBarVisible
              ? "100%"
              : undefined, // Add this line
          }}
          size={isLargerThanSm ? "lg" : "md"}
          radius="xl"
          rightSection={
            <ActionIcon type="submit" variant="transparent">
              <IconSearch />
            </ActionIcon>
          }
          {...form.getInputProps("query")}
          error={undefined}
        />
      </form>
      {!isLargerThanSm && isSearchBarVisible && (
        <ActionIcon>
          <IconX onClick={handleHideSearchBar} />
        </ActionIcon>
      )}
    </Group>
  );
}
