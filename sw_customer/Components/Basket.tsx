import React, { useState } from "react";
import { useRouter } from "next/router";
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
  Checkbox,
  Table,
} from "@mantine/core";
import {
  IconShoppingCartOff,
  IconPlus,
  IconX,
  IconArrowBadgeRight,
  IconSquareRoundedMinus,
  IconSquareRoundedPlusFilled,
  IconCheck,
  IconList,
  IconLayoutGrid,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMediaQuery } from "@mantine/hooks";
import { formatDateRelative } from "@/utils/datesUtil";
// Internal: Types
import { BasketItem, BasketItemShopBreakdown } from "@/types/customer_types";
// Intenral: API
import useBasketItems from "@/hooks/useBasketItems";
import basketItemsApi from "@/utils/basketItemsApi";
import useApiSubmit from "@/utils/useApiSubmit";
import { useGlobalContext } from "@/Context/globalContext";
import { useSessionContext } from "@/Context/SessionContext";
import {
  BasketSummarySkeleton,
  BasketItemsSkeleton,
} from "@/Components/Skeletons";

type ProductStateType = {
  loadingIncrease: Record<number, boolean>;
  loadingDecrease: Record<number, boolean>;
  loadingClearing: Record<number, boolean>;
  decreased: Record<number, boolean>;
  increased: Record<number, boolean>;
};

