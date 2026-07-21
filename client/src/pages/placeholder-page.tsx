import { Card, Heading, Text } from "@radix-ui/themes";

export function PlaceholderPage({ title }: { title: string }) {
  return <Card size="3"><Heading size="6">{title}</Heading><Text as="p" color="gray" mt="2">This feature shell is ready to connect to its TanStack Query hooks.</Text></Card>;
}
