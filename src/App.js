import "./styles.css";
import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Plus,
  Trash2,
  Edit,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  UserPlus,
  MessageCircle,
  Receipt,
  LogOut,
  Lock,
} from "lucide-react";
import { db, auth } from "./firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // ⚠️⚠️⚠️ اكتب هنا الإيميل بتاعك اللي سجلت بيه كمدير في فايربيز ⚠️⚠️⚠️
  const ADMIN_EMAIL = "viola@elprimo.com";

  const [activeTab, setActiveTab] = useState("clients");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [newService, setNewService] = useState({
    name: "",
    category: "تصميم",
    price: "",
  });
  const [newClient, setNewClient] = useState({
    name: "",
    phone: "",
    subtotal: "",
    discount: "",
    paid: "",
    selectedServices: [],
  });
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    date: "",
  });
  const [editingClient, setEditingClient] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      if (currentUser) {
        setActiveTab(
          currentUser.email === ADMIN_EMAIL ? "dashboard" : "clients"
        );
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const servicesSnap = await getDocs(collection(db, "services"));
        setServices(servicesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        const clientsSnap = await getDocs(collection(db, "clients"));
        setClients(clientsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        const expensesSnap = await getDocs(collection(db, "expenses"));
        setExpenses(expensesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        setLoading(false);
      } catch (error) {
        console.error("خطأ في جلب البيانات:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setAuthError("البريد الإلكتروني أو كلمة المرور غير صحيحة!");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // ---------------- إدارة العملاء ----------------
  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!newClient.name || !newClient.subtotal) return;

    const sub = Number(newClient.subtotal);
    const disc = Number(newClient.discount || 0);
    const finalTotal = sub - disc;
    const paidAmt = Number(newClient.paid || 0);
    const clientServicesList = newClient.selectedServices || [];

    try {
      const docRef = await addDoc(collection(db, "clients"), {
        name: newClient.name,
        phone: newClient.phone,
        subtotal: sub,
        discount: disc,
        total: finalTotal,
        paid: paidAmt,
        servicesList: clientServicesList,
        addedBy: user.email,
      });
      setClients([
        ...clients,
        {
          id: docRef.id,
          name: newClient.name,
          phone: newClient.phone,
          subtotal: sub,
          discount: disc,
          total: finalTotal,
          paid: paidAmt,
          servicesList: clientServicesList,
          addedBy: user.email,
        },
      ]);
      setNewClient({
        name: "",
        phone: "",
        subtotal: "",
        discount: "",
        paid: "",
        selectedServices: [],
      });
    } catch (error) {
      alert("حصل خطأ أثناء الحفظ: " + error.message);
    }
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    const sub = Number(editingClient.subtotal);
    const disc = Number(editingClient.discount || 0);
    const finalTotal = sub - disc;

    try {
      await updateDoc(doc(db, "clients", editingClient.id), {
        name: editingClient.name,
        phone: editingClient.phone,
        subtotal: sub,
        discount: disc,
        total: finalTotal,
        paid: Number(editingClient.paid),
      });
      setClients(
        clients.map((c) =>
          c.id === editingClient.id
            ? { ...editingClient, total: finalTotal }
            : c
        )
      );
      setEditingClient(null);
    } catch (error) {
      alert("خطأ في التعديل: " + error.message);
    }
  };

  const handleDeleteClient = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا العميل؟")) return;
    try {
      await deleteDoc(doc(db, "clients", id));
      setClients(clients.filter((c) => c.id !== id));
    } catch (error) {
      alert("خطأ في الحذف.");
    }
  };

  // ---------------- باقي الدوال ----------------
  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, "expenses"), {
        title: newExpense.title,
        amount: Number(newExpense.amount),
        date: newExpense.date || new Date().toISOString().split("T")[0],
      });
      setExpenses([
        ...expenses,
        {
          id: docRef.id,
          title: newExpense.title,
          amount: Number(newExpense.amount),
          date: newExpense.date,
        },
      ]);
      setNewExpense({ title: "", amount: "", date: "" });
    } catch (error) {
      alert("خطأ.");
    }
  };
  const handleDeleteExpense = async (id) => {
    try {
      await deleteDoc(doc(db, "expenses", id));
      setExpenses(expenses.filter((e) => e.id !== id));
    } catch (error) {}
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, "services"), {
        name: newService.name,
        category: newService.category,
        price: Number(newService.price),
      });
      setServices([
        ...services,
        {
          id: docRef.id,
          name: newService.name,
          category: newService.category,
          price: Number(newService.price),
        },
      ]);
      setNewService({ name: "", category: "تصميم", price: "" });
    } catch (error) {}
  };
  const handleDeleteService = async (id) => {
    try {
      await deleteDoc(doc(db, "services", id));
      setServices(services.filter((s) => s.id !== id));
    } catch (error) {}
  };

  // حسابات الجرد
  const totalRevenue = clients.reduce(
    (acc, c) => acc + Number(c.total || 0),
    0
  );
  const totalPaid = clients.reduce((acc, c) => acc + Number(c.paid || 0), 0);
  const totalRemaining = totalRevenue - totalPaid;
  const totalExpenses = expenses.reduce(
    (acc, e) => acc + Number(e.amount || 0),
    0
  );
  const netProfit = totalPaid - totalExpenses;
  const filteredClients = clients.filter((c) => c.name.includes(searchQuery));

  if (isAuthLoading)
    return (
      <div className="flex h-screen bg-[#121212] text-[#4CC9F0] items-center justify-center font-bold text-2xl">
        جاري تحميل النظام...
      </div>
    );

  // ================= شاشة تسجيل الدخول =================
  if (!user) {
    return (
      <div
        className="flex h-screen bg-[#121212] items-center justify-center relative overflow-hidden"
        dir="rtl"
      >
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#3A0CA3] rounded-full blur-[120px] opacity-30"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#4CC9F0] rounded-full blur-[120px] opacity-20"></div>

        <div className="glass-panel p-10 rounded-3xl w-full max-w-md z-10 text-center border border-white/10 shadow-2xl">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#4CC9F0] to-[#7209B7] mb-2">
            VIOLA ELPRIMO
          </h1>
          <p className="text-gray-400 mb-8 text-sm">
            نظام إدارة الوكالة الإبداعية
          </p>

          {authError && (
            <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <input
                type="email"
                placeholder="البريد الإلكتروني"
                className="w-full glass-input p-4 rounded-xl text-white pr-10 focus:border-[#4CC9F0]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Users
                className="absolute right-3 top-4 text-gray-400"
                size={20}
              />
            </div>
            <div className="relative">
              <input
                type="password"
                placeholder="كلمة المرور"
                className="w-full glass-input p-4 rounded-xl text-white pr-10 focus:border-[#4CC9F0]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock
                className="absolute right-3 top-4 text-gray-400"
                size={20}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#4CC9F0] to-[#3A0CA3] hover:from-[#3ba3c4] hover:to-[#2a0878] text-white font-bold py-4 rounded-xl transition-all shadow-lg text-lg"
            >
              تسجيل الدخول
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-6">
            هذا النظام مغلق ومخصص لموظفي الشركة فقط.
          </p>
        </div>
      </div>
    );
  }

  // ================= شاشة النظام بعد الدخول =================
  const isAdmin = user.email === ADMIN_EMAIL;
  if (loading)
    return (
      <div className="flex h-screen bg-[#121212] text-white items-center justify-center font-bold text-2xl">
        تحميل البيانات...
      </div>
    );

  return (
    <div
      className="flex h-screen bg-[#121212] text-white overflow-hidden"
      dir="rtl"
    >
      {/* القائمة الجانبية */}
      <aside className="w-64 glass-panel flex flex-col p-6 h-full z-10 relative border-l border-white/10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#4CC9F0] to-[#7209B7]">
            VIOLA ELPRIMO
          </h1>
          <p className="text-xs text-[#90BE6D] mt-2 font-bold">
            {isAdmin ? "مرحباً، مدير النظام" : "مرحباً، موظف المبيعات"}
          </p>
          <p className="text-[10px] text-gray-400">{user.email}</p>
        </div>

        <nav className="flex flex-col space-y-3 flex-1">
          {isAdmin && (
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center space-x-3 space-x-reverse p-3 rounded-lg transition-all ${
                activeTab === "dashboard"
                  ? "bg-[#3A0CA3] shadow-lg"
                  : "hover:bg-white/5"
              }`}
            >
              <LayoutDashboard size={20} /> <span>لوحة التحكم</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab("clients")}
            className={`flex items-center space-x-3 space-x-reverse p-3 rounded-lg transition-all ${
              activeTab === "clients"
                ? "bg-[#3A0CA3] shadow-lg"
                : "hover:bg-white/5"
            }`}
          >
            <Users size={20} /> <span>العملاء والمشاريع</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab("expenses")}
              className={`flex items-center space-x-3 space-x-reverse p-3 rounded-lg transition-all ${
                activeTab === "expenses"
                  ? "bg-[#3A0CA3] shadow-lg"
                  : "hover:bg-white/5"
              }`}
            >
              <Receipt size={20} /> <span>الجرد والمصروفات</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab("services")}
            className={`flex items-center space-x-3 space-x-reverse p-3 rounded-lg transition-all ${
              activeTab === "services"
                ? "bg-[#3A0CA3] shadow-lg"
                : "hover:bg-white/5"
            }`}
          >
            <Briefcase size={20} /> <span>الخدمات والأسعار</span>
          </button>
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center space-x-2 space-x-reverse p-3 mt-4 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
        >
          <LogOut size={18} /> <span>تسجيل الخروج</span>
        </button>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* ================= لوحة التحكم (للأدمن فقط) ================= */}
        {activeTab === "dashboard" && isAdmin && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold mb-8 text-white">
              نظرة عامة والجرد
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-[#4CC9F0]">
                <p className="text-gray-400 mb-2">حجم العمل (بعد الخصومات)</p>
                <h3 className="text-3xl font-bold">
                  {totalRevenue.toLocaleString()} ج.م
                </h3>
              </div>
              <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-[#90BE6D]">
                <p className="text-gray-400 mb-2">الإيرادات المحصلة (الدخل)</p>
                <h3 className="text-3xl font-bold text-[#90BE6D]">
                  {totalPaid.toLocaleString()} ج.م
                </h3>
              </div>
              <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-[#F94144]">
                <p className="text-gray-400 mb-2">إجمالي المصروفات (الخرج)</p>
                <h3 className="text-3xl font-bold text-[#F94144]">
                  {totalExpenses.toLocaleString()} ج.م
                </h3>
              </div>
              <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-[#7209B7]">
                <p className="text-gray-400 mb-2">صافي الربح الفعلي</p>
                <h3 className="text-3xl font-bold text-[#7209B7]">
                  {netProfit.toLocaleString()} ج.م
                </h3>
              </div>
            </div>
            <div className="glass-panel p-6 rounded-2xl border-r-4 border-r-yellow-500 w-full md:w-1/3">
              <p className="text-gray-400 mb-2">
                فلوس برة (المتبقي عند العملاء)
              </p>
              <h3 className="text-2xl font-bold text-yellow-500">
                {totalRemaining.toLocaleString()} ج.م
              </h3>
            </div>
          </div>
        )}

        {/* ================= العملاء (للجميع) ================= */}
        {activeTab === "clients" && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">العملاء والمشاريع</h2>
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="ابحث عن عميل..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full glass-input py-2 px-10 rounded-full text-sm focus:border-[#4CC9F0] transition-colors"
                />
                <Search
                  className="absolute right-3 top-2.5 text-gray-400"
                  size={18}
                />
              </div>
            </div>

            {/* فورم إضافة عميل */}
            <div className="glass-panel p-8 rounded-2xl mb-8 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#4CC9F0] rounded-full blur-[90px] opacity-20 pointer-events-none"></div>
              <h3 className="text-2xl font-bold mb-6 flex items-center text-[#4CC9F0]">
                <UserPlus size={24} className="ml-2" /> تسجيل مشروع أو عميل جديد
              </h3>
              <form
                onSubmit={handleAddClient}
                className="space-y-6 relative z-10"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      اسم العميل أو المشروع{" "}
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full glass-input p-3 rounded-xl focus:border-[#4CC9F0]"
                      value={newClient.name}
                      onChange={(e) =>
                        setNewClient({ ...newClient, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      رقم الواتساب
                    </label>
                    <input
                      type="text"
                      className="w-full glass-input p-3 rounded-xl text-left"
                      dir="ltr"
                      value={newClient.phone}
                      onChange={(e) =>
                        setNewClient({ ...newClient, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                  <label className="block text-sm text-[#4CC9F0] font-bold mb-3">
                    الخدمات المطلوبة (تُضاف للإجمالي تلقائياً)
                  </label>
                  <select
                    className="w-full glass-input p-3 rounded-xl text-white bg-[#121212] cursor-pointer"
                    value=""
                    onChange={(e) => {
                      const srv = services.find((s) => s.id === e.target.value);
                      if (srv) {
                        const updated = [
                          ...(newClient.selectedServices || []),
                          srv,
                        ];
                        const newSub = updated.reduce(
                          (acc, curr) => acc + Number(curr.price),
                          0
                        );
                        setNewClient({
                          ...newClient,
                          selectedServices: updated,
                          subtotal: newSub,
                        });
                      }
                    }}
                  >
                    <option value="">+ اضغط هنا لاختيار وإضافة خدمة...</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.price} ج.م)
                      </option>
                    ))}
                  </select>
                  {newClient.selectedServices &&
                    newClient.selectedServices.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {newClient.selectedServices.map((s, idx) => (
                          <span
                            key={idx}
                            className="bg-[#3A0CA3]/40 border border-[#7209B7] px-4 py-2 rounded-lg text-sm flex items-center shadow-lg text-white"
                          >
                            {s.name}{" "}
                            <span className="text-[#4CC9F0] font-bold mx-2">
                              ({s.price} ج)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated =
                                  newClient.selectedServices.filter(
                                    (_, i) => i !== idx
                                  );
                                const newSub = updated.reduce(
                                  (acc, curr) => acc + Number(curr.price),
                                  0
                                );
                                setNewClient({
                                  ...newClient,
                                  selectedServices: updated,
                                  subtotal: newSub,
                                });
                              }}
                              className="text-red-400 ml-1 hover:bg-red-400/20 rounded p-1"
                            >
                              <XCircle size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <div>
                    <label className="block text-sm text-[#4CC9F0] font-bold mb-2">
                      السعر الأساسي <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      className="w-full glass-input p-3 rounded-xl font-bold text-white"
                      value={newClient.subtotal}
                      onChange={(e) =>
                        setNewClient({ ...newClient, subtotal: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-yellow-400 mb-2">
                      الخصم
                    </label>
                    <input
                      type="number"
                      className="w-full glass-input p-3 rounded-xl text-yellow-400"
                      value={newClient.discount}
                      onChange={(e) =>
                        setNewClient({ ...newClient, discount: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      المبلغ المدفوع
                    </label>
                    <input
                      type="number"
                      className="w-full glass-input p-3 rounded-xl text-[#90BE6D]"
                      value={newClient.paid}
                      onChange={(e) =>
                        setNewClient({ ...newClient, paid: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#90BE6D] font-bold mb-2">
                      الإجمالي النهائي
                    </label>
                    <div className="w-full p-3 rounded-xl bg-[#90BE6D]/10 text-[#90BE6D] font-bold text-center border border-[#90BE6D]/30 min-h-[52px] flex items-center justify-center">
                      {Number(newClient.subtotal || 0) -
                        Number(newClient.discount || 0)}{" "}
                      ج.م
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#4CC9F0] to-[#3A0CA3] text-white font-bold py-4 rounded-xl shadow-lg hover:opacity-90 transition-opacity"
                >
                  تأكيد وتسجيل العميل
                </button>
              </form>
            </div>

            {/* تعديل العميل - للأدمن فقط */}
            {editingClient && isAdmin && (
              <div className="glass-panel p-6 rounded-2xl mb-8 border border-[#4CC9F0]">
                <h3 className="text-xl font-bold mb-4 text-[#4CC9F0]">
                  تعديل حساب العميل
                </h3>
                <form
                  onSubmit={handleUpdateClient}
                  className="grid grid-cols-1 md:grid-cols-5 gap-4"
                >
                  <input
                    type="text"
                    placeholder="الاسم"
                    value={editingClient.name}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        name: e.target.value,
                      })
                    }
                    className="glass-input p-3 rounded-lg"
                    required
                  />
                  <input
                    type="number"
                    placeholder="السعر الأساسي"
                    value={editingClient.subtotal}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        subtotal: e.target.value,
                      })
                    }
                    className="glass-input p-3 rounded-lg"
                    required
                  />
                  <input
                    type="number"
                    placeholder="الخصم"
                    value={editingClient.discount}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        discount: e.target.value,
                      })
                    }
                    className="glass-input p-3 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="المدفوع"
                    value={editingClient.paid}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        paid: e.target.value,
                      })
                    }
                    className="glass-input p-3 rounded-lg"
                    required
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-[#4CC9F0] text-black font-bold py-3 px-2 rounded-lg flex-1"
                    >
                      حفظ
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingClient(null)}
                      className="bg-red-500/20 text-red-400 py-3 px-2 rounded-lg"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* جدول العملاء */}
            <div className="glass-panel rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-right min-w-[800px]">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="p-4 font-semibold text-gray-300">
                      الاسم / المشروع
                    </th>
                    <th className="p-4 font-semibold text-gray-300">
                      السعر الأساسي
                    </th>
                    <th className="p-4 font-semibold text-gray-300">الخصم</th>
                    <th className="p-4 font-semibold text-gray-300">النهائي</th>
                    <th className="p-4 font-semibold text-gray-300">المدفوع</th>
                    <th className="p-4 font-semibold text-gray-300">المتبقي</th>
                    {isAdmin && (
                      <th className="p-4 font-semibold text-gray-300">
                        الموظف
                      </th>
                    )}
                    <th className="p-4 font-semibold text-gray-300 text-center">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="p-4">
                        <div className="font-bold">{client.name}</div>
                        {client.servicesList && (
                          <div className="text-[10px] text-[#4CC9F0] mt-1 flex gap-1 flex-wrap">
                            {client.servicesList.map((s, i) => (
                              <span
                                key={i}
                                className="bg-white/5 border border-white/10 px-2 py-0.5 rounded"
                              >
                                {s.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-gray-400 line-through">
                        {(client.subtotal || 0).toLocaleString()}
                      </td>
                      <td className="p-4 text-yellow-400">
                        {(client.discount || 0).toLocaleString()}
                      </td>
                      <td className="p-4 font-bold text-white">
                        {(client.total || 0).toLocaleString()}
                      </td>
                      <td className="p-4 text-[#90BE6D] font-bold">
                        {(client.paid || 0).toLocaleString()}
                      </td>
                      <td className="p-4 text-[#F94144] font-bold">
                        {(client.total - (client.paid || 0)).toLocaleString()}
                      </td>
                      {isAdmin && (
                        <td className="p-4 text-xs text-gray-400">
                          {client.addedBy || "المدير"}
                        </td>
                      )}
                      <td className="p-4 flex gap-2 justify-center">
                        {client.phone && (
                          <a
                            href={`https://wa.me/20${
                              client.phone
                            }?text=مرحباً ${
                              client.name
                            }، متبقي لحساب شركة Viola Elprimo مبلغ وقدره ${
                              client.total - client.paid
                            } ج.م`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/40"
                            title="إرسال واتساب"
                          >
                            <MessageCircle size={16} />
                          </a>
                        )}
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => setEditingClient(client)}
                              className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/40"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteClient(client.id)}
                              className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= المصروفات (للأدمن فقط) ================= */}
        {activeTab === "expenses" && isAdmin && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold mb-8">الجرد والمصروفات</h2>
            <div className="glass-panel p-6 rounded-2xl mb-8">
              <form
                onSubmit={handleAddExpense}
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
              >
                <input
                  type="text"
                  placeholder="بند الصرف (مثال: إعلانات، رواتب)"
                  className="glass-input p-3 rounded-xl focus:border-[#F94144]"
                  value={newExpense.title}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, title: e.target.value })
                  }
                  required
                />
                <input
                  type="number"
                  placeholder="المبلغ"
                  className="glass-input p-3 rounded-xl focus:border-[#F94144]"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: e.target.value })
                  }
                  required
                />
                <input
                  type="date"
                  className="glass-input p-3 rounded-xl text-gray-400"
                  value={newExpense.date}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, date: e.target.value })
                  }
                />
                <button
                  type="submit"
                  className="bg-[#F94144] hover:bg-[#d63638] text-white font-bold py-3 px-4 rounded-xl shadow-lg"
                >
                  تسجيل المصروف
                </button>
              </form>
            </div>
            <div className="glass-panel rounded-2xl p-6">
              <ul className="space-y-3">
                {expenses.map((expense) => (
                  <li
                    key={expense.id}
                    className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5"
                  >
                    <div>
                      <p className="font-bold text-lg">{expense.title}</p>
                      <p className="text-sm text-gray-400">{expense.date}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-xl font-bold text-[#F94144]">
                        {expense.amount.toLocaleString()} ج.م
                      </p>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-400 p-2 hover:bg-red-400/10 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ================= الخدمات (الكل يشوفها، التعديل للأدمن بس) ================= */}
        {activeTab === "services" && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold mb-8">الخدمات والأسعار</h2>

            {/* فورم الإضافة يظهر للأدمن فقط */}
            {isAdmin && (
              <div className="glass-panel p-6 rounded-2xl mb-8">
                <form
                  onSubmit={handleAddService}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                  <input
                    type="text"
                    placeholder="اسم الخدمة"
                    className="glass-input p-3 rounded-xl focus:border-[#3A0CA3]"
                    value={newService.name}
                    onChange={(e) =>
                      setNewService({ ...newService, name: e.target.value })
                    }
                    required
                  />
                  <select
                    className="glass-input p-3 rounded-xl text-white bg-[#121212] focus:border-[#3A0CA3]"
                    value={newService.category}
                    onChange={(e) =>
                      setNewService({ ...newService, category: e.target.value })
                    }
                  >
                    <option value="تصميم">01 - التصميم والهوية</option>
                    <option value="سوشيال">02 - إدارة السوشيال ميديا</option>
                    <option value="محتوى">03 - صناعة المحتوى</option>
                    <option value="فيديو">04 - مونتاج وفيديو</option>
                    <option value="إعلانات">05 - إعلانات ممولة</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                  <input
                    type="number"
                    placeholder="السعر"
                    className="glass-input p-3 rounded-xl focus:border-[#3A0CA3]"
                    value={newService.price}
                    onChange={(e) =>
                      setNewService({ ...newService, price: e.target.value })
                    }
                    required
                  />
                  <button
                    type="submit"
                    className="bg-[#3A0CA3] hover:bg-[#7209B7] text-white font-bold py-3 px-4 rounded-xl shadow-lg"
                  >
                    إضافة للقائمة
                  </button>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {["تصميم", "سوشيال", "محتوى", "فيديو", "إعلانات", "أخرى"].map(
                (cat) => {
                  const catServices = services.filter(
                    (s) => s.category === cat
                  );
                  if (catServices.length === 0) return null;
                  return (
                    <div
                      key={cat}
                      className="glass-panel p-6 rounded-2xl border border-white/5"
                    >
                      <h4 className="text-lg font-bold mb-4 text-[#4CC9F0] border-b border-white/10 pb-2">
                        {cat}
                      </h4>
                      <ul className="space-y-3">
                        {catServices.map((service) => (
                          <li
                            key={service.id}
                            className="flex justify-between items-center bg-[#121212]/50 p-3 rounded-xl border border-white/5"
                          >
                            <div>
                              <p className="font-semibold text-white">
                                {service.name}
                              </p>
                              <p className="text-sm text-[#90BE6D] font-bold">
                                {service.price.toLocaleString()} ج.م
                              </p>
                            </div>
                            {/* زر الحذف يظهر للأدمن فقط */}
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteService(service.id)}
                                className="text-red-400 p-2 hover:bg-red-400/10 rounded-lg transition"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