export default function Basket() {
  const queryClient = useQueryClient();
  // console.log("RENDER");
  const router = useRouter();

  const { session, isLoading } = useSessionContext();
  const accessToken = session?.access_token;

  const {
    isLoading: isLoadingBasketItems,
    basketItemsData,
    basketItemsMetaData,
  } = useBasketItems();

  const isLargerThanLg = useMediaQuery("(min-width: 1184px)", false, {
    getInitialValueInEffect: false,
  });

  const searchPage = router.query.page?.toString() || "1";
  const searchShop = router.query.shop?.toString() || "ALL";

  const handleFilterByShop = (filter_option: string) => {
    router.push(
      {
        pathname: router.pathname,
        query: {
          shop: filter_option,
          page: 1,
        },
      },
      undefined,
      {
        shallow: true,
      }
    );
  };

  const handleBasketPageChange = (page: number) => {
    // Scroll smoothly to the top of the page
    window.scrollTo({ top: isLargerThanLg ? 0 : 310, behavior: "smooth" });
    setTimeout(() => {
      router.push(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            page,
          },
        },
        undefined,
        {
          shallow: true,
        }
      );
    }, 500);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ["basket_items"],
      refetchType: "active",
    });
  };

  const generateShopOptions = (shopBreakdown: BasketItemShopBreakdown[]) => {
    const shopOptions = new Set(shopBreakdown.map((shop) => shop.name));
    const options = Array.from(shopOptions).map((shopName) => ({
      value: shopName,
      label: shopName.charAt(0) + shopName.slice(1).toLowerCase(),
    }));

    // Always include the 'ALL' option
    options.push({ value: "ALL", label: "All shops" });

    return options;
  };

  // In your component:
  const shopOptions = basketItemsMetaData
    ? generateShopOptions(basketItemsMetaData.shop_breakdown)
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
    onSuccess: handleSuccess,
    accessToken,
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
    onSuccess: handleSuccess,
    accessToken,
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
      }));
    }
  };

  const { handleSubmit: submitRemoveProductItems } = useApiSubmit({
    apiFunc: basketItemsApi.clearProductItems,
    onSuccess: handleSuccess,
    accessToken,
  });

  const clearProduct = async (itemId: number, name: string, index: number) => {
    setProductStates((prevStates) => ({
      ...prevStates,
      loadingClearing: { ...prevStates.loadingClearing, [index]: true },
    }));

    await submitRemoveProductItems(itemId, {
      title: `Removed items`,
      body: `Removed all ${name} from basket.`,
    });

    setProductStates((prevStates) => ({
      ...prevStates,
      loadingClearing: { ...prevStates.loadingClearing, [index]: false },
    }));
  };

  const { handleSubmit: submitclearAllProductItems, loading: loadingClearAll } =
    useApiSubmit({
      apiFunc: basketItemsApi.clearAll,
      onSuccess: handleSuccess,
      accessToken,
    });

  const clearBasket = () => {
    const data = "";
    submitclearAllProductItems(data, {
      title: "Cleared basket",
      body: "Removed all items from basket ",
    });
  };

  const [viewAsGrid, setViewAsGrid] = useState(true);

  const basketItemsRows =
    basketItemsData &&
    basketItemsData.map((item) => (
      <tr key={item.id}>
        <td>
          <img
            src={`/brand-logos/${item.product.shop_name}.jpeg`}
            alt={item.product.shop_name}
            style={{ width: "2rem" }}
          />
        </td>
        <td>
          <Text lineClamp={2}>{item.product.name}</Text>
        </td>
        <td>{item.product.price}</td>
        <td>{item.quantity}</td>
        <td>
          <Checkbox />
        </td>
      </tr>
    ));

  if (!session) {
    return (
      <Stack align="center" justify="center" style={{ height: "100%" }} mt="xl">
        <IconShoppingCartOff size={80} stroke={2} />
        <Text>Login or Register to access the basket</Text>
      </Stack>
    );
  }

  return (
    <Flex
      gap="md"
      justify="center"
      align={
        basketItemsData && basketItemsData.length === 0
          ? "center"
          : "flex-start"
      }
      direction={
        basketItemsData && basketItemsData.length === 0
          ? "row"
          : isLargerThanLg
          ? "row-reverse"
          : "column"
      }
      style={{ width: "100%", height: "100%" }}
      mt="sm"
      px="lg"
    >
      {isLoadingBasketItems ? (
        <>
          <BasketSummarySkeleton isLargerThanLg={isLargerThanLg} />
          <BasketItemsSkeleton />
        </>
      ) : basketItemsData && basketItemsData.length > 0 ? (
        <>
          {basketItemsMetaData && (
            <Paper
              maw={450}
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
              <Divider />

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
                    <Accordion.Item value={shop.name} key={shop.name}>
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
                            {shop.name.charAt(0).toUpperCase() +
                              shop.name.slice(1).toLowerCase()}
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
              <Divider color="dark" />
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

          <Stack maw={450}>
            <Group maw={450} position="apart">
              <Select
                maw="50%"
                value={searchShop}
                onChange={handleFilterByShop}
                placeholder="Pick one"
                data={shopOptions}
              />
              <Group mr="sm">
                <Text size="sm">View: </Text>
                <Group>
                  <ActionIcon
                    color={viewAsGrid ? "brand.7" : "gray"}
                    onClick={() => setViewAsGrid(true)}
                    variant="transparent"
                  >
                    <IconLayoutGrid size="1.5rem" />
                  </ActionIcon>
                  <ActionIcon
                    color={viewAsGrid ? "gray" : "brand.7"}
                    onClick={() => setViewAsGrid(false)}
                    variant="transparent"
                  >
                    <IconList size="1.5rem" />
                  </ActionIcon>
                </Group>
              </Group>
            </Group>
            {viewAsGrid ? (
              <Grid gutter={0}>
                {basketItemsData.map((item, index) => (
                  <Grid.Col key={item.product.id} span={12}>
                    <ItemGridView
                      index={index}
                      isLargerThanLg={isLargerThanLg}
                      item={item}
                      productStates={productStates}
                      handleIncreaseQuantity={handleIncreaseQuantity}
                      handleDecreaseQuantity={handleDecreaseQuantity}
                      clearProduct={clearProduct}
                    />
                  </Grid.Col>
                ))}
              </Grid>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Shop</th>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>{basketItemsRows}</tbody>
              </Table>
            )}

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
              {basketItemsMetaData && basketItemsMetaData.total_pages > 1 && (
                <Pagination
                  value={basketItemsMetaData.page}
                  onChange={handleBasketPageChange}
                  total={basketItemsMetaData.total_pages}
                />
              )}
            </Flex>

            <Button
              onClick={clearBasket}
              color="red"
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
        </>
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
    </Flex>
  );
}

type ItemViewProps = {
  index: number;
  isLargerThanLg: boolean;
  item: BasketItem;
  productStates: ProductStateType;
  handleIncreaseQuantity: (productId: number, index: number) => void;
  handleDecreaseQuantity: (productId: number, index: number) => void;
  clearProduct: (productId: number, productName: string, index: number) => void;
};

function ItemGridView({
  index,
  isLargerThanLg,
  item,
  productStates,
  handleIncreaseQuantity,
  handleDecreaseQuantity,
  clearProduct,
}: ItemViewProps) {
  return (
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
              c="brand.7"
              sx={{
                cursor: "pointer",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
              fw={700}
              component="a"
              href={item?.product?.product_url ? item.product.product_url : ""}
              target="_blank"
              rel="noopener noreferrer"
            >
              Go to source
            </Text>
            <IconArrowBadgeRight size={20} style={{ color: "#1098AD" }} />
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
                `(Updated: ${formatDateRelative(item.product.updated_at)})`}
            </Text>
          </Stack>

          <Group noWrap>
            <ActionIcon
              loading={productStates.loadingDecrease[index]}
              size="xl"
              color={productStates.decreased[index] ? "teal" : "brand"}
              variant="transparent"
              onClick={() => {
                if (item?.id) {
                  handleDecreaseQuantity(item.id, index);
                }
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
              color={productStates.increased[index] ? "teal" : "brand"}
              variant="transparent"
              onClick={() => {
                if (item?.id) {
                  handleIncreaseQuantity(item.id, index);
                }
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
              if (item?.id && item.product?.name) {
                clearProduct(item.id, item.product.name, index);
              }
            }}
          >
            <IconX size="1.2rem" />
          </ActionIcon>
          <Stack spacing={0} miw={50} mt={70}>
            <Text c="dimmed">Total: </Text>
            <Text weight={500}>
              €
              {item.product?.price && item.quantity
                ? (item.product.price * item.quantity).toFixed(2)
                : "N/A"}
            </Text>
          </Stack>
        </Stack>
      </Group>
    </Paper>
  );
}

function ItemListView({
  index,
  isLargerThanLg,
  item,
  productStates,
  handleIncreaseQuantity,
  handleDecreaseQuantity,
  clearProduct,
}: ItemViewProps) {
  return <Checkbox label="Custom icon: indeterminate" />;
}
