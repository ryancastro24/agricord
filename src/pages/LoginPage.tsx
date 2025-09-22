import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { HiOutlineMail } from "react-icons/hi";
import { MdLockOutline } from "react-icons/md";
const LoginPage = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-[url(./src/assets/farming.jpg)] bg-cover bg-center">
      <div className="bg-white flex items-center flex-col  p-8 h-full  shadow-lg w-[400px]  ml-auto mr-[100px]">
        <div className="w-[100px] h-[100px] bg-gray-300 rounded-full mb-8"></div>

        <div className="grid w-full max-w-sm items-center gap-3">
          <Label htmlFor="email" className="flex items-center gap-1">
            {" "}
            <HiOutlineMail size={15} />
            Email
          </Label>
          <Input type="email" id="email" placeholder="example@example.com" />
        </div>

        <div className="grid w-full max-w-sm mt-5 items-center gap-3">
          <Label htmlFor="password" className="flex items-center gap-1">
            {" "}
            <MdLockOutline size={15} />
            Password
          </Label>
          <Input type="password" id="password" placeholder="Enter Password" />
        </div>

        <div className="w-full">
          <Button className="w-full h-[50px] mt-8">LOGIN</Button>
        </div>

        <div className="w-full mt-5">
          <h2 className="text-sm">forgot password? recover</h2>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
