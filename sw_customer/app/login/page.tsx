"use client";

import { TextInput, Button, Paper } from "@mantine/core";
import { useForm } from "@mantine/form";

const LoginForm: React.FC = () => {
  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value),
      password: (value) => value.trim().length > 0,
    },
  });

  const handleFormSubmit = () => {};

  return (
    <Paper p="md" style={{ maxWidth: 400, margin: "0 auto" }}>
      <form onSubmit={form.onSubmit(handleFormSubmit)}>
        <TextInput
          id="1"
          label="Email"
          placeholder="Your email address"
          required
          {...form.getInputProps("email")}
        />
        <TextInput
          id="2"
          label="Password"
          type="password"
          placeholder="Your password"
          required
          style={{ marginTop: 15 }}
          {...form.getInputProps("password")}
        />
        <Button type="submit" variant="outline" style={{ marginTop: 20 }}>
          Login
        </Button>
      </form>
    </Paper>
  );
};

export default LoginForm;
