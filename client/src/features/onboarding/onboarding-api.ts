import { apiClient } from "../../services/api-client";
import type { Session } from "../auth/auth-api";

export type CreateCompanyInput = {
  name: string;
  panNumber: string;
  vatRegistered: boolean;
  vatNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  logo?: string;
  fiscalYear: {
    name: string;
    startDateBS: string;
    endDateBS: string;
    startDateAD: string;
    endDateAD: string;
  };
};

export type CreateSettingsInput = {
  businessType: "RETAIL" | "WHOLESALE" | "SERVICE" | "MANUFACTURING" | "PHARMACY" | "RESTAURANT" | "OTHER";
  currency: string;
  currencySymbol: string;
  language: string;
  dateFormat: "BS" | "AD";
  timezone: string;
  decimalPlaces: number;
  allowNegativeStock: boolean;
};

export function createCompany(input: CreateCompanyInput) {
  return apiClient<{ company: Session["activeCompany"]; session: Session }>("/companies", {
    method: "POST",
    body: JSON.stringify(input),
    skipAuthRefresh: true
  });
}

export function createSettings(input: CreateSettingsInput) {
  return apiClient<{ settings: unknown; session: Session }>("/settings", {
    method: "POST",
    body: JSON.stringify(input),
    skipAuthRefresh: true
  });
}
