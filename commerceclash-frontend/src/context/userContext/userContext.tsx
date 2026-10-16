import { createContext, useState, ReactNode, useContext } from "react";
import { toast } from "sonner";
import { UserContextType, User } from "./types";

interface UserProviderProps {
  children: ReactNode;
}

export const UserContext = createContext<UserContextType | null>(null);

// Custom hook to use the context with proper error handling
export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};

// Helper functions for localStorage
const getStoredValue = (key: string, defaultValue: boolean | string | null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    toast.error("Something went wrong loading your session. Please refresh the page.");
    return defaultValue;
  }
};

const setStoredValue = (key: string, value: boolean | string | User) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    toast.error("Your session could not be saved. Changes may not persist after refresh.");
  }
};

export const UserProvider = ({ children }: UserProviderProps) => {
  // Initialize state from localStorage or default values
  const [isLoggedIn, setIsLoggedInState] = useState(() =>
    getStoredValue("isLoggedIn", false)
  );
  const [role, setRoleState] = useState(() => getStoredValue("role", ""));
  const [id, setIdState] = useState(() => getStoredValue("id", ""));
  const [user, setUserState] = useState(() => getStoredValue("user", null));

  // Custom setters that also update localStorage
  const setIsLoggedIn = (value: boolean) => {
    setIsLoggedInState(value);
    setStoredValue("isLoggedIn", value);
    if (!value) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("id");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
    }
  };

  const setRole = (value: string) => {
    setRoleState(value);
    setStoredValue("role", value);
  };

  const setId = (value: string) => {
    setIdState(value);
    setStoredValue("id", value);
  };

  const setUser = (value: User) => {
    setUserState(value);
    setStoredValue("user", value);
  };

  return (
    <UserContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        role,
        setRole,
        id,
        setId,
        user,
        setUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
