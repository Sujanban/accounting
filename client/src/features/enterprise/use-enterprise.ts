import { useQuery } from "@tanstack/react-query";
import { enterpriseApi } from "./enterprise-api";
export const useBranches = () => useQuery({ queryKey: ["enterprise", "branches"], queryFn: ({ signal }) => enterpriseApi.branches(signal) });
export const useBranchWarehouses = (branchId: string) => useQuery({ queryKey: ["enterprise", "warehouses", branchId], queryFn: ({ signal }) => enterpriseApi.warehouses(branchId, signal), enabled: Boolean(branchId) });
