"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../api/firebase/config";
import { usePathname, useRouter } from "next/navigation";
import { GET_MS_ME } from "../api/graphql/queries";
import { INITIALIZE_MS_USER_PROFILE } from "../api/graphql/mutations";
import client from "../api/graphql/client";
import { useMutation } from "@apollo/client";
import {
  ADD_TO_CART,
  UPDATE_CART_ITEM,
  REMOVE_FROM_CART,
  CLEAR_CART,
} from "../api/graphql/mutations";

const MSAuthContext = createContext();


export const MSAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize the mutation hook
  const [initializeMSUserProfileMutation] = useMutation(
    INITIALIZE_MS_USER_PROFILE,
    { client }
  );

  useEffect(() => {
    const registrationPath = "/medical-supplies/auth/registering";
    const loginPath = "/medical-supplies/auth/login";
    const signupPath = "/medical-supplies/auth/signup";
    const homePath = "/medical-supplies/";

    // Define public paths that don't require authentication
    const publicPaths = [loginPath, signupPath, homePath];

    // New helper functions for role-based routing
    const getRoleBasedPath = (userRole) => {
      if (!userRole) return homePath;
      const basePath =
        userRole === "admin"
          ? "/medical-supplies/admin"
          : `/medical-supplies/${userRole}`;
      return basePath;
    };

    const canAccessCurrentRoute = (userRole, currentPath) => {
      if (publicPaths.includes(currentPath)) return true;
      if (!userRole) return false;

      const rolePrefix =
        userRole === "admin"
          ? "/medical-supplies/admin"
          : `/medical-supplies/${userRole}`;
      return currentPath.startsWith(rolePrefix);
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (firebaseUser) {
        try {
          // Get Firebase token
          const token = await firebaseUser.getIdToken();
          localStorage.setItem("ms_token", token);

          try {
            // Try to fetch user profile data
            const { data, error: queryError } = await client.query({
              query: GET_MS_ME,
              fetchPolicy: "network-only", // Important to get fresh data
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
                  await initializeMSUserProfileMutation({
                    variables: { email: firebaseUser.email },
                  });
                  // Re-fetch after initialization attempt
                  const { data: refetchData } = await client.query({
                    query: GET_MS_ME,
                    fetchPolicy: "network-only",
                  });

                  if (refetchData && refetchData.msMe) {
                    handleProfileData(firebaseUser, refetchData.msMe);
                  } else {
                    handleIncompleteProfile(firebaseUser); // Still couldn't get profile
                  }
                } catch (initError) {
                  console.error(
                    "Error during profile initialization attempt:",
                    initError
                  );
                  handleIncompleteProfile(firebaseUser); // Initialization failed
                }
              } else {
                handleIncompleteProfile(firebaseUser); // Other query error
              }
            } else if (data && data.msMe) {
              // Profile data exists
              console.log("Fetched profile data:", data.msMe);
              handleProfileData(firebaseUser, data.msMe);
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
      const userRole = profileData.role;

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || profileData.contactName || "",
        photoURL: firebaseUser.photoURL || profileData.profileImageUrl || "",
        role: userRole,
        isApproved: profileData.isApproved || false,
        profileComplete: profileData.profileComplete || false,
        // Include other relevant fields fetched
        companyName: profileData.companyName,
        contactName: profileData.contactName,
        phoneNumber: profileData.phoneNumber,
        address: profileData.address,
        efdaLicenseUrl: profileData.efdaLicenseUrl,
        businessLicenseUrl: profileData.businessLicenseUrl,
        cart: profileData.cart,
      });

      if (!profileData.profileComplete && pathname !== registrationPath) {
        // If profile is incomplete and user is not on registration page, redirect to registration
        router.push(registrationPath);
      } else if (profileData.profileComplete) {
        // If profile is complete
        if (
          pathname === registrationPath ||
          pathname === loginPath ||
          pathname === signupPath
        ) {
          // And user is on auth pages, redirect to appropriate 
          const roleDashboard = `/medical-supplies${
            userRole === "admin" ? "/admin" : `/${userRole}`
          }/`;
          router.push(roleDashboard);
        } else if (!canAccessCurrentRoute(userRole, pathname)) {
          // Or if user is trying to access a route they don't have permission for
          console.log(
            `User with role ${userRole} cannot access ${pathname}, redirecting to appropriate `
          );
          const roleDashboard = `/medical-supplies${
            userRole === "admin" ? "/admin" : `/${userRole}`
          }/`;
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
        role: null,
        isApproved: false,
      });

      if (pathname !== registrationPath) {
        router.push(registrationPath);
      }
      setLoading(false);
    };

    const handleSignOut = async () => {
      setUser(null);
      localStorage.removeItem("ms_token");
      await client.clearStore(); // Clear Apollo cache on sign out
      setLoading(false);
    };

    return () => unsubscribe();
  }, [router, pathname, initializeMSUserProfileMutation]);

  // Check if a user can access a specific route based on their role
  const canAccessRoute = (route) => {
    if (!user || !user.role) return false;

    // Add the medical-supplies prefix if not already present
    const normalizedRoute = route.startsWith("/medical-supplies")
      ? route
      : `/medical-supplies${route}`;

    // For admin, check if route starts with admin
    if (user.role === "admin") {
      return normalizedRoute.startsWith("/medical-supplies/admin");
    }

    // For other roles, check if route starts with their role
    return normalizedRoute.startsWith(`/medical-supplies/${user.role}`);
  };

  const signup = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      // Call initializeMSUserProfile mutation AFTER successful Firebase signup
      if (userCredential.user) {
        try {
          await initializeMSUserProfileMutation({ variables: { email } });
          console.log("MS User profile initialized via mutation.");
        } catch (mutationError) {
          // Log error, but don't block the signup flow entirely
          console.error(
            "Error initializing MS user profile via mutation:",
            mutationError
          );
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
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      await client.refetchQueries({ include: ["GetMSMe"] }); // Refetch profile on login
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
        await initializeMSUserProfileMutation({
          variables: { email: result.user.email },
        });
        console.log(
          "MS User profile initialized/verified via mutation after Google sign-in."
        );
      } catch (mutationError) {
        console.error(
          "Error initializing MS user profile after Google sign-in:",
          mutationError
        );
      }
      await client.refetchQueries({ include: ["GetMSMe"] }); // Refetch profile
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
      router.push("/medical-supplies/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // Cart operations remain the same
  const addToCart = async (
    productId,
    quantity,
    price,
    productName,
    productImage
  ) => {
    try {
      const { data } = await client.mutate({
        mutation: ADD_TO_CART,
        variables: { productId, quantity, price, productName, productImage },
      });

      if (data && data.addToCart) {
        // Update user state with new cart data
        setUser((prevUser) => ({
          ...prevUser,
          cart: data.addToCart.cart,
        }));
        return data.addToCart;
      }
      return null;
    } catch (error) {
      console.error("Add to cart error:", error);
      throw error;
    }
  };

  const updateCartItem = async (productId, quantity) => {
    try {
      const { data } = await client.mutate({
        mutation: UPDATE_CART_ITEM,
        variables: { productId, quantity },
      });

      if (data && data.updateCartItem) {
        setUser((prevUser) => ({
          ...prevUser,
          cart: data.updateCartItem.cart,
        }));
        return data.updateCartItem;
      }
      return null;
    } catch (error) {
      console.error("Update cart item error:", error);
      throw error;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const { data } = await client.mutate({
        mutation: REMOVE_FROM_CART,
        variables: { productId },
      });

      if (data && data.removeFromCart) {
        setUser((prevUser) => ({
          ...prevUser,
          cart: data.removeFromCart.cart,
        }));
        return data.removeFromCart;
      }
      return null;
    } catch (error) {
      console.error("Remove from cart error:", error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      const { data } = await client.mutate({
        mutation: CLEAR_CART,
      });

      if (data && data.clearCart) {
        setUser((prevUser) => ({
          ...prevUser,
          cart: data.clearCart.cart,
        }));
        return data.clearCart;
      }
      return null;
    } catch (error) {
      console.error("Clear cart error:", error);
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
    <MSAuthContext.Provider
      value={{
        user,
        loading,
        signup,
        login,
        logout,
        signInWithGoogle,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        canAccessRoute, // New utility function for role-based route checks
        // Helper function to get base path for the current user's role
        getRolePath: () =>
          user?.role
            ? `/medical-supplies${
                user.role === "admin" ? "/admin" : `/${user.role}`
              }`
            : null,
      }}
    >
      {children}
    </MSAuthContext.Provider>
  );
};

export const useMSAuth = () => useContext(MSAuthContext);
