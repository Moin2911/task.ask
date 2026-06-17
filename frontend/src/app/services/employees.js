import axios from "utils/axios";

const getAuthToken = () => window.localStorage.getItem("authToken");

const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const isFormData = (value) =>
  typeof FormData !== "undefined" && value instanceof FormData;

export const createEmployee = async (payload) => {
  const response = await axios.post("/auth/register", payload, {
    headers: {
      ...(isFormData(payload) ? {} : { "Content-Type": "application/json" }),
      ...getAuthHeaders(),
    },
  });
  return response?.data;
};

export const getEmployees = async () => {
  const response = await axios.get("/auth/employee", {
    headers: {
      ...getAuthHeaders(),
    },
  });
  return response?.data;
};

export const getEmployeeById = async (employeeId) => {
  const response = await axios.get(`/auth/employee/${employeeId}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  return response?.data;
};

export const updateEmployee = async (employeeId, payload) => {
  const response = await axios.patch(`/auth/employee/${employeeId}`, payload, {
    headers: {
      ...(isFormData(payload) ? {} : { "Content-Type": "application/json" }),
      ...getAuthHeaders(),
    },
  });
  return response?.data;
};

export const deleteEmployee = async (employeeId) => {
  const response = await axios.delete(`/auth/employee/${employeeId}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  return response?.data;
};
