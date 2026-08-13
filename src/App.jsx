import React, { useState, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getFirestore, collection, addDoc, updateDoc, deleteDoc, 
  doc, getDoc, setDoc, onSnapshot, query, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from 'firebase/auth';

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

const EMAILJS_SERVICE_ID = "service_a1qkxop";
const EMAILJS_TEMPLATE_ID = "template_okn7sbt";
const EMAILJS_PUBLIC_KEY = "vY-ZC8b43U-idsLpR";

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
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [parcels, setParcels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด');
  const [toast, setToast] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('กรุงเทพมหานคร');
  const [addressDetail, setAddressDetail] = useState('');
  
  const [formData, setFormData] = useState({ 
    trackingId: generateTrackingId(), 
    recipient: '', 
    recipientEmail: '', 
    phone: '', 
    status: 'รับฝากชำระแล้ว' 
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists() && userSnap.data().role) { 
          setUserRole(userSnap.data().role); 
          setShowRoleSelector(false); 
        } else { 
          setUserRole(null);
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
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) { 
      setAuthError('อีเมลหรือรหัสผ่านไม่ถูกต้อง'); 
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
    const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    if (typeof JsBarcode === 'function') {
      JsBarcode(svgNode, item.trackingId, { format: "CODE128", width: 2, height: 45, displayValue: true });
    }
     
    const qrData = `Tracking: ${item.trackingId} | ผู้รับ: ${item.recipient} | ปลายทาง: ${item.location} | สถานะ: ${item.status}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData)}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label - ${item.trackingId}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 20px; color: #000; }
            .label { border: 2px dashed #000; padding: 20px; width: 280px; margin: auto; text-align: left; background: #fff; }
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
            <p><strong>อีเมล:</strong> ${item.recipientEmail || '-'}</p>
            <p><strong>ปลายทาง:</strong> ${item.location}</p>
            <p><strong>สถานะ:</strong> ${item.status}</p>
            <div style="text-align:center; margin-top:12px;">
              <img src="${qrCodeUrl}" width="90" alt="QR Code" />
              <div style="font-size: 10px; color: #555; margin-top: 4px;">สแกนเพื่อตรวจสอบข้อมูล</div>
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
      const dataForPrint = { ...newParcelData, id: docRef.id };
       
      if (formData.recipientEmail && window.emailjs) {
        const emailParams = {
          tracking_id: formData.trackingId,
          recipient_name: formData.recipient,
          recipient_email: formData.recipientEmail,
          parcel_status: formData.status,
          parcel_location: fullLocation
        };
        window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailParams, EMAILJS_PUBLIC_KEY)
          .then(() => console.log('Email sent successfully'))
          .catch((err) => console.log('Email Error:', err));
      }

      printLabel(dataForPrint);
      showToast('บันทึก, ส่งอีเมล และสร้างใบปะหน้าสำเร็จ!');
      setFormData({ trackingId: generateTrackingId(), recipient: '', recipientEmail: '', phone: '', status: 'รับฝากชำระแล้ว' });
      setAddressDetail('');
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึก');
    }
    setFormLoading(false);
  };

  const handleDeleteParcel = async (id) => {
    if (userRole !== 'Admin') return;
    if (window.confirm('คุณต้องการลบรายการพัสดุนี้ใช่หรือไม่?')) {
      try {
        await deleteDoc(doc(db, "parcels", id));
        showToast('ลบรายการพัสดุสำเร็จ');
      } catch (err) {
        showToast('เกิดข้อผิดพลาดในการลบ');
      }
    }
  };

  if (authLoading) {
    return <div style={{ textAlign: 'center', marginTop: '50px', color: '#fff', background: '#0b0f19', height: '100vh', paddingTop: '50px' }}>กำลังโหลดระบบ...</div>;
  }

  if (!currentUser) {
    return (
      <div style={{ background: '#0b0f19', minHeight: '100vh', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#131b2e', padding: '40px', borderRadius: '16px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid #1e293b', textAlign: 'center' }}>
          
          <div style={{ display: 'inline-block', background: '#1e293b', color: '#38bdf8', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', marginBottom: '20px', fontWeight: '500' }}>
            ● ระบบจัดการและติดตามพัสดุ
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', letterSpacing: '0.5px', color: '#ffffff' }}>
            D-MAIL <span style={{ color: '#38bdf8' }}>LOGISTICS</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '30px' }}>กรุณาเข้าสู่ระบบเพื่อเข้าใช้งานแผงบอร์ด</p>

          {authError && <div style={{ color: '#ef4444', marginBottom: '15px', fontSize: '13px' }}>{authError}</div>}
          
          <form onSubmit={handleAuthSubmit} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#cbd5e1' }}>อีเมลผู้ใช้งาน</label>
              <input type="email" placeholder="admin@gmail.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
            </div>
            
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#cbd5e1' }}>รหัสผ่าน</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
            </div>

            <button type="submit" style={{ width: '100%', padding: '12px', background: '#06b6d4', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 12px rgba(6,182,212,0.3)' }}>
              เข้าสู่ระบบ
            </button>
          </form>

        </div>
      </div>
    );
  }

  if (showRoleSelector) {
    return (
      <div style={{ background: '#0b0f19', minHeight: '100vh', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#131b2e', padding: '30px', borderRadius: '16px', width: '350px', textAlign: 'center', border: '1px solid #1e293b' }}>
          <h2>เลือกบทบาทของคุณ</h2>
          <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px' }}>กรุณาเลือกสิทธิ์การใช้งานระบบ</p>
          <button onClick={() => selectRole('Admin')} style={{ width: '100%', padding: '12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>Admin (ผู้ดูแลระบบ)</button>
          <button onClick={() => selectRole('User')} style={{ width: '100%', padding: '12px', background: '#475569', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>User (ผู้ใช้งานทั่วไป)</button>
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
    <div style={{ background: '#0b0f19', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif', paddingBottom: '40px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#22c55e', color: '#fff', padding: '12px 20px', borderRadius: '5px', zIndex: 1000, fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: '#131b2e', borderBottom: '1px solid #1e293b' }}>
        <h2 style={{ margin: 0, letterSpacing: '1px' }}>D-MAIL <span style={{ color: '#38bdf8' }}>LOGISTICS</span></h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ background: userRole === 'Admin' ? '#0284c7' : '#475569', padding: '5px 12px', borderRadius: '15px', fontSize: '13px' }}>
            {userRole === 'Admin' ? 'Admin (ผู้ดูแลระบบ)' : 'User (ผู้ใช้งาน)'}
          </span>
          <button onClick={() => signOut(auth)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>ออกจากระบบ</button>
        </div>
      </div>

      <div style={{ padding: '30px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* แสดงแดชบอร์ดเฉพาะ Admin เท่านั้น */}
        {userRole === 'Admin' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
            <div style={{ background: '#131b2e', padding: '20px', borderRadius: '10px', textAlign: 'center', border: '1px solid #1e293b' }}>
              <div style={{ color: '#94a3b8', fontSize: '14px' }}>พัสดุทั้งหมดในระบบ</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>{parcels.length} รายการ</div>
            </div>
            <div style={{ background: '#131b2e', padding: '20px', borderRadius: '10px', textAlign: 'center', border: '1px solid #1e293b' }}>
              <div style={{ color: '#94a3b8', fontSize: '14px' }}>รับฝากชำระแล้ว</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>{parcels.filter(p => p.status === 'รับฝากชำระแล้ว').length} รายการ</div>
            </div>
            <div style={{ background: '#131b2e', padding: '20px', borderRadius: '10px', textAlign: 'center', border: '1px solid #1e293b' }}>
              <div style={{ color: '#94a3b8', fontSize: '14px' }}>กำลังจัดส่ง</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>{parcels.filter(p => p.status === 'กำลังจัดส่ง').length} รายการ</div>
            </div>
          </div>
        )}

        {/* ฟอร์มเพิ่มพัสดุสำหรับ Admin เท่านั้น */}
        {userRole === 'Admin' && (
          <div style={{ background: '#131b2e', padding: '25px', borderRadius: '10px', border: '1px solid #1e293b', marginBottom: '35px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>📝 สร้างรายการพัสดุใหม่ & พิมพ์ใบปะหน้า</h3>
            <form onSubmit={handleSaveAndPrint}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px' }}>Tracking ID (รันออโต้)</label>
                  <input type="text" value={formData.trackingId} disabled style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #334155', background: '#0f172a', color: '#888', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px' }}>ชื่อผู้รับ</label>
                  <input type="text" placeholder="ชื่อผู้รับ" value={formData.recipient} onChange={e => setFormData({...formData, recipient: e.target.value})} required style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #334155', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px' }}>อีเมลผู้รับ (สำหรับส่งแจ้งเตือน)</label>
                  <input type="email" placeholder="example@gmail.com" value={formData.recipientEmail} onChange={e => setFormData({...formData, recipientEmail: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #334155', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px' }}>เบอร์โทรศัพท์</label>
                  <input type="text" placeholder="081234567" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #334155', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px' }}>จังหวัดปลายทาง</label>
                  <select value={selectedProvince} onChange={e => setSelectedProvince(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #334155', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }}>
                    {THAI_PROVINCES.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px' }}>ที่อยู่รายละเอียด (บ้านเลขที่, ถนน, ตำบล, อำเภอ)</label>
                <input type="text" placeholder="เช่น 99/9 ถ.สุขุมวิท" value={addressDetail} onChange={e => setAddressDetail(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #334155', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
              </div>

              <button type="submit" disabled={formLoading} style={{ width: '100%', padding: '12px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                {formLoading ? 'กำลังบันทึกและส่งเมล...' : '💾 บันทึกข้อมูล ส่งอีเมล และพิมพ์ใบปะหน้า'}
              </button>
            </form>
          </div>
        )}

        {/* ตารางแสดงรายการ */}
        <div style={{ background: '#131b2e', padding: '20px', borderRadius: '10px', border: '1px solid #1e293b' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>📦 รายการพัสดุทั้งหมดในระบบ ({filteredParcels.length})</h3>
          
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <input type="text" placeholder="🔍 ค้นหา Tracking, ผู้รับ, เบอร์โทร..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}>
              <option value="ทั้งหมด">สถานะ: ทั้งหมด</option>
              <option value="รับฝากชำระแล้ว">รับฝากชำระแล้ว</option>
              <option value="กำลังจัดส่ง">กำลังจัดส่ง</option>
            </select>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '14px' }}>
                <th style={{ padding: '10px' }}>Tracking ID</th>
                <th style={{ padding: '10px' }}>ผู้รับ & เบอร์/อีเมล</th>
                <th style={{ padding: '10px' }}>ปลายทาง</th>
                <th style={{ padding: '10px' }}>สถานะ</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredParcels.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#777' }}>ไม่พบรายการพัสดุ</td>
                </tr>
              ) : (
                filteredParcels.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #1e293b', fontSize: '14px' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#38bdf8' }}>{item.trackingId}</td>
                    <td style={{ padding: '12px' }}>
                      <div>{item.recipient}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.phone || '-'} | {item.recipientEmail || 'ไม่มีอีเมล'}</div>
                    </td>
                    <td style={{ padding: '12px' }}>{item.location}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: item.status === 'กำลังจัดส่ง' ? '#0369a1' : '#334155' }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button onClick={() => printLabel(item)} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>🖨️ พิมพ์</button>
                        
                        {/* ปุ่มลบแสดงเฉพาะ Admin เท่านั้น */}
                        {userRole === 'Admin' && (
                          <button onClick={() => handleDeleteParcel(item.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>🗑️ ลบ</button>
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
