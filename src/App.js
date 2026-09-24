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
  MessageCircle,
  Receipt,
  LogOut,
  Lock,
  Menu,
  X,
  UserPlus,
  XCircle
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    category: "سوشيال",
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

  // قائمة أسعار Viola Elprimo كاملة للرفع بضغطة واحدة
  const bulkServicesList = [
    { name: "تصميم بوست سوشيال ميديا", category: "سوشيال", price: 250 },
    { name: "تصميم كاروسيل", category: "سوشيال", price: 400 },
    { name: "تصميم إنفوجرافيك", category: "سوشيال", price: 350 },
    { name: "تصميم ستوري", category: "سوشيال", price: 200 },
    { name: "تصميم غلاف", category: "سوشيال", price: 300 },
    { name: "تصميم إعلان ممول", category: "سوشيال", price: 400 },
    { name: "تصميم عروض وخصومات", category: "سوشيال", price: 250 },
    { name: "تصميم محتوى تعليمي", category: "سوشيال", price: 250 },
    { name: "تصميم غلاف ريلز", category: "سوشيال", price: 150 },
    { name: "تصميم صورة مصغرة", category: "سوشيال", price: 200 },
    { name: "تصميم بوستات المناسبات والأعياد", category: "سوشيال", price: 200 },
    { name: "مونتاج ريلز", category: "فيديو", price: 250 },
    { name: "مونتاج فيديو طويل (للدقيقة)", category: "فيديو", price: 50 },
    { name: "مونتاج فيديو تعليمي", category: "فيديو", price: 300 },
    { name: "مونتاج إعلان فيديو", category: "فيديو", price: 500 },
    { name: "مونتاج فيديوهات للسوشيال ميديا", category: "فيديو", price: 300 },
    { name: "تصحيح ألوان الفيديو", category: "فيديو", price: 150 },
    { name: "تصميم ومعالجة الصوت", category: "فيديو", price: 250 },
    { name: "صناعة محتوى قصير", category: "فيديو", price: 300 },
    { name: "تحويل فيديو طويل إلى ريلز", category: "فيديو", price: 250 },
    { name: "كتابة محتوى", category: "محتوى", price: 150 },
    { name: "كتابة وصف للمنشور", category: "محتوى", price: 50 },
    { name: "كتابة محتوى إعلاني", category: "محتوى", price: 200 },
    { name: "أفكار ريلز", category: "محتوى", price: 150 },
    { name: "أفكار منشورات", category: "محتوى", price: 150 },
    { name: "خطة محتوى شهرية", category: "محتوى", price: 1500 },
    { name: "استراتيجية المحتوى", category: "محتوى", price: 1500 },
    { name: "الأفكار الإبداعية للحملات والمحتوى", category: "محتوى", price: 1000 },
    { name: "كتابة الأفكار والخطافات الإعلانية", category: "محتوى", price: 1000 },
    { name: "كتابة سيناريو ريلز", category: "محتوى", price: 200 },
    { name: "استراتيجية تسويقية", category: "تسويق", price: 1500 },
    { name: "استراتيجية السوشيال ميديا", category: "تسويق", price: 1500 },
    { name: "تحليل المنافسين", category: "تسويق", price: 1000 },
    { name: "تحليل الصفحة", category: "تسويق", price: 1000 },
    { name: "تحليل المحتوى", category: "تسويق", price: 1500 },
    { name: "تحليل الجمهور المستهدف", category: "تسويق", price: 1000 },
    { name: "استشارة تسويقية", category: "تسويق", price: 1500 },
    { name: "استراتيجية الحملة التسويقية", category: "تسويق", price: 1000 },
    { name: "استراتيجية الإعلانات الممولة", category: "تسويق", price: 500 },
    { name: "استراتيجية المحتوى الإعلاني", category: "تسويق", price: 300 },
    { name: "إدارة صفحة فيسبوك", category: "إدارة", price: 500 },
    { name: "إدارة صفحة إنستجرام", category: "إدارة", price: 500 },
    { name: "نشر المحتوى", category: "إدارة", price: 500 },
    { name: "جدولة المحتوى", category: "إدارة", price: 500 },
    { name: "كتابة أوصاف المنشورات", category: "إدارة", price: 1000 },
    { name: "إعداد خطة المحتوى الشهرية", category: "إدارة", price: 1000 },
    { name: "إدارة السوشيال ميديا الشهرية (تبدأ من)", category: "إدارة", price: 2000 },
    { name: "إعداد الحملة الإعلانية", category: "إعلانات", price: 300 },
    { name: "استراتيجية الإعلانات", category: "إعلانات", price: 500 },
    { name: "تصميم الإعلان (يبدأ من)", category: "إعلانات", price: 400 },
    { name: "تصميم هوية بصرية", category: "هوية", price: 1500 },
    { name: "تصميم شعار", category: "هوية", price: 800 },
    { name: "دليل الهوية البصرية", category: "هوية", price: 500 },
    { name: "تحديد الألوان", category: "هوية", price: 500 },
    { name: "اختيار الخطوط", category: "هوية", price: 1000 },
    { name: "هوية السوشيال ميديا", category: "هوية", price: 1500 },
    { name: "تصميم المطبوعات الأساسية", category: "هوية", price: 1000 },
    { name: "عرض وتقديم الهوية", category: "هوية", price: 1500 },
    { name: "استراتيجية البراند", category: "هوية", price: 1000 },
    { name: "Branding كامل (يبدأ من)", category: "هوية", price: 9000 },
    { name: "كارت شخصي / بيزنس كارد", category: "مطبوعات", price: 150 },
    { name: "بروشور", category: "مطبوعات", price: 300 },
    { name: "منيو", category: "مطبوعات", price: 600 },
    { name: "بوستر", category: "مطبوعات", price: 200 },
    { name: "بانر", category: "مطبوعات", price: 250 },
    { name: "كتيب", category: "مطبوعات", price: 300 },
    { name: "دعوة", category: "مطبوعات", price: 150 },
    { name: "تصميم عبوة / تغليف", category: "مطبوعات", price: 600 },
    { name: "تصميم صفحة مذكرة", category: "تعليمي", price: 10 },
    { name: "تصميم صفحة كتاب شرح", category: "تعليمي", price: 15 },
    { name: "تصميم صفحة بنك أسئلة", category: "تعليمي", price: 15 },
    { name: "تصميم غلاف كتاب", category: "تعليمي", price: 300 },
    { name: "تصميم جدول مواعيد", category: "تعليمي", price: 200 },
    { name: "هوية مدرس / Teacher Branding", category: "تعليمي", price: 1000 },
    { name: "باقة STARTER", category: "باقات", price: 2500 },
    { name: "باقة GROWTH", category: "باقات", price: 5000 },
    { name: "باقة PROFESSIONAL", category: "باقات", price: 8000 },
    { name: "باقة PREMIUM", category: "باقات", price: 9000 },
    { name: "باقة FULL MARKETING", category: "باقات", price: 12000 },
    { name: "باقة TEACHER PACKAGE", category: "باقات", price: 14000 },
    { name: "باقة BUSINESS PACKAGE", category: "باقات", price: 20000 }
  ];

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

  const handleBulkUpload = async () => {
    if (!window.confirm("هل أنت متأكد من رفع جميع أسعار Viola Elprimo دفعة واحدة؟")) return;
    
    let addedCount = 0;
    for (const item of bulkServicesList) {
      const exists = services.find((s) => s.name === item.name);
      if (!exists) {
        try {
          await addDoc(collection(db, "services"), {
            name: item.name,
            category: item.category,
            price: Number(item.price),
          });
          addedCount++;
        } catch (error) {
          console.error("Error adding doc: ", error);
        }
      }
    }
    alert(`تمت العملية بنجاح! تمت إضافة ${addedCount} خدمة جديدة.`);
    window.location.reload(); 
  };

  // دالة فتح الواتساب الرسمية المباشرة
  const openWhatsApp = (client) => {
    if (!client.phone) {
      alert("لا يوجد رقم مسجل لهذا العميل.");
      return;
    }
    
    // تنظيف الرقم من المسافات وأي رموز غير رقمية
    let cleanPhone = client.phone.replace(/\D/g, '');
    
    // لو الرقم بيبدأ بصفر، شيل الصفر
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }
    
    // إضافة كود مصر لو مش موجود
    if (!cleanPhone.startsWith('20')) {
      cleanPhone = '20' + cleanPhone;
    }

    const remaining = (client.total || 0) - (client.paid || 0);
    const message = `مرحباً ${client.name}،\nمتبقي لحساب شركة Viola Elprimo مبلغ وقدره ${remaining} ج.م.\nبرجاء مراجعة الحساب، شكراً لتعاونكم.`;
    
    // تشفير الرسالة
    const encodedMessage = encodeURIComponent(message);
    
    // استخدام رابط API المباشر لتجنب إيرور 404
    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
    
    window.open(waUrl, '_blank');
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
      setNewService({ name: "", category: "سوشيال", price: "" });
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
        className="flex h-screen bg-[#121212] items-center justify-center relative overflow-hidden px-4"
        dir="rtl"
      >
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#3A0CA3] rounded-full blur-[120px] opacity-30"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#4CC9F0] rounded-full blur-[120px] opacity-20"></div>

        <div className="glass-panel p-8 md:p-10 rounded-3xl w-full max-w-md z-10 text-center border border-white/10 shadow-2xl">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#4CC9F0] to-[#7209B7] mb-2">
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

  const switchTab = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  }

  return (
    <div
      className="flex flex-col md:flex-row min-h-screen bg-[#121212] text-white overflow-hidden"
      dir="rtl"
    >
      {/* هيدر الموبايل */}
      <div className="md:hidden flex justify-between items-center p-4 glass-panel z-20 border-b border-white/10 relative">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#4CC9F0] to-[#7209B7]">
            VIOLA ELPRIMO
          </h1>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2">
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
      </div>

      {/* القائمة الجانبية (متجاوبة) */}
      <aside className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex w-full md:w-64 glass-panel flex-col p-6 h-auto md:h-full z-10 relative border-b md:border-b-0 md:border-l border-white/10 absolute md:static top-full left-0 right-0 bg-[#121212] md:bg-transparent shadow-2xl md:shadow-none`}>
        <div className="hidden md:block mb-8 text-center">
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
              onClick={() => switchTab("dashboard")}
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
            onClick={() => switchTab("clients")}
            className={`flex items-center space-x-3 space-x-reverse p-3 rounded-lg transition-all ${
              activeTab === "clients"
                ? "bg-[#3A0CA3] shadow-lg"
                : "hover:bg-white/5"
            } mt-2`}
          >
            <Users size={20} /> <span>العملاء والمشاريع</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => switchTab("expenses")}
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
            onClick={() => switchTab("services")}
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
          className="flex items-center justify-center space-x-2 space-x-reverse p-3 mt-4 mb-2 md:mb-0 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all w-full"
        >
          <LogOut size={18} /> <span>تسجيل الخروج</span>
        </button>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-full">
        {/* ================= لوحة التحكم (للأدمن فقط) ================= */}
        {activeTab === "dashboard" && isAdmin && (
          <div className="animate-fade-in w-full">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-white">
              نظرة عامة والجرد
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="glass-panel p-5 md:p-6 rounded-2xl border-t-4 border-t-[#4CC9F0]">
                <p className="text-sm md:text-base text-gray-400 mb-2">حجم العمل (بعد الخصومات)</p>
                <h3 className="text-2xl md:text-3xl font-bold break-words">
                  {totalRevenue.toLocaleString()} ج.م
                </h3>
              </div>
              <div className="glass-panel p-5 md:p-6 rounded-2xl border-t-4 border-t-[#90BE6D]">
                <p className="text-sm md:text-base text-gray-400 mb-2">الإيرادات المحصلة (الدخل)</p>
                <h3 className="text-2xl md:text-3xl font-bold text-[#90BE6D] break-words">
                  {totalPaid.toLocaleString()} ج.م
                </h3>
              </div>
              <div className="glass-panel p-5 md:p-6 rounded-2xl border-t-4 border-t-[#F94144]">
                <p className="text-sm md:text-base text-gray-400 mb-2">إجمالي المصروفات (الخرج)</p>
                <h3 className="text-2xl md:text-3xl font-bold text-[#F94144] break-words">
                  {totalExpenses.toLocaleString()} ج.م
                </h3>
              </div>
              <div className="glass-panel p-5 md:p-6 rounded-2xl border-t-4 border-t-[#7209B7]">
                <p className="text-sm md:text-base text-gray-400 mb-2">صافي الربح الفعلي</p>
                <h3 className="text-2xl md:text-3xl font-bold text-[#7209B7] break-words">
                  {netProfit.toLocaleString()} ج.م
                </h3>
              </div>
            </div>
            <div className="glass-panel p-5 md:p-6 rounded-2xl border-r-4 border-r-yellow-500 w-full md:w-1/3">
              <p className="text-sm md:text-base text-gray-400 mb-2">
                فلوس برة (المتبقي عند العملاء)
              </p>
              <h3 className="text-xl md:text-2xl font-bold text-yellow-500 break-words">
                {totalRemaining.toLocaleString()} ج.م
              </h3>
            </div>
          </div>
        )}

        {/* ================= العملاء (للجميع) ================= */}
        {activeTab === "clients" && (
          <div className="animate-fade-in w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
              <h2 className="text-2xl md:text-3xl font-bold">العملاء والمشاريع</h2>
              <div className="relative w-full md:w-64">
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
            <div className="glass-panel p-5 md:p-8 rounded-2xl mb-6 md:mb-8 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#4CC9F0] rounded-full blur-[90px] opacity-20 pointer-events-none"></div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center text-[#4CC9F0]">
                <UserPlus size={20} className="ml-2 md:w-6 md:h-6" /> تسجيل مشروع أو عميل جديد
              </h3>
              <form
                onSubmit={handleAddClient}
                className="space-y-4 md:space-y-6 relative z-10 w-full"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  <div>
                    <label className="block text-xs md:text-sm text-gray-300 mb-1 md:mb-2">
                      اسم العميل أو المشروع{" "}
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full glass-input p-2.5 md:p-3 rounded-xl focus:border-[#4CC9F0]"
                      value={newClient.name}
                      onChange={(e) =>
                        setNewClient({ ...newClient, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm text-gray-300 mb-1 md:mb-2">
                      رقم الواتساب (مثال: 01012345678)
                    </label>
                    <input
                      type="text"
                      className="w-full glass-input p-2.5 md:p-3 rounded-xl text-left"
                      dir="ltr"
                      value={newClient.phone}
                      onChange={(e) =>
                        setNewClient({ ...newClient, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="bg-white/5 p-4 md:p-5 rounded-xl border border-white/10">
                  <label className="block text-xs md:text-sm text-[#4CC9F0] font-bold mb-2 md:mb-3">
                    الخدمات المطلوبة (اختر من القوائم المنسدلة)
                  </label>
                  <select
                    className="w-full glass-input p-2.5 md:p-3 rounded-xl text-white bg-[#121212] cursor-pointer text-sm md:text-base"
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
                    <option value="">+ اضغط هنا لفتح قوائم الخدمات واختيار خدمة...</option>
                    {["سوشيال", "فيديو", "محتوى", "تسويق", "إدارة", "إعلانات", "هوية", "مطبوعات", "تعليمي", "باقات", "أخرى"].map(cat => {
                      const catServices = services.filter(s => s.category === cat);
                      if (catServices.length === 0) return null;
                      return (
                        <optgroup key={cat} label={`--- ${cat} ---`} className="text-[#4CC9F0] font-bold bg-[#121212]">
                          {catServices.map(s => (
                            <option key={s.id} value={s.id} className="text-white font-normal">
                              {s.name} ({s.price} ج.م)
                            </option>
                          ))}
                        </optgroup>
                      )
                    })}
                  </select>
                  {newClient.selectedServices &&
                    newClient.selectedServices.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3 md:mt-4">
                        {newClient.selectedServices.map((s, idx) => (
                          <span
                            key={idx}
                            className="bg-[#3A0CA3]/40 border border-[#7209B7] px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm flex items-center shadow-lg text-white"
                          >
                            {s.name}{" "}
                            <span className="text-[#4CC9F0] font-bold mx-1 md:mx-2">
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
                  <div>
                    <label className="block text-xs md:text-sm text-[#4CC9F0] font-bold mb-1 md:mb-2">
                      السعر الأساسي <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      className="w-full glass-input p-2.5 md:p-3 rounded-xl font-bold text-white text-sm md:text-base"
                      value={newClient.subtotal}
                      onChange={(e) =>
                        setNewClient({ ...newClient, subtotal: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm text-yellow-400 mb-1 md:mb-2">
                      الخصم
                    </label>
                    <input
                      type="number"
                      className="w-full glass-input p-2.5 md:p-3 rounded-xl text-yellow-400 text-sm md:text-base"
                      value={newClient.discount}
                      onChange={(e) =>
                        setNewClient({ ...newClient, discount: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm text-gray-300 mb-1 md:mb-2">
                      المبلغ المدفوع
                    </label>
                    <input
                      type="number"
                      className="w-full glass-input p-2.5 md:p-3 rounded-xl text-[#90BE6D] text-sm md:text-base"
                      value={newClient.paid}
                      onChange={(e) =>
                        setNewClient({ ...newClient, paid: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm text-[#90BE6D] font-bold mb-1 md:mb-2 whitespace-nowrap">
                      الإجمالي النهائي
                    </label>
                    <div className="w-full p-2.5 md:p-3 rounded-xl bg-[#90BE6D]/10 text-[#90BE6D] font-bold text-center border border-[#90BE6D]/30 min-h-[44px] md:min-h-[52px] flex items-center justify-center text-sm md:text-base">
                      {Number(newClient.subtotal || 0) -
                        Number(newClient.discount || 0)}{" "}
                      ج
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#4CC9F0] to-[#3A0CA3] text-white font-bold py-3 md:py-4 rounded-xl shadow-lg hover:opacity-90 transition-opacity text-sm md:text-base"
                >
                  تأكيد وتسجيل العميل
                </button>
              </form>
            </div>

            {/* تعديل العميل - للأدمن فقط */}
            {editingClient && isAdmin && (
              <div className="glass-panel p-4 md:p-6 rounded-2xl mb-6 md:mb-8 border border-[#4CC9F0] w-full">
                <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-[#4CC9F0]">
                  تعديل حساب العميل
                </h3>
                <form
                  onSubmit={handleUpdateClient}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 md:gap-4"
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
                    className="glass-input p-2.5 md:p-3 rounded-lg text-sm"
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
                    className="glass-input p-2.5 md:p-3 rounded-lg text-sm"
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
                    className="glass-input p-2.5 md:p-3 rounded-lg text-sm"
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
                    className="glass-input p-2.5 md:p-3 rounded-lg text-sm"
                    required
                  />
                  <div className="flex gap-2 sm:col-span-2 md:col-span-1">
                    <button
                      type="submit"
                      className="bg-[#4CC9F0] text-black font-bold py-2.5 md:py-3 px-2 rounded-lg flex-1 text-sm"
                    >
                      حفظ
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingClient(null)}
                      className="bg-red-500/20 text-red-400 py-2.5 md:py-3 px-2 rounded-lg text-sm"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* جدول العملاء - متجاوب بالتمرير الأفقي */}
            <div className="glass-panel rounded-2xl overflow-hidden w-full">
               <div className="overflow-x-auto w-full">
                  <table className="w-full text-right min-w-[700px] md:min-w-[800px]">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="p-3 md:p-4 font-semibold text-gray-300 text-sm md:text-base">
                          الاسم / المشروع
                        </th>
                        <th className="p-3 md:p-4 font-semibold text-gray-300 text-sm md:text-base">
                          الأساسي
                        </th>
                        <th className="p-3 md:p-4 font-semibold text-gray-300 text-sm md:text-base">الخصم</th>
                        <th className="p-3 md:p-4 font-semibold text-gray-300 text-sm md:text-base">النهائي</th>
                        <th className="p-3 md:p-4 font-semibold text-gray-300 text-sm md:text-base">المدفوع</th>
                        <th className="p-3 md:p-4 font-semibold text-gray-300 text-sm md:text-base">المتبقي</th>
                        {isAdmin && (
                          <th className="p-3 md:p-4 font-semibold text-gray-300 text-sm md:text-base">
                            الموظف
                          </th>
                        )}
                        <th className="p-3 md:p-4 font-semibold text-gray-300 text-center text-sm md:text-base">
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
                          <td className="p-3 md:p-4">
                            <div className="font-bold text-sm md:text-base whitespace-nowrap">{client.name}</div>
                            {client.servicesList && (
                              <div className="text-[9px] md:text-[10px] text-[#4CC9F0] mt-1 flex gap-1 flex-wrap">
                                {client.servicesList.map((s, i) => (
                                  <span
                                    key={i}
                                    className="bg-white/5 border border-white/10 px-1.5 md:px-2 py-0.5 rounded whitespace-nowrap"
                                  >
                                    {s.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-3 md:p-4 text-gray-400 line-through text-xs md:text-sm whitespace-nowrap">
                            {(client.subtotal || 0).toLocaleString()}
                          </td>
                          <td className="p-3 md:p-4 text-yellow-400 text-xs md:text-sm whitespace-nowrap">
                            {(client.discount || 0).toLocaleString()}
                          </td>
                          <td className="p-3 md:p-4 font-bold text-white text-xs md:text-sm whitespace-nowrap">
                            {(client.total || 0).toLocaleString()}
                          </td>
                          <td className="p-3 md:p-4 text-[#90BE6D] font-bold text-xs md:text-sm whitespace-nowrap">
                            {(client.paid || 0).toLocaleString()}
                          </td>
                          <td className="p-3 md:p-4 text-[#F94144] font-bold text-xs md:text-sm whitespace-nowrap">
                            {(client.total - (client.paid || 0)).toLocaleString()}
                          </td>
                          {isAdmin && (
                            <td className="p-3 md:p-4 text-[10px] md:text-xs text-gray-400 whitespace-nowrap">
                              {client.addedBy || "المدير"}
                            </td>
                          )}
                          <td className="p-3 md:p-4 flex gap-1 md:gap-2 justify-center">
                            <button
                              onClick={() => openWhatsApp(client)}
                              className="p-1.5 md:p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/40 transition cursor-pointer"
                              title="إرسال واتساب للعميل"
                            >
                              <MessageCircle size={14} className="md:w-4 md:h-4" />
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => setEditingClient(client)}
                                  className="p-1.5 md:p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/40"
                                >
                                  <Edit size={14} className="md:w-4 md:h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClient(client.id)}
                                  className="p-1.5 md:p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40"
                                >
                                  <Trash2 size={14} className="md:w-4 md:h-4" />
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
          </div>
        )}

        {/* ================= المصروفات (للأدمن فقط) ================= */}
        {activeTab === "expenses" && isAdmin && (
          <div className="animate-fade-in w-full">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">الجرد والمصروفات</h2>
            <div className="glass-panel p-5 md:p-6 rounded-2xl mb-6 md:mb-8 w-full">
              <form
                onSubmit={handleAddExpense}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
              >
                <input
                  type="text"
                  placeholder="بند الصرف (مثال: إعلانات، رواتب)"
                  className="glass-input p-2.5 md:p-3 rounded-xl focus:border-[#F94144] text-sm md:text-base"
                  value={newExpense.title}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, title: e.target.value })
                  }
                  required
                />
                <input
                  type="number"
                  placeholder="المبلغ"
                  className="glass-input p-2.5 md:p-3 rounded-xl focus:border-[#F94144] text-sm md:text-base"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: e.target.value })
                  }
                  required
                />
                <input
                  type="date"
                  className="glass-input p-2.5 md:p-3 rounded-xl text-gray-400 text-sm md:text-base"
                  value={newExpense.date}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, date: e.target.value })
                  }
                />
                <button
                  type="submit"
                  className="bg-[#F94144] hover:bg-[#d63638] text-white font-bold py-2.5 md:py-3 px-4 rounded-xl shadow-lg sm:col-span-2 md:col-span-1 text-sm md:text-base"
                >
                  تسجيل المصروف
                </button>
              </form>
            </div>
            <div className="glass-panel rounded-2xl p-4 md:p-6 w-full">
              <ul className="space-y-3">
                {expenses.map((expense) => (
                  <li
                    key={expense.id}
                    className="flex justify-between items-center bg-white/5 p-3 md:p-4 rounded-xl border border-white/5"
                  >
                    <div>
                      <p className="font-bold text-base md:text-lg">{expense.title}</p>
                      <p className="text-xs md:text-sm text-gray-400">{expense.date}</p>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4">
                      <p className="text-lg md:text-xl font-bold text-[#F94144] whitespace-nowrap">
                        {expense.amount.toLocaleString()} ج
                      </p>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-400 p-1.5 md:p-2 hover:bg-red-400/10 rounded-lg"
                      >
                        <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
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
          <div className="animate-fade-in w-full">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">الخدمات والأسعار</h2>

            {/* فورم الإضافة يظهر للأدمن فقط */}
            {isAdmin && (
              <div className="glass-panel p-5 md:p-6 rounded-2xl mb-6 md:mb-8 w-full">
                <form
                  onSubmit={handleAddService}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
                >
                  <input
                    type="text"
                    placeholder="اسم الخدمة"
                    className="glass-input p-2.5 md:p-3 rounded-xl focus:border-[#3A0CA3] text-sm md:text-base"
                    value={newService.name}
                    onChange={(e) =>
                      setNewService({ ...newService, name: e.target.value })
                    }
                    required
                  />
                  <select
                    className="glass-input p-2.5 md:p-3 rounded-xl text-white bg-[#121212] focus:border-[#3A0CA3] text-sm md:text-base"
                    value={newService.category}
                    onChange={(e) =>
                      setNewService({ ...newService, category: e.target.value })
                    }
                  >
                    <option value="سوشيال">سوشيال ميديا</option>
                    <option value="فيديو">المونتاج والفيديو</option>
                    <option value="محتوى">صناعة المحتوى</option>
                    <option value="تسويق">التسويق</option>
                    <option value="إدارة">إدارة الصفحات</option>
                    <option value="إعلانات">إعلانات ممولة</option>
                    <option value="هوية">الهوية البصرية</option>
                    <option value="مطبوعات">المطبوعات</option>
                    <option value="تعليمي">التصميم التعليمي</option>
                    <option value="باقات">الباقات الشهرية</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                  <input
                    type="number"
                    placeholder="السعر"
                    className="glass-input p-2.5 md:p-3 rounded-xl focus:border-[#3A0CA3] text-sm md:text-base"
                    value={newService.price}
                    onChange={(e) =>
                      setNewService({ ...newService, price: e.target.value })
                    }
                    required
                  />
                  <button
                    type="submit"
                    className="bg-[#3A0CA3] hover:bg-[#7209B7] text-white font-bold py-2.5 md:py-3 px-4 rounded-xl shadow-lg sm:col-span-2 md:col-span-1 text-sm md:text-base"
                  >
                    إضافة للقائمة
                  </button>
                </form>
              </div>
            )}

            {/* الزرار السحري لرفع القائمة كاملة */}
            {isAdmin && (
              <div className="mb-6 flex justify-end">
                <button
                  onClick={handleBulkUpload}
                  className="bg-[#90BE6D] hover:bg-green-600 text-[#121212] font-bold py-2 px-4 rounded-lg shadow-lg flex items-center gap-2 transition"
                >
                  <Plus size={18} /> رفع قائمة خدمات Viola Elprimo (بضغطة واحدة)
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
              {["سوشيال", "فيديو", "محتوى", "تسويق", "إدارة", "إعلانات", "هوية", "مطبوعات", "تعليمي", "باقات", "أخرى"].map(
                (cat) => {
                  const catServices = services.filter(
                    (s) => s.category === cat
                  );
                  if (catServices.length === 0) return null;
                  return (
                    <div
                      key={cat}
                      className="glass-panel p-4 md:p-6 rounded-2xl border border-white/5"
                    >
                      <h4 className="text-base md:text-lg font-bold mb-3 md:mb-4 text-[#4CC9F0] border-b border-white/10 pb-2">
                        {cat}
                      </h4>
                      <ul className="space-y-2 md:space-y-3">
                        {catServices.map((service) => (
                          <li
                            key={service.id}
                            className="flex justify-between items-center bg-[#121212]/50 p-2.5 md:p-3 rounded-xl border border-white/5"
                          >
                            <div className="flex-1 pr-2">
                              <p className="font-semibold text-white text-sm md:text-base truncate">
                                {service.name}
                              </p>
                              <p className="text-xs md:text-sm text-[#90BE6D] font-bold mt-0.5">
                                {service.price.toLocaleString()} ج.م
                              </p>
                            </div>
                            {/* زر الحذف يظهر للأدمن فقط */}
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteService(service.id)}
                                className="text-red-400 p-1.5 md:p-2 hover:bg-red-400/10 rounded-lg transition shrink-0"
                              >
                                <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
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
