import { Flex, Heading, Text } from "@radix-ui/themes";
import { LoadingScreen } from "./loading-screen";

export function CrudPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Flex justify="between" align="start" gap="4" wrap="wrap">
      <div>
        <Heading size="7">{title}</Heading>
        <Text as="p" color="gray" mt="2">{description}</Text>
      </div>
      {action}
    </Flex>
  );
}

export function CrudPageState({
  loading,
  error,
  label,
  description,
  children,
}: {
  loading: boolean;
  error: unknown;
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  if (loading) return <LoadingScreen fullScreen={false} label={label} description={description} />;
  if (error) return <Text color="red" role="alert">{error instanceof Error ? error.message : "The records could not be loaded."}</Text>;
  return <>{children}</>;
}

export const requestMessage = (error: unknown) =>
  error instanceof Error ? error.message : "The request could not be completed.";
