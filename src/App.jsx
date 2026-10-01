import React, { useState, useEffect } from 'react';
import { db } from './firebase'; 
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';

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
  const [currentView, setCurrentView] = useState('login'); 
  const [userRole, setUserRole] = useState(null); 
  const [toast, setToast] = useState('');
  const [parcels, setParcels] = useState([]);
  
  const [searchTrackingInput, setSearchTrackingInput] = useState('');
  const [trackedResult, setTrackedResult] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ทั้งหมด');
  
  const [formData, setFormData] = useState({ 
    trackingId: generateTrackingId(), 
    transactionType: 'รับเข้าพัสดุ (Inbound)',
    productName: '',
    quantity: 1,
    recipient: '', 
    phone: '', 
    destinationProvince: 'สมุทรสงคราม',
    addressDetail: '',
    status: 'รับเข้าคลังหลัก (สโตร์)' 
  });

  useEffect(() => {
    try {
      const q = query(collection(db, "parcels"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setParcels(items);
      }, (error) => {
        console.error("Firebase Error: ", error);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error(e);
    }
  }, []);

  const showToast = (message) => { 
    setToast(message); 
    setTimeout(() => setToast(''), 3000); 
  };

  const handlePublicSearch = (e) => {
    e.preventDefault();
    const found = parcels.find(p => p.trackingId?.toLowerCase() === searchTrackingInput.trim().toLowerCase());
    if (found) {
      setTrackedResult(found);
    } else {
      setTrackedResult(null);
      showToast('ไม่พบเลขพัสดุ กรุณาตรวจสอบอีกครั้ง');
    }
  };

  const printLabel = (item) => {
    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${item.trackingId}&scale=2&height=12&includetext=true`;
    const trackingUrl = window.location.href;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(trackingUrl)}`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('กรุณาอนุญาตให้เบราว์เซอร์เปิดหน้าต่างป๊อปอัป');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>D-MAIL Label - ${item.trackingId}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 20px; color: #000; background: #fff; }
            .label { border: 2px dashed #0369a1; padding: 20px; width: 340px; margin: auto; text-align: left; background: #ffffff; border-radius: 8px; }
            .title { text-align: center; font-weight: bold; font-size: 20px; color: #0369a1; margin-bottom: 2px; }
            .sub-title { text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 12px; color: #475569; }
            .barcode { text-align: center; margin-bottom: 12px; }
            .barcode img { max-width: 100%; height: auto; }
            .info { font-size: 13px; margin-bottom: 6px; line-height: 1.4; color: #0f172a; }
            .qr-section { text-align: center; margin-top: 15px; }
            .qr-section img { width: 85px; height: 85px; }
            .qr-text { font-size: 11px; color: #64748b; margin-top: 3px; font-weight: bold; }
            button { margin-top: 20px; padding: 10px 20px; cursor: pointer; background: #0284c7; color: #fff; border: none; border-radius: 6px; font-size: 15px; font-weight: bold; display: block; margin-left: auto; margin-right: auto; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="title">D-MAIL LOGISTICS</div>
            <div class="sub-title">[ ${item.transactionType} ]</div>
            <div class="barcode"><img src="${barcodeUrl}" alt="Barcode" /></div>
            <div class="info"><strong>Tracking:</strong> ${item.trackingId}</div>
            <div class="info"><strong>รายการสินค้า:</strong> ${item.productName} (จำนวน: ${item.quantity})</div>
            <div class="info"><strong>ผู้รับ/แผนก:</strong> ${item.recipient} (${item.phone || '-'})</div>
            <div class="info"><strong>ปลายทาง:</strong> ${item.addressDetail} จ.${item.destinationProvince}</div>
            <div class="info"><strong>สถานะปัจจุบัน:</strong> ${item.status}</div>
            <div class="qr-section">
              <img src="${qrCodeUrl}" alt="QR Code" />
              <div class="qr-text">สแกนตรวจสอบสถานะพัสดุ</div>
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
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "parcels"), {
        ...formData,
        createdAt: new Date().toISOString()
      });
      
      const newItem = { ...formData, id: docRef.id };
      printLabel(newItem);
      showToast('บันทึกข้อมูลลง Firebase สำเร็จ!');
      
      setFormData({ 
        trackingId: generateTrackingId(), 
        transactionType: 'รับเข้าพัสดุ (Inbound)',
        productName: '', 
        quantity: 1, 
        recipient: '', 
        phone: '', 
        destinationProvince: 'สมุทรสงคราม', 
        addressDetail: '', 
        status: 'รับเข้าคลังหลัก (สโตร์)' 
      });
    } catch (error) {
      console.error(error);
      showToast('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "parcels", id), { status: newStatus });
      showToast('อัปเดตสถานะสำเร็จ');
    } catch (error) {
      showToast('ไม่สามารถอัปเดตสถานะได้');
    }
  };

  const handleDeleteParcel = async (id) => {
    if (userRole !== 'Admin') {
      showToast('เฉพาะ Admin เท่านั้นที่สามารถลบข้อมูลได้');
      return;
    }
    if (window.confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
      try {
        await deleteDoc(doc(db, "parcels", id));
        showToast('ลบรายการสำเร็จ');
      } catch (error) {
        showToast('ไม่สามารถลบข้อมูลได้');
      }
    }
  };

  if (currentView === 'track') {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif', padding: '40px 20px', color: '#0f172a' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h2 style={{ color: '#0369a1', margin: 0, fontSize: '22px' }}>🔍 D-MAIL Tracking System</h2>
            <button onClick={() => setCurrentView('login')} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>เข้าสู่ระบบเจ้าหน้าที่</button>
          </div>

          <div style={{ background: '#ffffff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <form onSubmit={handlePublicSearch}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px', color: '#334155' }}>กรอกหมายเลขพัสดุ (Tracking Number)</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="เช่น DM12345678TH" 
                  value={searchTrackingInput} 
                  onChange={e => setSearchTrackingInput(e.target.value)}
                  required
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }}
                />
                <button type="submit" style={{ padding: '12px 24px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>ค้นหา</button>
              </div>
            </form>
          </div>

          {trackedResult && (
            <div style={{ background: '#ffffff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #bae6fd' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', marginBottom: '15px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>หมายเลขพัสดุ</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0369a1' }}>{trackedResult.trackingId}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{trackedResult.transactionType}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px', marginBottom: '20px' }}>
                <div><strong>สินค้า:</strong> {trackedResult.productName} ({trackedResult.quantity} ชิ้น)</div>
                <div><strong>ผู้รับ:</strong> {trackedResult.recipient}</div>
                <div><strong>ปลายทาง:</strong> จ.{trackedResult.destinationProvince}</div>
                <div><strong>เบอร์ติดต่อ:</strong> {trackedResult.phone || '-'}</div>
              </div>
              <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: 'bold' }}>สถานะพัสดุปัจจุบัน</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0d9488', marginTop: '4px' }}>🟢 {trackedResult.status}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'login') {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#ffffff', padding: '40px', borderRadius: '16px', width: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(2, 132, 199, 0.1)', border: '1px solid #bae6fd' }}>
          <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', display: 'inline-block', marginBottom: '15px', fontWeight: 'bold' }}>
            📦 D-MAIL Logistics System
          </div>
          <h2 style={{ color: '#0369a1', margin: '0 0 10px 0', fontSize: '22px' }}>เข้าสู่ระบบจัดการพัสดุ</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '25px' }}>เลือกบทบาทการใช้งานของคุณ</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <button onClick={() => { setUserRole('Admin'); setCurrentView('dashboard'); showToast('เข้าสู่ระบบ Admin สำเร็จ'); }} style={{ padding: '14px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
              🛡️ Admin (ผู้ดูแลระบบสูงสุด)
            </button>
            <button onClick={() => { setUserRole('Staff'); setCurrentView('dashboard'); showToast('เข้าสู่ระบบ Staff สำเร็จ'); }} style={{ padding: '14px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
              👷 Staff (เจ้าหน้าที่คลังพัสดุ)
            </button>
          </div>
          
          <button onClick={() => setCurrentView('track')} style={{ background: 'transparent', border: 'none', color: '#0284c7', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', textDecoration: 'underline' }}>
            🔍 กลับสู่หน้าค้นหาพัสดุสำหรับลูกค้า (Tracking)
          </button>
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
    <div style={{ background: '#f8fafc', minHeight: '100vh', color: '#0f172a', fontFamily: 'sans-serif', paddingBottom: '40px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#0284c7', color: '#fff', padding: '12px 20px', borderRadius: '8px', zIndex: 1000, fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)' }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 40px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h2 style={{ margin: 0, color: '#0369a1', fontSize: '20px', fontWeight: 'bold' }}>
          📦 D-MAIL ADMIN DASHBOARD
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ background: userRole === 'Admin' ? '#e0f2fe' : '#ccfbf1', color: userRole === 'Admin' ? '#0369a1' : '#0f766e', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
            สิทธิ์: {userRole}
          </span>
          <button onClick={() => setCurrentView('track')} style={{ background: '#0d9488', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>🔍 ไปหน้าค้นหา</button>
          <button onClick={() => setCurrentView('login')} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>ออกจากระบบ</button>
        </div>
      </div>

      <div style={{ padding: '30px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>พัสดุทั้งหมดในระบบ</div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '6px', color: '#0f172a' }}>{parcels.length} รายการ</div>
          </div>
          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>รับเข้า (Inbound)</div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '6px', color: '#0d9488' }}>{parcels.filter(p => p.transactionType?.includes('รับเข้า')).length}</div>
          </div>
          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>เบิกออก (Outbound)</div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '6px', color: '#c2410c' }}>{parcels.filter(p => p.transactionType?.includes('เบิกออก')).length}</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '28px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#0369a1', fontSize: '17px', fontWeight: 'bold' }}>📝 บันทึกข้อมูลพัสดุใหม่</h3>
          <form onSubmit={handleSaveParcel}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>ประเภท</label>
                <select value={formData.transactionType} onChange={e => setFormData({...formData, transactionType: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px' }}>
                  <option value="รับเข้าพัสดุ (Inbound)">🟢 รับเข้าพัสดุ (Inbound)</option>
                  <option value="เบิกออกพัสดุ (Outbound)">🟠 เบิกออกพัสดุ (Outbound)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>ชื่อสินค้า</label>
                <input type="text" placeholder="ระบุชื่อพัสดุ" value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} required style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>จำนวน</label>
                <input type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>ผู้รับ / แผนก</label>
                <input type="text" placeholder="ชื่อผู้รับ" value={formData.recipient} onChange={e => setFormData({...formData, recipient: e.target.value})} required style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>เบอร์โทรติดต่อ</label>
                <input type="text" placeholder="0812345678" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>จังหวัดปลายทาง</label>
                <select value={formData.destinationProvince} onChange={e => setFormData({...formData, destinationProvince: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px' }}>
                  {THAI_PROVINCES.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>สถานะเบื้องต้น</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px' }}>
                  <option value="รับเข้าคลังหลัก (สโตร์)">รับเข้าคลังหลัก (สโตร์)</option>
                  <option value="กำลังกระจายส่ง">กำลังกระจายส่ง</option>
                  <option value="จัดส่งสำเร็จ">จัดส่งสำเร็จ</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: 'bold' }}>ที่อยู่ / รายละเอียดเพิ่มเติม</label>
              <input type="text" placeholder="บ้านเลขที่, อาคาร, แผนก" value={formData.addressDetail} onChange={e => setFormData({...formData, addressDetail: e.target.value})} required style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ textAlign: 'center' }}>
              <button type="submit" style={{ padding: '10px 24px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                💾 บันทึกและพิมพ์ใบปะหน้า
              </button>
            </div>
          </form>
        </div>

        <div style={{ background: '#ffffff', padding: '28px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#0369a1', fontSize: '17px', fontWeight: 'bold' }}>📋 รายการพัสดุทั้งหมด ({filteredParcels.length})</h3>
          
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <input type="text" placeholder="🔍 ค้นหา Tracking, สินค้า, ผู้รับ..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px' }} />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px' }}>
              <option value="ทั้งหมด">ประเภท: ทั้งหมด</option>
              <option value="รับเข้าพัสดุ (Inbound)">รับเข้าพัสดุ (Inbound)</option>
              <option value="เบิกออกพัสดุ (Outbound)">เบิกออกพัสดุ (Outbound)</option>
            </select>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#0369a1', fontSize: '13px', fontWeight: 'bold' }}>
                <th style={{ padding: '12px' }}>Tracking / ประเภท</th>
                <th style={{ padding: '12px' }}>สินค้า / จำนวน</th>
                <th style={{ padding: '12px' }}>ผู้รับ</th>
                <th style={{ padding: '12px' }}>สถานะ</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredParcels.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>ยังไม่มีข้อมูลพัสดุในระบบ Firebase</td>
                </tr>
              ) : (
                filteredParcels.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 'bold', color: '#0369a1' }}>{item.trackingId}</div>
                      <span style={{ display: 'inline-block', marginTop: '4px', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', background: item.transactionType?.includes('รับเข้า') ? '#ccfbf1' : '#ffedd5', color: item.transactionType?.includes('รับเข้า') ? '#0d9488' : '#c2410c' }}>
                        {item.transactionType}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 'bold' }}>{item.productName}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>จำนวน: {item.quantity}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div>{item.recipient}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>จ.{item.destinationProvince}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', background: item.status === 'จัดส่งสำเร็จ' ? '#ccfbf1' : '#e0f2fe', color: item.status === 'จัดส่งสำเร็จ' ? '#0d9488' : '#0369a1' }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button onClick={() => printLabel(item)} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🖨️ ปริ้นท์</button>
                        <select value={item.status} onChange={(e) => handleUpdateStatus(item.id, e.target.value)} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '5px', borderRadius: '6px', fontSize: '12px' }}>
                          <option value="รับเข้าคลังหลัก (สโตร์)">รับเข้าคลัง</option>
                          <option value="กำลังกระจายส่ง">กำลังกระจายส่ง</option>
                          <option value="จัดส่งสำเร็จ">จัดส่งสำเร็จ</option>
                        </select>
                        {userRole === 'Admin' && (
                          <button onClick={() => handleDeleteParcel(item.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🗑️ ลบ</button>
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
