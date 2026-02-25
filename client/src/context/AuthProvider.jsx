import { useEffect, useMemo, useState } from "react";
import {
  customerLogin as apiLogin,
  customerLogout as apiLogout,
  customerRegister as apiRegister,
  checkCustomerAuth,
} from "../api/customerAuth";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    checkCustomerAuth()
      .then((data) => {
        if (data.authenticated) {
          setCustomer(data.user);
        } else {
          setCustomer(null);
        }
      })
      .catch(() => {
        setCustomer(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email, password) => {
    const data = await apiLogin(email, password);
    setCustomer(data.user);
    return data;
  };

  const logout = async () => {
    await apiLogout();
    setCustomer(null);
  };

  const register = async ({ email, password, firstName, lastName }) => {
    const data = await apiRegister({ email, password, firstName, lastName });
    setCustomer(data.user);
    return data;
  };

  const value = useMemo(
    () => ({
      customer,
      isAuthenticated: !!customer,
      loading,
      login,
      logout,
      register,
    }),
    [customer, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
