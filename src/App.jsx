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
    const q = query(collection(db, "warehouse_parcels"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setParcels(snapshot.docs.map(docSnap => ({ 
        id: docSnap.id, 
        ...docSnap.data() 
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
    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${item.trackingId}&scale=2&height=12&includetext=true`;
    const trackingUrl = `https://d-mail-logistics.firebaseapp.com/?track=${item.trackingId}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(trackingUrl)}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Warehouse Label - ${item.trackingId}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 15px; color: #000; }
            .label { border: 2px solid #000; padding: 15px; width: 300px; margin: auto; text-align: left; background: #fff; }
            .barcode { text-align: center; margin-bottom: 8px; }
            .barcode img { max-width: 100%; height: auto; }
            button { margin-top: 15px; padding: 12px 20px; cursor: pointer; background: #1e3a8a; color: #fff; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="label">
            <h3 style="text-align:center; margin:0 0 8px 0; font-size: 16px;">CENTRAL WAREHOUSE</h3>
            <div style="text-align:center; font-weight:bold; font-size:15px; margin-bottom:6px; color:${item.transactionType?.includes('รับเข้า') ? '#15803d' : '#c2410c'};">[ ${item.transactionType} ]</div>
            <div class="barcode"><img src="${barcodeUrl}" alt="Barcode" /></div>
            <p style="margin:6px 0; font-size:13px;"><strong>Tracking:</strong> ${item.trackingId}</p>
            <p style="margin:6px 0; font-size:13px;"><strong>สินค้า:</strong> ${item.productName} (จำนวน: ${item.quantity})</p>
            <p style="margin:6px 0; font-size:13px;"><strong>ผู้รับ/ผู้เบิก:</strong> ${item.recipient} (${item.phone || '-'})</p>
            <p style="margin:6px 0; font-size:13px;"><strong>ปลายทาง/หน่วยงาน:</strong> ${item.addressDetail} จ.${item.destinationProvince}</p>
            <p style="margin:6px 0; font-size:13px;"><strong>สถานะ:</strong> ${item.status}</p>
            <div style="text-align:center; margin-top:10px;">
              <img src="${qrCodeUrl}" width="85" alt="QR Code" />
              <div style="font-size: 10px; color: #000; margin-top: 2px; font-weight: bold;">สแกนเพื่อเช็คสถานะ</div>
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
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#1e293b', background: '#f8fafc', fontSize: '18px', fontWeight: 'bold' }}>
        กำลังโหลดระบบคลังสินค้า...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#f5f5f4', color: '#1c1917', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#ffffff', padding: '40px', borderRadius: '16px', width: '420px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '2px solid #e7e5e4', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: '#dbeafe', color: '#1e40af', padding: '8px 18px', borderRadius: '20px', fontSize: '14px', marginBottom: '20px', fontWeight: 'bold' }}>
            ● ระบบคลังสินค้า (Admin & Staff)
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1e3a8a' }}>
            CENTRAL WAREHOUSE
          </h1>
          <p style={{ color: '#44403c', fontSize: '15px', marginBottom: '25px', fontWeight: 'bold' }}>
            {isRegistering ? 'กรอกข้อมูลเพื่อสมัครสมาชิกใหม่' : 'กรุณาเข้าสู่ระบบเพื่อจัดการคลังสินค้า'}
          </p>

          {authError && <div style={{ color: '#dc2626', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>{authError}</div>}
           
          <form onSubmit={handleAuthSubmit} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#1c1917', fontWeight: 'bold' }}>อีเมล</label>
              <input type="email" placeholder="user@gmail.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #a8a29e', background: '#fff', color: '#1c1917', fontSize: '15px', boxSizing: 'border-box', fontWeight: 'bold' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#1c1917', fontWeight: 'bold' }}>รหัสผ่าน</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #a8a29e', background: '#fff', color: '#1c1917', fontSize: '15px', boxSizing: 'border-box', fontWeight: 'bold' }} />
            </div>
            <button type="submit" style={{ width: '100%', padding: '14px', background: isRegistering ? '#047857' : '#1e3a8a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
              {isRegistering ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <div style={{ marginTop: '20px', fontSize: '14px', color: '#44403c', fontWeight: 'bold' }}>
            {isRegistering ? (
              <span>มีบัญชีอยู่แล้ว? <button onClick={() => setIsRegistering(false)} style={{ background: 'none', border: 'none', color: '#1e3a8a', cursor: 'pointer', fontWeight: 'bold', padding: 0, fontSize: '14px', textDecoration: 'underline' }}>เข้าสู่ระบบที่นี่</button></span>
            ) : (
              <span>ยังไม่มีบัญชีผู้ใช้งาน? <button onClick={() => setIsRegistering(true)} style={{ background: 'none', border: 'none', color: '#1e3a8a', cursor: 'pointer', fontWeight: 'bold', padding: 0, fontSize: '14px', textDecoration: 'underline' }}>สมัครสมาชิก</button></span>
            )}
          </div>

        </div>
      </div>
    );
  }

  if (showRoleSelector) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#f5f5f4', color: '#1c1917', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#ffffff', padding: '35px', borderRadius: '16px', width: '380px', textAlign: 'center', border: '2px solid #e7e5e4', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#1c1917', margin: '0 0 10px 0', fontSize: '22px' }}>เลือกบทบาทของคุณ</h2>
          <p style={{ color: '#44403c', fontSize: '14px', marginBottom: '25px', fontWeight: 'bold' }}>กำหนดสิทธิ์การใช้งานในระบบคลังพัสดุ</p>
          <button onClick={() => selectRole('Admin')} style={{ width: '100%', padding: '14px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px', fontSize: '15px' }}>🛡️ Admin (ผู้ดูแลระบบ)</button>
          <button onClick={() => selectRole('Staff')} style={{ width: '100%', padding: '14px', background: '#047857', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>👷 Staff (เจ้าหน้าที่)</button>
        </div>
      </div>
    );
  }

  const filteredParcels = parcels.filter(item => {
    const matchSearch = item.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.recipient.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.destinationProvince.includes(searchTerm);
    const matchType = typeFilter === 'ทั้งหมด' || item.transactionType === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div style={{ background: '#f5f5f4', minHeight: '100vh', color: '#1c1917', fontFamily: 'sans-serif', paddingBottom: '40px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#047857', color: '#fff', padding: '14px 24px', borderRadius: '8px', zIndex: 1000, fontWeight: 'bold', fontSize: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: '#ffffff', borderBottom: '2px solid #e7e5e4', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
        <h2 style={{ margin: 0, letterSpacing: '1px', color: '#1e3a8a', fontSize: '22px', fontWeight: 'bold' }}>
          CENTRAL WAREHOUSE
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ 
            background: userRole === 'Admin' ? '#dbeafe' : '#d1fae5', 
            color: userRole === 'Admin' ? '#1e40af' : '#065f46',
            padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' 
          }}>
            สิทธิ์: {userRole}
          </span>
          <button onClick={() => signOut(auth)} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>ออกจากระบบ</button>
        </div>
      </div>

      <div style={{ padding: '30px 40px', maxWidth: '1200px', margin: '0 auto' }}>
         
        {/* สถิติคลังสินค้า */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '12px', textAlign: 'center', border: '2px solid #e7e5e4', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#44403c', fontSize: '14px', fontWeight: 'bold' }}>รายการทั้งหมด</div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '8px', color: '#1c1917' }}>{parcels.length} รายการ</div>
          </div>
          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '12px', textAlign: 'center', border: '2px solid #e7e5e4', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#44403c', fontSize: '14px', fontWeight: 'bold' }}>รายการรับเข้า (Inbound)</div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '8px', color: '#15803d' }}>{parcels.filter(p => p.transactionType?.includes('รับเข้า')).length}</div>
          </div>
          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '12px', textAlign: 'center', border: '2px solid #e7e5e4', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#44403c', fontSize: '14px', fontWeight: 'bold' }}>รายการเบิกออก (Outbound)</div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '8px', color: '#c2410c' }}>{parcels.filter(p => p.transactionType?.includes('เบิกออก')).length}</div>
          </div>
        </div>

        {/* ฟอร์มบันทึก รับเข้า / เบิกออก */}
        <div style={{ background: '#ffffff', padding: '30px', borderRadius: '14px', border: '2px solid #e7e5e4', marginBottom: '30px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e3a8a', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📦 บันทึกรายการคลังสินค้า (รับเข้า / เบิกออก)
          </h3>
          <form onSubmit={handleSaveParcel}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#1c1917', marginBottom: '6px', fontWeight: 'bold' }}>ประเภทรายการ</label>
                <select value={formData.transactionType} onChange={e => setFormData({...formData, transactionType: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #a8a29e', background: '#fff', color: '#1c1917', boxSizing: 'border-box', fontWeight: 'bold', fontSize: '14px' }}>
                  <option value="รับเข้า (Inbound)">🟢 รับเข้า (Inbound)</option>
                  <option value="เบิกออก (Outbound)">🟠 เบิกออก (Outbound)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#1c1917', marginBottom: '6px', fontWeight: 'bold' }}>ชื่อสินค้า / รายการพัสดุ</label>
                <input type="text" placeholder="เช่น อุปกรณ์ไอที, อะไหล่" value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #a8a29e', background: '#fff', color: '#1c1917', boxSizing: 'border-box', fontWeight: 'bold', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#1c1917', marginBottom: '6px', fontWeight: 'bold' }}>จำนวน</label>
                <input type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #a8a29e', background: '#fff', color: '#1c1917', boxSizing: 'border-box', fontWeight: 'bold', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#1c1917', marginBottom: '6px', fontWeight: 'bold' }}>ผู้รับ / ผู้เบิกสินค้า</label>
                <input type="text" placeholder="ชื่อผู้รับหรือแผนกที่เบิก" value={formData.recipient} onChange={e => setFormData({...formData, recipient: e.target.value})} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #a8a29e', background: '#fff', color: '#1c1917', boxSizing: 'border-box', fontWeight: 'bold', fontSize: '14px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#1c1917', marginBottom: '6px', fontWeight: 'bold' }}>เบอร์โทรติดต่อ</label>
                <input type="text" placeholder="0812345678" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #a8a29e', background: '#fff', color: '#1c1917', boxSizing: 'border-box', fontWeight: 'bold', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#1c1917', marginBottom: '6px', fontWeight: 'bold' }}>จังหวัด / ปลายทาง</label>
                <select value={formData.destinationProvince} onChange={e => setFormData({...formData, destinationProvince: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #a8a29e', background: '#fff', color: '#1c1917', boxSizing: 'border-box', fontWeight: 'bold', fontSize: '14px' }}>
                  {THAI_PROVINCES.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#1c1917', marginBottom: '6px', fontWeight: 'bold' }}>สถานะเริ่มต้น</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #a8a29e', background: '#fff', color: '#1c1917', boxSizing: 'border-box', fontWeight: 'bold', fontSize: '14px' }}>
                  <option value="รับเข้าคลังหลัก (สโตร์)">รับเข้าคลังหลัก (สโตร์)</option>
                  <option value="กำลังกระจายส่ง">กำลังกระจายส่ง</option>
                  <option value="จัดส่งสำเร็จ">จัดส่งสำเร็จ</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#1c1917', marginBottom: '6px', fontWeight: 'bold' }}>ที่อยู่หรือรายละเอียดเพิ่มเติม</label>
              <input type="text" placeholder="บ้านเลขที่, อาคาร, แผนก" value={formData.addressDetail} onChange={e => setFormData({...formData, addressDetail: e.target.value})} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #a8a29e', background: '#fff', color: '#1c1917', boxSizing: 'border-box', fontWeight: 'bold', fontSize: '14px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button type="submit" disabled={formLoading} style={{ padding: '14px 28px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'all 0.2s' }}>
                {formLoading ? 'กำลังบันทึก...' : '💾 บันทึกรายการ และพิมพ์ใบปะหน้า (พร้อม Barcode & QR)'}
              </button>
            </div>
          </form>
        </div>

        {/* ตารางประวัติรายการคลังสินค้า */}
        <div style={{ background: '#ffffff', padding: '25px', borderRadius: '14px', border: '2px solid #e7e5e4', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1c1917', fontSize: '18px', fontWeight: 'bold' }}>📋 ประวัติการรับเข้าและเบิกออก ({filteredParcels.length})</h3>
           
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <input type="text" placeholder="🔍 ค้นหา Tracking, สินค้า, ผู้รับ, จังหวัด..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '2px solid #a8a29e', background: '#fff', color: '#1c1917', fontWeight: 'bold', fontSize: '14px' }} />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '2px solid #a8a29e', background: '#fff', color: '#1c1917', fontWeight: 'bold', fontSize: '14px' }}>
              <option value="ทั้งหมด">ประเภท: ทั้งหมด</option>
              <option value="รับเข้า (Inbound)">รับเข้า (Inbound)</option>
              <option value="เบิกออก (Outbound)">เบิกออก (Outbound)</option>
            </select>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
              <tr style={{ borderBottom: '2px solid #d6d3d1', color: '#1c1917', fontSize: '14px', fontWeight: 'bold' }}>
                <th style={{ padding: '14px' }}>Tracking / ประเภท</th>
                <th style={{ padding: '14px' }}>สินค้า / จำนวน</th>
                <th style={{ padding: '14px' }}>ผู้รับ / ผู้เบิก</th>
                <th style={{ padding: '14px' }}>สถานะ</th>
                <th style={{ padding: '14px', textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
          <tbody>
              {filteredParcels.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#78716c', fontWeight: 'bold', fontSize: '15px' }}>ไม่พบข้อมูลรายการ</td>
                </tr>
              ) : (
                filteredParcels.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e7e5e4', fontSize: '15px' }}>
                    <td style={{ padding: '14px' }}>
                      <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '16px' }}>{item.trackingId}</div>
                      <span style={{ 
                        display: 'inline-block', marginTop: '6px', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                        background: item.transactionType?.includes('รับเข้า') ? '#d1fae5' : '#ffedd5',
                        color: item.transactionType?.includes('รับเข้า') ? '#065f46' : '#9a3412'
                      }}>
                        {item.transactionType || 'รับเข้า (Inbound)'}
                      </span>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ fontWeight: 'bold', color: '#1c1917' }}>{item.productName}</div>
                      <div style={{ fontSize: '13px', color: '#44403c', fontWeight: 'bold' }}>จำนวน: {item.quantity} ชิ้น</div>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ color: '#1c1917', fontWeight: 'bold' }}>{item.recipient}</div>
                      <div style={{ fontSize: '13px', color: '#44403c', fontWeight: 'bold' }}>จ.{item.destinationProvince}</div>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span style={{ 
                        padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold',
                        background: item.status === 'จัดส่งสำเร็จ' ? '#d1fae5' : item.status === 'กำลังกระจายส่ง' ? '#fef08a' : '#dbeafe',
                        color: item.status === 'จัดส่งสำเร็จ' ? '#065f46' : item.status === 'กำลังกระจายส่ง' ? '#854d0e' : '#1e40af'
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={() => printLabel(item)} style={{ background: '#1e3a8a', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>🖨️ ปริ้นท์</button>
                         
                        <select 
                          value={item.status} 
                          onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                          style={{ background: '#fff', color: '#1c1917', border: '2px solid #a8a29e', padding: '7px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}
                        >
                          <option value="รับเข้าคลังหลัก (สโตร์)">รับเข้าคลัง</option>
                          <option value="กำลังกระจายส่ง">กำลังกระจายส่ง</option>
                          <option value="จัดส่งสำเร็จ">จัดส่งสำเร็จ</option>
                        </select>

                        {userRole === 'Admin' && (
                          <button onClick={() => handleDeleteParcel(item.id)} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>🗑️ ลบ</button>
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
