import React from "react";
import { Session } from "next-auth";
import {
  Text,
  Stack,
  Button,
  Card,
  Image,
  Group,
  Badge,
  NumberInput,
} from "@mantine/core";
import { IconShoppingCartOff, IconTrash, IconX } from "@tabler/icons-react";
import { Product, BasketItem } from "@/types/customer_types";

interface BasketProps {
  session: Session | null;
  basketItems: BasketItem[];
}

export default function Basket({ session, basketItems }: BasketProps) {
  if (!session) {
    return (
      <Stack align="center" justify="center" style={{ height: "100%" }} mt="xl">
        <IconShoppingCartOff size={80} stroke={2} />
        <Text>Login or Register to access the basket</Text>
      </Stack>
    );
  }

  if (basketItems && basketItems.length === 0) {
    return (
      <Stack align="center" justify="center" style={{ height: "100%" }} mt="xl">
        <Text>Your basket is empty</Text>
      </Stack>
    );
  }

  const handleQuantityChange = (productId: number, quantity: number) => {
    console.log(`Adjust quantity for product ${productId} to ${quantity}`);
    // Add logic to adjust quantity
  };

  const clearProduct = (productId: number) => {
    console.log(`Clearing product ${productId}`);
    // Add logic to clear product from basket
  };

  const clearBasket = () => {
    console.log("Clearing all items from the basket");
    // Add logic to clear the entire basket
  };

  return (
    <Stack>
      {basketItems &&
        basketItems.map((item) => (
          <Card key={item.product?.id} shadow="sm" padding="lg">
            <Group position="apart">
              <Group>
                {item.product?.img_src && (
                  <Image
                    src={item.product.img_src}
                    alt={item.product.name}
                    width={100}
                    height={100}
                    fit="cover"
                  />
                )}
                <div>
                  <Text weight={500}>{item.product?.name}</Text>
                  <Text size="sm">Price: ${item.product?.price}</Text>
                  <Badge color="green">{item.product?.shop_name}</Badge>
                  <Text size="xs">Updated: {item.product?.updated_at}</Text>
                </div>
              </Group>
              <Group>
                <NumberInput
                  defaultValue={item.quantity}
                  min={1}
                  max={10}
                  onChange={(value) =>
                    handleQuantityChange(item.product?.id, value)
                  }
                />
                <Button
                  color="red"
                  onClick={() => clearProduct(item.product?.id)}
                >
                  <IconTrash size={16} />
                </Button>
              </Group>
            </Group>
          </Card>
        ))}
      <Button color="red" onClick={clearBasket} mt="md">
        <IconX size={16} /> Clear Basket
      </Button>
    </Stack>
  );
}
