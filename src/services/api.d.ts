import { RegisterForm } from '../components/auth/Register'; // Assuming RegisterForm is exported from Register.tsx

export const authAPI: {
  register: (formData: RegisterForm) => Promise<any>; // Replace 'any' with a more specific return type if you have one
  // Add declarations for other functions in api.js here
};