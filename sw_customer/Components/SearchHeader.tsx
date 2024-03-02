import { useState, ReactElement, useEffect } from "react";
import { Paper, TextInput, Flex, ActionIcon, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import { useRouter } from "next/router";

interface SearchHeaderProps {
  loadingSearch: boolean;
}

export default function SearchHeader({
  loadingSearch,
}: SearchHeaderProps): ReactElement {
  const isLargerThanSm = useMediaQuery("(min-width: 768px)", undefined, {
    getInitialValueInEffect: false,
  });

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
    router.push(`?query=${values.query}&page=${values.page}`);
  };

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
            color="brand"
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
