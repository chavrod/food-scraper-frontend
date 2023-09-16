"use client";

import { signIn } from "next-auth/react";

import { TextInput, Button, Paper } from "@mantine/core";
import { useForm } from "@mantine/form";

const LoginForm: React.FC = () => {
  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) =>
        !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value)
          ? "Invalid email."
          : null,
      password: (value) =>
        value.trim().length === 0 ? "Password is required." : null,
    },
  });

  const handleFormSubmit = async () => {
    try {
      const { email, password } = form.values;

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      console.log(result);

      if (result && result.error) {
        // const data = await result.json();
        // form.setErrors(data);
      } else {
        // Show success message
        // Optionality to resend verification email
      }
    } catch (error) {
      console.log("helooo");
    }
  };

  return (
    <Paper p="md" style={{ maxWidth: 400, margin: "0 auto" }}>
      <form onSubmit={form.onSubmit(handleFormSubmit)}>
        <TextInput
          id="login_email"
          label="Email"
          placeholder="Your email address"
          required
          {...form.getInputProps("email")}
        />
        <TextInput
          id="login_password"
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
