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
            button { margin-top: 15px; padding: 10px 20px; cursor: pointer; background: #374151; color: #fff; border: none; border-radius: 4px; font-size: 15px; }
          </style>
        </head>
        <body>
          <div class="label">
            <h3 style="text-align:center; margin:0 0 8px 0;">CENTRAL WAREHOUSE</h3>
            <div style="text-align:center; font-weight:bold; font-size:14px; margin-bottom:6px; color:${item.transactionType?.includes('รับเข้า') ? '#4b5563' : '#6b7280'};">[ ${item.transactionType} ]</div>
            <div class="barcode"><img src="${barcodeUrl}" alt="Barcode" /></div>
            <p style="margin:4px 0;"><strong>Tracking:</strong> ${item.trackingId}</p>
            <p style="margin:4px 0;"><strong>สินค้า:</strong> ${item.productName} (จำนวน: ${item.quantity})</p>
            <p style="margin:4px 0;"><strong>ผู้รับ/ผู้เบิก:</strong> ${item.recipient} (${item.phone || '-'})</p>
            <p style="margin:4px 0;"><strong>ปลายทาง/หน่วยงาน:</strong> ${item.addressDetail} จ.${item.destinationProvince}</p>
            <p style="margin:4px 0;"><strong>สถานะ:</strong> ${item.status}</p>
            <div style="text-align:center; margin-top:10px;">
              <img src="${qrCodeUrl}" width="85" alt="QR Code" />
              <div style="font-size: 9px; color: #333; margin-top: 2px;">สแกนเพื่อเช็คสถานะ</div>
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
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#9ca3af', background: '#111827' }}>
        กำลังโหลดระบบคลังสินค้า...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#111827', color: '#e5e7eb', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#1f2937', padding: '40px', borderRadius: '16px', width: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', border: '1px solid #374151', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: '#374151', color: '#d1d5db', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', marginBottom: '20px', fontWeight: '500' }}>
            ● ระบบคลังสินค้า (Admin & Staff)
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#f3f4f6' }}>
            CENTRAL <span style={{ color: '#9ca3af' }}>WAREHOUSE</span>
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '25px' }}>
            {isRegistering ? 'กรอกข้อมูลเพื่อสมัครสมาชิกใหม่' : 'กรุณาเข้าสู่ระบบเพื่อจัดการคลังสินค้า'}
          </p>

          {authError && <div style={{ color: '#f87171', marginBottom: '15px', fontSize: '13px' }}>{authError}</div>}
          
          <form onSubmit={handleAuthSubmit} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#9ca3af' }}>อีเมล</label>
              <input type="email" placeholder="user@gmail.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #4b5563', background: '#111827', color: '#f3f4f6', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#9ca3af' }}>รหัสผ่าน</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #4b5563', background: '#111827', color: '#f3f4f6', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" style={{ width: '100%', padding: '12px', background: '#4b5563', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
              {isRegistering ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <div style={{ marginTop: '20px', fontSize: '13px', color: '#9ca3af' }}>
            {isRegistering ? (
              <span>มีบัญชีอยู่แล้ว? <button onClick={() => setIsRegistering(false)} style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontWeight: 'bold', padding: 0, fontSize: '13px' }}>เข้าสู่ระบบที่นี่</button></span>
            ) : (
              <span>ยังไม่มีบัญชีผู้ใช้งาน? <button onClick={() => setIsRegistering(true)} style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontWeight: 'bold', padding: 0, fontSize: '13px' }}>สมัครสมาชิก</button></span>
            )}
          </div>

        </div>
      </div>
    );
  }

  if (showRoleSelector) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#111827', color: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#1f2937', padding: '30px', borderRadius: '16px', width: '360px', textAlign: 'center', border: '1px solid #374151', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <h2 style={{ color: '#f3f4f6', margin: '0 0 8px 0' }}>เลือกบทบาทของคุณ</h2>
          <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '20px' }}>กำหนดสิทธิ์การใช้งานในระบบคลังพัสดุ</p>
          <button onClick={() => selectRole('Admin')} style={{ width: '100%', padding: '12px', background: '#374151', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '12px' }}>🛡️ Admin (ผู้ดูแลระบบ)</button>
          <button onClick={() => selectRole('Staff')} style={{ width: '100%', padding: '12px', background: '#4b5563', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>👷 Staff (เจ้าหน้าที่)</button>
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
    <div style={{ background: '#111827', minHeight: '100vh', color: '#e5e7eb', fontFamily: 'sans-serif', paddingBottom: '40px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#374151', color: '#fff', padding: '12px 20px', borderRadius: '6px', zIndex: 1000, fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', border: '1px solid #4b5563' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: '#1f2937', borderBottom: '1px solid #374151' }}>
        <h2 style={{ margin: 0, letterSpacing: '0.5px', color: '#f3f4f6', fontSize: '20px' }}>
          CENTRAL <span style={{ color: '#9ca3af' }}>WAREHOUSE</span>
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ 
            background: '#374151', 
            color: '#d1d5db',
            padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' 
          }}>
            สิทธิ์: {userRole}
          </span>
          <button onClick={() => signOut(auth)} style={{ background: '#4b5563', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>ออกจากระบบ</button>
        </div>
      </div>

      <div style={{ padding: '30px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* สถิติคลังสินค้า */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '25px' }}>
          <div style={{ background: '#1f2937', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #374151', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            <div style={{ color: '#9ca3af', fontSize: '13px', fontWeight: '500' }}>รายการทั้งหมด</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '6px', color: '#f3f4f6' }}>{parcels.length} รายการ</div>
          </div>
          <div style={{ background: '#1f2937', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #374151', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            <div style={{ color: '#9ca3af', fontSize: '13px', fontWeight: '500' }}>รายการรับเข้า (Inbound)</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '6px', color: '#d1d5db' }}>{parcels.filter(p => p.transactionType?.includes('รับเข้า')).length}</div>
          </div>
          <div style={{ background: '#1f2937', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #374151', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            <div style={{ color: '#9ca3af', fontSize: '13px', fontWeight: '500' }}>รายการเบิกออก (Outbound)</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '6px', color: '#9ca3af' }}>{parcels.filter(p => p.transactionType?.includes('เบิกออก')).length}</div>
          </div>
        </div>

        {/* ฟอร์มบันทึก รับเข้า / เบิกออก */}
        <div style={{ background: '#1f2937', padding: '30px', borderRadius: '16px', border: '1px solid #374151', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', marginBottom: '30px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#d1d5db', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📦 บันทึกรายการคลังสินค้า (รับเข้า / เบิกออก)
          </h3>
          <form onSubmit={handleSaveParcel}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: '500' }}>ประเภทรายการ</label>
                <select value={formData.transactionType} onChange={e => setFormData({...formData, transactionType: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #4b5563', background: '#111827', color: '#f3f4f6', boxSizing: 'border-box', fontWeight: '600' }}>
                  <option value="รับเข้า (Inbound)">⚪ รับเข้า (Inbound)</option>
                  <option value="เบิกออก (Outbound)">🔘 เบิกออก (Outbound)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: '500' }}>ชื่อสินค้า / รายการพัสดุ</label>
                <input type="text" placeholder="เช่น อุปกรณ์ไอที, อะไหล่" value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #4b5563', background: '#111827', color: '#f3f4f6', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: '500' }}>จำนวน</label>
                <input type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #4b5563', background: '#111827', color: '#f3f4f6', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: '500' }}>ผู้รับ / ผู้เบิกสินค้า</label>
                <input type="text" placeholder="ชื่อผู้รับหรือแผนกที่เบิก" value={formData.recipient} onChange={e => setFormData({...formData, recipient: e.target.value})} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #4b5563', background: '#111827', color: '#f3f4f6', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: '500' }}>เบอร์โทรติดต่อ</label>
                <input type="text" placeholder="0812345678" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #4b5563', background: '#111827', color: '#f3f4f6', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: '500' }}>จังหวัด / ปลายทาง</label>
                <select value={formData.destinationProvince} onChange={e => setFormData({...formData, destinationProvince: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #4b5563', background: '#111827', color: '#f3f4f6', boxSizing: 'border-box' }}>
                  {THAI_PROVINCES.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: '500' }}>สถานะเริ่มต้น</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #4b5563', background: '#111827', color: '#f3f4f6', boxSizing: 'border-box' }}>
                  <option value="รับเข้าคลังหลัก (สโตร์)">รับเข้าคลังหลัก (สโตร์)</option>
                  <option value="กำลังกระจายส่ง">กำลังกระจายส่ง</option>
                  <option value="จัดส่งสำเร็จ">จัดส่งสำเร็จ</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: '500' }}>ที่อยู่หรือรายละเอียดเพิ่มเติม</label>
              <input type="text" placeholder="บ้านเลขที่, อาคาร, แผนก" value={formData.addressDetail} onChange={e => setFormData({...formData, addressDetail: e.target.value})} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #4b5563', background: '#111827', color: '#f3f4f6', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button type="submit" disabled={formLoading} style={{ padding: '12px 28px', background: '#374151', color: '#fff', border: '1px solid #4b5563', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transition: 'all 0.2s' }}>
                {formLoading ? 'กำลังบันทึก...' : '💾 บันทึกรายการ และพิมพ์ใบปะหน้า (พร้อม Barcode & QR)'}
              </button>
            </div>
          </form>
        </div>

        {/* ตารางประวัติรายการคลังสินค้า */}
        <div style={{ background: '#1f2937', padding: '25px', borderRadius: '16px', border: '1px solid #374151', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#f3f4f6', fontSize: '16px' }}>📋 ประวัติการรับเข้าและเบิกออก ({filteredParcels.length})</h3>
          
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <input type="text" placeholder="🔍 ค้นหา Tracking, สินค้า, ผู้รับ, จังหวัด..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #4b5563', background: '#111827', color: '#f3f4f6' }} />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #4b5563', background: '#111827', color: '#f3f4f6' }}>
              <option value="ทั้งหมด">ประเภท: ทั้งหมด</option>
              <option value="รับเข้า (Inbound)">รับเข้า (Inbound)</option>
              <option value="เบิกออก (Outbound)">เบิกออก (Outbound)</option>
            </select>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #374151', color: '#9ca3af', fontSize: '13px' }}>
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
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>ไม่พบข้อมูลรายการ</td>
                </tr>
              ) : (
                filteredParcels.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #374151', fontSize: '14px' }}>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ fontWeight: 'bold', color: '#d1d5db' }}>{item.trackingId}</div>
                      <span style={{ 
                        display: 'inline-block', marginTop: '4px', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600',
                        background: '#374151',
                        color: '#d1d5db'
                      }}>
                        {item.transactionType || 'รับเข้า (Inbound)'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ fontWeight: '600', color: '#f3f4f6' }}>{item.productName}</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>จำนวน: {item.quantity} ชิ้น</div>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ color: '#f3f4f6' }}>{item.recipient}</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>จ.{item.destinationProvince}</div>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{ 
                        padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                        background: '#374151',
                        color: '#d1d5db'
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button onClick={() => printLabel(item)} style={{ background: '#374151', color: '#fff', border: '1px solid #4b5563', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>🖨️ ปริ้นท์</button>
                        
                        <select 
                          value={item.status} 
                          onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                          style={{ background: '#111827', color: '#f3f4f6', border: '1px solid #4b5563', padding: '5px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '500' }}
                        >
                          <option value="รับเข้าคลังหลัก (สโตร์)">รับเข้าคลัง</option>
                          <option value="กำลังกระจายส่ง">กำลังกระจายส่ง</option>
                          <option value="จัดส่งสำเร็จ">จัดส่งสำเร็จ</option>
                        </select>

                        {userRole === 'Admin' && (
                          <button onClick={() => handleDeleteParcel(item.id)} style={{ background: '#4b5563', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>🗑️ ลบ</button>
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
