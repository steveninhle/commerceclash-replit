export interface User {
  name: string;
  email: string;
  status: boolean;
}

export interface UserContextType {
  isLoggedIn: boolean;
  role: string;
  id: string;
  user: User | null;
  setIsLoggedIn: (value: boolean) => void;
  setRole: (value: string) => void;
  setId: (value: string) => void;
  setUser: (value: User) => void;
}
