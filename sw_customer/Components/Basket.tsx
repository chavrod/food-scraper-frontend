import React, { useState } from "react";
import { Session } from "next-auth";
import {
  Text,
  Stack,
  Button,
  Image,
  Group,
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
  Select,
  Skeleton,
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
import {
  BasketItemMetaData,
  BasketItemShopBreakdown,
} from "@/types/customer_plus_types";
import { UseApiReturnType } from "@/utils/useApi";
// Intenral: API
import basketItemsApi from "@/app/api/basketItemsApi";
import useApiSubmit from "@/utils/useApiSubmit";

type BasketItemsType = UseApiReturnType<BasketItem[], BasketItemMetaData>;

interface BasketProps {
  session: Session | null;
  isLargerThanLg: boolean;
  basketItems: BasketItemsType;
  handleSuccess: () => void;
  handleBasketItemsPageChange: (page: number) => void;
  handleBasketItemsShopFilterChange: (filter_option: string) => void;
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
  handleSuccess,
  handleBasketItemsPageChange,
  handleBasketItemsShopFilterChange,
}: BasketProps) {
  if (!session) {
    return (
      <Stack align="center" justify="center" style={{ height: "100%" }} mt="xl">
        <IconShoppingCartOff size={80} stroke={2} />
        <Text>Login or Register to access the basket</Text>
      </Stack>
    );
  }

  const [activePage, setPage] = useState(1);
  const handlePageChange = (page: number) => {
    setPage(page);
    handleBasketItemsPageChange(page);
  };

  const [value, setValue] = useState<string | null>("ALL");
  const handleFilterByShop = (filter_option: string) => {
    setValue(filter_option);
    handleBasketItemsShopFilterChange(filter_option);
  };

  const generateShopOptions = (shopBreakdown: BasketItemShopBreakdown[]) => {
    const shopOptions = new Set(
      shopBreakdown.map((shop) => shop.product__shop_name)
    );
    const options = Array.from(shopOptions).map((shopName) => ({
      value: shopName,
      label: shopName.charAt(0) + shopName.slice(1).toLowerCase(),
    }));

    // Always include the 'ALL' option
    options.push({ value: "ALL", label: "Showing all" });

    return options;
  };

  // In your component:
  const shopOptions = basketItems.responseData.metaData
    ? generateShopOptions(basketItems.responseData.metaData.shop_breakdown)
    : [];

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

  const handleDecreaseQuantity = async (itemId: number, index: number) => {
    setProductStates((prevStates) => ({
      ...prevStates,
      loadingDecrease: { ...prevStates.loadingDecrease, [index]: true },
    }));

    const wasSuccessful = await submitDecreaseQuantity(itemId);

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

  const handleIncreaseQuantity = async (itemId: number, index: number) => {
    setProductStates((prevStates) => ({
      ...prevStates,
      loadingIncrease: { ...prevStates.loadingIncrease, [index]: true },
    }));

    const data = {
      pk: itemId,
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

  const clearProduct = async (itemId: number, name: string, index: number) => {
    setProductStates((prevStates) => ({
      ...prevStates,
      loadingClearing: { ...prevStates.loadingClearing, [index]: true },
    }));

    await submitRemoveProductItems(itemId, `Removed ${name} from basket.`);

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
    <>
      {basketItems.loading ? (
        <Flex
          gap="md"
          justify="center"
          align="flex-start"
          direction={isLargerThanLg ? "row-reverse" : "column"}
          style={{ width: "100%" }}
        >
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
              disableChevronRotation
              chevron={isLargerThanLg ? "" : <IconPlus size="1rem" />}
            >
              {Array.from({ length: 3 }).map((_, index) => (
                <Accordion.Item value={index.toString()} key={index}>
                  <Accordion.Control
                    disabled={isLargerThanLg}
                    style={{
                      color: "black",
                      cursor: isLargerThanLg ? "default" : "auto",
                      opacity: 1,
                    }}
                  >
                    <Group position="apart">
                      <Text miw={80} align="left">
                        <Skeleton height={20} width={80} />
                      </Text>

                      {isLargerThanLg && <Skeleton height={20} width={40} />}
                      <Skeleton height={20} width={60} />
                    </Group>
                  </Accordion.Control>
                </Accordion.Item>
              ))}
            </Accordion>
            <Divider color="dark"></Divider>
            <Group mt="xs" position="apart">
              <Text ml={21} weight={500} miw={80} align="left">
                {isLargerThanLg ? "" : "Total"}
              </Text>

              {isLargerThanLg && <Skeleton height={20} width={40} />}
              <Skeleton mr={59} height={20} width={60} />
            </Group>
          </Paper>

          <Grid gutter={0} mb={65}>
            {/* Shop filter skeleton */}
            <Paper withBorder>
              <Skeleton height={40} width={150}></Skeleton>
            </Paper>

            {/* Basket items skeleton */}
            {Array.from({ length: 8 }).map((_, index) => (
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
                    <Stack>
                      <Skeleton height={50} width={50} />
                      <Skeleton height={50} width={50} />
                    </Stack>

                    <Stack spacing={5}>
                      <Box h={45}>
                        <Skeleton height={20} width={150} />
                        <Skeleton height={20} width={120} mt={5} />
                      </Box>

                      <Stack spacing={0} mt="lg">
                        <Group noWrap>
                          <Skeleton height={35} width={100} />
                        </Group>
                      </Stack>

                      <Group noWrap mt="md">
                        <Skeleton height={40} width={40} radius="lg" />
                        <Skeleton height={15} width={30} />
                        <Skeleton height={40} width={40} radius="lg" />
                      </Group>
                    </Stack>
                    <Stack align="flex-end" justify="space-between">
                      <Skeleton height={20} width={20} />

                      <Skeleton height={40} width={50} mt={90} />
                    </Stack>
                  </Group>
                </Paper>
              </Grid.Col>
            ))}
          </Grid>
        </Flex>
      ) : basketItems.responseData.data &&
        basketItems.responseData.data?.length > 0 ? (
        <Flex
          gap="md"
          justify="center"
          align="flex-start"
          direction={isLargerThanLg ? "row-reverse" : "column"}
          style={{ width: "100%" }}
        >
          {basketItems.responseData.metaData && (
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
                {basketItems.responseData.metaData &&
                  basketItems.responseData.metaData.shop_breakdown?.map(
                    (shop, index) => (
                      <Accordion.Item
                        value={shop.product__shop_name}
                        key={index}
                      >
                        <Accordion.Control
                          disabled={isLargerThanLg}
                          style={{
                            color: "black",
                            cursor: isLargerThanLg ? "default" : "auto",
                            opacity: 1,
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
                    )
                  )}
              </Accordion>
              <Divider color="dark"></Divider>
              <Group mt="xs" position="apart">
                <Text ml={21} weight={500} miw={80} align="left">
                  {isLargerThanLg ? "" : "Total"}
                </Text>

                {isLargerThanLg && (
                  <Text weight={500} miw={40} align="right">
                    {basketItems.responseData.metaData.total_quantity}
                  </Text>
                )}
                <Text mr={59} weight={500} miw={20}>
                  €{basketItems.responseData.metaData.total_price}
                </Text>
              </Group>
            </Paper>
          )}

          <Stack>
            <Group maw={450} position="left">
              <Select
                value={value}
                onChange={handleFilterByShop}
                label="Selected shops"
                placeholder="Pick one"
                data={shopOptions}
              />
            </Group>
            <Grid gutter={0}>
              {basketItems.responseData.data.map((item, index) => (
                <Grid.Col key={index} span={12}>
                  <Paper
                    maw={450}
                    miw={isLargerThanLg ? 400 : ""}
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
                              item?.id &&
                                handleDecreaseQuantity(item.id, index);
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
                              item?.id &&
                                handleIncreaseQuantity(item.id, index);
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
                            item?.id &&
                              item.product?.name &&
                              clearProduct(item.id, item.product.name, index);
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
              {basketItems.responseData.metaData?.total_pages && (
                <Pagination
                  value={activePage}
                  onChange={handlePageChange}
                  total={basketItems.responseData.metaData?.total_pages}
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
      ) : (
        <Stack
          align="center"
          justify="center"
          style={{ height: "100%" }}
          mt="xl"
        >
          <IconShoppingCartOff size={80} stroke={2} />
          <Text>Your basket is empty</Text>
        </Stack>
      )}
    </>
  );
}
