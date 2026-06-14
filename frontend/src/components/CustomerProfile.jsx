import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getTranslation } from "../utils/i18n";
import { speakText } from "../utils/tts";
import api from "../utils/api";
import Header from "../components/Header";
import { 
  ArrowLeft, Phone, MapPin, Shield, Plus, Sparkles, 
  Send, FileText, Trash2, ArrowUpRight, ArrowDownLeft, 
  X, Check, Info, FileDown, MessageSquare, Volume2, Mic 
} from "lucide-react";

export const CustomerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const currentLang = user?.language || "english";

  const [customer, setCustomer] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("ALL"); // ALL, CREDIT, DEBIT
  const [loading, setLoading] = useState(true);

  // Add Transaction Modal
  const [showTxModal, setShowTxModal] = useState(false);
  const [txForm, setTxForm] = useState({
    type: "CREDIT",
    amount: "",
    description: "",
    paymentMethod: "CASH"
  });
  const [txSubmitting, setTxSubmitting] = useState(false);

  // AI Reminder Modal
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTone, setReminderTone] = useState("friendly");
  const [reminderLang, setReminderLang] = useState(currentLang);
  const [generatedMsg, setGeneratedMsg] = useState("");
  const [generatingMsg, setGeneratingMsg] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);

  // Razorpay Link
  const [paymentLink, setPaymentLink] = useState("");
  const [creatingPayLink, setCreatingPayLink] = useState(false);

  // Temp Voice Recording inside Tx Form
  const [voiceFormLoading, setVoiceFormLoading] = useState(false);

  const loadCustomerData = async () => {
    try {
      // 1. Fetch customer profile
      const custRes = await api.get(`/customers/${id}`);
      setCustomer(custRes.data);

      // 2. Fetch family members if linked
      if (custRes.data.familyGroupId) {
        const famRes = await api.get(`/customers/family/${custRes.data.familyGroupId}`);
        setFamilyMembers(famRes.data.filter(m => m._id !== id));
      }

      // 3. Fetch transactions
      const txRes = await api.get(`/transactions/customer/${id}`);
      setTransactions(txRes.data);

      // Check if we need to auto-speak the balance
      const params = new URLSearchParams(location.search);
      if (params.get("action") === "speak-balance") {
        const balText = `${custRes.data.name} balance is rupees ${custRes.data.totalBalance}.`;
        speakText(balText, currentLang);
        // Clear search query param so it doesn't speak repeatedly on reload
        navigate(`/customer/${id}`, { replace: true });
      }

    } catch (err) {
      console.error("Failed to load customer profile data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, [id]);

  // Handle Add Transaction submit
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!txForm.amount || parseFloat(txForm.amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    setTxSubmitting(true);
    try {
      await api.post("/transactions", {
        customerId: id,
        type: txForm.type,
        amount: parseFloat(txForm.amount),
        description: txForm.description,
        paymentMethod: txForm.paymentMethod
      });
      setShowTxModal(false);
      setTxForm({ type: "CREDIT", amount: "", description: "", paymentMethod: "CASH" });
      loadCustomerData();
      speakText("Transaction recorded successfully", currentLang);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to record transaction");
    } finally {
      setTxSubmitting(false);
    }
  };

  // Generate Razorpay Payment Link
  const handleCreatePaymentLink = async () => {
    if (!customer || customer.totalBalance <= 0) return;
    setCreatingPayLink(true);
    try {
      const res = await api.post("/payments/create-link", {
        customerId: id,
        amount: customer.totalBalance
      });
      setPaymentLink(res.data.paymentLink);
      speakText("Payment link created", currentLang);
    } catch (err) {
      console.error("Razorpay link failed, generating fallback:", err.message);
      // Generate fallback local mock payment link
      const fallbackUrl = `https://digital-udhaar-khata-two.vercel.app/pay-mock/${id}?amount=${customer.totalBalance}`;
      setPaymentLink(fallbackUrl);
    } finally {
      setCreatingPayLink(false);
    }
  };

  // Generate AI Reminder Message
  const handleGenerateAiMessage = async () => {
    setGeneratingMsg(true);
    try {
      // Ensure we have a link to insert
      let activeLink = paymentLink;
      if (!activeLink) {
        // Generate quick mock link for the AI context if not already fetched
        activeLink = `https://digital-udhaar-khata-two.vercel.app/pay-mock/${id}?amount=${customer.totalBalance}`;
      }

      const res = await api.post("/notifications/ai-reminder", {
        customerId: id,
        tone: reminderTone,
        language: reminderLang,
        paymentLink: activeLink
      });
      setGeneratedMsg(res.data.reminderText);
      speakText("AI message generated", currentLang);
    } catch (err) {
      alert("Failed to generate AI reminder message");
    } finally {
      setGeneratingMsg(false);
    }
  };

  // Send Reminder (Twilio Trigger)
  const handleSendReminder = async (type) => {
    if (!generatedMsg) return;
    setSendingReminder(true);
    const endpoint = type === "SMS" ? "/notifications/send-sms" : "/notifications/send-whatsapp";
    try {
      await api.post(endpoint, {
        customerId: id,
        message: generatedMsg
      });
      alert(`Reminder sent successfully via ${type}!`);
      setShowReminderModal(false);
      setGeneratedMsg("");
    } catch (err) {
      alert(`Failed to send ${type} reminder: ` + (err.response?.data?.message || err.message));
    } finally {
      setSendingReminder(false);
    }
  };

  // Generate monthly PDF statement using our PDFKit backend route
  const handleGenerateStatement = async () => {
    try {
      const res = await api.post(`/statements/monthly/${id}`, {
        month: new Date().getMonth(),
        year: new Date().getFullYear()
      });
      // The API returns the statement object with pdfUrl pointing to Cloudinary!
      speakText("Statement generated successfully", currentLang);
      alert("PDF Statement generated successfully!");
      // Open in new tab
      if (res.data.statement?.pdfUrl) {
        window.open(res.data.statement.pdfUrl, "_blank");
      }
      loadCustomerData();
    } catch (err) {
      alert("Failed to generate PDF statement: " + (err.response?.data?.message || err.message));
    }
  };

  // Delete Transaction
  const handleDeleteTx = async (txId) => {
    if (!window.confirm("Are you sure you want to delete this transaction entry? This will revert customer balance.")) return;
    try {
      await api.delete(`/transactions/${txId}`);
      loadCustomerData();
      speakText("Deleted transaction", currentLang);
    } catch (err) {
      alert("Failed to delete transaction");
    }
  };

  // Voice Fill Form inside Transaction Add modal
  const handleVoiceFill = async () => {
    setVoiceFormLoading(true);
    speakText(getTranslation(currentLang, "speakNow"), currentLang);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", blob, "tx.webm");

        try {
          const res = await api.post("/voice/parse", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          
          const parsed = res.data.parsedData;
          if (parsed && parsed.amount) {
            setTxForm(prev => ({
              ...prev,
              amount: parsed.amount,
              type: parsed.transactionType || prev.type,
              description: parsed.transactionType === "CREDIT" ? "Voice Udhaar" : "Voice Jama"
            }));
            speakText(`Heard ${parsed.amount} rupees`, currentLang);
          } else {
            speakText("Could not understand amount", currentLang);
          }
        } catch (e) {
          console.error("OpenAI Whisper parsing failed:", e);
        } finally {
          setVoiceFormLoading(false);
        }
      };

      // Record for 4 seconds, then stop automatically
      recorder.start();
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      }, 4000);

    } catch (e) {
      alert("Failed to access microphone for voice fill");
      setVoiceFormLoading(false);
    }
  };

  // Get color for Trust Score
  const getTrustScoreColor = (score) => {
    if (score >= 80) return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", label: getTranslation(currentLang, "trustGreen") };
    if (score >= 40) return { bg: "bg-amber-50 text-amber-700 border-amber-200", label: getTranslation(currentLang, "trustYellow") };
    return { bg: "bg-red-50 text-red-700 border-red-200", label: getTranslation(currentLang, "trustRed") };
  };

  const handleSpeakBalance = () => {
    if (customer) {
      const balStr = `${customer.name} owes ₹${customer.totalBalance} outstanding credit. Trust level is ${getTrustScoreColor(customer.trustScore).label}.`;
      speakText(balStr, currentLang);
    }
  };

  const filteredTxns = transactions.filter((t) => {
    if (filter === "CREDIT") return t.type === "CREDIT";
    if (filter === "DEBIT") return t.type === "DEBIT";
    return true;
  });

  const profileExplanation = customer ? `Ledger profile for ${customer.name}. Mobile number is ${customer.phone}. Outstanding balance is ₹${customer.totalBalance}.` : "Loading profile details";

  if (loading || !customer) {
    return (
      <div className="min-h-screen flex flex-col bg-purple-50 justify-center items-center">
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-purple-600">Loading ledger ledger...</p>
      </div>
    );
  }

  const trustInfo = getTrustScoreColor(customer.trustScore);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-slate-100 to-indigo-50 pb-20">
      <Header titleExplain={profileExplanation} />

      <main className="flex-grow max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6 slide-up">
        
        {/* Navigation & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 bg-white rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-100 transition shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-extrabold text-purple-950">
            {getTranslation(currentLang, "history")}
          </h2>
        </div>

        {/* Customer Detail Card */}
        <section className="glass p-6 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          
          {/* Main Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-purple-600 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-md">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-2xl font-black text-purple-950 flex items-center gap-2">
                  {customer.name}
                  {customer.familyGroupId && (
                    <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded font-black uppercase">
                      Family Ledger
                    </span>
                  )}
                </h3>
                
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-sm text-purple-600 font-medium">
                  <span className="flex items-center gap-1"><Phone className="w-4 h-4 text-purple-400" /> +91 {customer.phone}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-purple-400" /> {customer.address}</span>
                </div>
              </div>
            </div>

            {customer.notes && (
              <p className="text-xs text-purple-500 font-semibold bg-purple-50/50 p-3 rounded-xl border border-purple-100/50">
                <span className="font-extrabold text-purple-700 uppercase tracking-wider block text-[9px] mb-0.5">Shopkeeper Notes</span>
                "{customer.notes}"
              </p>
            )}
          </div>

          {/* Balance Display Box */}
          <div className="bg-white/80 p-5 rounded-2xl border border-purple-100 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="absolute top-2 right-2 flex gap-1">
              {/* Speak balance button */}
              <button 
                onClick={handleSpeakBalance}
                className="p-1 rounded-lg text-purple-400 hover:text-purple-600 hover:bg-purple-50 transition cursor-pointer"
                title="Speak Outstanding Balance"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div>
              <span className="text-xs font-extrabold text-purple-400 uppercase tracking-wider block">Outstanding Credit</span>
              <h4 className={`text-3xl font-black mt-1 ${customer.totalBalance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                ₹{customer.totalBalance.toLocaleString("en-IN")}
              </h4>
            </div>

            <div className="mt-4 pt-3 border-t border-purple-50 flex items-center justify-between">
              <span className="text-xs text-purple-500 font-bold">{getTranslation(currentLang, "trustScore")}</span>
              <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 border rounded-full ${trustInfo.bg}`}>
                {trustInfo.label} ({customer.trustScore}%)
              </span>
            </div>
          </div>

        </section>

        {/* Family Khata Group Details */}
        {customer.familyGroupId && (
          <section className="glass p-6 rounded-3xl shadow-sm">
            <h4 className="text-sm font-black text-purple-950 uppercase tracking-wider mb-3">
              {getTranslation(currentLang, "familyGroup")}
            </h4>
            <div className="flex flex-wrap gap-2">
              <div className="px-3.5 py-2 bg-purple-100 border border-purple-200 text-purple-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                {customer.name} (Primary)
              </div>
              {familyMembers.map((member) => (
                <div 
                  key={member._id}
                  onClick={() => navigate(`/customer/${member._id}`)}
                  className="px-3.5 py-2 bg-white hover:bg-purple-50 border border-purple-100 hover:border-purple-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  {member.name}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Action Button Tray */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* Add Transaction Trigger */}
          <button
            onClick={() => setShowTxModal(true)}
            className="flex items-center gap-2 justify-center bg-purple-600 hover:bg-purple-700 text-white font-bold p-4.5 rounded-2xl shadow-md cursor-pointer active:scale-95 duration-100 transition text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>

          {/* AI Reminders Trigger */}
          <button
            disabled={customer.totalBalance <= 0}
            onClick={() => {
              setShowReminderModal(true);
              handleCreatePaymentLink();
            }}
            className="flex items-center gap-2 justify-center bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 font-bold p-4.5 rounded-2xl shadow-sm cursor-pointer active:scale-95 duration-100 transition text-sm disabled:opacity-40"
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>{getTranslation(currentLang, "sendReminder")}</span>
          </button>

          {/* Generate PDF Statement */}
          <button
            onClick={handleGenerateStatement}
            className="flex items-center gap-2 justify-center bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 font-bold p-4.5 rounded-2xl shadow-sm cursor-pointer active:scale-95 duration-100 transition text-sm"
          >
            <FileText className="w-4 h-4 text-purple-500" />
            <span>{getTranslation(currentLang, "generateStatement")}</span>
          </button>

          {/* Pay simulation route */}
          <button
            disabled={customer.totalBalance <= 0}
            onClick={() => navigate(`/pay-mock/${id}?amount=${customer.totalBalance}`)}
            className="flex items-center gap-2 justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold p-4.5 rounded-2xl shadow-sm cursor-pointer active:scale-95 duration-100 transition text-sm disabled:opacity-40"
          >
            <Check className="w-4 h-4 text-emerald-500" />
            <span>{getTranslation(currentLang, "paymentSimulator")}</span>
          </button>

        </section>

        {/* Transaction Ledger Table */}
        <section className="glass p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <h3 className="text-sm font-black text-purple-950 uppercase tracking-wider">
              Ledger Transactions
            </h3>

            {/* Filter Pills */}
            <div className="bg-purple-50/50 p-1 border border-purple-100 rounded-xl flex">
              {["ALL", "CREDIT", "DEBIT"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                    filter === f
                      ? "bg-white text-purple-900 shadow-sm"
                      : "text-purple-500 hover:text-purple-800"
                  }`}
                >
                  {f === "ALL" ? "All Entries" : f === "CREDIT" ? "Udhaar (-)" : "Jama (+)"}
                </button>
              ))}
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto rounded-2xl border border-purple-50">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-purple-50/60 text-purple-950 text-xs font-extrabold uppercase border-b border-purple-100">
                  <th className="p-4">Date</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Details</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 text-sm font-semibold text-purple-950">
                {filteredTxns.map((t) => (
                  <tr key={t._id} className="hover:bg-purple-50/20">
                    <td className="p-4 text-xs font-bold text-purple-400">
                      {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="p-4">
                      {t.type === "CREDIT" ? (
                        <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-lg border border-red-200 inline-flex items-center gap-1 text-xs font-black">
                          <ArrowUpRight className="w-3.5 h-3.5" /> Udhaar
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1 text-xs font-black">
                          <ArrowDownLeft className="w-3.5 h-3.5" /> Jama
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-xs uppercase bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-black">
                        {t.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 text-purple-600 max-w-xs truncate">{t.description || "-"}</td>
                    <td className={`p-4 text-right font-black text-base ${t.type === "CREDIT" ? "text-red-600" : "text-emerald-600"}`}>
                      ₹{t.amount}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeleteTx(t._id)}
                        className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredTxns.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-xs text-purple-500 font-bold italic">
                      No ledger entries match current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* Add Transaction Modal */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-950/40 backdrop-blur-sm p-6">
          <div className="w-full max-w-md bg-white rounded-3xl border border-purple-100 shadow-2xl p-6 relative slide-up">
            
            <button
              onClick={() => setShowTxModal(false)}
              className="absolute top-4 right-4 text-purple-400 hover:text-purple-950 transition p-1.5 rounded-full hover:bg-purple-50"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-purple-950 mb-6">
              Add Ledger Entry
            </h3>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              
              {/* Type toggle */}
              <div>
                <label className="block text-xs font-bold text-purple-950 mb-2">Entry Type</label>
                <div className="grid grid-cols-2 gap-2 bg-purple-50 p-1 border border-purple-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: "CREDIT" })}
                    className={`py-3 rounded-xl font-extrabold text-sm transition cursor-pointer ${
                      txForm.type === "CREDIT"
                        ? "bg-red-500 text-white shadow-md shadow-red-200"
                        : "text-red-600 hover:bg-red-50"
                    }`}
                  >
                    Give Udhaar (Credit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: "DEBIT" })}
                    className={`py-3 rounded-xl font-extrabold text-sm transition cursor-pointer ${
                      txForm.type === "DEBIT"
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                        : "text-emerald-600 hover:bg-emerald-50"
                    }`}
                  >
                    Receive Jama (Repay)
                  </button>
                </div>
              </div>

              {/* Amount with voice filler */}
              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1.5 flex justify-between items-center">
                  <span>Amount (INR)</span>
                  <button
                    type="button"
                    onClick={handleVoiceFill}
                    disabled={voiceFormLoading}
                    className="flex items-center gap-1 bg-purple-100 hover:bg-purple-200 text-purple-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase cursor-pointer transition disabled:opacity-50"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>{voiceFormLoading ? "Listening..." : "Voice input"}</span>
                  </button>
                </label>
                <input
                  type="number"
                  placeholder="₹ E.g., 500"
                  value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                  className="w-full px-4 py-3 bg-purple-50/50 border border-purple-200 focus:border-purple-500 rounded-xl outline-none font-bold text-purple-950 placeholder-purple-300 text-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1.5">Description / Items</label>
                <input
                  type="text"
                  placeholder="E.g., 2kg Rice, Oil pack, sugar"
                  value={txForm.description}
                  onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-purple-50/50 border border-purple-200 focus:border-purple-500 rounded-xl outline-none font-semibold text-purple-950 placeholder-purple-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1.5">Payment Method</label>
                <select
                  value={txForm.paymentMethod}
                  onChange={(e) => setTxForm({ ...txForm, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2.5 bg-purple-50/50 border border-purple-200 focus:border-purple-500 rounded-xl outline-none font-semibold text-purple-950"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI Payment</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card Swipe</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="flex-1 border border-purple-200 text-purple-700 py-3 rounded-xl font-bold hover:bg-purple-50 transition text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={txSubmitting}
                  className="flex-grow bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition text-sm shadow-md cursor-pointer disabled:opacity-50"
                >
                  {txSubmitting ? "Saving..." : "Save Entry"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* AI Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-950/40 backdrop-blur-sm p-6">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-purple-100 shadow-2xl p-6 relative slide-up">
            
            <button
              onClick={() => setShowReminderModal(false)}
              className="absolute top-4 right-4 text-purple-400 hover:text-purple-950 transition p-1.5 rounded-full hover:bg-purple-50"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-purple-950 mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              {getTranslation(currentLang, "aiReminders")}
            </h3>

            <div className="space-y-4">
              
              {/* Tone settings */}
              <div>
                <label className="block text-xs font-bold text-purple-950 mb-2">Message Tone</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "friendly", text: getTranslation(currentLang, "aiToneFriendly") },
                    { id: "strong", text: getTranslation(currentLang, "aiToneStrong") },
                    { id: "overdue", text: getTranslation(currentLang, "aiToneOverdue") }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setReminderTone(t.id)}
                      className={`py-2 px-3 border rounded-xl font-bold text-xs transition cursor-pointer ${
                        reminderTone === t.id
                          ? "border-purple-600 bg-purple-50 text-purple-800"
                          : "border-purple-100 hover:border-purple-200 text-purple-500 hover:text-purple-950"
                      }`}
                    >
                      {t.text}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language selection */}
              <div>
                <label className="block text-xs font-bold text-purple-950 mb-2">Message Language</label>
                <select
                  value={reminderLang}
                  onChange={(e) => setReminderLang(e.target.value)}
                  className="w-full px-4 py-2 bg-purple-50/50 border border-purple-200 focus:border-purple-500 rounded-xl outline-none font-semibold text-purple-950"
                >
                  <option value="english">English</option>
                  <option value="hindi">हिन्दी (Hindi)</option>
                  <option value="telugu">తెలుగు (Telugu)</option>
                  <option value="tamil">தமிழ் (Tamil)</option>
                </select>
              </div>

              {/* Payment Link status info */}
              <div className="p-3 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-between text-xs font-bold">
                <span className="text-purple-600 flex items-center gap-1"><Info className="w-4 h-4 text-purple-400" /> Razorpay Payment Link</span>
                {creatingPayLink ? (
                  <span className="text-purple-400">Creating link...</span>
                ) : paymentLink ? (
                  <span className="text-emerald-600 flex items-center gap-1"><Check className="w-4 h-4" /> Ready</span>
                ) : (
                  <button 
                    onClick={handleCreatePaymentLink} 
                    className="text-purple-700 underline cursor-pointer"
                  >
                    Generate Link
                  </button>
                )}
              </div>

              {/* Action: Generate */}
              <button
                type="button"
                onClick={handleGenerateAiMessage}
                disabled={generatingMsg || creatingPayLink}
                className="w-full py-3 bg-purple-600 text-white font-extrabold rounded-2xl shadow-md hover:bg-purple-700 transition cursor-pointer text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{generatingMsg ? "Writing message with AI..." : getTranslation(currentLang, "generateMessage")}</span>
              </button>

              {/* Edit message preview area */}
              {generatedMsg && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-purple-950">Draft Reminder Message</label>
                  <textarea
                    value={generatedMsg}
                    onChange={(e) => setGeneratedMsg(e.target.value)}
                    className="w-full px-4 py-3 bg-purple-50/30 border border-purple-200 focus:border-purple-500 rounded-2xl outline-none font-semibold text-purple-950 h-32 leading-relaxed"
                  />
                  
                  {/* SMS / WhatsApp sends button */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => handleSendReminder("SMS")}
                      disabled={sendingReminder}
                      className="py-3 px-4 bg-purple-100 hover:bg-purple-200 border border-purple-200 text-purple-800 font-extrabold rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <MessageSquare className="w-4.5 h-4.5" />
                      <span>{getTranslation(currentLang, "sendSMS")}</span>
                    </button>
                    <button
                      onClick={() => handleSendReminder("WHATSAPP")}
                      disabled={sendingReminder}
                      className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4.5 h-4.5" />
                      <span>{getTranslation(currentLang, "sendWhatsApp")}</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerProfile;
