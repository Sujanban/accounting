import { apiClient } from "../../services/api-client";

export type Employee = { _id: string; employeeCode: string; name: string; branchId: string; baseSalary: number };
export type AttendanceEntry = { employeeId: string; attendanceType: "PRESENT" | "ABSENT" | "LEAVE" | "OVERTIME"; units: number };
export type AttendanceVoucher = { _id: string; attendanceDate: string; narration: string | null; entries: AttendanceEntry[] };
export type LeaveRequest = { _id: string; employeeId: string; leaveType: "ANNUAL" | "SICK" | "UNPAID" | "OTHER"; startDate: string; endDate: string; reason: string | null; status: "PENDING" | "APPROVED" | "REJECTED" };

export const payrollApi = {
  employees: (signal?: AbortSignal) => apiClient<Employee[]>("/payroll/employees", { signal }),
  createEmployee: (input: Omit<Employee, "_id"> & { email?: string | null }) => apiClient<Employee>("/payroll/employees", { method: "POST", body: JSON.stringify(input) }),
  updateEmployee: (id: string, input: Omit<Employee, "_id"> & { email?: string | null }) => apiClient<Employee>(`/payroll/employees/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  attendance: (signal?: AbortSignal) => apiClient<AttendanceVoucher[]>("/payroll/attendance", { signal }),
  createAttendance: (input: { attendanceDate: string; narration?: string; entries: AttendanceEntry[] }) => apiClient<AttendanceVoucher>("/payroll/attendance", { method: "POST", body: JSON.stringify(input) }),
  leaveRequests: (signal?: AbortSignal) => apiClient<LeaveRequest[]>("/leave-requests", { signal }),
  createLeaveRequest: (input: { employeeId: string; leaveType: LeaveRequest["leaveType"]; startDate: string; endDate: string; reason?: string }) => apiClient<LeaveRequest>("/leave-requests", { method: "POST", body: JSON.stringify(input) }),
  reviewLeaveRequest: (id: string, status: "APPROVED" | "REJECTED") => apiClient<LeaveRequest>(`/leave-requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
};
