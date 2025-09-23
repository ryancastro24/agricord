import { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ import router hook
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { HiOutlineMail } from "react-icons/hi";
import { MdLockOutline } from "react-icons/md";
import supabase from "@/db/config";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate(); // ✅ initialize router navigation

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      console.log("✅ Logged in user:", data.user);
      setErrorMsg("");

      // ✅ redirect to dashboard
      navigate("/dashboard/", { replace: true });
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-[url(./src/assets/farming.jpg)] bg-cover bg-center">
      <div className="bg-white flex items-center flex-col p-8 h-full shadow-lg w-[400px] ml-auto mr-[100px]">
        <div className="w-[100px] h-[100px] bg-gray-300 rounded-full mb-8"></div>

        {/* Error message */}
        {errorMsg && <p className="text-red-500 text-sm mb-4">{errorMsg}</p>}

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-5">
          <div className="grid w-full max-w-sm items-center gap-3">
            <Label htmlFor="email" className="flex items-center gap-1">
              <HiOutlineMail size={15} />
              Email
            </Label>
            <Input
              type="email"
              id="email"
              placeholder="example@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid w-full max-w-sm items-center gap-3">
            <Label htmlFor="password" className="flex items-center gap-1">
              <MdLockOutline size={15} />
              Password
            </Label>
            <Input
              type="password"
              id="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="w-full">
            <Button type="submit" className="w-full h-[50px] mt-3">
              LOGIN
            </Button>
          </div>
        </form>

        <div className="w-full mt-5">
          <h2 className="text-sm">
            Forgot password?{" "}
            <span className="text-blue-600 cursor-pointer">Recover</span>
          </h2>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
