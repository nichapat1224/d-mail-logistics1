import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getFirestore, collection, addDoc, updateDoc, deleteDoc, 
  doc, onSnapshot, query, orderBy, serverTimestamp 
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

const generateTrackingId = () => 'DM' + Math.floor(10000000 + Math.random() * 90000000) + 'TH';

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
  
  // State สำหรับฟอร์มเพิ่มข้อมูล (เพิ่มประเภทรายการ, ช่องทางจัดส่ง และหมายเหตุ)
  const [formData, setFormData] = useState({ 
    trackingId: generateTrackingId(), 
    itemCategory: 'พัสดุ (Parcel)', // เพิ่มแยกประเภท จดหมาย หรือ พัสดุ
    transactionType: 'รับเข้า (Inbound)',
    productName: '',
    quantity: 1,
    recipient: '', 
    phone: '', 
    carrier: 'ไปรษณีย์ไทย (Thailand Post)', // เพิ่มช่องทางการจัดส่ง
    destinationProvince: 'สมุทรสงคราม',
    addressDetail: '',
    status: 'รับเข้าคลังหลัก (สโตร์)',
    note: '' // เพิ่มหมายเหตุ
  });
  const [formLoading, setFormLoading] = useState(false);

  // State สำหรับโหมดสแกนบาร์โค้ดจำลองผ่านกล้อง/Input
  const [scannerInput, setScannerInput] = useState('');
  const [showScannerModal, setShowScannerModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        if (!userRole) {
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
    if (!currentUser || showRoleSelector) return;
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
  }, [currentUser, showRoleSelector]);

  const showToast = (message) => { 
    setToast(message); 
    setTimeout(() => setToast(''), 3000); 
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        setCurrentUser(userCredential.user);
        setUserRole(null);
        setShowRoleSelector(true);
        showToast('สมัครสมาชิกสำเร็จ! กรุณาเลือกสิทธิ์การใช้งาน');
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setCurrentUser(userCredential.user);
        setUserRole(null);
        setShowRoleSelector(true);
      }
    } catch (err) { 
      console.error("Auth Error:", err);
      setAuthError(isRegistering ? 'ไม่สามารถสมัครสมาชิกได้ (อีเมลอาจซ้ำหรือรหัสผ่านสั้นเกินไป)' : 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'); 
    }
  };

  const selectRole = (role) => {
    setUserRole(role);
    setShowRoleSelector(false);
    showToast(`เข้าสู่ระบบในฐานะ ${role} สำเร็จ`);
  };

  const printLabel = (item) => {
    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${item.trackingId}&scale=2&height=12&includetext=true`;
    const trackingUrl = `https://d-mail-logistics.firebaseapp.com/?track=${item.trackingId}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(trackingUrl)}`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('กรุณาอนุญาตให้เบราว์เซอร์เปิดหน้าต่างป๊อปอัป (Popup)');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>D-Mail Label - ${item.trackingId}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 20px; color: #000; background: #fff; }
            .label { border: 2px dashed #0d9488; padding: 20px; width: 340px; margin: auto; text-align: left; background: #ffffff; border-radius: 8px; }
            .title { text-align: center; font-weight: bold; font-size: 18px; color: #0f766e; margin-bottom: 2px; }
            .sub-title { text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 10px; color: #334155; }
            .barcode { text-align: center; margin-bottom: 12px; }
            .barcode img { max-width: 100%; height: auto; }
            .info { font-size: 13px; margin-bottom: 5px; line-height: 1.4; color: #000; }
            .qr-section { text-align: center; margin-top: 15px; }
            .qr-section img { width: 85px; height: 85px; }
            .qr-text { font-size: 11px; color: #000; margin-top: 3px; font-weight: bold; }
            button { margin-top: 20px; padding: 10px 20px; cursor: pointer; background: #0d9488; color: #fff; border: none; border-radius: 6px; font-size: 15px; font-weight: bold; display: block; margin-left: auto; margin-right: auto; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="title">SMART MAIL & PARCEL</div>
            <div class="sub-title">[ ${item.itemCategory} | ${item.transactionType} ]</div>
            <div class="barcode"><img src="${barcodeUrl}" alt="Barcode" /></div>
            <div class="info"><strong>Tracking:</strong> ${item.trackingId}</div>
            <div class="info"><strong>ขนส่งโดย:</strong> ${item.carrier}</div>
            <div class="info"><strong>รายการ:</strong> ${item.productName} (จำนวน: ${item.quantity})</div>
            <div class="info"><strong>ผู้รับ:</strong> ${item.recipient} (${item.phone || '-'})</div>
            <div class="info"><strong>ปลายทาง:</strong> ${item.addressDetail} จ.${item.destinationProvince}</div>
            <div class="info"><strong>สถานะ:</strong> ${item.status}</div>
            ${item.note ? `<div class="info"><strong>หมายเหตุ:</strong> ${item.note}</div>` : ''}
            <div class="qr-section">
              <img src="${qrCodeUrl}" alt="QR Code" />
              <div class="qr-text">สแกนเพื่อตรวจสอบสถานะพัสดุ</div>
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
      showToast('กรุณากรอกข้อมูลรายการ, ผู้รับ และที่อยู่ให้ครบถ้วน');
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
      showToast(`บันทึกข้อมูลสำเร็จ! เลขพัสดุ: ${formData.trackingId}`);
      setFormData({ 
        trackingId: generateTrackingId(), 
        itemCategory: 'พัสดุ (Parcel)',
        transactionType: 'รับเข้า (Inbound)',
        productName: '', 
        quantity: 1, 
        recipient: '', 
        phone: '', 
        carrier: 'ไปรษณีย์ไทย (Thailand Post)',
        destinationProvince: 'สมุทรสงคราม', 
        addressDetail: '', 
        status: 'รับเข้าคลังหลัก (สโตร์)',
        note: ''
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
    if (window.confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
      try {
        await deleteDoc(doc(db, "warehouse_parcels", id));
        showToast('ลบรายการสำเร็จ');
      } catch (err) {
        showToast('เกิดข้อผิดพลาดในการลบ');
      }
    }
  };

  if (authLoading) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0d9488', background: '#f0fdfa', fontSize: '18px', fontWeight: 'bold' }}>
        กำลังโหลดระบบบริหารจัดการจดหมายและพัสดุอัจฉริยะ...
      </div>
    );
  }

  if (currentUser && showRoleSelector) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #ccfbf1 0%, #f0fdfa 100%)', color: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#ffffff', padding: '40px', borderRadius: '16px', width: '400px', textAlign: 'center', border: '1px solid #99f6e4', boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.1)' }}>
          <div style={{ display: 'inline-block', background: '#ccfbf1', color: '#0f766e', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', marginBottom: '15px', fontWeight: 'bold' }}>
            ● เลือกบทบาทผู้ใช้งานระบบ
          </div>
          <h2 style={{ color: '#0f766e', margin: '0 0 10px 0', fontSize: '22px', fontWeight: 'bold' }}>กำหนดสิทธิ์การใช้งาน</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '30px', fontWeight: 'bold' }}>กรุณาเลือกบทบาทในการเข้าสู่ระบบจัดการพัสดุ</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <button onClick={() => selectRole('Admin')} style={{ width: '100%', padding: '14px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)' }}>
              🛡 Admin (ผู้ดูแลระบบ)
              <div style={{ fontSize: '12px', fontWeight: 'normal', opacity: '0.9', marginTop: '3px' }}>จัดการข้อมูลทั้งหมด และมีสิทธิ์ลบรายการ</div>
            </button>
            <button onClick={() => selectRole('Staff')} style={{ width: '100%', padding: '14px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)' }}>
              👷 Staff (เจ้าหน้าที่รับ-ส่งพัสดุ)
              <div style={{ fontSize: '12px', fontWeight: 'normal', opacity: '0.9', marginTop: '3px' }}>บันทึกรับเข้า-เบิกออก ปริ้นท์ป้าย และอัปเดตสถานะ</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #ccfbf1 0%, #f0fdfa 100%)', color: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#ffffff', padding: '40px', borderRadius: '16px', width: '420px', boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.1)', border: '1px solid #99f6e4', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: '#ccfbf1', color: '#0f766e', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', marginBottom: '20px', fontWeight: 'bold' }}>
            ● ระบบบริหารจัดการจดหมายและพัสดุอัจฉริยะ
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#0f766e', letterSpacing: '0.5px' }}>
            SMART MAIL & PARCEL
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '25px', fontWeight: 'bold' }}>
            {isRegistering ? 'กรอกข้อมูลเพื่อสมัครสมาชิกใหม่' : 'กรุณาเข้าสู่ระบบเพื่อใช้งาน'}
          </p>
          {authError && <div style={{ color: '#ef4444', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>{authError}</div>}
          <form onSubmit={handleAuthSubmit} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>อีเมล</label>
              <input type="email" placeholder="user@gmail.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #99f6e4', background: '#f8fafc', color: '#0f172a', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>รหัสผ่าน</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #99f6e4', background: '#f8fafc', color: '#0f172a', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <button type="submit" style={{ width: '100%', padding: '12px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)' }}>
              {isRegistering ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
            </button>
          </form>
          <div style={{ marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
            {isRegistering ? (
              <span>มีบัญชีอยู่แล้ว? <button onClick={() => setIsRegistering(false)} style={{ background: 'none', border: 'none', color: '#0d9488', cursor: 'pointer', fontWeight: 'bold', padding: 0, fontSize: '14px', textDecoration: 'underline' }}>เข้าสู่ระบบ</button></span>
            ) : (
              <span>ยังไม่มีบัญชีผู้ใช้งาน? <button onClick={() => setIsRegistering(true)} style={{ background: 'none', border: 'none', color: '#0d9488', cursor: 'pointer', fontWeight: 'bold', padding: 0, fontSize: '14px', textDecoration: 'underline' }}>สมัครสมาชิก</button></span>
            )}
          </div>
        </div>
      </div>
    );
  }

  const filteredParcels = parcels.filter(item => {
    const matchSearch = item.trackingId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.destinationProvince?.includes(searchTerm) ||
                        item.carrier?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === 'ทั้งหมด' || item.itemCategory === typeFilter || item.transactionType === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div style={{ background: '#f0fdfa', minHeight: '100vh', color: '#0f172a', fontFamily: 'sans-serif', paddingBottom: '40px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#0d9488', color: '#fff', padding: '12px 20px', borderRadius: '8px', zIndex: 1000, fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 40px', background: '#ffffff', borderBottom: '1px solid #99f6e4', boxShadow: '0 1px 3px rgba(13, 148, 136, 0.05)' }}>
        <h2 style={{ margin: 0, letterSpacing: '0.5px', color: '#0f766e', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          📬 ระบบบริหารจัดการจดหมายและพัสดุอัจฉริยะ
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => setShowScannerModal(true)} style={{ background: '#0d9488', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📷 สแกนบาร์โค้ด / QR
          </button>
          <span style={{ 
            background: userRole === 'Admin' ? '#ccfbf1' : '#e0f2fe', 
            color: userRole === 'Admin' ? '#0f766e' : '#0369a1',
            padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold'
          }}>
            สิทธิ์: {userRole}
          </span>
          <button onClick={() => signOut(auth)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>ออกจากระบบ</button>
        </div>
      </div>

      {/* Modal สแกนบาร์โค้ดจำลอง */}
      {showScannerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ background: '#ffffff', padding: '30px', borderRadius: '12px', width: '400px', textAlign: 'center' }}>
            <h3 style={{ color: '#0f766e', marginTop: 0 }}>📷 สแกนหรือกรอกหมายเลขพัสดุ</h3>
            <p style={{ fontSize: '13px', color: '#64748b' }}>ใช้สำหรับยิงบาร์โค้ดด้วยเครื่องสแกน USB หรือพิมพ์ Tracking เพื่อค้นหาด่วน</p>
            <input 
              type="text" 
              placeholder="ยิงบาร์โค้ดหรือพิมพ์ Tracking เช่น DMxxxxxxxxTH" 
              value={scannerInput} 
              onChange={e => setScannerInput(e.target.value)} 
              autoFocus
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #99f6e4', marginBottom: '15px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} 
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => {
                setSearchTerm(scannerInput);
                setShowScannerModal(false);
                setScannerInput('');
                showToast('ดึงข้อมูลพัสดุจากบาร์โค้ดเรียบร้อย');
              }} style={{ background: '#0d9488', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>ค้นหาทันที</button>
              <button onClick={() => setShowScannerModal(false)} style={{ background: '#cbd5e1', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>ปิด</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '30px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* สถิติคลังพัสดุ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #99f6e4', boxShadow: '0 1px 3px rgba(13, 148, 136, 0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>พัสดุ/จดหมายทั้งหมด</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '6px', color: '#0f172a' }}>{parcels.length} รายการ</div>
          </div>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #99f6e4', boxShadow: '0 1px 3px rgba(13, 148, 136, 0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>จดหมาย (Letters)</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '6px', color: '#0284c7' }}>{parcels.filter(p => p.itemCategory?.includes('จดหมาย')).length}</div>
          </div>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #99f6e4', boxShadow: '0 1px 3px rgba(13, 148, 136, 0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>พัสดุ (Parcels)</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '6px', color: '#0d9488' }}>{parcels.filter(p => p.itemCategory?.includes('พัสดุ')).length}</div>
          </div>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #99f6e4', boxShadow: '0 1px 3px rgba(13, 148, 136, 0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>รอนำจ่าย / ค้างรับ</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '6px', color: '#c2410c' }}>{parcels.filter(p => p.status !== 'จัดส่งสำเร็จ').length}</div>
          </div>
        </div>

        {/* ฟอร์มบันทึกข้อมูล */}
        <div style={{ background: '#ffffff', padding: '28px', borderRadius: '12px', border: '1px solid #99f6e4', marginBottom: '30px', boxShadow: '0 1px 3px rgba(13, 148, 136, 0.05)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#0f766e', fontSize: '17px', fontWeight: 'bold' }}>
            📝 บันทึกรับเข้า / เบิกจ่ายจดหมายและพัสดุ
          </h3>
          <form onSubmit={handleSaveParcel}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>ประเภทสิ่งของ</label>
                <select value={formData.itemCategory} onChange={e => setFormData({...formData, itemCategory: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #99f6e4', background: '#f8fafc', color: '#0f172a', fontSize: '14px', outline: 'none' }}>
                  <option value="พัสดุ (Parcel)">📦 พัสดุ (Parcel)</option>
                  <option value="จดหมาย (Letter)">✉️ จดหมาย / เอกสาร (Letter)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>ประเภทการทำรายการ</label>
                <select value={formData.transactionType} onChange={e => setFormData({...formData, transactionType: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #99f6e4', background: '#f8fafc', color: '#0f172a', fontSize: '14px', outline: 'none' }}>
                  <option value="รับเข้า (Inbound)">🟢 รับเข้า (Inbound)</option>
                  <option value="เบิกออก (Outbound)">🟠 เบิกออก / จ่ายออก (Outbound)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>ช่องทางการจัดส่ง / ขนส่ง</label>
                <select value={formData.carrier} onChange={e => setFormData({...formData, carrier: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #99f6e4', background: '#f8fafc', color: '#0f172a', fontSize: '14px', outline: 'none' }}>
                  <option value="ไปรษณีย์ไทย (Thailand Post)">ไปรษณีย์ไทย (Thailand Post)</option>
                  <option value="Flash Express">Flash Express</option>
                  <option value="J&T Express">J&T Express</option>
                  <option value="Kerry / DHL">Kerry / DHL</option>
                  <option value="รับเองที่คลัง/เคาน์เตอร์">รับเองที่คลัง/เคาน์เตอร์</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>ชื่อรายการ / รายละเอียดพัสดุ</label>
                <input type="text" placeholder="เช่น กล่องพัสดุขนาดกลาง, เอกสารด่วน" value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} required style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #99f6e4', background: '#f8fafc', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>จำนวน</label>
                <input type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #99f6e4', background: '#f8fafc', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>ชื่อผู้รับ / ผู้เบิก</label>
                <input type="text" placeholder="ชื่อ-นามสกุล หรือแผนก" value={formData.recipient} onChange={e => setFormData({...formData, recipient: e.target.value})} required style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #99f6e4', background: '#f8fafc', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>เบอร์โทรติดต่อ</label>
                <input type="text" placeholder="0812345678" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #99f6e4', background: '#f8fafc', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>จังหวัด / ปลายทาง</label>
                <select value={formData.destinationProvince} onChange={e => setFormData({...formData, destinationProvince: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #99f6e4', background: '#f8fafc', color: '#0f172a', fontSize: '14px', outline: 'none' }}>
                  {THAI_PROVINCES.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>สถานะเริ่มต้น</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #99f6e4', background: '#f8fafc', color: '#0f172a', fontSize: '14px', outline: 'none' }}>
                  <option value="รับเข้าคลังหลัก (สโตร์)">รับเข้าคลังหลัก (สโตร์)</option>
                  <option value="กำลังกระจายส่ง / นำจ่าย">กำลังกระจายส่ง / นำจ่าย</option>
                  <option value="จัดส่งสำเร็จ">จัดส่งสำเร็จ</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>หมายเหตุ (Notes)</label>
                <input type="text" placeholder="เช่น แตกหักง่าย, ฝากไว้ที่ป้อมยาม" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #99f6e4', background: '#f8fafc', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>ที่อยู่ / รายละเอียดห้อง / อาคาร</label>
              <input type="text" placeholder="เช่น หอพักห้อง 405, อาคาร A" value={formData.addressDetail} onChange={e => setFormData({...formData, addressDetail: e.target.value})} required style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #99f6e4', background: '#f8fafc', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button type="submit" disabled={formLoading} style={{ padding: '10px 24px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', boxShadow: '0 2px 6px rgba(13, 148, 136, 0.2)' }}>
                {formLoading ? 'กำลังบันทึก...' : '💾 บันทึกและพิมพ์ใบปะหน้า'}
              </button>
            </div>
          </form>
        </div>

        {/* ตารางประวัติรายการ */}
        <div style={{ background: '#ffffff', padding: '28px', borderRadius: '12px', border: '1px solid #99f6e4', boxShadow: '0 1px 3px rgba(13, 148, 136, 0.05)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#0f766e', fontSize: '17px', fontWeight: 'bold' }}>📋 ประวัติจดหมายและพัสดุ ({filteredParcels.length})</h3>
          
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <input type="text" placeholder="🔍 ค้นหา Tracking, ผู้รับ, ขนส่ง, จังหวัด..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, padding: '11px 14px', borderRadius: '8px', border: '1px solid #99f6e4', background: '#f8fafc', color: '#0f172a', fontSize: '14px', outline: 'none' }} />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '11px 14px', borderRadius: '8px', border: '1px solid #99f6e4', background: '#f8fafc', color: '#0f172a', fontSize: '14px', outline: 'none' }}>
              <option value="ทั้งหมด">ประเภท: ทั้งหมด</option>
              <option value="พัสดุ (Parcel)">พัสดุ (Parcel)</option>
              <option value="จดหมาย (Letter)">จดหมาย (Letter)</option>
              <option value="รับเข้า (Inbound)">รับเข้า (Inbound)</option>
              <option value="เบิกออก (Outbound)">เบิกออก (Outbound)</option>
            </select>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #99f6e4', color: '#0f766e', fontSize: '13px', fontWeight: 'bold' }}>
                <th style={{ padding: '12px' }}>Tracking / ขนส่ง</th>
                <th style={{ padding: '12px' }}>รายการ / จำนวน</th>
                <th style={{ padding: '12px' }}>ผู้รับ / ปลายทาง</th>
                <th style={{ padding: '12px' }}>สถานะ</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredParcels.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px', fontWeight: 'bold' }}>ไม่พบข้อมูลรายการพัสดุ</td>
                </tr>
              ) : (
                filteredParcels.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f0fdfa', fontSize: '14px' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 'bold', color: '#0f766e', fontSize: '15px' }}>{item.trackingId}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{item.carrier}</div>
                      <span style={{ 
                        display: 'inline-block', marginTop: '4px', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                        background: '#ccfbf1', color: '#0f766e'
                      }}>
                        {item.itemCategory || 'พัสดุ'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{item.productName}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>จำนวน: {item.quantity} ชิ้น</div>
                      {item.note && <div style={{ fontSize: '12px', color: '#c2410c', fontStyle: 'italic' }}>หมายเหตุ: {item.note}</div>}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ color: '#0f172a', fontWeight: 'bold' }}>{item.recipient} ({item.phone || '-'})</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{item.addressDetail} จ.{item.destinationProvince}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                        background: item.status === 'จัดส่งสำเร็จ' ? '#ccfbf1' : item.status.includes('กำลังกระจาย') ? '#fef9c3' : '#e0f2fe',
                        color: item.status === 'จัดส่งสำเร็จ' ? '#0f766e' : item.status.includes('กำลังกระจาย') ? '#a16207' : '#0369a1'
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={() => printLabel(item)} style={{ background: '#0d9488', color: '#fff', border: 'none', padding: '7px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🖨️ ปริ้นท์</button>
                        
                        <select 
                          value={item.status} 
                          onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                          style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #99f6e4', padding: '6px 8px', borderRadius: '6px', fontSize: '12px', outline: 'none' }}
                        >
                          <option value="รับเข้าคลังหลัก (สโตร์)">รับเข้าคลัง</option>
                          <option value="กำลังกระจายส่ง / นำจ่าย">กำลังนำจ่าย</option>
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
