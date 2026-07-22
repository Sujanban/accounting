import { Card, Flex, Heading, Text } from "@radix-ui/themes";

export function PlaceholderPage({ title, description }: { title: string; description?: string }) {
  return <Flex direction="column" gap="5"><div><Heading size="7">{title}</Heading><Text as="p" color="gray" mt="2">{description ?? "This workspace is ready to connect to its TanStack Query hooks."}</Text></div><Card size="3"><Text color="gray" size="2">The navigation and route are ready. This feature will display its live company data here.</Text></Card></Flex>;
}
