import { Session } from "next-auth";
import { Text, Stack, Button } from "@mantine/core";
import { IconShoppingCartOff } from "@tabler/icons-react";

interface BasketProps {
  session: Session | null;
}

export default function Basket({ session }: BasketProps) {
  if (!session) {
    return (
      <Stack align="center" justify="center" style={{ height: "100%" }} mt="xl">
        <IconShoppingCartOff size={80} stroke={2} />
        <Text>Login or Register to access basket</Text>
      </Stack>
    );
  }

  return <div>Basket</div>;
}
