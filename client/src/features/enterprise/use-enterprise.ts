import { useQuery } from "@tanstack/react-query";
import { enterpriseApi } from "./enterprise-api";
export const useBranches = () => useQuery({ queryKey: ["enterprise", "branches"], queryFn: ({ signal }) => enterpriseApi.branches(signal) });
export const useBranchWarehouses = (branchId: string, isActive: "true" | "false" | "all" = "true") => useQuery({ queryKey: ["enterprise", "warehouses", branchId, isActive], queryFn: ({ signal }) => enterpriseApi.warehouses(branchId, isActive, signal), enabled: Boolean(branchId) });
