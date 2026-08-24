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
            button { margin-top: 15px; padding: 10px 20px; cursor: pointer; background: #2563eb; color: #fff; border: none; border-radius: 4px; font-size: 15px; }
          </style>
        </head>
        <body>
          <div class="label">
            <h3 style="text-align:center; margin:0 0 8px 0;">CENTRAL WAREHOUSE</h3>
            <div style="text-align:center; font-weight:bold; font-size:14px; margin-bottom:6px; color:${item.transactionType?.includes('รับเข้า') ? '#16a34a' : '#ea580c'};">[ ${item.transactionType} ]</div>
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
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#94a3b8', background: '#0f172a' }}>
        กำลังโหลดระบบคลังสินค้า...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0f172a', color: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#1e293b', padding: '40px', borderRadius: '16px', width: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', border: '1px solid #334155', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#38bdf8' }}>📦 D-MAIL Logistics</h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px' }}>ระบบจัดการพัสดุและคลังสินค้าอัจฉริยะ</p>
          
          {authError && (
            <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
            <div>
              <label style={{ fontSize: '13px', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>อีเมล</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }}
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>รหัสผ่าน</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }}
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              style={{ marginTop: '10px', padding: '12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
            >
              {isRegistering ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <button 
            onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }} 
            style={{ background: 'none', border: 'none', color: '#38bdf8', marginTop: '16px', cursor: 'pointer', fontSize: '13px' }}
          >
            {isRegistering ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบที่นี่' : 'ยังไม่มีบัญชี? สมัครสมาชิก'}
          </button>
        </div>
      </div>
    );
  }

  if (showRoleSelector || !userRole) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0f172a', color: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#1e293b', padding: '40px', borderRadius: '16px', width: '420px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', border: '1px solid #334155', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 10px 0', color: '#38bdf8' }}>เลือกบทบาทการใช้งาน</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>กรุณากำหนดสิทธิ์การเข้าใช้งานระบบของคุณ ({currentUser.email})</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              onClick={() => selectRole('Admin')}
              style={{ padding: '14px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>👑 ผู้ดูแลระบบ (Admin)</span>
              <span style={{ fontSize: '12px', opacity: 0.8 }}>จัดการ/ลบ/เพิ่ม</span>
            </button>
            <button 
              onClick={() => selectRole('Staff')}
              style={{ padding: '14px', background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>📦 เจ้าหน้าที่คลัง (Staff)</span>
              <span style={{ fontSize: '12px', opacity: 0.8 }}>บันทึก/พิมพ์ป้าย</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredParcels = parcels.filter(item => {
    const matchesSearch = item.trackingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.recipient?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ทั้งหมด' || item.transactionType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', fontFamily: 'sans-serif', padding: '20px', boxSizing: 'border-box' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: '#1e293b', padding: '16px 24px', borderRadius: '12px', border: '1px solid #334155' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', color: '#38bdf8' }}>📦 D-MAIL Logistics Dashboard</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>ผู้ใช้งาน: {currentUser.email} | สิทธิ์: <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{userRole}</span></p>
        </div>
        <button 
          onClick={() => signOut(auth)}
          style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ออกจากระบบ
        </button>
      </header>

      {/* ฟอร์มบันทึกรายการ */}
      <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#e2e8f0' }}>📝 บันทึกรายการพัสดุ / คลังสินค้า</h3>
        <form onSubmit={handleSaveParcel} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Tracking ID</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={formData.trackingId} 
                onChange={(e) => setFormData({...formData, trackingId: e.target.value})}
                required
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
              />
              <button 
                type="button" 
                onClick={() => setFormData({...formData, trackingId: generateTrackingId()})}
                style={{ padding: '8px 12px', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                title="สุ่มรหัสใหม่"
              >
                🔄
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ประเภททำรายการ</label>
            <select 
              value={formData.transactionType}
              onChange={(e) => setFormData({...formData, transactionType: e.target.value})}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
            >
              <option value="รับเข้า (Inbound)">รับเข้า (Inbound)</option>
              <option value="เบิกออก (Outbound)">เบิกออก (Outbound)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ชื่อสินค้า / พัสดุ</label>
            <input 
              type="text" 
              value={formData.productName} 
              onChange={(e) => setFormData({...formData, productName: e.target.value})}
              placeholder="ระบุชื่อสินค้า"
              required
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>จำนวน</label>
            <input 
              type="number" 
              min="1"
              value={formData.quantity} 
              onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
              required
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ผู้รับ / ผู้เบิก</label>
            <input 
              type="text" 
              value={formData.recipient} 
              onChange={(e) => setFormData({...formData, recipient: e.target.value})}
              placeholder="ชื่อผู้รับ"
              required
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>เบอร์โทรศัพท์</label>
            <input 
              type="text" 
              value={formData.phone} 
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="0812345678"
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>จังหวัดปลายทาง</label>
            <select 
              value={formData.destinationProvince}
              onChange={(e) => setFormData({...formData, destinationProvince: e.target.value})}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
            >
              {THAI_PROVINCES.map((prov, idx) => (
                <option key={idx} value={prov}>{prov}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ที่อยู่ / รายละเอียดเพิ่มเติม</label>
            <input 
              type="text" 
              value={formData.addressDetail} 
              onChange={(e) => setFormData({...formData, addressDetail: e.target.value})}
              placeholder="บ้านเลขที่ / อาคาร / แผนก"
              required
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button 
              type="submit" 
              disabled={formLoading}
              style={{ padding: '10px 24px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {formLoading ? 'กำลังบันทึก...' : '💾 บันทึกและพิมพ์ป้าย'}
            </button>
          </div>
        </form>
      </div>

      {/* ส่วนตารางและการค้นหา */}
      <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ margin: 0, color: '#e2e8f0' }}>📋 รายการพัสดุทั้งหมด ({filteredParcels.length})</h3>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="🔍 ค้นหา Tracking, สินค้า, ผู้รับ..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff', width: '240px' }}
            />
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
            >
              <option value="ทั้งหมด">ประเภท: ทั้งหมด</option>
              <option value="รับเข้า (Inbound)">รับเข้า (Inbound)</option>
              <option value="เบิกออก (Outbound)">เบิกออก (Outbound)</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                <th style={{ padding: '12px' }}>Tracking ID</th>
                <th style={{ padding: '12px' }}>ประเภท</th>
                <th style={{ padding: '12px' }}>สินค้า</th>
                <th style={{ padding: '12px' }}>ผู้รับ</th>
                <th style={{ padding: '12px' }}>ปลายทาง</th>
                <th style={{ padding: '12px' }}>สถานะ</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredParcels.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>ไม่พบรายการพัสดุในระบบ</td>
                </tr>
              ) : (
                filteredParcels.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#38bdf8' }}>{item.trackingId}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: item.transactionType?.includes('รับเข้า') ? '#065f46' : '#9a3412', color: '#fff' }}>
                        {item.transactionType}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{item.productName} <span style={{ color: '#94a3b8', fontSize: '12px' }}>(x{item.quantity})</span></td>
                    <td style={{ padding: '12px' }}>{item.recipient}</td>
                    <td style={{ padding: '12px' }}>{item.addressDetail} จ.{item.destinationProvince}</td>
                    <td style={{ padding: '12px' }}>
                      <select 
                        value={item.status}
                        onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                        style={{ padding: '6px', borderRadius: '4px', background: '#0f172a', color: '#fff', border: '1px solid #475569', fontSize: '12px' }}
                      >
                        <option value="รับเข้าคลังหลัก (สโตร์)">รับเข้าคลังหลัก (สโตร์)</option>
                        <option value="กำลังจัดเตรียมสินค้า">กำลังจัดเตรียมสินค้า</option>
                        <option value="ระหว่างจัดส่ง / ขนส่ง">ระหว่างจัดส่ง / ขนส่ง</option>
                        <option value="จัดส่งสำเร็จ">จัดส่งสำเร็จ</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        onClick={() => printLabel(item)}
                        style={{ padding: '6px 10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        title="พิมพ์ใบปะหน้า"
                      >
                        🖨️
                      </button>
                      {userRole === 'Admin' && (
                        <button 
                          onClick={() => handleDeleteParcel(item.id)}
                          style={{ padding: '6px 10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          title="ลบรายการ"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#0284c7', color: '#fff', padding: '12px 20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 1000, fontWeight: 'bold' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
