// src/services/api.d.ts

export const authAPI: {
  register: (formData: any) => Promise<any>; // Replace 'any' with a more specific return type if you have one
  login: (formData: any) => Promise<any>; // Replace 'any' with a more specific return type if you have one
  getProfile: () => Promise<any>; // Replace 'any' with a more specific return type if you have one
  forgotPassword: (data: { email?: string; mobileNumber?: string }) => Promise<any>; // Replace 'any' with a more specific return type
  verifyOtp: (data: { identifier: string; otp: string }) => Promise<any>; // Replace 'any' with a more specific return type
  resetPassword: (data: { identifier: string; otp: string; newPassword: string }) => Promise<any>; // Replace 'any' with a more specific return type
};