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
import { GET_MS_ME } from "../api/graphql/queries";
import { GET_MY_CART } from "../api/graphql/cart/cartQuery";
import { INITIALIZE_MS_USER_PROFILE } from "../api/graphql/mutations";
import client from "../api/graphql/client";
import { useMutation } from "@apollo/client";
import {
  ADD_TO_CART,
  ADD_SPECIFIC_BATCH_TO_CART,
  UPDATE_CART_BATCH_ITEM,
  REMOVE_PRODUCT_FROM_CART,
  REMOVE_BATCH_FROM_CART,
  CLEAR_CART,
} from "../api/graphql/cart/cartMutation";

const MSAuthContext = createContext();

export const MSAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartData, setCartData] = useState({ items: [], totalItems: 0, totalPrice: 0 });
  const router = useRouter();
  const pathname = usePathname();

  // Initialize the mutation hook
  const [initializeMSUserProfileMutation] = useMutation(
    INITIALIZE_MS_USER_PROFILE,
    { client }
  );
  
  // Initialize cart mutation hooks
  const [addToCartMutation] = useMutation(ADD_TO_CART, { client });
  const [addSpecificBatchMutation] = useMutation(ADD_SPECIFIC_BATCH_TO_CART, { client });
  const [updateCartBatchItemMutation] = useMutation(UPDATE_CART_BATCH_ITEM, { client });
  const [removeProductMutation] = useMutation(REMOVE_PRODUCT_FROM_CART, { client });
  const [removeBatchMutation] = useMutation(REMOVE_BATCH_FROM_CART, { client });
  const [clearCartMutation] = useMutation(CLEAR_CART, { client });

   // Fetch cart data when user is authenticated
   useEffect(() => {
    const fetchCartData = async () => {
      if (user && user.userId && user.emailVerified) {
        try {
          const { data } = await client.query({
            query: GET_MY_CART,
            fetchPolicy: "network-only",
          });
          
          if (data && data.myCart) {
            setCartData(data.myCart);
          }
        } catch (error) {
          console.error("Error fetching cart data:", error);
        }
      }
    };

    fetchCartData();
  }, [user]);

  useEffect(() => {
    const registrationPath = "/medical-supplies/auth/registering";
    const loginPath = "/medical-supplies/auth/login";
    const signupPath = "/medical-supplies/auth/signup";
    const verifyEmailPath = "/medical-supplies/auth/verify-email";
    const homePath = "/medical-supplies/";
    
    // Define the waiting for approval path dynamically based on role
    const WaitingForApprovalPath = (role) =>
      `/medical-supplies/${role}/waiting-for-approval`;

    // Define public paths that don't require authentication
    const publicPaths = [loginPath, signupPath, homePath, verifyEmailPath];

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

          // Check if email is verified
          if (!firebaseUser.emailVerified) {
            // Redirect to email verification page if not verified and not already there
            if (pathname !== verifyEmailPath) {
              console.log("Email not verified, redirecting to verification page");
              setUser({
                userId: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || "",
                profileImageUrl: firebaseUser.photoURL || "",
                emailVerified: false,
                role: null,
                isApproved: false,
                profileComplete: false,
              });
              router.push(verifyEmailPath);
              setLoading(false);
              return;
            } else {
              // User is on verification page, set minimal user data
              setUser({
                userId: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || "",
                profileImageUrl: firebaseUser.photoURL || "",
                emailVerified: false,
                role: null,
                isApproved: false,
                profileComplete: false,
              });
              setLoading(false);
              return;
            }
          }

          try {
            // Try to fetch user profile data (only if email is verified)
            const { data, error: queryError } = await client.query({
              query: GET_MS_ME,
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
      const isProfileComplete = profileData.profileComplete || false;
      const isUserApproved = profileData.isApproved || false;

      setUser({
        userId: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || profileData.contactName || "",
        profileImageUrl:  profileData.profileImageUrl || firebaseUser.photoURL || "",
        emailVerified: firebaseUser.emailVerified,
        role: userRole,
        isApproved: isUserApproved,
        profileComplete: isProfileComplete,
        rejectionReason: profileData.rejectionReason || null,
        // Include other relevant fields fetched
        companyName: profileData.companyName,
        contactName: profileData.contactName,
        phoneNumber: profileData.phoneNumber,
        address: profileData.address,
        efdaLicenseUrl: profileData.efdaLicenseUrl,
        businessLicenseUrl: profileData.businessLicenseUrl,
        ratingStats: profileData.ratingStats,
        recentRatings: profileData.recentRatings,
      });

       // Fetch cart data after setting user
       client.query({
        query: GET_MY_CART,
        fetchPolicy: "network-only",
      }).then(({ data }) => {
        if (data && data.myCart) {
          setCartData(data.myCart);
        }
      }).catch(error => {
        console.error("Error fetching cart data:", error);
      });

      const currentWaitingPath = userRole
        ? WaitingForApprovalPath(userRole)
        : null;

      // 1. Handle incomplete profile: Redirect to registration if not already there.
      if (!isProfileComplete && pathname !== registrationPath) {
        console.log("Profile incomplete, redirecting to registration.");
        router.push(registrationPath);
        setLoading(false);
        return;
      }

      // 2. Handle complete profile BUT not approved: Redirect to waiting page if not already there.
      if (
        isProfileComplete &&
        !isUserApproved &&
        userRole &&
        pathname !== currentWaitingPath
      ) {
        console.log(
          "Profile complete but not approved, redirecting to waiting page."
        );
        router.push(currentWaitingPath);
        setLoading(false);
        return;
      }

      // 3. Handle complete AND approved profile:
      if (isProfileComplete && isUserApproved) {
        // Redirect away from auth/registration/waiting pages
        if (
          pathname === registrationPath ||
          pathname === loginPath ||
          pathname === signupPath ||
          pathname === verifyEmailPath ||
          (currentWaitingPath && pathname === currentWaitingPath)
        ) {
          console.log(
            "Profile complete and approved, redirecting from auth/waiting page to dashboard."
          );
          const roleDashboard = `/medical-supplies${
            userRole === "admin" ? "/admin" : `/${userRole}`
          }/`;
          router.push(roleDashboard);
        }
        // Redirect if user tries to access a route they shouldn't
        else if (!canAccessCurrentRoute(userRole, pathname)) {
          console.log(
            `User with role ${userRole} cannot access ${pathname}, redirecting to appropriate dashboard.`
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
        userId: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || "",
        profileImageUrl: firebaseUser.photoURL || "",
        emailVerified: firebaseUser.emailVerified,
        role: null,
        isApproved: false,
        profileComplete: false,
      });

      if (pathname !== registrationPath) {
        router.push(registrationPath);
      }
      setLoading(false);
    };

    const handleSignOut = async () => {
      setUser(null);
      localStorage.removeItem("ms_token");
      await client.clearStore();
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
      
      await client.refetchQueries({ include: ["GetMSMe"] });
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
        query: GET_MS_ME,
        fetchPolicy: "network-only",
      });
      
      if (data && data.msMe) {
        // Profile exists, user is logging in
        console.log("Existing Google user logging in");
        await client.refetchQueries({ include: ["GetMSMe"] });
        return result.user;
      } else {
        // Profile doesn't exist, initialize it for new user
        console.log("New Google user, initializing profile");
        await initializeMSUserProfileMutation({
          variables: { email: result.user.email },
        });
        console.log("MS User profile initialized for new Google user");
      }
    } catch (queryError) {
      // If query fails (user doesn't exist or other error), try to initialize profile
      console.log("Profile query failed, attempting to initialize profile");
      try {
        await initializeMSUserProfileMutation({
          variables: { email: result.user.email },
        });
        console.log("MS User profile initialized after Google sign-in");
      } catch (mutationError) {
        console.error("Error initializing MS user profile after Google sign-in:", mutationError);
        // Don't throw here - let the auth state handler manage the user flow
      }
    }
    
    // Refetch queries to ensure fresh data
    await client.refetchQueries({ include: ["GetMSMe"] });
    return result.user;
    
  } catch (error) {
    console.error("Google sign in error:", error);
    throw error;
  }
};
  const logout = async () => {
    try {
      await signOut(auth);
      router.push("/medical-supplies/auth/login");
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
            await initializeMSUserProfileMutation({
              variables: { email: auth.currentUser.email },
            });
            console.log("MS User profile initialized after email verification");
          } catch (mutationError) {
            console.error(
              "Error initializing MS user profile after email verification:",
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

  // Cart operations
  const addToCart = async (productId, quantity) => {
    try {
      const { data } = await addToCartMutation({
        variables: {
          input: { productId, quantity },
        },
        refetchQueries: [{ query: GET_MY_CART }],
      });
      
      if (data && data.addToCart) {
        setCartData(data.addToCart);
        return data.addToCart;
      }
      return null;
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  };

  const addSpecificBatchToCart = async (productId, batchId, quantity) => {
    try {
      const { data } = await addSpecificBatchMutation({
        variables: {
          input: { productId, batchId, quantity },
        },
        refetchQueries: [{ query: GET_MY_CART }],
      });
      
      if (data && data.addSpecificBatchToCart) {
        setCartData(data.addSpecificBatchToCart);
        return data.addSpecificBatchToCart;
      }
      return null;
    } catch (error) {
      console.error("Error adding specific batch to cart:", error);
      throw error;
    }
  };

  const updateCartBatchItem = async (productId, batchId, quantity) => {
    try {
      const { data } = await updateCartBatchItemMutation({
        variables: {
          input: { productId, batchId, quantity },
        },
        refetchQueries: [{ query: GET_MY_CART }],
      });
      
      if (data && data.updateCartBatchItem) {
        setCartData(data.updateCartBatchItem);
        return data.updateCartBatchItem;
      }
      return null;
    } catch (error) {
      console.error("Error updating cart batch item:", error);
      throw error;
    }
  };

  const removeProductFromCart = async (productId) => {
    try {
      const { data } = await removeProductMutation({
        variables: { productId },
        refetchQueries: [{ query: GET_MY_CART }],
      });
      
      if (data && data.removeProductFromCart) {
        setCartData(data.removeProductFromCart);
        return data.removeProductFromCart;
      }
      return null;
    } catch (error) {
      console.error("Error removing product from cart:", error);
      throw error;
    }
  };

  const removeBatchFromCart = async (productId, batchId) => {
    try {
      console.log("Removing batch from cart:", productId, "with batch ID:",batchId);
      const { data } = await removeBatchMutation({
        variables: { productId, batchId },
        refetchQueries: [{ query: GET_MY_CART }],
      });
      
      if (data && data.removeBatchFromCart) {
        setCartData(data.removeBatchFromCart);
        return data.removeBatchFromCart;
      }
      return null;
    } catch (error) {
      console.error("Error removing batch from cart:", error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      const { data } = await clearCartMutation({
        refetchQueries: [{ query: GET_MY_CART }],
      });
      
      if (data && data.clearCart) {
        setCartData(data.clearCart);
        return data.clearCart;
      }
      return null;
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
  };

  const refreshCart = async () => {
    try {
      const { data } = await client.query({
        query: GET_MY_CART,
        fetchPolicy: "network-only",
      });
      
      if (data && data.myCart) {
        setCartData(data.myCart);
        return data.myCart;
      }
      return null;
    } catch (error) {
      console.error("Error refreshing cart:", error);
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
        cart: cartData,
        signup,
        login,
        logout,
        signInWithGoogle,
        sendVerificationEmail,
        checkEmailVerification,
        sendPasswordReset,
        addToCart,
        addSpecificBatchToCart,
        updateCartBatchItem,
        removeProductFromCart,
        removeBatchFromCart,
        clearCart,
        refreshCart,
        canAccessRoute,
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