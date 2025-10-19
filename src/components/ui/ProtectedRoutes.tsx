// src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import supabase from "@/db/config";
import AllPageLoading from "@/dashboardComponents/AllPageLoading";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[]; // 👈 Optional list of allowed roles
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        setIsAuthenticated(true);

        // ✅ Fetch user details (role from metadata)
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUserRole(user?.user_metadata?.role || "guest");
      } else {
        setIsAuthenticated(false);
      }

      setLoading(false);
    };

    fetchSession();

    // ✅ Listen for login/logout changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) return <AllPageLoading />;

  // ⛔ Not logged in → redirect to login
  if (!isAuthenticated) return <Navigate to="/" replace />;

  // ⛔ Logged in but role not allowed → redirect to 404
  if (allowedRoles && !allowedRoles.includes(userRole || "")) {
    return <Navigate to="/404" state={{ from: location }} replace />;
  }

  // ✅ Allowed
  return <>{children}</>;
};

export default ProtectedRoute;
