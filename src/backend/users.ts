import axios from "axios";

export type User = {
  id: string;
  email: string;
  user_metadata: {
    firstname: string;
    lastname: string;
    role: string;
    contact: string;
    address: string;
    profile_picture?: string;
  };
};

// Base API instance (replace with your backend URL)
const api = axios.create({
  baseURL: import.meta.env.VITE_USERS_API,
  headers: {
    "Content-Type": "application/json",
  },
});

// Function to get users
export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await api.get<User[]>("/users"); // <-- customize endpoint
    return response.data;
  } catch (error: any) {
    console.error("Error fetching users:", error.message);
    throw new Error(error.response?.data?.message || "Failed to fetch users");
  }
};

// Payload type for creating user
export type CreateUserPayload = {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  role: string;
  contact: string;
  address: string;
  profile_picture?: string;
};

export const createUser = async (payload: CreateUserPayload): Promise<User> => {
  try {
    const response = await api.post<User>("/users/register", payload); // POST request with body
    return response.data;
  } catch (error: any) {
    console.error("Error creating user:", error.message);
    throw new Error(error.response?.data?.message || "Failed to create user");
  }
};
