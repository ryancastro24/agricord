// src/pages/NotFoundPage.tsx
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center">
      <h1 className="text-7xl font-bold text-green-600 mb-3">404</h1>
      <p className="text-gray-600 mb-6 text-lg">
        Oops! The page you’re looking for doesn’t exist.
      </p>

      <Button onClick={() => navigate(-1)} className="bg-green-600">
        Go Back
      </Button>
    </div>
  );
};

export default NotFoundPage;
