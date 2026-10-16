import { AxiosError, AxiosRequestConfig } from "axios";
import { axiosInstance } from "./axiosInstance.ts";

const isAxiosError = (error: unknown): error is AxiosError => {
  return error instanceof Error && "response" in error;
};

const handleApiError = (error: unknown): never => {
  if (isAxiosError(error)) {
    const errorData = error.response?.data;
    if (errorData) throw errorData;
    throw {
      type: "apiError",
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
    };
  }
  throw error;
};

export const get = async (url: string, params = {}) => {
  try {
    const res = await axiosInstance.get(url, { params });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getCsv = async (url: string, config?: AxiosRequestConfig) => {
  try {
    const res = await axiosInstance.get(url, config);
    return config?.responseType === "blob" ? res : res.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const post = async (url: string, data = {}, config?: AxiosRequestConfig) => {
  try {
    const res = await axiosInstance.post(url, data, config);
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const put = async (url: string, data = {}) => {
  try {
    const res = await axiosInstance.put(url, data);
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const del = async (url: string) => {
  try {
    const res = await axiosInstance.delete(url);
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const patch = async (url: string, data = {}) => {
  try {
    const res = await axiosInstance.patch(url, data);
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};
