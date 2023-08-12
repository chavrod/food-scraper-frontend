"use client";
import { useState } from "react";
import { useForm } from "@mantine/form";
import { TextInput, Group, Button, Checkbox } from "@mantine/core";
import { useRouter } from "next/navigation";

export default function SearchForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      q: "",
      p: 1,
    },

    validate: {
      q: (value) => (value.length <= 0 ? "Invalid name" : null),
    },
  });

  const handleFormSubmit = (values: { q: string; p: number }) => {
    router.push(`?q=${values.q}&p=${values.p}`);

    setLoading(true);

    setTimeout(() => {
      setLoading(false); // End the loading state after 2 seconds
    }, 2000); // Wait for 2 seconds
  };

  return (
    <>
      <form onSubmit={form.onSubmit(handleFormSubmit)}>
        <Group mb="md">
          <TextInput
            id="1"
            withAsterisk
            placeholder="Type a product name"
            disabled={loading}
            {...form.getInputProps("q")}
          />
          <Button type="submit" loading={loading}>
            Search
          </Button>
        </Group>
      </form>
    </>
  );
}
