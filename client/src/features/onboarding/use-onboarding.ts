import { useMutation } from "@tanstack/react-query";
import { createCompany, createSettings } from "./onboarding-api";

export function useCreateCompany() {
  return useMutation({ mutationFn: createCompany, retry: false });
}

export function useCreateSettings() {
  return useMutation({ mutationFn: createSettings, retry: false });
}
