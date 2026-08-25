import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getFirestore, collection, addDoc, updateDoc, deleteDoc, 
  doc, getDoc, setDoc, onSnapshot, query, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged 
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

const generateTrackingId = () => 'WH' + Math.floor(10000000 + Math.random() * 90000000) + 'TH';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  const [authLoading, setAuthLoading] = useState(true);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
    
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
    
  const [parcels, setParcels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ทั้งหมด');
  const [toast, setToast] = useState('');
    
  const [formData, setFormData] = useState({ 
    trackingId: generateTrackingId(), 
    transactionType: 'รับเข้า (Inbound)',
    productName: '',
    quantity: 1,
    recipient: '', 
    phone: '', 
    destinationProvince: 'กรุงเทพมหานคร',
    addressDetail: '',
    status: 'รับเข้าคลังหลัก (สโตร์)' 
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
            setUserRole(null);
            setShowRoleSelector(true); 
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
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
    const q = query(collection(db, "warehouse_parcels"), orderBy("createdAt", "desc"));
    const unsubscribeParcels = onSnapshot(q, (snapshot) => {
      setParcels(snapshot.docs.map(docSnap => ({ 
        id: docSnap.id, 
        ...docSnap.data() 
      })));
    }, (error) => {
      console.error("Error fetching parcels:", error);
    });
    return () => unsubscribeParcels();
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
        await createUserWithEmailAndPassword(auth, email, password);
        showToast('สมัครสมาชิกสำเร็จ!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) { 
      setAuthError(isRegistering ? 'ไม่สามารถสมัครสมาชิกได้ (อีเมลอาจซ้ำหรือรหัสผ่านสั้นเกินไป)' : 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'); 
    }
  };

  const selectRole = async (role) => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, "users", currentUser.uid), { role, email: currentUser.email }, { merge: true });
      setUserRole(role);
      setShowRoleSelector(false);
      showToast(`กำหนดสิทธิ์เป็น ${role} สำเร็จ`);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const printLabel = (item) => {
    const printWindow = window.open('', '_blank', 'width=500,height=650');
    if (!printWindow) {
      showToast('กรุณาอนุญาตให้เบราว์เซอร์เปิดหน้าต่างป๊อปอัป (Popup)');
      return;
    }
    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${item.trackingId}&scale=2&height=12&includetext=true`;
    const trackingUrl = `https://d-mail-logistics.firebaseapp.com/?track=${item.trackingId}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(trackingUrl)}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Warehouse Label - ${item.trackingId}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 15px; color: #0f172a; }
            .label { border: 2px solid #bae6fd; padding: 15px; width: 300px; margin: auto; text-align: left; background: #ffffff; border-radius: 8px; }
            .barcode { text-align: center; margin-bottom: 8px; }
            .barcode img { max-width: 100%; height: auto; }
            button { margin-top: 15px; padding: 12px 20px; cursor: pointer; background: #0284c7; color: #fff; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="label">
            <h3 style="text-align:center; margin:0 0 8px 0; font-size: 16px; color: #0369a1;">CENTRAL WAREHOUSE</h3>
            <div style="text-align:center; font-weight:bold; font-size:15px; margin-bottom:6px; color:${item.transactionType?.includes('รับเข้า') ? '#0d9488' : '#c2410c'};">[ ${item.transactionType} ]</div>
            <div class="barcode"><img src="${barcodeUrl}" alt="Barcode" /></div>
            <p style="margin:6px 0; font-size:13px;"><strong>Tracking:</strong> ${item.trackingId}</p>
            <p style="margin:6px 0; font-size:13px;"><strong>สินค้า:</strong> ${item.productName} (จำนวน: ${item.quantity})</p>
            <p style="margin:6px 0; font-size:13px;"><strong>ผู้รับ/ผู้เบิก:</strong> ${item.recipient} (${item.phone || '-'})</p>
            <p style="margin:6px 0; font-size:13px;"><strong>ปลายทาง/หน่วยงาน:</strong> ${item.addressDetail} จ.${item.destinationProvince}</p>
            <p style="margin:6px 0; font-size:13px;"><strong>สถานะ:</strong> ${item.status}</p>
            <div style="text-align:center; margin-top:10px;">
              <img src="${qrCodeUrl}" width="85" alt="QR Code" />
              <div style="font-size: 10px; color: #64748b; margin-top: 2px; font-weight: bold;">สแกนเพื่อเช็คสถานะ</div>
            </div>
          </div>
          <button onclick="window.print()">🖨️ สั่งพิมพ์ใบปะหน้า</button>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSaveParcel = async (e) => {
    e.preventDefault();
    if (!formData.productName || !formData.recipient || !formData.addressDetail) {
      showToast('กรุณากรอกข้อมูลสินค้า ผู้รับ และที่อยู่ให้ครบถ้วน');
      return;
    }

    const newParcelData = { 
      ...formData, 
      createdBy: currentUser.email, 
      createdAt: serverTimestamp() 
    };

    setFormLoading(true);
    try {
      const docRef = await addDoc(collection(db, "warehouse_parcels"), newParcelData);
      printLabel({ ...newParcelData, id: docRef.id });
      showToast(`บันทึกรายการ "${formData.transactionType}" สำเร็จ!`);
      setFormData({ 
        trackingId: generateTrackingId(), 
        transactionType: 'รับเข้า (Inbound)',
        productName: '', 
        quantity: 1, 
        recipient: '', 
        phone: '', 
        destinationProvince: 'กรุงเทพมหานคร', 
        addressDetail: '', 
        status: 'รับเข้าคลังหลัก (สโตร์)' 
      });
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึก');
    }
    setFormLoading(false);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "warehouse_parcels", id), { status: newStatus });
      showToast(`อัปเดตสถานะเป็น "${newStatus}" สำเร็จ`);
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการอัปเดต');
    }
  };

  const handleDeleteParcel = async (id) => {
    if (userRole !== 'Admin') {
      showToast('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบข้อมูลได้');
      return;
    }
    if (window.confirm('คุณต้องการลบรายการพัสดุนี้ใช่หรือไม่?')) {
      try {
        await deleteDoc(doc(db, "warehouse_parcels", id));
        showToast('ลบรายการพัสดุสำเร็จ');
      } catch (err) {
        showToast('เกิดข้อผิดพลาดในการลบ');
      }
    }
  };

  if (authLoading) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0284c7', background: '#f0f9ff', fontSize: '18px', fontWeight: 'bold' }}>
        กำลังโหลดระบบคลังสินค้า...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)', color: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#ffffff', padding: '40px', borderRadius: '16px', width: '420px', boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.1)', border: '1px solid #bae6fd', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: '#e0f2fe', color: '#0369a1', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', marginBottom: '20px', fontWeight: 'bold' }}>
            ● ระบบจัดการคลังสินค้า
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#0369a1', letterSpacing: '0.5px' }}>
            CENTRAL WAREHOUSE
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '25px', fontWeight: 'bold' }}>
            {isRegistering ? 'กรอกข้อมูลเพื่อสมัครสมาชิกใหม่' : 'กรุณาเข้าสู่ระบบเพื่อใช้งาน'}
          </p>

          {authError && <div style={{ color: '#ef4444', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>{authError}</div>}
           
          <form onSubmit={handleAuthSubmit} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>อีเมล</label>
              <input type="email" placeholder="user@gmail.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #bae6fd', background: '#f8fafc', color: '#0f172a', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>รหัสผ่าน</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #bae6fd', background: '#f8fafc', color: '#0f172a', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <button type="submit" style={{ width: '100%', padding: '12px', background: isRegistering ? '#0d9488' : '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)', transition: 'background 0.2s' }}>
              {isRegistering ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <div style={{ marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
            {isRegistering ? (
              <span>มีบัญชีอยู่แล้ว? <button onClick={() => setIsRegistering(false)} style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontWeight: 'bold', padding: 0, fontSize: '14px', textDecoration: 'underline' }}>เข้าสู่ระบบ</button></span>
            ) : (
              <span>ยังไม่มีบัญชีผู้ใช้งาน? <button onClick={() => setIsRegistering(true)} style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontWeight: 'bold', padding: 0, fontSize: '14px', textDecoration: 'underline' }}>สมัครสมาชิก</button></span>
            )}
          </div>

        </div>
      </div>
    );
  }

  if (showRoleSelector) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)', color: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#ffffff', padding: '35px', borderRadius: '16px', width: '380px', textAlign: 'center', border: '1px solid #bae6fd', boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.1)' }}>
          <h2 style={{ color: '#0369a1', margin: '0 0 10px 0', fontSize: '20px' }}>เลือกบทบาทของคุณ</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '25px' }}>กำหนดสิทธิ์การใช้งานในระบบคลังพัสดุ</p>
          <button onClick={() => selectRole('Admin')} style={{ width: '100%', padding: '12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '12px', fontSize: '15px' }}>🛡️ Admin (ผู้ดูแลระบบ)</button>
          <button onClick={() => selectRole('Staff')} style={{ width: '100%', padding: '12px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>👷 Staff (เจ้าหน้าที่)</button>
        </div>
      </div>
    );
  }

  const filteredParcels = parcels.filter(item => {
    const matchSearch = item.trackingId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.destinationProvince?.includes(searchTerm);
    const matchType = typeFilter === 'ทั้งหมด' || item.transactionType === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div style={{ background: '#f0f9ff', minHeight: '100vh', color: '#0f172a', fontFamily: 'sans-serif', paddingBottom: '40px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#0284c7', color: '#fff', padding: '12px 20px', borderRadius: '8px', zIndex: 1000, fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 40px', background: '#ffffff', borderBottom: '1px solid #bae6fd', boxShadow: '0 1px 3px rgba(2, 132, 199, 0.05)' }}>
        <h2 style={{ margin: 0, letterSpacing: '0.5px', color: '#0369a1', fontSize: '20px', fontWeight: 'bold' }}>
          📦 CENTRAL WAREHOUSE
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ 
            background: userRole === 'Admin' ? '#e0f2fe' : '#ccfbf1', 
            color: userRole === 'Admin' ? '#0369a1' : '#0f766e',
            padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold'
          }}>
            สิทธิ์: {userRole}
          </span>
          <button onClick={() => signOut(auth)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>ออกจากระบบ</button>
        </div>
      </div>

      <div style={{ padding: '30px 40px', maxWidth: '1200px', margin: '0 auto' }}>
         
        {/* สถิติคลังสินค้า */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '12px', textAlign: 'center', border: '1px solid #bae6fd', boxShadow: '0 1px 3px rgba(2, 132, 199, 0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>รายการทั้งหมด</div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '6px', color: '#0f172a' }}>{parcels.length} รายการ</div>
          </div>
          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '12px', textAlign: 'center', border: '1px solid #bae6fd', boxShadow: '0 1px 3px rgba(2, 132, 199, 0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>รายการรับเข้า (Inbound)</div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '6px', color: '#0d9488' }}>{parcels.filter(p => p.transactionType?.includes('รับเข้า')).length}</div>
          </div>
          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '12px', textAlign: 'center', border: '1px solid #bae6fd', boxShadow: '0 1px 3px rgba(2, 132, 199, 0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>รายการเบิกออก (Outbound)</div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '6px', color: '#c2410c' }}>{parcels.filter(p => p.transactionType?.includes('เบิกออก')).length}</div>
          </div>
        </div>

        {/* ฟอร์มบันทึก รับเข้า / เบิกออก */}
        <div style={{ background: '#ffffff', padding: '28px', borderRadius: '12px', border: '1px solid #bae6fd', marginBottom: '30px', boxShadow: '0 1px 3px rgba(2, 132, 199, 0.05)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#0369a1', fontSize: '17px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📝 บันทึกรายการคลังสินค้า (รับเข้า / เบิกออก)
          </h3>
          <form onSubmit={handleSaveParcel}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>ประเภทรายการ</label>
                <select value={formData.transactionType} onChange={e => setFormData({...formData, transactionType: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #bae6fd', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box', fontSize: '14px', outline: 'none' }}>
                  <option value="รับเข้า (Inbound)">🟢 รับเข้า (Inbound)</option>
                  <option value="เบิกออก (Outbound)">🟠 เบิกออก (Outbound)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>ชื่อสินค้า / รายการพัสดุ</label>
                <input type="text" placeholder="เช่น อุปกรณ์ไอที, อะไหล่" value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} required style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #bae6fd', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box', fontSize: '14px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>จำนวน</label>
                <input type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #bae6fd', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box', fontSize: '14px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>ผู้รับ / ผู้เบิกสินค้า</label>
                <input type="text" placeholder="ชื่อผู้รับหรือแผนกที่เบิก" value={formData.recipient} onChange={e => setFormData({...formData, recipient: e.target.value})} required style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #bae6fd', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box', fontSize: '14px', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>เบอร์โทรติดต่อ</label>
                <input type="text" placeholder="0812345678" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #bae6fd', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box', fontSize: '14px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>จังหวัด / ปลายทาง</label>
                <select value={formData.destinationProvince} onChange={e => setFormData({...formData, destinationProvince: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #bae6fd', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box', fontSize: '14px', outline: 'none' }}>
                  {THAI_PROVINCES.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>สถานะเริ่มต้น</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #bae6fd', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box', fontSize: '14px', outline: 'none' }}>
                  <option value="รับเข้าคลังหลัก (สโตร์)">รับเข้าคลังหลัก (สโตร์)</option>
                  <option value="กำลังกระจายส่ง">กำลังกระจายส่ง</option>
                  <option value="จัดส่งสำเร็จ">จัดส่งสำเร็จ</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>ที่อยู่หรือรายละเอียดเพิ่มเติม</label>
              <input type="text" placeholder="บ้านเลขที่, อาคาร, แผนก" value={formData.addressDetail} onChange={e => setFormData({...formData, addressDetail: e.target.value})} required style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #bae6fd', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box', fontSize: '14px', outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button type="submit" disabled={formLoading} style={{ padding: '12px 28px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)' }}>
                {formLoading ? 'กำลังบันทึก...' : '💾 บันทึกรายการ'}
              </button>
            </div>
          </form>
        </div>

        {/* ตารางประวัติรายการคลังสินค้า */}
        <div style={{ background: '#ffffff', padding: '28px', borderRadius: '12px', border: '1px solid #bae6fd', boxShadow: '0 1px 3px rgba(2, 132, 199, 0.05)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#0369a1', fontSize: '17px', fontWeight: 'bold' }}>📋 ประวัติการรับเข้าและเบิกออก ({filteredParcels.length})</h3>
           
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <input type="text" placeholder="🔍 ค้นหา Tracking, สินค้า, ผู้รับ, จังหวัด..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, padding: '11px 14px', borderRadius: '8px', border: '1px solid #bae6fd', background: '#f8fafc', color: '#0f172a', fontSize: '14px', outline: 'none' }} />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '11px 14px', borderRadius: '8px', border: '1px solid #bae6fd', background: '#f8fafc', color: '#0f172a', fontSize: '14px', outline: 'none' }}>
              <option value="ทั้งหมด">ประเภท: ทั้งหมด</option>
              <option value="รับเข้า (Inbound)">รับเข้า (Inbound)</option>
              <option value="เบิกออก (Outbound)">เบิกออก (Outbound)</option>
            </select>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #bae6fd', color: '#0369a1', fontSize: '13px', fontWeight: 'bold' }}>
                <th style={{ padding: '12px' }}>Tracking / ประเภท</th>
                <th style={{ padding: '12px' }}>สินค้า / จำนวน</th>
                <th style={{ padding: '12px' }}>ผู้รับ / ผู้เบิก</th>
                <th style={{ padding: '12px' }}>สถานะ</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredParcels.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px', fontWeight: 'bold' }}>ไม่พบข้อมูลรายการ</td>
                </tr>
              ) : (
                filteredParcels.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f0f9ff', fontSize: '14px' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 'bold', color: '#0369a1', fontSize: '15px' }}>{item.trackingId}</div>
                      <span style={{ 
                        display: 'inline-block', marginTop: '4px', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                        background: item.transactionType?.includes('รับเข้า') ? '#ccfbf1' : '#ffedd5',
                        color: item.transactionType?.includes('รับเข้า') ? '#0d9488' : '#c2410c'
                      }}>
                        {item.transactionType || 'รับเข้า (Inbound)'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{item.productName}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>จำนวน: {item.quantity} ชิ้น</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ color: '#0f172a', fontWeight: 'bold' }}>{item.recipient}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>จ.{item.destinationProvince}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                        background: item.status === 'จัดส่งสำเร็จ' ? '#ccfbf1' : item.status === 'กำลังกระจายส่ง' ? '#fef9c3' : '#e0f2fe',
                        color: item.status === 'จัดส่งสำเร็จ' ? '#0d9488' : item.status === 'กำลังกระจายส่ง' ? '#a16207' : '#0369a1'
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={() => printLabel(item)} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '7px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🖨️ ปริ้นท์</button>
                         
                        <select 
                          value={item.status} 
                          onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                          style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #bae6fd', padding: '6px 8px', borderRadius: '6px', fontSize: '12px', outline: 'none' }}
                        >
                          <option value="รับเข้าคลังหลัก (สโตร์)">รับเข้าคลัง</option>
                          <option value="กำลังกระจายส่ง">กำลังกระจายส่ง</option>
                          <option value="จัดส่งสำเร็จ">จัดส่งสำเร็จ</option>
                        </select>

                        {userRole === 'Admin' && (
                          <button onClick={() => handleDeleteParcel(item.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '7px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🗑️ ลบ</button>
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
