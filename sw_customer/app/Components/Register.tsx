"use-client";

import { useState } from "react";
import { TextInput, Button, Paper } from "@mantine/core";
import { useForm } from "@mantine/form";

const RegisterForm: React.FC = () => {
  const form = useForm({
    initialValues: {
      email: "",
      username: "",
      password1: "",
      password2: "", // repeat password
    },
    validate: {
      email: (value) =>
        !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value)
          ? "Invalid email."
          : null,
      password1: (value) =>
        value.trim().length === 0 ? "Password is required." : null,
      password2: (value, values) =>
        value !== values.password1 ? "Passwords must match." : null,
    },
  });

  const handleFormSubmit = async () => {
    try {
      const { email, password1, password2 } = form.values;

      const username = email;

      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "auth/register/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            username,
            password1,
            password2,
          }),
        }
      );
      const data = await response.json();

      console.log(response);
      console.log(data);

      if (!response.ok) {
        form.setErrors(data);
      } else {
        // Show success message
        // Optionality to resend verification email
      }
    } catch (error) {
      console.log("helooo");
    }

    // Handle the response data as required (e.g., show a success message or error message)
  };

  // onSubmit={form.onSubmit(handleFormSubmit)}
  // console.log(form);

  return (
    <Paper p="md" style={{ maxWidth: 400, margin: "0 auto" }}>
      <form onSubmit={form.onSubmit(handleFormSubmit)}>
        <TextInput
          id="email"
          label="Email"
          placeholder="Your email address"
          required
          {...form.getInputProps("email")}
        />
        <TextInput
          id="p1"
          label="Password"
          type="password"
          placeholder="Your password"
          required
          style={{ marginTop: 15 }}
          {...form.getInputProps("password1")}
        />
        <TextInput
          id="p2"
          label="Repeat Password"
          type="password"
          placeholder="Repeat your password"
          required
          style={{ marginTop: 15 }}
          {...form.getInputProps("password2")}
        />
        <Button type="submit" variant="outline" style={{ marginTop: 20 }}>
          Register
        </Button>
      </form>
    </Paper>
  );
};

export default RegisterForm;
