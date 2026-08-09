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
  const [userRole, setUserRole] = useState(null); // 'Admin' หรือ 'User'
  const [authLoading, setAuthLoading] = useState(true);

  // Auth States
  const [isRegistering, setIsRegistering] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Dashboard States
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

  // ตรวจสอบการเข้าสู่ระบบและ Role จาก Firestore
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

  // ดึงรายการพัสดุ Real-time
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
        setAuthError('❌ รหัสผ่านทั้งสองช่องไม่ตรงกัน');
        return;
      }
      if (password.length < 6) {
        setAuthError('❌ รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        return;
      }
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (err) {
        setAuthError(err.code === 'auth/email-already-in-use' ? '❌ อีเมลนี้ถูกใช้งานแล้ว' : '❌ เกิดข้อผิดพลาดในการลงทะเบียน');
      }
    } else {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        setAuthError('❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง');
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

      showToast(`🎉 เข้าสู่ระบบในฐานะ [${selectedRole}] เรียบร้อยแล้ว!`);
    } catch (e) {
      console.error("Error saving role:", e);
      showToast('❌ ไม่สามารถบันทึกสิทธิ์ลงฐานข้อมูลได้');
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
      showToast('❌ เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่บันทึกข้อมูลได้');
      return;
    }

    if (!formData.recipient || !addressDetail) {
      showToast('⚠️ กรุณากรอกข้อมูลผู้รับและรายละเอียดที่อยู่ให้ครบถ้วน');
      return;
    }

    const fullLocation = `${addressDetail} จ.${selectedProvince}`;
    const newParcelData = {
      trackingId: formData.trackingId,
      recipient: formData.recipient,
      phone: formData.phone,
      location: fullLocation,
      status: formData.status,
      createdBy: currentUser.email
