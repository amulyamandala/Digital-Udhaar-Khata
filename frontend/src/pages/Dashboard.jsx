import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getTranslation } from "../utils/i18n";
import { speakText } from "../utils/tts";
import api from "../utils/api";
import Header from "../components/Header";
import VoiceAssistant from "../components/VoiceAssistant";
import { Link, useNavigate } from "react-router-dom";
import { 
  Users, ArrowUpRight, ArrowDownRight, FileText, Link2, 
  Search, Plus, Mic, Volume2, Shield, User, MapPin, 
  Phone, PlusCircle, X, ChevronRight 
} from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts";

export const Dashboard = () => {
  const { user } = useAuth();
  const currentLang = user?.language || "english";
  const navigate = useNavigate();

  // Dashboard Aggregates
  const [summary, setSummary] = useState({
    totalCustomers: 0,
    totalOutstanding: 0,
    totalRecovered: 0,
    monthlyTransactionsCount: 0,
    pendingPaymentsCount: 0
  });
  const [chartData, setChartData] = useState([]);
  const [topDefaulters, setTopDefaulters] = useState([]);

  // Customer Management
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Add Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
    linkCustomerId: ""
  });
  const [addError, setAddError] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Voice Assistant Modal
  const [showVoice, setShowVoice] = useState(false);

  // Load Dashboard Data
  const loadDashboardData = async () => {
    try {
      const res = await api.get("/analytics/dashboard");
      setSummary(res.data.summary);
      setChartData(res.data.chartData);
      setTopDefaulters(res.data.topDefaulters);
    } catch (err) {
      console.error("Failed to load dashboard data:", err.message);
    }
  };

  // Load Customers list
  const loadCustomers = async (search = "") => {
    setLoading(true);
    try {
      const res = await api.get(`/customers?search=${search}`);
      setCustomers(res.data);
    } catch (err) {
      console.error("Failed to load customers list:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    loadCustomers();
  }, []);

  // Search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    loadCustomers(query);
  };

  // Add Customer Submit
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setAddError("");
    setAddSubmitting(true);
    try {
      await api.post("/customers", newCustomer);
      setShowAddModal(false);
      setNewCustomer({ name: "", phone: "", address: "", notes: "", linkCustomerId: "" });
      loadDashboardData();
      loadCustomers(searchQuery);
      speakText("Customer added successfully", currentLang);
    } catch (err) {
      setAddError(err.response?.data?.message || "Failed to add customer");
      speakText(err.response?.data?.message || "Failed to add customer", currentLang);
    } finally {
      setAddSubmitting(false);
    }
  };

  // Get color for Trust Score
  const getTrustScoreColor = (score) => {
    if (score >= 80) return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", text: getTranslation(currentLang, "trustGreen"), hex: "#10b981" };
    if (score >= 40) return { bg: "bg-amber-50 text-amber-700 border-amber-200", text: getTranslation(currentLang, "trustYellow"), hex: "#f59e0b" };
    return { bg: "bg-red-50 text-red-700 border-red-200", text: getTranslation(currentLang, "trustRed"), hex: "#ef4444" };
  };

  // TTS readout for the whole dashboard
  const dashboardExplanation = `Dashboard overview for ${user?.shopName || "your store"}. You have recorded ${summary.totalCustomers} total customers. Your total outstanding credit ledger is ₹${summary.totalOutstanding}. You have successfully recovered ₹${summary.totalRecovered} in payments. There are ${summary.monthlyTransactionsCount} transactions recorded this month, and ${summary.pendingPaymentsCount} payment links pending.`;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-slate-100 to-indigo-50 pb-20">
      <Header titleExplain={dashboardExplanation} />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Metric Cards grid */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
          
          <div className="glass p-4 rounded-3xl flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-xs font-extrabold text-purple-600 uppercase tracking-wider">{getTranslation(currentLang, "totalCustomers")}</span>
              <div className="bg-purple-100 text-purple-700 p-1.5 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-purple-950">{summary.totalCustomers}</h3>
            </div>
          </div>

          <div className="glass p-4 rounded-3xl flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-xs font-extrabold text-red-600 uppercase tracking-wider">{getTranslation(currentLang, "outstandingCredit")}</span>
              <div className="bg-red-100 text-red-700 p-1.5 rounded-lg">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-red-600">₹{summary.totalOutstanding.toLocaleString("en-IN")}</h3>
            </div>
          </div>

          <div className="glass p-4 rounded-3xl flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider">{getTranslation(currentLang, "totalRecovered")}</span>
              <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-emerald-600">₹{summary.totalRecovered.toLocaleString("en-IN")}</h3>
            </div>
          </div>

          <div className="glass p-4 rounded-3xl flex flex-col justify-between shadow-sm col-span-1">
            <div className="flex justify-between items-start">
              <span className="text-xs font-extrabold text-purple-600 uppercase tracking-wider">{getTranslation(currentLang, "monthlyTransactions")}</span>
              <div className="bg-purple-100 text-purple-700 p-1.5 rounded-lg">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-purple-950">{summary.monthlyTransactionsCount}</h3>
            </div>
          </div>

          <div className="glass p-4 rounded-3xl flex flex-col justify-between shadow-sm col-span-1">
            <div className="flex justify-between items-start">
              <span className="text-xs font-extrabold text-amber-600 uppercase tracking-wider">{getTranslation(currentLang, "pendingPayments")}</span>
              <div className="bg-amber-100 text-amber-700 p-1.5 rounded-lg">
                <Link2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-amber-600">{summary.pendingPaymentsCount}</h3>
            </div>
          </div>

        </section>

        {/* Charts & Defaulters Row */}
        {chartData.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Chart Card */}
            <div className="glass p-6 rounded-3xl shadow-sm md:col-span-2 flex flex-col h-[320px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-purple-950 uppercase tracking-wider">
                  {getTranslation(currentLang, "creditVsRecovery")}
                </h3>
              </div>
              <div className="flex-1 w-full min-h-0 text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3e8ff" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="#6b21a8" />
                    <YAxis tickLine={false} axisLine={false} stroke="#6b21a8" />
                    <Tooltip cursor={{ fill: '#f3e8ff' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar name="Credit (Udhaar)" dataKey="credit" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar name="Recovery (Jama)" dataKey="recovery" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Defaulters Card */}
            <div className="glass p-6 rounded-3xl shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-purple-950 uppercase tracking-wider mb-4">
                  {getTranslation(currentLang, "topDefaulters")}
                </h3>
                <div className="space-y-4">
                  {topDefaulters.slice(0, 4).map((d) => {
                    const info = getTrustScoreColor(d.trustScore);
                    return (
                      <div 
                        key={d._id} 
                        onClick={() => navigate(`/customer/${d._id}`)}
                        className="flex items-center justify-between p-3 bg-purple-50/40 border border-purple-100 hover:border-purple-300 rounded-2xl cursor-pointer transition"
                      >
                        <div>
                          <h4 className="font-extrabold text-purple-950 text-sm">{d.name}</h4>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 border rounded-full ${info.bg} inline-block mt-1`}>
                            {info.text}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-red-600">₹{d.totalBalance}</span>
                        </div>
                      </div>
                    );
                  })}
                  {topDefaulters.length === 0 && (
                    <p className="text-xs text-purple-500 font-semibold italic text-center py-8">
                      No defaulters recorded!
                    </p>
                  )}
                </div>
              </div>
            </div>

          </section>
        )}

        {/* Customer Directory Search & List */}
        <section className="glass p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <h3 className="text-sm font-black text-purple-950 uppercase tracking-wider">
              Customer Directory
            </h3>

            {/* Action Bar */}
            <div className="flex gap-2">
              {/* Add Customer Trigger */}
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-purple-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-purple-700 active:scale-95 duration-100 transition shadow-md shadow-purple-100 text-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{getTranslation(currentLang, "addCustomer")}</span>
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
            <input
              type="text"
              placeholder={getTranslation(currentLang, "searchPlaceholder")}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-12 pr-4 py-3 bg-purple-50/50 border border-purple-200 focus:border-purple-500 rounded-2xl outline-none font-semibold text-purple-950 placeholder-purple-300 transition"
            />
          </div>

          {/* Customer Listing */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs font-semibold text-purple-600">Loading customer ledger index...</p>
              </div>
            ) : customers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customers.map((c) => {
                  const info = getTrustScoreColor(c.trustScore);
                  return (
                    <div
                      key={c._id}
                      onClick={() => navigate(`/customer/${c._id}`)}
                      className="p-4 bg-white hover:bg-purple-50/30 border border-purple-100 hover:border-purple-400 rounded-2xl cursor-pointer transition flex items-center justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-purple-950 text-base flex items-center gap-1.5">
                            {c.name}
                            {c.familyGroupId && (
                              <span className="bg-purple-100 text-purple-700 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">
                                Family
                              </span>
                            )}
                          </h4>
                          <div className="flex flex-col gap-0.5 mt-1 text-xs text-purple-500 font-semibold">
                            <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> +91 {c.phone}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {c.address}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-purple-400 font-bold block uppercase">Balance</span>
                        <span className={`text-base font-black ${c.totalBalance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                          ₹{c.totalBalance}
                        </span>
                        
                        <div className="mt-1">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 border rounded-full ${info.bg}`}>
                            {info.text}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-purple-100 rounded-2xl">
                <Users className="w-12 h-12 text-purple-300 mx-auto mb-2" />
                <p className="text-sm text-purple-950 font-bold">
                  {getTranslation(currentLang, "noCustomers")}
                </p>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Floating Microphone Trigger button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowVoice(true)}
          className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-purple-300 hover:bg-purple-700 active:scale-95 duration-100 transition animate-bounce hover:animate-none cursor-pointer"
          title={getTranslation(currentLang, "voiceAssistant")}
        >
          <Mic className="w-7 h-7" />
        </button>
      </div>

      {/* Voice Assistant Modal */}
      {showVoice && (
        <VoiceAssistant 
          onClose={() => setShowVoice(false)} 
          onCustomerAdded={() => {
            setShowVoice(false);
            setShowAddModal(true);
          }}
        />
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-950/40 backdrop-blur-sm p-6">
          <div className="w-full max-w-md bg-white rounded-3xl border border-purple-100 shadow-2xl p-6 relative slide-up">
            
            {/* Close */}
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-purple-400 hover:text-purple-950 transition p-1.5 rounded-full hover:bg-purple-50"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-purple-950 mb-6 flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-purple-600" />
              {getTranslation(currentLang, "addCustomer")}
            </h3>

            {addError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1.5">
                  Customer Name
                </label>
                <input
                  type="text"
                  placeholder="E.g., Ravi Shankar"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-purple-50/50 border border-purple-200 focus:border-purple-500 rounded-xl outline-none font-semibold text-purple-950 placeholder-purple-300"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="number"
                  placeholder="10-digit mobile number"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-purple-50/50 border border-purple-200 focus:border-purple-500 rounded-xl outline-none font-semibold text-purple-950 placeholder-purple-300"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1.5">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Customer address or landmark"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-purple-50/50 border border-purple-200 focus:border-purple-500 rounded-xl outline-none font-semibold text-purple-950 placeholder-purple-300"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1.5">
                  Link to Family Ledger (Optional)
                </label>
                <select
                  value={newCustomer.linkCustomerId}
                  onChange={(e) => setNewCustomer({ ...newCustomer, linkCustomerId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-purple-50/50 border border-purple-200 focus:border-purple-500 rounded-xl outline-none font-semibold text-purple-950"
                >
                  <option value="">-- No Family Link --</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} (+91 {c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1.5">
                  Notes
                </label>
                <textarea
                  placeholder="Any extra info (credits allowed limit, references, family status)"
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-purple-50/50 border border-purple-200 focus:border-purple-500 rounded-xl outline-none font-semibold text-purple-950 placeholder-purple-300 h-20"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 border border-purple-200 text-purple-700 py-3 rounded-xl font-bold hover:bg-purple-50 transition text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSubmitting}
                  className="flex-grow bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition text-sm shadow-md cursor-pointer disabled:opacity-50"
                >
                  {addSubmitting ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
