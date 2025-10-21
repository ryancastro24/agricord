import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { HiOutlineMail } from "react-icons/hi";
import { MdLockOutline } from "react-icons/md";
import { Loader2 } from "lucide-react";
import supabase from "@/db/config";
import Logo from "@/assets/Agricord logo.png";
import FarmingBG from "@/assets/farming.png";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      const user = data.user;
      if (!user) {
        setErrorMsg("Login failed. Please try again.");
        setLoading(false);
        return;
      }

      const role = user.user_metadata?.role;

      if (role === "chairman")
        navigate("/dashboard/scanner", { replace: true });
      else if (role === "staff")
        navigate("/dashboard/cluster", { replace: true });
      else if (role === "admin") navigate("/dashboard/", { replace: true });
      else navigate("/dashboard/", { replace: true });
    } catch (err: any) {
      console.error("Unexpected login error:", err);
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex font-[Montserrat] items-center justify-center min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: `url(${FarmingBG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="bg-white flex flex-col items-center p-8 rounded shadow-xl w-[90%] sm:max-w-sm md:w-[350px] sm:h-auto md:h-auto">
        {/* Logo */}
        <div className="w-[200px] h-[80px] flex items-center justify-center mb-6">
          <img src={Logo} className="w-full" alt="Agricord logo" />
        </div>

        {/* Error */}
        {errorMsg && (
          <p className="text-red-500 text-sm text-center mb-4">
            {errorMsg} please try again
          </p>
        )}

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="w-full flex flex-col gap-5 text-sm sm:text-base"
        >
          <div className="grid w-full items-center gap-1">
            <Label htmlFor="email" className="flex text-xs items-center gap-1">
              <HiOutlineMail size={13} />
              Email
            </Label>
            <Input
              type="email"
              id="email"
              placeholder="example@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="grid w-full items-center gap-1">
            <Label
              htmlFor="password"
              className="flex text-xs items-center gap-1"
            >
              <MdLockOutline size={13} />
              Password
            </Label>
            <Input
              type="password"
              id="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-[45px] mt-3 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                Logging in...
              </>
            ) : (
              "LOGIN"
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="w-full mt-5 text-center">
          <h2 className="text-xs sm:text-sm">
            Forgot password?{" "}
            <span className="text-blue-600 cursor-pointer hover:underline">
              Recover
            </span>
          </h2>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
