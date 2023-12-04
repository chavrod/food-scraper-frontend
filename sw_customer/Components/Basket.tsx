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
  Container,
  ActionIcon,
  Grid,
  Paper,
  Box,
} from "@mantine/core";
import {
  IconShoppingCartOff,
  IconTrash,
  IconX,
  IconArrowBadgeRight,
  IconSquareRoundedMinus,
  IconSquareRoundedPlusFilled,
} from "@tabler/icons-react";
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

  const handleDecreaseQuantity = (productId: number, quantity: number) => {
    if (quantity > 1) {
      handleQuantityChange(productId, quantity - 1);
    }
  };

  const handleIncreaseQuantity = (productId: number, quantity: number) => {
    handleQuantityChange(productId, quantity + 1);
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
      <Grid gutter={0} justify="center">
        {basketItems &&
          basketItems.map((item, index) => (
            <Grid.Col key={index} span={12}>
              <Paper h="200px" shadow="md" withBorder p="md" m="xs" radius="md">
                <Group position="apart" noWrap>
                  {item.product?.img_src && (
                    <Stack>
                      <Image
                        src={item.product.img_src}
                        alt={item.product.name}
                        width={50}
                        height={50}
                        fit="cover"
                      />
                      <Container
                        w={50}
                        h={50}
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <img
                          src={`/brand-logos/${item.product.shop_name}.jpeg`}
                          alt={item.product.shop_name}
                          style={{ width: "2rem" }}
                        />
                      </Container>
                    </Stack>
                  )}
                  <Stack spacing={5}>
                    <Box h={45}>
                      <Text weight={500} lineClamp={2}>
                        {item.product?.name}
                      </Text>
                    </Box>

                    <Group spacing={0} align="center">
                      <Text
                        fz="md"
                        c="cyan.7"
                        sx={{
                          cursor: "pointer",
                          "&:hover": {
                            textDecoration: "underline",
                          },
                        }}
                        fw={700}
                        component="a"
                        href={""}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Go to source
                      </Text>
                      <IconArrowBadgeRight
                        size={20}
                        style={{ color: "#1098AD" }}
                      />
                    </Group>
                    <Stack spacing={0}>
                      <Group noWrap>
                        <Text weight={500}>€{item.product?.price}</Text>
                        <Text size="sm" c="dimmed">
                          €2.49/kg{" "}
                        </Text>
                      </Group>
                      <Text size="xs">{`(Updated: Today)`}</Text>
                    </Stack>

                    <Group noWrap>
                      <ActionIcon
                        size="xl"
                        color="cyan"
                        variant="transparent"
                        onClick={() =>
                          handleDecreaseQuantity(
                            item.product?.id,
                            item.quantity
                          )
                        }
                      >
                        <IconSquareRoundedMinus size="3rem" />
                      </ActionIcon>
                      <Text weight={500}>{item.quantity}</Text>
                      <ActionIcon
                        size="xl"
                        color="cyan"
                        variant="transparent"
                        onClick={() =>
                          handleIncreaseQuantity(
                            item.product?.id,
                            item.quantity
                          )
                        }
                      >
                        <IconSquareRoundedPlusFilled size="3rem" />
                      </ActionIcon>
                    </Group>
                  </Stack>
                  <Stack align="flex-end" justify="space-between">
                    <ActionIcon
                      variant="transparent"
                      color="red"
                      onClick={() => clearProduct(item.product?.id)}
                    >
                      <IconX size="1.2rem" />
                    </ActionIcon>
                    <Stack spacing={0} mt={70}>
                      <Text c="dimmed">Total: </Text>
                      <Text weight={500}>€20.4</Text>
                    </Stack>
                  </Stack>
                </Group>
              </Paper>
            </Grid.Col>
          ))}
      </Grid>
      <Button color="red" onClick={clearBasket} mt="md">
        <IconX size={16} /> Clear Basket
      </Button>
    </Stack>
  );
}
