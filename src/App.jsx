import React, { useState } from 'react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');

  // ฟอร์มพัสดุ
  const [trackingNo, setTrackingNo] = useState('');
  const [recipient, setRecipient] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('กรุงเทพมหานคร');
  const [address, setAddress] = useState('');

  // สถานะเปิดหน้าต่างใบปะหน้า
  const [selectedParcel, setSelectedParcel] = useState(null);

  // รายชื่อ 77 จังหวัดทั่วไทย
  const provinces = [
    "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "ยะลา", "ยโสธร", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี", "เชียงราย", "เชียงใหม่", "เพชรบุรี", "เพชรบูรณ์", "เลย", "แพร่", "แม่ฮ่องสอน"
  ];

  // รายการพัสดุ
  const [parcels, setParcels] = useState([
    { id: 'TH-2026-001', recipient: 'คุณหมิว', phone: '0812345678', province: 'สมุทรสงคราม', address: '123 ถ.แม่กลอง', status: 'กำลังจัดส่ง' }
  ]);

  // สุ่มเลขพัสดุออโต้
  const handleGenerateTracking = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setTrackingNo(`TH-2026-${randomNum}`);
  };

  // ฟังก์ชันเพิ่มพัสดุ + ส่งแจ้งเตือนไป Discord
  const handleAddParcel = async (e) => {
    e.preventDefault();
    if (trackingNo && recipient && phone && address) {
      const newParcel = { id: trackingNo, recipient, phone, province, address, status: 'รอดำเนินการ' };
      setParcels([...parcels, newParcel]);

      // ส่งข้อมูลแจ้งเตือนไปที่ Discord Webhook ของคุณ
      const webhookUrl = 'https://discordapp.com/api/webhooks/1534569324356964352/1rvOo8ssGWLqzmSTw9mtB-Zun3pyuqgnT1GkHWJaHXU4_p4pJuswsJGLimqdsKag-fMC';
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🚨 **มีพัสดุเข้าระบบใหม่!**\n📦 **Tracking:** ${trackingNo}\n👤 **ผู้รับ:** ${recipient}\n📞 **เบอร์โทร:** ${phone}\n📍 **ปลายทาง:** จังหวัด${province} (${address})`
          })
        });
      } catch (err) {
        console.error('Discord webhook error:', err);
      }

      setTrackingNo('');
      setRecipient('');
      setPhone('');
      setAddress('');
      alert('บันทึกข้อมูลพัสดุและส่งแจ้งเตือนไป Discord เรียบร้อย!');
    } else {
      alert('กรุณากรอกข้อมูลให้ครบทุกช่อง');
    }
  };

  // --- หน้า Login ---
  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#081028', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'Sarabun, sans-serif', color: '#f0f9ff' }}>
        <div style={{ backgroundColor: '#112240', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)', width: '420px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
            <span style={{ color: '#e0f2fe' }}>D-MAIL</span> <span style={{ color: '#38bdf8' }}>LOGISTICS</span>
          </h1>
          <p style={{ color: '#94a3b8', marginBottom: '30px' }}>กรุณาเข้าสู่ระบบเพื่อเลือกสิทธิ์การใช้งาน</p>

          <div style={{ textAlign: 'left', marginBottom: '15px' }}>
            <label style={{ color: '#e0f2fe', display: 'block', marginBottom: '5px' }}>อีเมลผู้ใช้งาน</label>
            <input 
              type="email" 
              placeholder="admin@gmail.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #2d3748', backgroundColor: '#050c20', color: 'white', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ textAlign: 'left', marginBottom: '25px' }}>
            <label style={{ color: '#e0f2fe', display: 'block', marginBottom: '5px' }}>รหัสผ่าน</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #2d3748', backgroundColor: '#050c20', color: 'white', boxSizing: 'border-box' }}
            />
          </div>

          <button 
            onClick={() => { if(email) setIsLoggedIn(true); else alert('กรุณากรอกอีเมล'); }}
            style={{ width: '100%', padding: '14px', borderRadius: '6px', border: 'none', backgroundColor: '#0ea5e9', color: '#081028', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            เข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  // --- หน้าเลือกระดับผู้ใช้งาน ---
  if (!role) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#081028', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'Sarabun, sans-serif', color: '#f0f9ff' }}>
        <div style={{ backgroundColor: '#112240', padding: '40px', borderRadius: '12px', textAlign: 'center', width: '400px' }}>
          <h2 style={{ color: '#38bdf8', marginBottom: '10px' }}>เลือกสถานะผู้ใช้งาน</h2>
          <p style={{ color: '#94a3b8', marginBottom: '30px' }}>คุณต้องการเข้าสู่ระบบในฐานะอะไร?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button 
              onClick={() => setRole('admin')}
              style={{ padding: '15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              👑 ผู้ดูแลระบบ (Admin)
            </button>
            <button 
              onClick={() => setRole('user')}
              style={{ padding: '15px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              👤 ผู้ใช้งานทั่วไป (User)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#081028', padding: '30px', fontFamily: 'Sarabun, sans-serif', color: '#f0f9ff' }}>
      <div style={{ maxWidth: '950px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '20px', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '24px', margin: '0', color: '#38bdf8' }}>📦 D-MAIL LOGISTICS ({role === 'admin' ? 'Admin Mode' : 'User Mode'})</h1>
            <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>ยินดีต้อนรับคุณ {email}</p>
          </div>
          <button 
            onClick={() => { setRole(''); setIsLoggedIn(false); }}
            style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ออกจากระบบ
          </button>
        </header>

        {/* ฟอร์มเพิ่มพัสดุเฉพาะ Admin */}
        {role === 'admin' && (
          <div style={{ backgroundColor: '#112240', padding: '25px', borderRadius: '10px', marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#38bdf8' }}>➕ เพิ่มรายการพัสดุใหม่ & แจ้งเตือน Discord</h3>
            <form onSubmit={handleAddParcel} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="กดปุ่มรันเลขพัสดุ" 
                  value={trackingNo} 
                  readOnly 
                  style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #2d3748', backgroundColor: '#050c20', color: '#38bdf8', fontWeight: 'bold' }}
                />
                <button 
                  type="button" 
                  onClick={handleGenerateTracking}
                  style={{ backgroundColor: '#0ea5e9', color: '#081028', border: 'none', padding: '0 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  รันเลขพัสดุ
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="ชื่อผู้รับ" 
                  value={recipient} 
                  onChange={(e) => setRecipient(e.target.value)} 
                  style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #2d3748', backgroundColor: '#050c20', color: 'white' }}
                />
                <input 
                  type="text" 
                  placeholder="เบอร์โทรศัพท์" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #2d3748', backgroundColor: '#050c20', color: 'white' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <select 
                  value={province} 
                  onChange={(e) => setProvince(e.target.value)}
                  style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #2d3748', backgroundColor: '#050c20', color: 'white' }}
                >
                  {provinces.map((prov, index) => (
                    <option key={index} value={prov}>{prov}</option>
                  ))}
                </select>
                <input 
                  type="text" 
                  placeholder="ที่อยู่จัดส่งละเอียด (บ้านเลขที่ / ถนน)" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  style={{ flex: 2, padding: '12px', borderRadius: '6px', border: '1px solid #2d3748', backgroundColor: '#050c20', color: 'white' }}
                />
              </div>

              <button 
                type="submit"
                style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                บันทึกและส่งแจ้งเตือน Discord
              </button>
            </form>
          </div>
        )}

        {/* ตารางรายการพัสดุ */}
        <div style={{ backgroundColor: '#112240', padding: '25px', borderRadius: '10px' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>📋 รายการพัสดุทั้งหมดในระบบ</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #2d3748', color: '#94a3b8', fontSize: '14px' }}>
                <th style={{ padding: '10px' }}>เลขพัสดุ</th>
                <th style={{ padding: '10px' }}>ผู้รับ</th>
                <th style={{ padding: '10px' }}>เบอร์โทร</th>
                <th style={{ padding: '10px' }}>จังหวัด</th>
                <th style={{ padding: '10px' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {parcels.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #1e293b', fontSize: '14px' }}>
                  <td style={{ padding: '12px', color: '#38bdf8', fontWeight: 'bold' }}>{item.id}</td>
                  <td style={{ padding: '12px' }}>{item.recipient}</td>
                  <td style={{ padding: '12px' }}>{item.phone}</td>
                  <td style={{ padding: '12px' }}>{item.province}</td>
                  <td style={{ padding: '12px' }}>
                    <button 
                      onClick={() => setSelectedParcel(item)}
                      style={{ backgroundColor: '#f59e0b', color: '#081028', border: 'none', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                    >
                      🖨️ พิมพ์ใบปะหน้า
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal หน้าต่างใบปะหน้าพัสดุ */}
      {selectedParcel && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', color: 'black', padding: '30px', borderRadius: '10px', width: '450px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
            <h2 style={{ textAlign: 'center', borderBottom: '2px dashed black', paddingBottom: '10px', margin: '0 0 20px 0' }}>
              📦 D-MAIL EXPRESS (ใบปะหน้าพัสดุ)
            </h2>
            
            <div style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px', backgroundColor: '#f3f4f6', padding: '10px', border: '1px solid #ccc' }}>
              Tracking: {selectedParcel.id}
            </div>

            <div style={{ marginBottom: '15px', fontSize: '16px' }}>
              <strong>ผู้รับ:</strong> {selectedParcel.recipient} (โทร: {selectedParcel.phone})
            </div>
            <div style={{ marginBottom: '20px', fontSize: '16px' }}>
              <strong>ที่อยู่จัดส่ง:</strong> {selectedParcel.address} จ.{selectedParcel.province}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => window.print()}
                style={{ flex: 1, backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                🖨️ สั่งพิมพ์ (Print)
              </button>
              <button 
                onClick={() => setSelectedParcel(null)}
                style={{ flex: 1, backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
