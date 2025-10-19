// src/components/PublicRoute.tsx
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import supabase from "@/db/config";

interface PublicRouteProps {
  children: ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndRole = async () => {
      try {
        // Check for an active session
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;

        if (!session) {
          setLoading(false);
          return;
        }

        // Fetch the authenticated user
        const { data: userData, error } = await supabase.auth.getUser();
        if (error || !userData.user) {
          console.error("Error fetching user:", error);
          setLoading(false);
          return;
        }

        // Get custom role from user metadata (adjust field name if different)
        const role = userData.user.user_metadata?.role;

        // Redirect based on role
        if (role === "chairman") setRedirectPath("/dashboard/scanner");
        else if (role === "staff") setRedirectPath("/dashboard/cluster");
        else if (role === "admin") setRedirectPath("/dashboard");
        else setRedirectPath("/dashboard"); // default
      } catch (err) {
        console.error("Error checking auth:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkAuthAndRole();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) return <p>Loading...</p>;

  // ✅ Redirect if logged in and role is found
  if (redirectPath) return <Navigate to={redirectPath} replace />;

  // 🚪 If not authenticated, show public page (e.g., login/register)
  return <>{children}</>;
};

export default PublicRoute;
