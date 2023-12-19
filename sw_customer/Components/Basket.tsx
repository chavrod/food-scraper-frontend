import React, { useState } from "react";
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
  Flex,
  Pagination,
} from "@mantine/core";
import {
  IconShoppingCartOff,
  IconPlus,
  IconX,
  IconArrowBadgeRight,
  IconSquareRoundedMinus,
  IconSquareRoundedPlusFilled,
  IconCheck,
} from "@tabler/icons-react";
import { formatDateRelative } from "@/utils/datesUtil";
// Internal: Types
import { Product, BasketItem } from "@/types/customer_types";
import { BasketItemMetaData } from "@/types/customer_plus_types";
// Intenral: API
import basketItemsApi from "@/app/api/basketItemsApi";
import useApiSubmit from "@/utils/useApiSubmit";

interface BasketProps {
  session: Session | null;
  isLargerThanLg: boolean;
  basketItems: BasketItem[] | undefined;
  basketItemsMetaData: BasketItemMetaData | undefined;
  handleSuccess: () => void;
  handleBasketItemsPageChange: (page: number) => void;
}

type ProductStateType = {
  loadingIncrease: Record<number, boolean>;
  loadingDecrease: Record<number, boolean>;
  loadingClearing: Record<number, boolean>;
  decreased: Record<number, boolean>;
  increased: Record<number, boolean>;
};

