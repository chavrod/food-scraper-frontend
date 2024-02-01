import { useState, ReactElement, useEffect } from "react";
import { Paper, TextInput, Flex, ActionIcon, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconSearch } from "@tabler/icons-react";

interface SearchHeaderProps {
  handleSubmit: (values: { query: string; page: string }) => void;
  loadingSearch: boolean;
  searchText: string | undefined;
  searchPage: string | undefined;
  isLargerThanSm: boolean;
}

export default function SearchHeader({
  handleSubmit,
  loadingSearch,
  searchText,
  searchPage,
  isLargerThanSm,
}: SearchHeaderProps): ReactElement {
  const form = useForm({
    initialValues: {
      query: searchText || "",
      page: searchPage || "1",
    },

    validate: {
      query: (value: string) => (value.length <= 0 ? "Invalid name" : null),
    },

    transformValues: (values) => ({
      ...values,
      query: values.query.replace(/\s+/g, " ").trim().toLowerCase(),
    }),
  });

  // State to trigger form submission
  const [shouldSubmit, setShouldSubmit] = useState(false);

  // Update form value when searchText changes
  useEffect(() => {
    if (searchText && searchPage) {
      form.setFieldValue("query", searchText);
      form.setFieldValue("page", searchPage);
      setShouldSubmit(true); // Set flag to trigger form submission
    }
  }, [searchText]);

  // Submit form when shouldSubmit is true
  useEffect(() => {
    if (shouldSubmit) {
      handleSubmit(form.values);
      setShouldSubmit(false); // Reset flag after submission
    }
  }, [shouldSubmit]);

  return (
    <Paper
      radius={0}
      mb="md"
      style={{
        position: "sticky",
        top: 80,
        zIndex: 10,
        width: "100%",
      }}
      withBorder
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Flex
          my="md"
          mx={isLargerThanSm ? "xl" : "xs"}
          gap={0}
          justify={isLargerThanSm ? "flex-start" : "center"}
          align="flex-start"
          direction="row"
          wrap="nowrap"
        >
          <TextInput
            id="1"
            withAsterisk
            placeholder="What are you looking for?"
            disabled={loadingSearch}
            miw={isLargerThanSm ? 400 : 230}
            size={isLargerThanSm ? "lg" : "md"}
            radius={0}
            icon={<IconSearch />}
            {...form.getInputProps("query")}
          />
          <Button
            radius={0}
            type="submit"
            variant="filled"
            color="cyan"
            size={isLargerThanSm ? "lg" : "md"}
            loading={loadingSearch}
            style={{
              borderTopLeftRadius: "0px",
              borderBottomLeftRadius: "0px",
              borderTopRightRadius: "6px",
              borderBottomRightRadius: "6px",
            }}
          >
            {!loadingSearch ? "Search" : ""}
          </Button>
        </Flex>
      </form>
    </Paper>
  );
}
