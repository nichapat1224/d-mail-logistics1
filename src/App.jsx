import React, { useState, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  setDoc,
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

// --- CONFIG FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyD5KVYu3jqWSbni1oAvkP7RySDp_WZtnP8",
  authDomain: "d-mail-logistics.firebaseapp.com",
  projectId: "d-mail-logistics",
  storageBucket: "d-mail-logistics.firebasestorage.app",
  messagingSenderId: "1005959962733",
  appId: "1:1005959962733:web:6675d641bbfcca19a41f64",
  measurementId: "G-YPL9E3SFXM"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

const DISCORD_WEBHOOK_URL = "https://discordapp.com/api/webhooks/1534569324356964352/1rvOo8ssGWLqzmSTw9mtB-Zun3pyuqgnT1GkHWJaHXU4_p4pJuswsJGLimqdsKag-fMC";

const THAI_PROVINCES = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", 
  "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", 
  "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", 
  "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", 
  "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", 
  "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", 
  "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", 
  "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", 
  "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
];

const generateTrackingId = () => 'DM' + Math.floor(10000000 + Math.random() * 90000000) + 'TH';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  const [authLoading, setAuthLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [parcels, setParcels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด');
  const [dateFilter, setDateFilter] = useState('ทั้งหมด');
  const [toast, setToast] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('กรุงเทพมหานคร');
  const [addressDetail, setAddressDetail] = useState('');
  const [formData, setFormData] = useState({ 
    trackingId: generateTrackingId(), 
    recipient: '', 
    phone: '', 
    status: 'รับฝากชำระแล้ว' 
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          if (userSnap.exists() && userSnap.data().role) { 
            setUserRole(userSnap.data().role); 
            setShowRoleSelector(false); 
          } else { 
            setShowRoleSelector(true); 
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
          setShowRoleSelector(true);
        }
      } else { 
        setCurrentUser(null); 
        setUserRole(null); 
        setShowRoleSelector(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "parcels"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setParcels(snapshot.docs.map(docSnap => ({ 
        id: docSnap.id, 
        ...docSnap.data(), 
        parsedDate: docSnap.data().createdAt?.toDate() || new Date() 
      })));
    }, (error) => {
      console.error("Firestore snapshot error:", error);
    });
  }, [currentUser]);

  const showToast = (message) => { 
    setToast(message); 
    setTimeout(() => setToast(''), 3000); 
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegistering) {
        if (password !== confirmPassword) throw new Error('รหัสผ่านไม่ตรงกัน');
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) { 
      setAuthError(err.message); 
    }
  };

  const selectRole = async (role) => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, "users", currentUser.uid), { role, email: currentUser.email }, { merge: true });
      setUserRole(role);
      setShowRoleSelector(false);
      showToast(`บันทึกสิทธิ์เป็น ${role} สำเร็จ`);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const printLabel = (item) => {
    const printWindow = window.open('', '_blank', 'width=500,height=600');
    if (!printWindow) return;

    const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    if (typeof JsBarcode === 'function') {
      try {
        JsBarcode(svgNode, item.trackingId, { format: "CODE128", width: 2, height: 45, displayValue: true });
      } catch (e) {
        console.error("Barcode generation error:", e);
      }
    }
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(item.trackingId)}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label - ${item.trackingId}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 20px; }
            .label { border: 2px dashed #000; padding: 20px; width: 280px; margin: auto; text-align: left; }
            .barcode { text-align: center; margin-bottom: 10px; }
            .barcode svg { width: 100%; height: auto; }
            button { margin-top: 20px; padding: 10px 20px; cursor: pointer; background: #0284c7; color: #fff; border: none; border-radius: 4px; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="label">
            <h3 style="text-align:center; margin:0 0 10px 0;">D-MAIL LOGISTICS</h3>
            <div class="barcode">${svgNode.outerHTML}</div>
            <p><strong>Tracking:</strong> ${item.trackingId}</p>
            <p><strong>ผู้รับ:</strong> ${item.recipient}</p>
            <p><strong>เบอร์โทร:</strong> ${item.phone || '-'}</p>
            <p><strong>ปลายทาง:</strong> ${item.location}</p>
            <p><strong>สถานะ:</strong> ${item.status}</p>
            <div style="text-align:center; margin-top:10px;">
              <img src="${qrCodeUrl}" width="80" alt="QR Code" />
            </div>
          </div>
          <button onclick="window.print()">🖨️ สั่งพิมพ์ใบนี้</button>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSaveAndPrint = async (e) => {
    e.preventDefault();
    if (!formData.recipient || !addressDetail) {
      showToast('กรุณากรอกข้อมูลผู้รับและที่อยู่ให้ครบถ้วน');
      return;
    }
    const fullLocation = `${addressDetail} จ.${selectedProvince}`;
    const newParcelData = { 
      ...formData, 
      location: fullLocation, 
      createdBy: currentUser.email, 
      createdAt: serverTimestamp() 
    };

    setFormLoading(true);
    try {
      const docRef = await addDoc(collection(db, "parcels"), newParcelData);
      const dataForPrint = { ...newParcelData, id: docRef.id, parsedDate: new Date() };
      
      if (DISCORD_WEBHOOK_URL) {
        fetch(DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `📦 **มีพัสดุรายการใหม่เข้ามา!**\n🆔 Tracking: \`${formData.trackingId}\`\n👤 ผู้รับ: ${formData.recipient}\n📍 ปลายทาง: ${fullLocation}`
          })
        }).catch(err => console.log('Discord Error:', err));
      }

      printLabel(dataForPrint);
      showToast('บันทึกและสร้างใบปะหน้าสำเร็จ!');
      setFormData({ trackingId: generateTrackingId(), recipient: '', phone: '', status: 'รับฝากชำระแล้ว' });
      setAddressDetail('');
    } catch (err) {
      console.error("Save parcel error:", err);
      showToast('เกิดข้อผิดพลาดในการบันทึก');
    }
    setFormLoading(false);
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "parcels", id), { status: newStatus });
      showToast('อัปเดตสถานะสำเร็จ');
    } catch (err) {
      showToast('อัปเดตสถานะไม่สำเร็จ');
    }
  };

  const deleteParcel = async (id) => {
    if (!window.confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) return;
    try {
      await deleteDoc(doc(db, "parcels", id));
      showToast('ลบรายการสำเร็จ');
    } catch (err) {
      showToast('ลบไม่สำเร็จ');
    }
  };

  const filteredParcels = parcels.filter(item => {
    const matchSearch = (item.trackingId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                        (item.recipient?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                        (item.phone || '').includes(searchTerm);
    const matchStatus = statusFilter === 'ทั้งหมด' || item.status === statusFilter;
    const matchDate = dateFilter === 'ทั้งหมด' || 
                      (dateFilter === 'วันนี้' && item.parsedDate.toDateString() === new Date().toDateString());
    return matchSearch && matchStatus && matchDate;
  });

  if (authLoading) {
    return <div style={{ background: '#070b14', color: '#fff', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' }}>กำลังโหลดระบบ...</div>;
  }

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', background: '#070b14', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif', color: '#fff' }}>
        <div style={{ 
          background: '#0d1322', 
          padding: '40px 30px', 
          borderRadius: '16px', 
          width: '380px', 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
          border: '1px solid #1e293b',
          textAlign: 'center'
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#0284c720', border: '1px solid #0284c750', padding: '4px 12px', borderRadius: '20px', marginBottom: '20px' }}>
            <span style={{ width: '8px', height: '8px', background: '#38bdf8', borderRadius: '50%', display: 'inline-block' }}></span>
            <span style={{ fontSize: '12px', color: '#38bdf8' }}>ระบบจัดการและติดตามพัสดุ</span>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 5px 0', letterSpacing: '0.5px' }}>D-MAIL LOGISTICS</h1>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '30px' }}>กรุณาเข้าสู่ระบบเพื่อเข้าใช้งานแดชบอร์ด</p>

          {authError && <div style={{ background: '#ef444420', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>{authError}</div>}
          
          <form onSubmit={handleAuthSubmit} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#cbd5e1' }}>อีเมลผู้ใช้งาน</label>
              <input 
                type="email" 
                placeholder="admin@gmail.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                style={{ width: '100%', padding: '12px 15px', background: '#f8fafc', border: 'none', color: '#0f172a', borderRadius: '8px', boxSizing: 'border-box', fontSize: '15px', outline: 'none' }} 
              />
            </div>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#cbd5e1' }}>รหัสผ่าน</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                style={{ width: '100%', padding: '12px 15px', background: '#f8fafc', border: 'none', color: '#0f172a', borderRadius: '8px', boxSizing: 'border-box', fontSize: '15px', outline: 'none' }} 
              />
            </div>
            {isRegistering && (
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#cbd5e1' }}>ยืนยันรหัสผ่าน</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '12px 15px', background: '#f8fafc', border: 'none', color: '#0f172a', borderRadius: '8px', boxSizing: 'border-box', fontSize: '15px', outline: 'none' }} 
                />
              </div>
            )}
            <button type="submit" style={{ width: '100%', padding: '12px', background: '#06b6d4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 4px 12px rgba(6, 182, 212, 0.4)' }}>
              {isRegistering ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '25px' }}>
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }} 
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}
            >
              {isRegistering ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชีผู้ใช้? ลงทะเบียนใหม่'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showRoleSelector) {
    return (
      <div style={{ minHeight: '100vh', background: '#070b14', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#101728', padding: '30px', borderRadius: '12px', width: '400px', textAlign: 'center', border: '1px solid #1e293b' }}>
          <h2>เลือกบทบาทการใช้งานของคุณ</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>กรุณาเลือกสิทธิ์เพื่อเข้าสู่ระบบพัสดุ</p>
          {authError && <div style={{ background: '#ef4444', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>{authError}</div>}
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button 
              onClick={() => selectRole('Admin')} 
              style={{ flex: 1, padding: '15px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              👑 ผู้ดูแลระบบ (Admin)
            </button>
            <button 
              onClick={() => selectRole('User')} 
              style={{ flex: 1, padding: '15px', background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              👤 ผู้ใช้งานทั่วไป (User)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070b14', color: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#1e293b', color: '#fff', padding: '12px 20px', borderRadius: '8px', border: '1px solid #334155', zIndex: 1000, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #1e293b', paddingBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ margin: 0, fontSize: '22px' }}>D-MAIL LOGISTICS</h1>
          <span style={{ background: userRole === 'Admin' ? '#0284c7' : '#334155', padding: '2px 10px', borderRadius: '12px', fontSize: '12px' }}>
            {userRole}
          </span>
        </div>
        <button 
          onClick={() => signOut(auth)} 
          style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ออกจากระบบ
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        <div style={{ background: '#101728', padding: '20px', borderRadius: '10px', border: '1px solid #1e293b' }}>
          <div style={{ color: '#94a3b8', fontSize: '14px' }}>พัสดุทั้งหมดในระบบ</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>{parcels.length} รายการ</div>
        </div>
        <div style={{ background: '#101728', padding: '20px', borderRadius: '10px', border: '1px solid #1e293b' }}>
          <div style={{ color: '#eab308', fontSize: '14px' }}>รับฝากชำระแล้ว</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>
            {parcels.filter(p => p.status === 'รับฝากชำระแล้ว').length} รายการ
          </div>
        </div>
        <div style={{ background: '#101728', padding: '20px', borderRadius: '10px', border: '1px solid #1e293b' }}>
          <div style={{ color: '#38bdf8', fontSize: '14px' }}>กำลังจัดส่ง</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>
            {parcels.filter(p => p.status === 'กำลังจัดส่ง').length} รายการ
          </div>
        </div>
      </div>

      {userRole === 'Admin' && (
        <div style={{ background: '#101728', padding: '20px', borderRadius: '10px', border: '1px solid #1e293b', marginBottom: '25px' }}>
          <h3 style={{ margin: '0 0 15px 0' }}>📝 สร้างรายการพัสดุใหม่ & พิมพ์ใบปะหน้า</h3>
          <form onSubmit={handleSaveAndPrint}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '5px' }}>Tracking ID</label>
                <input 
                  type="text" 
                  value={formData.trackingId} 
                  onChange={(e) => setFormData({...formData, trackingId: e.target.value})} 
                  required 
                  style={{ width: '100%', padding: '10px', background: '#070b14', border: '1px solid #334155', color: '#fff', borderRadius: '6px', boxSizing: 'border-box' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '5px' }}>ชื่อผู้รับ</label>
                <input 
                  type="text" 
                  placeholder="ระบุชื่อ-นามสกุล ผู้รับ" 
                  value={formData.recipient} 
                  onChange={(e) => setFormData({...formData, recipient: e.target.value})} 
                  required 
                  style={{ width: '100%', padding: '10px', background: '#070b14', border: '1px solid #334155', color: '#fff', borderRadius: '6px', boxSizing: 'border-box' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '5px' }}>เบอร์โทรศัพท์</label>
                <input 
                  type="text" 
                  placeholder="0812345678" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  style={{ width: '100%', padding: '10px', background: '#070b14', border: '1px solid #334155', color: '#fff', borderRadius: '6px', boxSizing: 'border-box' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '5px' }}>จังหวัดปลายทาง</label>
                <select 
                  value={selectedProvince} 
                  onChange={(e) => setSelectedProvince(e.target.value)} 
                  style={{ width: '100%', padding: '10px', background: '#070b14', border: '1px solid #334155', color: '#fff', borderRadius: '6px', boxSizing: 'border-box' }}
                >
                  {THAI_PROVINCES.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '5px' }}>ที่อยู่รายละเอียด (บ้านเลขที่, ถนน, ตำบล, อำเภอ)</label>
              <input 
                type="text" 
                placeholder="เช่น 99/9 ถ.สุขุมวิท" 
                value={addressDetail} 
                onChange={(e) => setAddressDetail(e.target.value)} 
                required 
                style={{ width: '100%', padding: '10px', background: '#070b14', border: '1px solid #334155', color: '#fff', borderRadius: '6px', boxSizing: 'border-box' }} 
              />
            </div>
            <button 
              type="submit" 
              disabled={formLoading} 
              style={{ width: '100%', padding: '12px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
            >
              {formLoading ? 'กำลังบันทึก...' : '💾 บันทึกข้อมูล ส่ง Discord และพิมพ์ใบปะหน้า'}
            </button>
          </form>
        </div>
      )}

      <div style={{ background: '#101728', padding: '15px', borderRadius: '10px', border: '1px solid #1e293b', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="🔍 ค้นหา Tracking, ผู้รับ, เบอร์โทร..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          style={{ flex: 1, minWidth: '220px', padding: '10px', background: '#070b14', border: '1px solid #334155', color: '#fff', borderRadius: '6px' }} 
        />
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)} 
          style={{ padding: '10px', background: '#070b14', border: '1px solid #334155', color: '#fff', borderRadius: '6px' }}
        >
          <option value="ทั้งหมด">สถานะ: ทั้งหมด</option>
          <option value="รับฝากชำระแล้ว">รับฝากชำระแล้ว</option>
          <option value="กำลังจัดส่ง">กำลังจัดส่ง</option>
          <option value="จัดส่งสำเร็จ">จัดส่งสำเร็จ</option>
        </select>
        <select 
          value={dateFilter} 
          onChange={(e) => setDateFilter(e.target.value)} 
          style={{ padding: '10px', background: '#070b14', border: '1px solid #334155', color: '#fff', borderRadius: '6px' }}
        >
          <option value="ทั้งหมด">เวลา: ทั้งหมด</option>
          <option value="วันนี้">วันนี้</option>
        </select>
      </div>

      <div style={{ background: '#101728', borderRadius: '10px', border: '1px solid #1e293b', overflow: 'hidden' }}>
        <div style={{ padding: '15px', borderBottom: '1px solid #1e293b', fontWeight: 'bold' }}>
          📋 รายการพัสดุทั้งหมดในระบบ ({filteredParcels.length})
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#070b14', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                <th style={{ padding: '12px' }}>Tracking ID</th>
                <th style={{ padding: '12px' }}>ผู้รับ & เบอร์โทร</th>
                <th style={{ padding: '12px' }}>ปลายทาง</th>
                <th style={{ padding: '12px' }}>สถานะ</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredParcels.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>ไม่พบข้อมูลพัสดุในระบบ</td>
                </tr>
              ) : (
                filteredParcels.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#38bdf8' }}>{item.trackingId}</td>
                    <td style={{ padding: '12px' }}>
                      <div>{item.recipient}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.phone || '-'}</div>
                    </td>
                    <td style={{ padding: '12px', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.location}</td>
                    <td style={{ padding: '12px' }}>
                      {userRole === 'Admin' ? (
                        <select 
                          value={item.status} 
                          onChange={(e) => updateStatus(item.id, e.target.value)} 
                          style={{ padding: '6px', background: '#070b14', border: '1px solid #334155', color: '#fff', borderRadius: '4px' }}
                        >
                          <option value="รับฝากชำระแล้ว">รับฝากชำระแล้ว</option>
                          <option value="กำลังจัดส่ง">กำลังจัดส่ง</option>
                          <option value="จัดส่งสำเร็จ">จัดส่งสำเร็จ</option>
                        </select>
                      ) : (
                        <span>{item.status}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button 
                          onClick={() => printLabel(item)} 
                          style={{ padding: '6px 12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          🖨️ พิมพ์
                        </button>
                        {userRole === 'Admin' && (
                          <button 
                            onClick={() => deleteParcel(item.id)} 
                            style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            ลบ
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
