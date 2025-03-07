import Link from "next/link";
import React, { useState } from "react";
import { useAuthInfo } from "@/utils/auth/index";
import {
  Paper,
  Text,
  Group,
  Container,
  Stack,
  Button,
  Flex,
  Box,
  Title,
  ActionIcon,
  Tooltip,
  Divider,
  Image,
  Loader,
} from "@mantine/core";
import {
  IconShoppingCart,
  IconCheck,
  IconShoppingCartOff,
  IconX,
  IconSquareRoundedMinus,
  IconSquareRoundedPlusFilled,
} from "@tabler/icons-react";
import { useMediaQuery } from "@mantine/hooks";
// Intenral: API
import basketItemsApi from "@/utils/basketItemsApi";
import useApiSubmit from "@/utils/useApiSubmit";
import { useGlobalContext } from "@/Context/globalContext";
import useBasketItems from "@/hooks/useBasketItems";
import { useQueryClient } from "@tanstack/react-query";

type ProductStateType = {
  loadingIncrease: Record<number, boolean>;
  loadingDecrease: Record<number, boolean>;
  loadingClearing: Record<number, boolean>;
  decreased: Record<number, boolean>;
  increased: Record<number, boolean>;
};

export default function BasketPreview() {
  const isLargerThanSm = useMediaQuery("(min-width: 768px)", undefined, {
    getInitialValueInEffect: false,
  });

  const queryClient = useQueryClient();

  const { accessToken, user } = useAuthInfo();

  const {
    isLoading: isLoadingBasketItems,
    basketItemsData,
    basketItemsMetaData,
  } = useBasketItems();

  const handleSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ["basket_items"],
      refetchType: "active",
    });
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
        // Don't update the 'added' state if it was not successful
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

  if (!isLargerThanSm || !user) {
    return undefined;
  }

  return (
    <Stack
      spacing={0}
      miw={300}
      style={{
        borderLeft: "1px solid #ADB5BD", // Apply border to the left side
        borderRight: "1px solid #ADB5BD",
        borderBottom: "1px solid #ADB5BD",
        minWidth: "3n0px",
        maxWidth: "400px",
        marginRight: "20px",
      }}
    >
      <Stack
        mb="md"
        style={{
          position: "sticky",
          top: 80,
          zIndex: 10,
        }}
      >
        <Box
          p="sm"
          style={{
            backgroundColor: "white",
            borderBottom: "1px solid #ADB5BD",
          }}
        >
          <Title order={3} mt="sm">
            Basket Preview
          </Title>
          <Text size="sm" c="dimmed">
            {`${isLoadingBasketItems ? "Loading" : "Showing"} 10 latest items`}
          </Text>
          <Divider my="xs" />
          <Stack>
            <Group>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "3rem", // Width of the circle
                  height: "3rem", // Height of the circle
                  backgroundColor: "#15AABF", // Background color of the circle
                  borderRadius: "50%", // Makes the div circular
                }}
              >
                <IconShoppingCart size="2.3rem" color="white" stroke="0.1rem" />
              </div>
              <Stack spacing={0}>
                <Text color="#15AABF" size="xl" fw={700}>
                  €
                  {basketItemsMetaData?.total_price
                    ? basketItemsMetaData.total_price
                    : 0}
                </Text>
                <Text color="grey" size="sm" fw={600}>
                  Guide price
                </Text>
              </Stack>
            </Group>
            <Tooltip
              label="Log in to access the basket"
              disabled={!!user}
              events={{
                hover: true,
                focus: false,
                touch: true,
              }}
            >
              <Link href={user ? "/basket" : "#"} passHref>
                <Button
                  style={{ width: "100%" }}
                  variant="filled"
                  radius="xl"
                  size="sm"
                  color={user ? "default" : "gray.6"}
                >
                  Go to basket
                </Button>
              </Link>
            </Tooltip>
          </Stack>
          {/* <Box
              p="sm"
              style={{
                borderBottom: "1px solid #ADB5BD",
              }}
            ></Box> */}
        </Box>
      </Stack>

      {user ? (
        isLoadingBasketItems ? (
          <Paper>
            <Stack align="center" m="xl">
              <Loader />
              <Text fw={500}>Loading basket items</Text>
            </Stack>
          </Paper>
        ) : basketItemsData && basketItemsData.length > 0 ? (
          basketItemsData.map((item, index) => (
            <Paper key={item.id} shadow="xs" radius="xs" maw={300} withBorder>
              <Flex
                justify="center"
                align="flex-start"
                direction="row"
                p="md"
                gap="md"
              >
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

                  <Text fw={750} color="#15AABF">
                    €{item.product?.price}
                  </Text>

                  <Group noWrap spacing={10}>
                    <ActionIcon
                      loading={productStates.loadingDecrease[index]}
                      size="xl"
                      color={productStates.decreased[index] ? "teal" : "brand"}
                      variant="transparent"
                      onClick={() => {
                        if (item?.id) handleDecreaseQuantity(item.id, index);
                      }}
                    >
                      {productStates.decreased[index] ? (
                        <IconCheck size="2.2rem" />
                      ) : (
                        <IconSquareRoundedMinus size="2.5rem" />
                      )}
                    </ActionIcon>
                    <Text weight={500}>{item.quantity}</Text>
                    <ActionIcon
                      loading={productStates.loadingIncrease[index]}
                      size="xl"
                      color={productStates.increased[index] ? "teal" : "brand"}
                      variant="transparent"
                      onClick={() => {
                        if (item?.id) handleIncreaseQuantity(item.id, index);
                      }}
                    >
                      {productStates.increased[index] ? (
                        <IconCheck size="2.2rem" />
                      ) : (
                        <IconSquareRoundedPlusFilled size="2.5rem" />
                      )}
                    </ActionIcon>
                  </Group>
                </Stack>

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
              </Flex>
            </Paper>
          ))
        ) : (
          <Paper>
            <Stack align="center" m="xl">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "3rem", // Width of the circle
                  height: "3rem", // Height of the circle
                  backgroundColor: "#868E96", // Background color of the circle
                  borderRadius: "50%", // Makes the div circular
                }}
              >
                <IconShoppingCart size="2.3rem" color="white" stroke="0.1rem" />
              </div>

              <Text fw={500}>Basket is emtpy</Text>
            </Stack>
          </Paper>
        )
      ) : (
        <Paper>
          <Stack align="center" m="xl">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "3rem", // Width of the circle
                height: "3rem", // Height of the circle
                backgroundColor: "#868E96", // Background color of the circle
                borderRadius: "50%", // Makes the div circular
              }}
            >
              <IconShoppingCartOff
                size="2.3rem"
                color="white"
                stroke="0.1rem"
              />
            </div>

            <Text fw={500}>Log in to access the basket</Text>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