export default function Basket({
  session,
  isLargerThanLg,
  basketItems,
  basketItemsMetaData,
  handleSuccess,
  handleBasketItemsPageChange,
}: BasketProps) {
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

  const [activePage, setPage] = useState(1);
  const handlePageChange = (page: number) => {
    setPage(page);
    handleBasketItemsPageChange(page);
  };

  const [productStates, setProductStates] = useState<ProductStateType>({
    loadingIncrease: {},
    loadingDecrease: {},
    loadingClearing: {},
    decreased: {},
    increased: {},
  });

  const { handleSubmit: submitDecreaseQuantity } = useApiSubmit({
    apiFunc: basketItemsApi.decreaseItemQuantity,
    onSuccess: () => {
      handleSuccess();
    },
  });

  const handleDecreaseQuantity = async (productId: number, index: number) => {
    setProductStates((prevStates) => ({
      ...prevStates,
      loadingDecrease: { ...prevStates.loadingDecrease, [index]: true },
    }));

    const wasSuccessful = await submitDecreaseQuantity(productId);

    if (wasSuccessful) {
      setProductStates((prevStates) => ({
        ...prevStates,
        loadingDecrease: { ...prevStates.loadingDecrease, [index]: false },
        decreased: { ...prevStates.decreased, [index]: true },
      }));

      setTimeout(() => {
        setProductStates((prevStates) => ({
          ...prevStates,
          decreased: { ...prevStates.decreased, [index]: false },
        }));
      }, 2000);
    } else {
      setProductStates((prevStates) => ({
        ...prevStates,
        loadingDecrease: { ...prevStates.loadingDecrease, [index]: false },
      }));
    }
  };

  const { handleSubmit: submitIncreaseQuantity } = useApiSubmit({
    apiFunc: basketItemsApi.addItemQuantity,
    onSuccess: () => {
      handleSuccess();
    },
  });

  const handleIncreaseQuantity = async (productId: number, index: number) => {
    setProductStates((prevStates) => ({
      ...prevStates,
      loadingIncrease: { ...prevStates.loadingIncrease, [index]: true },
    }));

    const data = {
      pk: productId,
    };
    const wasSuccessful = await submitIncreaseQuantity(data);

    if (wasSuccessful) {
      setProductStates((prevStates) => ({
        ...prevStates,
        loadingIncrease: { ...prevStates.loadingIncrease, [index]: false },
        increased: { ...prevStates.increased, [index]: true },
      }));

      setTimeout(() => {
        setProductStates((prevStates) => ({
          ...prevStates,
          increased: { ...prevStates.increased, [index]: false },
        }));
      }, 2000);
    } else {
      setProductStates((prevStates) => ({
        ...prevStates,
        loadingIncrease: { ...prevStates.loadingIncrease, [index]: false },
        // Don't update the 'added' state if it was not successful
      }));
    }
  };

  const { handleSubmit: submitRemoveProductItems } = useApiSubmit({
    apiFunc: basketItemsApi.clearProductItems,
    onSuccess: () => {
      handleSuccess();
    },
  });

  const clearProduct = async (
    productId: number,
    name: string,
    index: number
  ) => {
    setProductStates((prevStates) => ({
      ...prevStates,
      loadingClearing: { ...prevStates.loadingClearing, [index]: true },
    }));

    await submitRemoveProductItems(productId, `Removed ${name} from basket.`);

    setProductStates((prevStates) => ({
      ...prevStates,
      loadingClearing: { ...prevStates.loadingClearing, [index]: false },
    }));
  };

  const { handleSubmit: submitclearAllProductItems, loading: loadingClearAll } =
    useApiSubmit({
      apiFunc: basketItemsApi.clearAll,
      onSuccess: () => {
        handleSuccess();
      },
    });

  const clearBasket = () => {
    const data = "";
    submitclearAllProductItems(
      data,
      `Removed all items from basket from basket.`
    );
  };

  return (
    <Flex
      gap="md"
      justify="center"
      align="flex-start"
      direction={isLargerThanLg ? "row-reverse" : "column"}
      style={{ width: "100%" }}
    >
      {basketItemsMetaData && (
        <Paper
          maw={isLargerThanLg ? "auto" : 450}
          shadow="md"
          withBorder
          p="md"
          radius="md"
          mt="xs"
          style={{ width: "100%" }}
        >
          <Title mb="xs" order={4} align="left">
            Basket Summary by Shop
          </Title>
          {isLargerThanLg && (
            <Group position="apart" noWrap>
              <Text miw={120} ml={20} c="dimmed">
                Shop
              </Text>
              <Text mr={40} c="dimmed">
                Items
              </Text>
              <Text miw={90} mr={27} c="dimmed">
                Amount
              </Text>
            </Group>
          )}
          <Divider></Divider>

          <Accordion
            multiple
            chevron={isLargerThanLg ? "" : <IconPlus size="1rem" />}
            styles={{
              chevron: {
                "&[data-rotate]": {
                  transform: "rotate(45deg)",
                },
              },
            }}
          >
            {basketItemsMetaData &&
              basketItemsMetaData.shop_breakdown?.map((shop, index) => (
                <Accordion.Item value={shop.product__shop_name} key={index}>
                  <Accordion.Control
                    disabled={isLargerThanLg}
                    style={{
                      color: "black", // or any color you prefer
                      cursor: isLargerThanLg ? "default" : "auto", // to override the disabled cursor
                      opacity: 1, // to remove the default opacity applied to disabled elements
                    }}
                  >
                    <Group position="apart">
                      <Text miw={80} align="left">
                        {shop.product__shop_name.charAt(0).toUpperCase() +
                          shop.product__shop_name.slice(1).toLowerCase()}
                      </Text>

                      {isLargerThanLg && (
                        <Text weight={500} miw={40} align="right">
                          {shop.total_quantity}
                        </Text>
                      )}
                      <Text weight={500} miw={60} align="right">
                        €{shop.total_price}
                      </Text>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Group position="apart">
                      <Text ml={4} c="dimmed">
                        Items
                      </Text>
                      <Text mr={45} c="dimmed">
                        {shop.total_quantity}
                      </Text>
                    </Group>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
          </Accordion>
          <Divider color="dark"></Divider>
          <Group mt="xs" position="apart">
            <Text ml={21} weight={500} miw={80} align="left">
              {isLargerThanLg ? "" : "Total"}
            </Text>

            {isLargerThanLg && (
              <Text weight={500} miw={40} align="right">
                {basketItemsMetaData.total_quantity}
              </Text>
            )}
            <Text mr={59} weight={500} miw={20}>
              €{basketItemsMetaData.total_price}
            </Text>
          </Group>
        </Paper>
      )}

      <Stack>
        <Grid gutter={0}>
          {basketItems &&
            basketItems.map((item, index) => (
              <Grid.Col key={index} span={12}>
                <Paper
                  maw={450}
                  h="200px"
                  shadow="md"
                  withBorder
                  p="md"
                  my="xs"
                  radius="md"
                  style={{ width: "100%" }}
                >
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
                          href={
                            item?.product?.product_url
                              ? item.product.product_url
                              : ""
                          }
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
                        <Text size="xs">
                          {item.product?.updated_at &&
                            `(Updated: ${formatDateRelative(
                              item.product.updated_at
                            )})`}
                        </Text>
                      </Stack>

                      <Group noWrap>
                        <ActionIcon
                          loading={productStates.loadingDecrease[index]}
                          size="xl"
                          color={
                            productStates.decreased[index] ? "teal" : "cyan"
                          }
                          variant="transparent"
                          onClick={() => {
                            item.product?.id &&
                              handleDecreaseQuantity(item.product.id, index);
                          }}
                        >
                          {productStates.decreased[index] ? (
                            <IconCheck size="2.2rem" />
                          ) : (
                            <IconSquareRoundedMinus size="3rem" />
                          )}
                        </ActionIcon>
                        <Text weight={500}>{item.quantity}</Text>
                        <ActionIcon
                          loading={productStates.loadingIncrease[index]}
                          size="xl"
                          color={
                            productStates.increased[index] ? "teal" : "cyan"
                          }
                          variant="transparent"
                          onClick={() => {
                            item.product?.id &&
                              handleIncreaseQuantity(item.product.id, index);
                          }}
                        >
                          {productStates.increased[index] ? (
                            <IconCheck size="2.2rem" />
                          ) : (
                            <IconSquareRoundedPlusFilled size="3rem" />
                          )}
                        </ActionIcon>
                      </Group>
                    </Stack>
                    <Stack align="flex-end" justify="space-between">
                      <ActionIcon
                        loading={productStates.loadingClearing[index]}
                        variant="transparent"
                        color="red"
                        onClick={() => {
                          item.product?.id &&
                            clearProduct(
                              item.product.id,
                              item.product.name,
                              index
                            );
                        }}
                      >
                        <IconX size="1.2rem" />
                      </ActionIcon>
                      <Stack spacing={0} miw={50} mt={70}>
                        <Text c="dimmed">Total: </Text>
                        <Text weight={500}>
                          €
                          {item.product?.price && item.quantity
                            ? (item.product?.price * item.quantity).toFixed(2)
                            : "N/A"}
                        </Text>
                      </Stack>
                    </Stack>
                  </Group>
                </Paper>
              </Grid.Col>
            ))}
        </Grid>
        <Flex
          style={{
            width: "100%",
          }}
          justify="center"
          align="center"
          direction="row"
          wrap="wrap"
          maw={450}
        >
          {basketItemsMetaData?.total_pages && (
            <Pagination
              value={activePage}
              onChange={handlePageChange}
              total={basketItemsMetaData?.total_pages}
            />
          )}
        </Flex>

        <Button
          onClick={clearBasket}
          variant="outline"
          maw={450}
          fullWidth
          mt={15}
          mb={65}
          loading={loadingClearAll}
        >
          Empty basket
        </Button>
      </Stack>
    </Flex>
  );
}
