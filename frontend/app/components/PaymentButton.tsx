"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

declare global {
  interface Window {
    Razorpay: RazorpayInstance;
  }
}

interface RazorpayInstance {
  new (options: RazorpayOptions): Razorpay;
}

interface Razorpay {
  open(): void;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler(response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }): void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

const PaymentButton = () => {
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const loadRazorpayScript = () => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => setRazorpayLoaded(true);
      script.onerror = () => toast.error("Failed to load Razorpay script");
      document.body.appendChild(script);
    };

    loadRazorpayScript();
  }, []);

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      toast.error("Razorpay SDK not loaded. Please try again.");
      return;
    }

    const amountInPaise = parseInt(amount) * 100;
    if (!amount || isNaN(amountInPaise) || amountInPaise <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setLoading(true);
    toast.loading("Processing payment...");

    try {
      const { data } = await axios.post("http://localhost:8000/create-order", {
        amount: amountInPaise,
      });

      const options: RazorpayOptions = {
        key: "your-test-key",
        amount: data.order.amount,
        currency: "INR",
        name: "Test Payment",
        description: "Test Transaction",
        order_id: data.order.id,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const verification = await axios.post(
              "http://localhost:8000/verify-payment",
              response
            );
            if (verification.data.success) {
              toast.dismiss();
              toast.success("Payment successful!");
            } else {
              toast.dismiss();
              toast.error("Payment verification failed.");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.dismiss();
            toast.error("Payment verification failed.");
          }
        },
        prefill: {
          name: "John Doe",
          email: "johndoe@example.com",
          contact: "9999999999",
        },
        theme: { color: "#4F46E5" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      toast.dismiss();
      toast.error("Error processing payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold text-gray-700 text-center mb-4">
          Enter Amount
        </h2>
        <input
          type="number"
          placeholder="Enter amount in INR"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-center"
        />
        <button
          onClick={handlePayment}
          className={`mt-4 w-full px-6 py-3 font-semibold text-white rounded-lg shadow-md transition duration-300 ease-in-out ${
            razorpayLoaded
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "bg-gray-400 cursor-not-allowed"
          } ${loading && "opacity-75 pointer-events-none"}`}
          disabled={!razorpayLoaded || loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="w-5 h-5 mr-2 text-white animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8z"
                ></path>
              </svg>
              Processing...
            </span>
          ) : (
            `Pay ₹${amount || "0"}`
          )}
        </button>
      </div>
    </div>
  );
};

export default PaymentButton;
