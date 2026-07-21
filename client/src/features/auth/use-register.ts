import { useMutation } from "@tanstack/react-query";
import { register } from "./auth-api";

export function useRegister() {
  return useMutation({
    mutationFn: register,
    retry: false
  });
}
