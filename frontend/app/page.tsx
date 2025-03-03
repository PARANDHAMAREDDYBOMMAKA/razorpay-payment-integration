import PaymentButton from "./components/PaymentButton";
import { Toaster } from "react-hot-toast";

export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <Toaster position="top-right" />
      <div className="w-full max-w-md">
        <PaymentButton />
      </div>
    </div>
  );
}
