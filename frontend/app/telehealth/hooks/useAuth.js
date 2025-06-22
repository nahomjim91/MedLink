"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
} from "firebase/auth";
import { auth } from "../api/firebase/config";
import { usePathname, useRouter } from "next/navigation";
import { GET_MY_PROFILE } from "../api/graphql/queries";
import { INITIALIZE_USER_PROFILE } from "../api/graphql/mutations";
import client from "../api/graphql/client";
import { useMutation } from '@apollo/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // Initialize the mutation hook
  const [initializeUserProfileMutation] = useMutation(INITIALIZE_USER_PROFILE, { client });

  // Helper function to handle profile data processing
  const processProfileData = (firebaseUser, profileData) => {
    const userRole = profileData.role;
    const isProfileComplete = profileData.profileComplete || false;

    return {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || profileData.firstName || "",
      photoURL: firebaseUser.photoURL || profileData.profileImageUrl || "",
      emailVerified: firebaseUser.emailVerified,
      role: userRole,
      profileComplete: isProfileComplete,
      // Include other relevant fields fetched
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      gender: profileData.gender,
      dob: profileData.dob,
      phoneNumber: profileData.phoneNumber,
      doctorProfile: profileData.doctorProfile,
      patientProfile: profileData.patientProfile,
      createdAt: profileData.createdAt,
    };
  };

  // Refetch user profile method
  const refetchUser = async () => {
    if (!auth.currentUser) {
      console.warn("No authenticated user to refetch");
      return null;
    }

    setRefetching(true);
    
    try {
      // Reload Firebase user to get latest data
      await reload(auth.currentUser);
      
      // Get fresh Firebase token
      const token = await auth.currentUser.getIdToken(true); // Force refresh
      localStorage.setItem("token", token);

      // Check if email is verified
      if (!auth.currentUser.emailVerified) {
        const userData = {
          id: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName || "",
          photoURL: auth.currentUser.photoURL || "",
          emailVerified: false,
          role: null,
          profileComplete: false,
        };
        setUser(userData);
        return userData;
      }

      // Fetch fresh profile data from GraphQL
      const { data, error } = await client.query({
        query: GET_MY_PROFILE,
        fetchPolicy: "network-only", // Always fetch from network
      });

      if (error) {
        console.error("Error refetching user profile:", error);
        throw error;
      }

      if (data && data.me) {
        const updatedUser = processProfileData(auth.currentUser, data.me);
        setUser(updatedUser);
        console.log("User profile refetched successfully:", updatedUser);
        return updatedUser;
      } else {
        // Handle case where profile doesn't exist
        const incompleteUser = {
          id: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName || "",
          photoURL: auth.currentUser.photoURL || "",
          emailVerified: auth.currentUser.emailVerified,
          role: null,
          profileComplete: false,
        };
        setUser(incompleteUser);
        return incompleteUser;
      }

    } catch (error) {
      console.error("Error during user refetch:", error);
      throw error;
    } finally {
      setRefetching(false);
    }
  };

  useEffect(() => {
    const registrationPath = "/telehealth/auth/registering";
    const loginPath = "/telehealth/auth/login";
    const signupPath = "/telehealth/auth/signup";
    const verifyEmailPath = "/telehealth/auth/verify-email";
    const homePath = "/telehealth/";
    const dashboardPath = "/telehealth/dashboard";

    // Define public paths that don't require authentication
    const publicPaths = [loginPath, signupPath, homePath, verifyEmailPath];

    const canAccessCurrentRoute = (userRole, currentPath) => {
      if (publicPaths.includes(currentPath)) return true;
      if (!userRole) return false;

      // Check if user can access the current path based on their role
      const rolePrefix = `/telehealth/${userRole}`;
      return currentPath.startsWith(rolePrefix) || currentPath === dashboardPath;
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (firebaseUser) {
        try {
          // Get Firebase token
          const token = await firebaseUser.getIdToken();
          localStorage.setItem("token", token);

          // Check if email is verified
          if (!firebaseUser.emailVerified) {
            // Redirect to email verification page if not verified and not already there
            if (pathname !== verifyEmailPath) {
              console.log("Email not verified, redirecting to verification page");
              setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || "",
                photoURL: firebaseUser.photoURL || "",
                emailVerified: false,
                role: null,
                profileComplete: false,
              });
              router.push(verifyEmailPath);
              setLoading(false);
              return;
            } else {
              // User is on verification page, set minimal user data
              setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || "",
                photoURL: firebaseUser.photoURL || "",
                emailVerified: false,
                role: null,
                profileComplete: false,
              });
              setLoading(false);
              return;
            }
          }

          try {
            // Try to fetch user profile data (only if email is verified)
            const { data, error: queryError } = await client.query({
              query: GET_MY_PROFILE,
              fetchPolicy: "network-only",
            });

            if (queryError) {
              // Handle case where profile might not exist yet
              console.warn(
                "Profile query error (might be temporary):",
                queryError
              );
              // Attempt to initialize if it seems like a new user without a profile
              if (
                queryError.message.includes("Not found") ||
                queryError.message.includes("null")
              ) {
                try {
                  console.log(
                    "Attempting to initialize potentially missing profile..."
                  );
                  await initializeUserProfileMutation({
                    variables: { email: firebaseUser.email },
                  });
                  // Re-fetch after initialization attempt
                  const { data: refetchData } = await client.query({
                    query: GET_MY_PROFILE,
                    fetchPolicy: "network-only",
                  });

                  if (refetchData && refetchData.me) {
                    handleProfileData(firebaseUser, refetchData.me);
                  } else {
                    handleIncompleteProfile(firebaseUser);
                  }
                } catch (initError) {
                  console.error(
                    "Error during profile initialization attempt:",
                    initError
                  );
                  handleIncompleteProfile(firebaseUser);
                }
              } else {
                handleIncompleteProfile(firebaseUser);
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
        // User is signed out - redirect to home if not on a public path
        await handleSignOut();

        // Check if user is trying to access a protected route
        if (!publicPaths.includes(pathname) && !pathname.startsWith(homePath)) {
          console.log(
            "Unauthenticated user trying to access protected route, redirecting to home"
          );
          router.push(homePath);
        }
      }
    });

    const handleProfileData = (firebaseUser, profileData) => {
      const updatedUser = processProfileData(firebaseUser, profileData);
      setUser(updatedUser);

      // 1. Handle incomplete profile: Redirect to registration if not already there.
      if (!updatedUser.profileComplete && pathname !== registrationPath) {
        console.log("Profile incomplete, redirecting to registration.");
        router.push(registrationPath);
        setLoading(false);
        return;
      }

      // 2. Handle complete profile:
      if (updatedUser.profileComplete) {
        // Redirect away from auth/registration pages
        if (
          pathname === registrationPath ||
          pathname === loginPath ||
          pathname === signupPath ||
          pathname === verifyEmailPath
        ) {
          console.log(
            "Profile complete, redirecting from auth page to dashboard."
          );
          const roleDashboard = updatedUser.role 
            ? `/telehealth/${updatedUser.role}` 
            : dashboardPath;
          router.push(roleDashboard);
        }
        // Redirect if user tries to access a route they shouldn't
        else if (!canAccessCurrentRoute(updatedUser.role, pathname)) {
          console.log(
            `User with role ${updatedUser.role} cannot access ${pathname}, redirecting to appropriate dashboard.`
          );
          const roleDashboard = updatedUser.role 
            ? `/telehealth/${updatedUser.role}` 
            : dashboardPath;
          router.push(roleDashboard);
        }
      }

      setLoading(false);
    };

    const handleIncompleteProfile = (firebaseUser) => {
      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || "",
        photoURL: firebaseUser.photoURL || "",
        emailVerified: firebaseUser.emailVerified,
        role: null,
        profileComplete: false,
      });

      if (pathname !== registrationPath) {
        router.push(registrationPath);
      }
      setLoading(false);
    };

    const handleSignOut = async () => {
      setUser(null);
      localStorage.removeItem("token");
      await client.clearStore();
      setLoading(false);
    };

    return () => unsubscribe();
  }, [router, pathname, initializeUserProfileMutation]);

  // Check if a user can access a specific route based on their role
  const canAccessRoute = (route) => {
    if (!user || !user.role) return false;

    // Add the telehealth prefix if not already present
    const normalizedRoute = route.startsWith("/telehealth")
      ? route
      : `/telehealth${route}`;

    // For specific roles, check if route starts with their role
    return normalizedRoute.startsWith(`/telehealth/${user.role}`) || 
           normalizedRoute === "/telehealth/dashboard";
  };

  const signup = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      // Send email verification immediately after signup
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
        console.log("Email verification sent");
        
        // Don't initialize profile until email is verified
        // The profile will be initialized after email verification
      }
      
      return userCredential.user;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      // Check if email is verified for login
      if (!userCredential.user.emailVerified) {
        // Don't proceed with profile fetch if email not verified
        return userCredential.user;
      }
      
      await client.refetchQueries({ include: ["GetMyProfile"] });
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
      
      // Handle email verification for Google users (edge case)
      if (!result.user.emailVerified) {
        console.log("Google user email not verified, sending verification");
        await sendEmailVerification(result.user);
        return result.user; // Let the auth state handler manage the flow
      }
      
      // Check if user profile already exists
      try {
        const { data } = await client.query({
          query: GET_MY_PROFILE,
          fetchPolicy: "network-only",
        });
        
        if (data && data.me) {
          // Profile exists, user is logging in
          console.log("Existing Google user logging in");
          await client.refetchQueries({ include: ["GetMyProfile"] });
          return result.user;
        } else {
          // Profile doesn't exist, initialize it for new user
          console.log("New Google user, initializing profile");
          await initializeUserProfileMutation({
            variables: { email: result.user.email },
          });
          console.log("User profile initialized for new Google user");
        }
      } catch (queryError) {
        // If query fails (user doesn't exist or other error), try to initialize profile
        console.log("Profile query failed, attempting to initialize profile");
        try {
          await initializeUserProfileMutation({
            variables: { email: result.user.email },
          });
          console.log("User profile initialized after Google sign-in");
        } catch (mutationError) {
          console.error("Error initializing user profile after Google sign-in:", mutationError);
          // Don't throw here - let the auth state handler manage the user flow
        }
      }
      
      // Refetch queries to ensure fresh data
      await client.refetchQueries({ include: ["GetMyProfile"] });
      return result.user;
      
    } catch (error) {
      console.error("Google sign in error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push("/telehealth/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // Email verification functions
  const sendVerificationEmail = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        console.log("Verification email sent");
        return true;
      }
      throw new Error("No user found");
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw error;
    }
  };

  const checkEmailVerification = async () => {
    try {
      if (auth.currentUser) {
        await reload(auth.currentUser);
        const isVerified = auth.currentUser.emailVerified;
        
        if (isVerified) {
          // Initialize profile after email verification
          try {
            await initializeUserProfileMutation({
              variables: { email: auth.currentUser.email },
            });
            console.log("User profile initialized after email verification");
          } catch (mutationError) {
            console.error(
              "Error initializing user profile after email verification:",
              mutationError
            );
          }
        }
        
        return isVerified;
      }
      return false;
    } catch (error) {
      console.error("Error checking email verification:", error);
      throw error;
    }
  };

  const sendPasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log("Password reset email sent");
      return true;
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refetching,
        signup,
        login,
        logout,
        signInWithGoogle,
        sendVerificationEmail,
        checkEmailVerification,
        sendPasswordReset,
        canAccessRoute,
        refetchUser,
        getRolePath: () =>
          user?.role
            ? `/telehealth/${user.role}`
            : "/telehealth/dashboard",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);