import React, { useState, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import emailjs from '@emailjs/browser'; // 📌 1. นำเข้า EmailJS สำหรับส่งอีเมล
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

// 📌 2. กำหนดค่า EmailJS ของคุณที่นี่
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";

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
  
  const [qrModalItem, setQrModalItem] = useState(null);

  const [formData, setFormData] = useState({ 
    trackingId: generateTrackingId(), 
    recipient: '', 
    recipientEmail: '', // 📌 เพิ่มช่องเก็บอีเมลผู้รับ
    phone: '', 
    status: 'รับฝากชำระแล้ว' 
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
       
      // 📌 ส่งอีเมลแจ้งเตือนผ่าน EmailJS ไปยังผู้รับอัตโนมัติ
      if (formData.recipientEmail) {
        const emailParams = {
          tracking_id: formData.trackingId,
          recipient_name: formData.recipient,
          recipient_email: formData.recipientEmail,
          parcel_status: formData.status,
          parcel_location: fullLocation
        };
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailParams, EMAILJS_PUBLIC_KEY)
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

  // ... (ส่วนโค้ดการแสดงผลหน้า UI ของ Admin และ User คงเดิมตามโครงสร้างโปรเจกต์ของคุณ)
