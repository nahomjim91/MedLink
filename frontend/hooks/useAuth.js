"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth } from "../app/telehealth/api/firebase/config";
import { usePathname, useRouter } from "next/navigation";
import { GET_MY_PROFILE } from "../app/telehealth/api/graphql/queries";
import { INITIALIZE_USER_PROFILE } from "../app/telehealth/api/graphql/mutations";
import client from "../app/telehealth/api/graphql/client";
import { useMutation } from '@apollo/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  // Initialize the mutation hook
  const [initializeUserProfileMutation] = useMutation(INITIALIZE_USER_PROFILE, { client });

  useEffect(() => {
    const registrationPath = "/telehealth/auth/registering";
    const dashboardPath = "/telehealth/dashboard"; // Define the dashboard path

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (firebaseUser) {
        try {
          // Get Firebase token
          const token = await firebaseUser.getIdToken();
          localStorage.setItem("token", token);

          try {
            // Try to fetch user profile data
            const { data, error: queryError } = await client.query({
              query: GET_MY_PROFILE,
              fetchPolicy: "network-only", // Important to get fresh data
            });

            if (queryError) {
              // Handle case where profile might not exist yet
              console.warn("Profile query error (might be temporary):", queryError);
              // Attempt to initialize if it seems like a new user without a profile
              if (queryError.message.includes("Not found") || queryError.message.includes("null")) {
                try {
                  console.log("Attempting to initialize potentially missing profile...");
                  await initializeUserProfileMutation({ variables: { email: firebaseUser.email } });
                  // Re-fetch after initialization attempt
                  const { data: refetchData } = await client.query({ 
                    query: GET_MY_PROFILE, 
                    fetchPolicy: "network-only" 
                  });
                  
                  if (refetchData && refetchData.me) {
                    handleProfileData(firebaseUser, refetchData.me);
                  } else {
                    handleIncompleteProfile(firebaseUser); // Still couldn't get profile
                  }
                } catch (initError) {
                  console.error("Error during profile initialization attempt:", initError);
                  handleIncompleteProfile(firebaseUser); // Initialization failed
                }
              } else {
                handleIncompleteProfile(firebaseUser); // Other query error
              }
            } else if (data && data.me) {
              // Profile data exists
              console.log("Fetched profile data:", data.me);
              handleProfileData(firebaseUser, data.me);
            } else {
              // No profile data found, but no error
              handleIncompleteProfile(firebaseUser);
            }
          } catch (error) {
            console.error("Profile fetch/processing error:", error);
            handleIncompleteProfile(firebaseUser);
          }
        } catch (error) {
          console.error("Token fetch error:", error);
          await handleSignOut();
        }
      } else {
        // User is signed out
        await handleSignOut();
      }
    });

    const handleProfileData = (firebaseUser, profileData) => {
      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email, 
        displayName: firebaseUser.displayName || profileData.firstName || "",
        photoURL: firebaseUser.photoURL || profileData.profileImageUrl || "",
        role: profileData.role,
        profileComplete: profileData.profileComplete,
        // Include other relevant fields fetched
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        gender: profileData.gender,
        dob: profileData.dob,
        phoneNumber: profileData.phoneNumber,
        doctorProfile: profileData.doctorProfile
      });

      // Handle routing based on profile completion status
      if (!profileData.profileComplete && pathname !== registrationPath) {
        // If profile is incomplete and user is not on registration page, redirect to registration
        router.push(registrationPath);
      } else if (profileData.profileComplete && 
                (pathname === registrationPath || pathname === "/telehealth/auth/login" || pathname === "/telehealth/auth/signup")) {
        // If profile is complete and user is on auth pages, redirect to dashboard
        router.push(dashboardPath);
      }
      
      setLoading(false);
    };

    const handleIncompleteProfile = (firebaseUser) => {
      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || "",
        photoURL: firebaseUser.photoURL || "",
        role: null,
        profileComplete: false
      });
      
      if (pathname !== registrationPath) {
        router.push(registrationPath);
      }
      setLoading(false);
    };

    const handleSignOut = async () => {
      setUser(null);
      localStorage.removeItem("token");
      await client.clearStore(); // Clear Apollo cache on sign out
      setLoading(false);
    };

    return () => unsubscribe();
  }, [router, pathname, initializeUserProfileMutation]);

  const signup = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Call initializeUserProfile mutation AFTER successful Firebase signup
      if (userCredential.user) {
        try {
          await initializeUserProfileMutation({ variables: { email } });
          console.log("User profile initialized via mutation.");
        } catch (mutationError) {
          // Log error, but don't block the signup flow entirely
          console.error("Error initializing user profile via mutation:", mutationError);
          // You might want to add retry logic or specific error handling here
        }
      }
      return userCredential.user;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await client.refetchQueries({ include: ["GetMyProfile"] }); // Refetch profile on login
      return userCredential.user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // Check if profile needs initialization for Google Sign-In too
      try {
        // Attempt to initialize - it's safe if the profile already exists
        await initializeUserProfileMutation({ variables: { email: result.user.email } });
        console.log("User profile initialized/verified via mutation after Google sign-in.");
      } catch (mutationError) {
        console.error("Error initializing user profile after Google sign-in:", mutationError);
      }
      await client.refetchQueries({ include: ["GetMyProfile"] }); // Refetch profile
      return result.user;
    } catch (error) {
      console.error("Google sign in error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // handleSignOut will clear state via onAuthStateChanged
      router.push("/telehealth/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signup,
        login,
        logout,
        signInWithGoogle
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);