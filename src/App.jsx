import React, { useState, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import { db } from './firebase';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
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
  const auth = getAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  const [authLoading, setAuthLoading] = useState(true);

  const [isRegistering, setIsRegistering] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  // State สำหรับเปิด/ปิดซ่อนรหัสผ่าน
  const [showPassword, setShowPassword] = useState(false);

  const [parcels, setParcels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด');
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
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists() && userSnap.data().role) {
            setUserRole(userSnap.data().role);
            setShowRoleSelector(false);
          } else {
            setShowRoleSelector(true);
          }
        } catch (e) {
          console.error("Error fetching user role:", e);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setShowRoleSelector(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "parcels"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const parcelList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setParcels(parcelList);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (isRegistering) {
      if (password !== confirmPassword) {
        setAuthError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
        return;
      }
      if (password.length < 6) {
        setAuthError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        return;
      }
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (err) {
        setAuthError(err.code === 'auth/email-already-in-use' ? 'อีเมลนี้ถูกใช้งานแล้ว' : 'เกิดข้อผิดพลาดในการลงทะเบียน');
      }
    } else {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        setAuthError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    }
  };

  const handleSelectRole = async (selectedRole) => {
    if (!currentUser) return;
    setUserRole(selectedRole);
    setShowRoleSelector(false);

    try {
      await setDoc(doc(db, "users", currentUser.uid), {
        email: currentUser.email,
        role: selectedRole,
        updatedAt: serverTimestamp()
      }, { merge: true });
      showToast(`เข้าสู่ระบบในฐานะ [${selectedRole}] เรียบร้อยแล้ว!`);
    } catch (e) {
      console.error("Error saving role:", e);
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setShowRoleSelector(false);
    signOut(auth);
  };

  const sendDiscordNotification = async (title, parcelData, color = 3447003) => {
    if (!DISCORD_WEBHOOK_URL) return;
    try {
      await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: title,
            color: color,
            fields: [
              { name: '📦 Tracking ID', value: `\`${parcelData.trackingId}\``, inline: true },
              { name: '👤 ผู้รับ', value: parcelData.recipient, inline: true },
              { name: '📞 เบอร์โทร', value: parcelData.phone || 'ไม่ระบุ', inline: true },
              { name: '📍 ปลายทาง', value: parcelData.location, inline: false },
              { name: '🚚 สถานะปัจจุบัน', value: `**${parcelData.status}**`, inline: false },
              { name: '👨‍💻 ผู้ทำรายการ', value: `${currentUser?.email} (${userRole})`, inline: false }
            ],
            footer: { text: 'D-MAIL LOGISTICS Notification System' },
            timestamp: new Date().toISOString()
          }]
        })
      });
    } catch (error) {
      console.error("Discord Notification Error:", error);
    }
  };

  const printLabel = (item) => {
    const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    if (typeof JsBarcode === 'function') {
      JsBarcode(svgNode, item.trackingId, { format: "CODE128", width: 2, height: 45, displayValue: true });
    }

    const trackUrl = `${window.location.origin}/track?id=${item.trackingId}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(trackUrl)}`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const pri = iframe.contentWindow;
    pri.document.open();
    pri.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ใบปะหน้าพัสดุ - ${item.trackingId}</title>
          <style>
            body { font-family: sans-serif; padding: 15px; text-align: center; border: 2px dashed #000; margin: 10px; }
            h2 { font-size: 20px; margin-bottom: 2px; }
            .barcode { margin: 10px 0; display: flex; justify-content: center; }
            .barcode svg { width: 100%; max-width: 280px; height: auto; }
            .content-grid { display: flex; justify-content: space-between; text-align: left; margin-top: 10px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 13px; line-height: 1.5; }
            .qr-box { text-align: center; margin-left: 10px; }
            .qr-box img { width: 85px; height: 85px; }
            .qr-text { font-size: 9px; color: #555; margin-top: 2px; }
          </style>
        </head>
        <body>
          <h2>D-MAIL LOGISTICS</h2>
          <p style="margin-top:0; font-size:11px; color:#555;">ใบปะหน้าพัสดุด่วนพิเศษ</p>
          <div class="barcode">${svgNode.outerHTML}</div>
          <div class="content-grid">
            <div>
              <p><strong>Tracking ID:</strong> ${item.trackingId}</p>
              <p><strong>ผู้รับ:</strong> ${item.recipient} (${item.phone || 'ไม่ระบุเบอร์'})</p>
              <p><strong>ปลายทาง:</strong> ${item.location}</p>
              <p><strong>สถานะ:</strong> ${item.status}</p>
            </div>
            <div class="qr-box">
              <img src="${qrCodeUrl}" alt="QR Tracking" />
              <div class="qr-text">สแกนเช็กสถานะ</div>
            </div>
          </div>
        </body>
      </html>
    `);
    pri.document.close();

    setTimeout(() => {
      pri.focus();
      pri.print();
      document.body.removeChild(iframe);
    }, 600);
  };

  const handleSaveAndPrint = async (e) => {
    e.preventDefault();
    if (userRole !== 'Admin') {
      showToast('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่บันทึกข้อมูลได้');
      return;
    }

    if (!formData.recipient || !addressDetail) {
      showToast('กรุณากรอกข้อมูลผู้รับและรายละเอียดที่อยู่ให้ครบถ้วน');
      return;
    }

    const fullLocation = `${addressDetail} จ.${selectedProvince}`;
    const newParcelData = {
      trackingId: formData.trackingId,
      recipient: formData.recipient,
      phone: formData.phone,
      location: fullLocation,
      status: formData.status,
      createdBy: currentUser.email,
      createdAt: serverTimestamp()
    };

    setFormLoading(true);
    try {
      await addDoc(collection(db, "parcels"), newParcelData);
      showToast('บันทึกรายการพัสดุและส่งแจ้งเตือน Discord สำเร็จ!');
      
      await sendDiscordNotification('🚨 มีพัสดุเข้าระบบใหม่ (D-Mail)', {
        ...newParcelData,
        phone: formData.phone || 'ไม่ระบุ'
      }, 3447003);

      printLabel(newParcelData);

      setFormData({
        trackingId: generateTrackingId(),
        recipient: '',
        phone: '',
        status: 'รับฝากชำระแล้ว'
      });
      setAddressDetail('');
    } catch (error) {
      console.error("Error saving parcel:", error);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูลพัสดุ');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    if (userRole !== 'Admin') {
      showToast('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่เปลี่ยนสถานะได้');
      return;
    }
    try {
      const parcelRef = doc(db, "parcels", id);
      const parcelSnap = await getDoc(parcelRef);
      if (!parcelSnap.exists()) return;

      const parcelData = parcelSnap.data();
      await updateDoc(parcelRef, { 
        status: newStatus,
        updatedAt: serverTimestamp() 
      });

      showToast(`อัปเดตสถานะเป็น [${newStatus}] สำเร็จ`);
      
      await sendDiscordNotification(`🔄 อัปเดตสถานะพัสดุ: ${newStatus}`, {
        ...parcelData,
        status: newStatus
      }, 15844367);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDeleteParcel = async (id) => {
    if (userRole !== 'Admin') {
      showToast('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่ลบข้อมูลได้');
      return;
    }
    if (!window.confirm('คุณต้องการลบรายการพัสดุตารางนี้ใช่หรือไม่?')) return;

    try {
      await deleteDoc(doc(db, "parcels", id));
      showToast('ลบรายการพัสดุสำเร็จ');
    } catch (error) {
      console.error("Error deleting parcel:", error);
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#38bdf8', fontFamily: 'sans-serif' }}>
        <h2>กำลังโหลดระบบ D-MAIL LOGISTICS...</h2>
      </div>
    );
  }

  if (currentUser && showRoleSelector) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif', color: '#f8fafc' }}>
        <div style={{ backgroundColor: '#101728', padding: '40px', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)', width: '100%', maxWidth: '420px', textAlign: 'center', border: '1px solid #1e293b' }}>
          <h2 style={{ color: '#38bdf8', marginBottom: '10px' }}>เลือกสิทธิ์การใช้งาน</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '30px' }}>กรุณาเลือกบทบาทที่ต้องการใช้งาน:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button 
              onClick={() => handleSelectRole('Admin')}
              style={{ padding: '16px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
            >
              👑 ผู้ดูแลระบบ (Admin)
            </button>
            <button 
              onClick={() => handleSelectRole('User')}
              style={{ padding: '16px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
            >
              👤 ผู้ใช้งานทั่วไป (User)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif', margin: 0, padding: '20px' }}>
        <div style={{ backgroundColor: '#101728', padding: '45px 40px', borderRadius: '24px', boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.9)', width: '100%', maxWidth: '460px', border: '1px solid #1e293b', textAlign: 'center' }}>
          
          {/* แถบสถานะด้านบน */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#162032', padding: '6px 16px', borderRadius: '20px', marginBottom: '24px', border: '1px solid #1e293b' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px #22c55e' }}></span>
            <span style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: '500' }}>ระบบจัดการและติดตามพัสดุ</span>
          </div>

          {/* หัวข้อ D-MAIL LOGISTICS */}
          <div style={{ marginBottom: '30px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>
              <span style={{ color: '#ffffff' }}>D-MAIL </span>
              <span style={{ color: '#00d2ff' }}>LOGISTICS</span>
            </h1>
            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>กรุณาเข้าสู่ระบบเพื่อเข้าใช้งาน</p>
          </div>

          {authError && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 12px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px', fontWeight: '500' }}>อีเมลผู้ใช้งาน</label>
              <input 
                type="email" 
                required
                placeholder="admin@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #1e293b', backgroundColor: '#162032', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px', fontWeight: '500' }}>รหัสผ่าน</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '14px 45px 14px 16px', borderRadius: '12px', border: '1px solid #1e293b', backgroundColor: '#162032', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {isRegistering && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px', fontWeight: '500' }}>ยืนยันรหัสผ่าน</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #1e293b', backgroundColor: '#162032', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
            )}

            <button 
              type="submit"
              style={{ width: '100%', marginTop: '4px', padding: '15px', background: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0, 114, 255, 0.4)', transition: '0.2s', boxSizing: 'border-box' }}
            >
              {isRegistering ? 'ลงทะเบียนสมาชิก' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '25px' }}>
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', textDecoration: 'none', padding: 0 }}
            >
              {isRegistering ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชีผู้ใช้? ลงทะเบียนใหม่'}
            </button>
          </div>

        </div>
      </div>
    );
  }

  const filteredParcels = parcels.filter(item => {
    const matchSearch = item.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.phone && item.phone.includes(searchTerm));
    const matchStatus = statusFilter === 'ทั้งหมด' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'sans-serif', paddingBottom: '50px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: '#162032', color: '#38bdf8', border: '1px solid #0072ff', padding: '14px 24px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 9999, fontWeight: 'bold' }}>
          {toast}
        </div>
      )}

      <header style={{ backgroundColor: '#101728', borderBottom: '1px solid #1e293b', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '10px' }}>
            📦 D-MAIL LOGISTICS <span style={{ fontSize: '12px', backgroundColor: userRole === 'Admin' ? '#0284c7' : '#334155', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>{userRole}</span>
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>ผู้ใช้งาน: {currentUser.email}</p>
        </div>
        <button 
          onClick={handleLogout}
          style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
        >
          ออกจากระบบ
        </button>
      </header>

      <main style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {userRole === 'Admin' ? (
          <div style={{ backgroundColor: '#101728', padding: '30px', borderRadius: '20px', border: '1px solid #1e293b' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#38bdf8', fontSize: '18px' }}>➕ สร้างรายการพัสดุใหม่ & พิมพ์ใบปะหน้า</h3>
            <form onSubmit={handleSaveAndPrint} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Tracking ID (Auto)</label>
                  <input 
                    type="text" 
                    readOnly
                    value={formData.trackingId}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #1e293b', backgroundColor: '#162032', color: '#38bdf8', fontWeight: 'bold', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>ชื่อผู้รับ</label>
                  <input 
                    type="text" 
                    required
                    placeholder="ระบุชื่อ-นามสกุล ผู้รับ"
                    value={formData.recipient}
                    onChange={(e) => setFormData({...formData, recipient: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #1e293b', backgroundColor: '#162032', color: 'white', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>เบอร์โทรศัพท์</label>
                  <input 
                    type="text" 
                    placeholder="0812345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #1e293b', backgroundColor: '#162032', color: 'white', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>จังหวัดปลายทาง</label>
                  <select 
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #1e293b', backgroundColor: '#162032', color: 'white', boxSizing: 'border-box' }}
                  >
                    {THAI_PROVINCES.map((prov, idx) => (
                      <option key={idx} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>ที่อยู่รายละเอียด (บ้านเลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="เช่น 99/9 ถ.สุขุมวิท แขวงคลองเตย"
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #1e293b', backgroundColor: '#162032', color: 'white', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={formLoading}
                style={{ padding: '14px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', opacity: formLoading ? 0.7 : 1 }}
              >
                {formLoading ? 'กำลังบันทึกข้อมูล...' : '💾 บันทึกข้อมูล ส่ง Discord และพิมพ์ใบปะหน้า'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ backgroundColor: '#101728', padding: '20px 30px', borderRadius: '20px', border: '1px solid #1e293b', textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#64748b' }}>💡 คุณเข้าสู่ระบบในฐานะ **User** สามารถตรวจสอบสถานะพัสดุและค้นหาข้อมูลพัสดุได้</p>
          </div>
        )}

        <div style={{ backgroundColor: '#101728', padding: '30px', borderRadius: '20px', border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px' }}>📋 รายการพัสดุทั้งหมดในระบบ ({filteredParcels.length})</h3>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="🔍 ค้นหา Tracking, ผู้รับ, เบอร์โทร"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #1e293b', backgroundColor: '#162032', color: 'white', fontSize: '14px', width: '240px' }}
              />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #1e293b', backgroundColor: '#162032', color: 'white', fontSize: '14px' }}
              >
                <option value="ทั้งหมด">สถานะ: ทั้งหมด</option>
                <option value="รับฝากชำระแล้ว">รับฝากชำระแล้ว</option>
                <option value="กำลังจัดส่ง">กำลังจัดส่ง</option>
                <option value="จัดส่งสำเร็จ">จัดส่งสำเร็จ</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #1e293b', color: '#64748b' }}>
                  <th style={{ padding: '12px' }}>Tracking ID</th>
                  <th style={{ padding: '12px' }}>ผู้รับ & เบอร์โทร</th>
                  <th style={{ padding: '12px' }}>ปลายทาง</th>
                  <th style={{ padding: '12px' }}>สถานะ</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>จัดการ / พิมพ์</th>
                </tr>
              </thead>
              <tbody>
                {filteredParcels.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>ไม่พบข้อมูลพัสดุในระบบ</td>
                  </tr>
                ) : (
                  filteredParcels.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '14px', color: '#38bdf8', fontWeight: 'bold' }}>{item.trackingId}</td>
                      <td style={{ padding: '14px' }}>
                        <div>{item.recipient}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{item.phone || 'ไม่ระบุเบอร์'}</div>
                      </td>
                      <td style={{ padding: '14px', maxWidth: '250px', wordBreak: 'break-word' }}>{item.location}</td>
                      <td style={{ padding: '14px' }}>
                        {userRole === 'Admin' ? (
                          <select 
                            value={item.status}
                            onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#162032', color: '#38bdf8', fontSize: '13px' }}
                          >
                            <option value="รับฝากชำระแล้ว">รับฝากชำระแล้ว</option>
                            <option value="กำลังจัดส่ง">กำลังจัดส่ง</option>
                            <option value="จัดส่งสำเร็จ">จัดส่งสำเร็จ</option>
                          </select>
                        ) : (
                          <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#162032', fontSize: '12px', color: '#38bdf8' }}>
                            {item.status}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <button 
                            onClick={() => printLabel(item) }
                            style={{ padding: '6px 12px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
                          >
                            🖨️ พิมพ์
                          </button>
                          {userRole === 'Admin' && (
                            <button 
                              onClick={() => handleDeleteParcel(item.id)}
                              style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
                            >
                              🗑️
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

      </main>
    </div>
  );
}
