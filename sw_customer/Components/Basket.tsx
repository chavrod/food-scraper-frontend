import React from "react";
import { Session } from "next-auth";
import {
  Text,
  Stack,
  Button,
  Image,
  Group,
  Badge,
  Container,
  ActionIcon,
  Grid,
  Paper,
  Box,
  Title,
  Divider,
  Accordion,
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
      <Paper shadow="md" withBorder p="md" m="xs" radius="md">
        <Title mb="xs" order={4} align="left">
          Basket Summary by Shop
        </Title>
        <Divider></Divider>
        <Accordion multiple>
          <Accordion.Item value="customization">
            <Accordion.Control>
              <Group position="apart">
                <Text>Aldi</Text>
                <Text weight={500}> €100.49</Text>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Group position="apart">
                <Text ml={4} c="dimmed">
                  Items
                </Text>
                <Text mr={45} c="dimmed">
                  2
                </Text>
              </Group>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="flexibility">
            <Accordion.Control>
              <Group position="apart">
                <Text>Tesco</Text>
                <Text weight={500}> €2.49</Text>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Group position="apart">
                <Text ml={4} c="dimmed">
                  Items
                </Text>
                <Text mr={45} c="dimmed">
                  20
                </Text>
              </Group>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="focus-ring">
            <Accordion.Control>
              <Group position="apart">
                <Text>Supervalu</Text>
                <Text weight={500}> €20.49</Text>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Group position="apart">
                <Text ml={4} c="dimmed">
                  Items
                </Text>
                <Text mr={45} c="dimmed">
                  2
                </Text>
              </Group>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
        <Divider></Divider>
        <Group mt="xs" position="apart">
          <Text ml={21} weight={500}>
            Total
          </Text>
          <Text mr={59} weight={500}>
            €140.49
          </Text>
        </Group>
      </Paper>
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
