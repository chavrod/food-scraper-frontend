import { ReactElement } from "react";
import { Paper, TextInput, Flex, ActionIcon } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconSearch } from "@tabler/icons-react";

interface SearchHeaderProps {
  handleSubmit: (values: { query: string; page: number }) => void;
  loadingSearch: boolean;
  searchText: string | undefined;
}

export default function SearchHeader({
  handleSubmit,
  loadingSearch,
  searchText,
}: SearchHeaderProps): ReactElement {
  const form = useForm({
    initialValues: {
      query: searchText || "",
      page: 1,
    },

    validate: {
      query: (value: string) => (value.length <= 0 ? "Invalid name" : null),
    },
  });

  return (
    <Paper style={{ width: "100%" }}>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Flex
          my="md"
          gap="xs"
          justify="center"
          align="flex-start"
          direction="row"
          wrap="nowrap"
        >
          <TextInput
            id="1"
            withAsterisk
            placeholder="Type a product name"
            disabled={loadingSearch}
            radius="lg"
            {...form.getInputProps("query")}
          />
          <ActionIcon
            type="submit"
            variant="filled"
            radius="lg"
            size="lg"
            color="cyan"
            loading={loadingSearch}
          >
            <IconSearch size="1.3rem" />
          </ActionIcon>
        </Flex>
      </form>
    </Paper>
  );
}
