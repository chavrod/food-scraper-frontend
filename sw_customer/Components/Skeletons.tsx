import {
  Flex,
  Paper,
  Title,
  Group,
  Text,
  Divider,
  Accordion,
  Grid,
  Skeleton,
  Box,
  Stack,
  Space,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";

// Skeleton for a single product item
const ProductSkeleton = () => (
  <Grid.Col span={12} md={6} xl={4}>
    <Paper h="190px" shadow="md" withBorder p="sm" m="xs" radius="md">
      <Flex
        gap="md"
        justify="flex-start"
        align="flex-start"
        direction="row"
        wrap="nowrap"
      >
        <Stack align="center">
          <Skeleton height={80} width={80} />
          <Skeleton height={60} width={60} />
        </Stack>
        <Stack style={{ width: "80%" }}>
          <Skeleton height={8} width={200} />
          <Skeleton height={8} width={160} />
          <Skeleton height={8} width={100} />
          <Space h={35} />
          <Group position="apart">
            <Skeleton height={25} width={35} />
            <Skeleton height={30} width={80} radius="lg" />
          </Group>
        </Stack>
      </Flex>
    </Paper>
  </Grid.Col>
);

// Full loading skeleton for the product grid
export const ProductGridSkeleton = () => (
  <Grid gutter="md" justify="center" m="sm">
    {Array.from({ length: 24 }).map((_, index) => (
      <ProductSkeleton key={index} />
    ))}
  </Grid>
);

// Basket Summary Skeleton Component
export const BasketSummarySkeleton = ({
  isLargerThanLg,
}: {
  isLargerThanLg: boolean;
}) => (
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
);

// Basket Items Component
const BasketItemSkeleton = () => (
  <Grid.Col span={12}>
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
);

// Basket Items Skeleton Component
export const BasketItemsSkeleton = () => (
  <Grid gutter={0} mb={65} maw={450}>
    {/* Shop filter skeleton */}
    <Paper withBorder>
      <Skeleton height={40} width={150}></Skeleton>
    </Paper>

    {/* Basket items skeleton */}
    {Array.from({ length: 8 }).map((_, index) => (
      <BasketItemSkeleton key={index} />
    ))}
  </Grid>
);
