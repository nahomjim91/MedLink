"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth} from "@/app/telehealth/api/firebase/config";
import client from "@/app/telehealth/api/graphql/client";
import { useRouter } from "next/navigation";
import {
  REGISTER,
  CREATE_DOCTOR_PROFILE,
  CREATE_PATIENT_PROFILE,
} from "@/app/telehealth/api/graphql/mutations";
import { GET_USER } from "@/app/telehealth/api/graphql/queries";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Function to fetch complete user data from GraphQL
  const fetchUserData = async () => {
    try {
      const { data } = await client.query({
        query: GET_USER,
        fetchPolicy: "network-only", // Skip cache to ensure fresh data
      });

      if (data && data.me) {
        setUser(data.me);
        return data.me;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (firebaseUser) {
        // Get token and set it in localStorage
        const token = await firebaseUser.getIdToken();
        localStorage.setItem("token", token);

        // Attempt to fetch complete user data
        const userData = await fetchUserData();

        if (userData) {
          // We successfully got the complete user data from GraphQL
          setUser(userData);
        } else {
          // If GraphQL fetch fails, use basic Firebase data as fallback
          // This maintains some user context rather than null
          setUser({
            id: firebaseUser.uid, // Use id instead of uid for consistency
            email: firebaseUser.email,
            // Add placeholder values for required fields
            firstName: "",
            lastName: "",
            role: "",
          });

          // Since we couldn't get complete user data, redirect to profile completion
          // or login page depending on your app flow
          router.push("/telehealth/auth/login");
        }
      } else {
        // User is not authenticated
        setUser(null);
        localStorage.removeItem("token");
        await client.clearStore();
        router.push("/telehealth/auth/register");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const register = async (email, password, firstName, lastName, role) => {
    try {
      // Step 1: Register the user
      const { data } = await client.mutate({
        mutation: REGISTER,
        variables: {
          input: {
            email,
            password,
            firstName,
            lastName,
            role,
          },
        },
      });

      // Store token in localStorage
      const { token, user } = data.register;
      localStorage.setItem("token", token);

      // Log in with Firebase using the credentials
      await signInWithEmailAndPassword(auth, email, password);

      // Step 2: Create the appropriate profile based on role
      if (user.role === "DOCTOR") {
        const { data: doctorData } = await client.mutate({
          mutation: CREATE_DOCTOR_PROFILE,
          variables: {
            input: {
              specialization: "General", // Default value
              experience: 0, // Default value
              bio: "New doctor profile",
            },
          },
        });
        console.log("Doctor profile created:", doctorData.createDoctorProfile);
      } else if (user.role === "PATIENT") {
        const { data: patientData } = await client.mutate({
          mutation: CREATE_PATIENT_PROFILE,
          variables: {
            input: {
              dateOfBirth: "", // Default empty string
              gender: "", // Default empty string
            },
          },
        });
        console.log(
          "Patient profile created:",
          patientData.createPatientProfile
        );
      }

      // Set the complete user object
      setUser(user);
      return user;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);

      // Sign in the user with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Get the ID token from Firebase
      const idToken = await userCredential.user.getIdToken();
      localStorage.setItem("token", idToken);

      // Fetch the complete user data
      const userData = await fetchUserData();

      if (!userData) {
        throw new Error("Failed to fetch user data after login");
      }

      setLoading(false);
      return userData;
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("token");
      await client.clearStore();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
