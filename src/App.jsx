import React, { useState } from 'react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');

  // สถานะสลับหน้าจอระหว่าง Login กับ Register
  const [isRegistering, setIsRegistering] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // ฟอร์มพัสดุ (รันเลขพัสดุอัตโนมัติ)
  const [trackingNo, setTrackingNo] = useState(`TH-2026-${Math.floor(1000 + Math.random() * 9000)}`);
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

  // รายชื่อผู้ใช้งานในระบบ (เพิ่ม/ลบได้)
  const [users, setUsers] = useState([
    { id: 1, email: 'admin@gmail.com', role: 'admin' },
    { id: 2, email: 'user1@gmail.com', role: 'user' }
  ]);

  // ฟอร์มสำหรับเพิ่ม User ใหม่จากหน้า Admin
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');

  // ฟังก์ชันสุ่มเลขพัสดุใหม่
  const handleGenerateTracking = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setTrackingNo(`TH-2026-${randomNum}`);
  };

  // ฟังก์ชันสมัครสมาชิกใหม่จากหน้า Login
  const handleRegister = (e) => {
    e.preventDefault();
    if (regEmail && regPassword) {
      // เช็คว่ามีอีเมลนี้อยู่แล้วหรือยัง
      const found = users.find(u => u.email === regEmail);
      if (found) {
        alert('อีเมลนี้มีผู้ใช้งานในระบบแล้ว!');
        return;
      }
      setUsers([...users, { id: Date.now(), email: regEmail, role: 'user' }]);
      alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
      setIsRegistering(false);
      setRegEmail('');
      setRegPassword('');
    } else {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
    }
  };

  // ฟังก์ชันเข้าสู่ระบบ
  const handleLogin = (e) => {
    e.preventDefault();
    const found = users.find(u => u.email === email);
    if (found) {
      setIsLoggedIn(true);
    } else {
      // อนุญาตให้เมลใหม่เข้าได้โดยตั้งเป็น user อัตโนมัติถ้ายังไม่ถูกบันทึก
      if (email) {
        setUsers([...users, { id: Date.now(), email: email, role: 'user' }]);
        setIsLoggedIn(true);
      } else {
        alert('กรุณากรอกอีเมลผู้ใช้งาน');
      }
    }
  };

  // ฟังก์ชันเพิ่มพัสดุ + ส่ง Discord
  const handleAddParcel = async (e) => {
    e.preventDefault();
    if (trackingNo && recipient && phone && address) {
      const newParcel = { id: trackingNo, recipient, phone, province, address, status: 'รอดำเนินการ' };
      setParcels([...parcels, newParcel]);

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

      handleGenerateTracking();
      setRecipient('');
      setPhone('');
      setAddress('');
      alert('บันทึกข้อมูลพัสดุและส่งแจ้งเตือนไป Discord เรียบร้อย!');
    } else {
      alert('กรุณากรอกข้อมูลให้ครบทุกช่อง');
    }
  };

  // ฟังก์ชันเปลี่ยนสถานะพัสดุ
  const handleStatusChange = (index, newStatus) => {
    const updated = [...parcels];
    updated[index].status = newStatus;
    setParcels(updated);
  };

  // ฟังก์ชันเพิ่ม User จากหน้า Admin
  const handleAddUser = (e) => {
    e.preventDefault();
    if (newUserEmail) {
      setUsers([...users, { id: Date.now(), email: newUserEmail, role: newUserRole }]);
      setNewUserEmail('');
      alert('เพิ่มผู้ใช้งานสำเร็จ!');
    } else {
      alert('กรุณากรอกอีเมลผู้ใช้งาน');
    }
  };

  // ฟังก์ชันลบ User
  const handleDeleteUser = (id) => {
    if (users.length <= 1) {
      alert('ไม่สามารถลบผู้ใช้งานทั้งหมดออกจากระบบได้');
      return;
    }
    setUsers(users.filter(u => u.id !== id));
  };

  // --- หน้า Login / Register ---
  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#081028', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'Sarabun, sans-serif', color: '#f0f9ff' }}>
        <div style={{ backgroundColor: '#112240', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)', width: '420px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
            <span style={{ color: '#e0f2fe' }}>D-MAIL</span> <span style={{ color: '#38bdf8' }}>LOGISTICS</span>
          </h1>
          <p style={{ color: '#94a3b8', marginBottom: '30px' }}>
            {isRegistering ? 'ลงทะเบียนผู้ใช้งานใหม่ในระบบ' : 'กรุณาเข้าสู่ระบบเพื่อใช้งาน'}
          </p>

          {!isRegistering ? (
            // ฟอร์มเข้าสู่ระบบ
            <form onSubmit={handleLogin}>
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
                type="submit"
                style={{ width: '100%', padding: '14px', borderRadius: '6px', border: 'none', backgroundColor: '#0ea5e9', color: '#081028', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px' }}
              >
                เข้าสู่ระบบ
              </button>

              <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0' }}>
                ยังไม่มีบัญชีผู้ใช้งาน?{' '}
                <span 
                  onClick={() => setIsRegistering(true)} 
                  style={{ color: '#38bdf8', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}
                >
                  ลงทะเบียนที่นี่
                </span>
              </p>
            </form>
          ) : (
            // ฟอร์มลงทะเบียนสมาชิกใหม่
            <form onSubmit={handleRegister}>
              <div style={{ textAlign: 'left', marginBottom: '15px' }}>
                <label style={{ color: '#e0f2fe', display: 'block', marginBottom: '5px' }}>อีเมลสำหรับสมัครสมาชิก</label>
                <input 
                  type="email" 
                  placeholder="newuser@gmail.com" 
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #2d3748', backgroundColor: '#050c20', color: 'white', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ textAlign: 'left', marginBottom: '25px' }}>
                <label style={{ color: '#e0f2fe', display: 'block', marginBottom: '5px' }}>รหัสผ่าน</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #2d3748', backgroundColor: '#050c20', color: 'white', boxSizing: 'border-box' }}
                />
              </div>

              <button 
                type="submit"
                style={{ width: '100%', padding: '14px', borderRadius: '6px', border: 'none', backgroundColor: '#10b981', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px' }}
              >
                ยืนยันลงทะเบียน
              </button>

              <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0' }}>
                มีบัญชีอยู่แล้ว?{' '}
                <span 
                  onClick={() => setIsRegistering(false)} 
                  style={{ color: '#38bdf8', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}
                >
                  กลับไปเข้าสู่ระบบ
                </span>
              </p>
            </form>
          )}
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
            <h1 style={{ fontSize: '24px', margin: '0', color: '#38bdf8' }}>📦 D-MAIL LOGISTICS ({role === 'admin' ? 'Admin Dashboard' : 'User Mode'})</h1>
            <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>ยินดีต้อนรับคุณ {email}</p>
          </div>
          <button 
            onClick={() => { setRole(''); setIsLoggedIn(false); }}
            style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ออกจากระบบ
          </button>
        </header>

        {/* --- Dashboard สถิติสำหรับ Admin --- */}
        {role === 'admin' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' }}>
            <div style={{ backgroundColor: '#112240', padding: '20px', borderRadius: '10px', borderLeft: '5px solid #38bdf8' }}>
              <div style={{ color: '#94a3b8', fontSize: '14px' }}>พัสดุทั้งหมดในระบบ</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f0f9ff', marginTop: '5px' }}>{parcels.length} ชิ้น</div>
            </div>
            <div style={{ backgroundColor: '#112240', padding: '20px', borderRadius: '10px', borderLeft: '5px solid #f59e0b' }}>
              <div style={{ color: '#94a3b8', fontSize: '14px' }}>กำลังจัดส่ง / รอดำเนินการ</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b', marginTop: '5px' }}>
                {parcels.filter(p => p.status !== 'จัดส่งสำเร็จ').length} ชิ้น
              </div>
            </div>
            <div style={{ backgroundColor: '#112240', padding: '20px', borderRadius: '10px', borderLeft: '5px solid #10b981' }}>
              <div style={{ color: '#94a3b8', fontSize: '14px' }}>จัดส่งสำเร็จแล้ว</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', marginTop: '5px' }}>
                {parcels.filter(p => p.status === 'จัดส่งสำเร็จ').length} ชิ้น
              </div>
            </div>
          </div>
        )}

        {/* ฟอร์มเพิ่มพัสดุเฉพาะ Admin */}
        {role === 'admin' && (
          <div style={{ backgroundColor: '#112240', padding: '25px', borderRadius: '10px', marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#38bdf8' }}>➕ เพิ่มรายการพัสดุใหม่ & แจ้งเตือน Discord</h3>
            <form onSubmit={handleAddParcel} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  value={trackingNo} 
                  readOnly 
                  style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #2d3748', backgroundColor: '#050c20', color: '#38bdf8', fontWeight: 'bold' }}
                />
                <button 
                  type="button" 
                  onClick={handleGenerateTracking}
                  style={{ backgroundColor: '#0ea5e9', color: '#081028', border: 'none', padding: '0 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  สุ่มเลขใหม่
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

        {/* --- ส่วนจัดการผู้ใช้งาน (เพิ่ม/ลบ User) เฉพาะ Admin --- */}
        {role === 'admin' && (
          <div style={{ backgroundColor: '#112240', padding: '25px', borderRadius: '10px', marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#38bdf8' }}>👥 จัดการบัญชีผู้ใช้งานในระบบ (Add/Delete Users)</h3>
            <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input 
                type="email" 
                placeholder="อีเมลผู้ใช้งานใหม่" 
                value={newUserEmail} 
                onChange={(e) => setNewUserEmail(e.target.value)}
                style={{ flex: 2, padding: '10px', borderRadius: '6px', border: '1px solid #2d3748', backgroundColor: '#050c20', color: 'white' }}
              />
              <select 
                value={newUserRole} 
                onChange={(e) => setNewUserRole(e.target.value)}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #2d3748', backgroundColor: '#050c20', color: 'white' }}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <button 
                type="submit"
                style={{ backgroundColor: '#6366f1', color: 'white', border: 'none', padding: '0 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                เพิ่มยูสเซอร์
              </button>
            </form>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #2d3748', color: '#94a3b8', fontSize: '14px' }}>
                  <th style={{ padding: '8px' }}>อีเมล</th>
                  <th style={{ padding: '8px' }}>สิทธิ์การใช้งาน</th>
                  <th style={{ padding: '8px' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #1e293b', fontSize: '14px' }}>
                    <td style={{ padding: '10px' }}>{u.email}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ backgroundColor: u.role === 'admin' ? '#065f46' : '#3730a3', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        ลบยูส
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                <th style={{ padding: '10px' }}>สถานะพัสดุ</th>
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
                    {role === 'admin' ? (
                      <select 
                        value={item.status} 
                        onChange={(e) => handleStatusChange(index, e.target.value)}
                        style={{ backgroundColor: '#050c20', color: '#38bdf8', padding: '4px 8px', borderRadius: '4px', border: '1px solid #2d3748' }}
                      >
                        <option value="รอดำเนินการ">รอดำเนินการ</option>
                        <option value="กำลังจัดส่ง">กำลังจัดส่ง</option>
                        <option value="จัดส่งสำเร็จ">จัดส่งสำเร็จ</option>
                      </select>
                    ) : (
                      <span style={{ backgroundColor: '#065f46', color: '#34d399', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {item.status}
                      </span>
                    )}
                  </td>
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

      {/* Modal หน้าต่างใบปะหน้าพัสดุ (พร้อม QR Code) */}
      {selectedParcel && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', color: 'black', padding: '30px', borderRadius: '10px', width: '450px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
            <h2 style={{ textAlign: 'center', borderBottom: '2px dashed black', paddingBottom: '10px', margin: '0 0 20px 0' }}>
              📦 D-MAIL EXPRESS (ใบปะหน้า)
            </h2>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                Tracking: <span style={{ color: '#2563eb' }}>{selectedParcel.id}</span>
              </div>
              <div style={{ width: '60px', height: '60px', border: '2px solid black', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                QR CODE
              </div>
            </div>
            
            <div style={{ marginBottom: '15px', fontSize: '16px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
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
