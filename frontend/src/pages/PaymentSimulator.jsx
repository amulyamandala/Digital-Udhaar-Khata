import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { speakText } from "../utils/tts";
import { CheckCircle, CreditCard, Smartphone, Check, ArrowRight } from "lucide-react";

export const PaymentSimulator = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [amount, setAmount] = useState(searchParams.get("amount") || "0");
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const [method, setMethod] = useState("UPI");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPublicInfo = async () => {
      try {
        const res = await api.get(`/customers/public/${id}`);
        setCustomer(res.data);
        if (!searchParams.get("amount")) {
          setAmount(res.data.totalBalance);
        }
      } catch (err) {
        console.error("Failed to load bill invoice:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicInfo();
  }, [id]);

  const handlePayment = async () => {
    setSubmitting(true);
    try {
      await api.post("/payments/mock-pay", {
        customerId: id,
        amount: Number(amount)
      });
      setPaid(true);
      speakText(`Payment of ${amount} rupees to ${customer?.shopName || "store"} was successful. Thank you!`, "english");
    } catch (err) {
      alert("Payment simulation failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-3xl border border-slate-100 shadow-md">
          <p className="text-red-500 font-bold">Error: Bill details or Customer ledger not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden slide-up">
        
        {/* Header */}
        <div className="bg-purple-600 p-6 text-white text-center">
          <span className="text-[10px] font-black uppercase bg-purple-700/50 px-2.5 py-1 rounded-full">Secure Payment Gateway</span>
          <h2 className="text-2xl font-black mt-2 tracking-tight">{customer.shopName}</h2>
          <p className="text-xs text-purple-100 mt-1">Digital Credits Clearance Terminal</p>
        </div>

        {paid ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-sm animate-bounce">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800">Payment Successful!</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">₹{amount} paid to {customer.shopName}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl text-left text-xs font-semibold text-slate-600 space-y-2 border border-slate-100">
              <div className="flex justify-between">
                <span>Customer Name:</span>
                <span className="font-extrabold text-slate-800">{customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Transaction Ref:</span>
                <span className="font-extrabold text-slate-800">TXN-SIM-{Date.now().toString().slice(-6)}</span>
              </div>
            </div>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition shadow-md cursor-pointer text-sm"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            
            {/* Amount Owed */}
            <div className="text-center bg-purple-50/50 p-6 rounded-2xl border border-purple-100">
              <span className="text-xs font-extrabold text-purple-500 uppercase tracking-wider block">Amount Owed</span>
              <h4 className="text-4xl font-black text-purple-950 mt-1">₹{amount}</h4>
              <span className="text-[10px] text-purple-400 font-bold block mt-1">Paying for: {customer.name}</span>
            </div>

            {/* Choose Method */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Select Payment Method</label>
              
              <div 
                onClick={() => setMethod("UPI")}
                className={`p-4 border-2 rounded-2xl cursor-pointer flex items-center justify-between transition-all select-none ${
                  method === "UPI" ? "border-purple-600 bg-purple-50/30" : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-purple-500" />
                  <span className="font-extrabold text-slate-800 text-sm">UPI (PhonePe, GPay, Paytm)</span>
                </div>
                {method === "UPI" && <div className="bg-purple-600 w-2 h-2 rounded-full" />}
              </div>

              <div 
                onClick={() => setMethod("CARD")}
                className={`p-4 border-2 rounded-2xl cursor-pointer flex items-center justify-between transition-all select-none ${
                  method === "CARD" ? "border-purple-600 bg-purple-50/30" : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-purple-500" />
                  <span className="font-extrabold text-slate-800 text-sm">Credit / Debit Card</span>
                </div>
                {method === "CARD" && <div className="bg-purple-600 w-2 h-2 rounded-full" />}
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handlePayment}
              disabled={submitting}
              className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700 active:scale-95 duration-100 transition shadow-lg shadow-purple-200 cursor-pointer disabled:opacity-50 text-sm"
            >
              <span>{submitting ? "Processing payment..." : `Pay ₹${amount} Now`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentSimulator;
