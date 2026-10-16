import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add credentials include
axiosInstance.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response, // simply return successful responses
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url;
    const excludedUrls = ["/auth/signin"];

    const shouldSkipInterceptor = excludedUrls.some((url) =>
      requestUrl?.includes(url)
    );
    if (shouldSkipInterceptor) {
      return Promise.reject(error);
    }

    if (status === 401) {
      console.warn("Unauthorized! Handling 401...");

      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      localStorage.removeItem("id");
      localStorage.removeItem("access_token");

      window.location.href = "/";

      // Reject with a meaningful error
      return Promise.reject({
        type: "authError",
        message: "Session expired or unauthorized",
        status: 401,
      });
    }

    // For other errors, just pass along
    return Promise.reject(error);
  }
);

export { axiosInstance };
