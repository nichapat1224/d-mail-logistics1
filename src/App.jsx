import React, { useState } from 'react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // สถานะสำหรับเก็บรายการพัสดุจำลองในหน้าแดชบอร์ด
  const [parcels, setParcels] = useState([
    { id: 'TH123456789', recipient: 'แผนก IT (คุณหมิว)', status: 'กำลังจัดส่ง' },
    { id: 'TH987654321', recipient: 'ฝ่ายบริหาร', status: 'ถึงปลายทางแล้ว' }
  ]);
  const [trackingNo, setTrackingNo] = useState('');
  const [recipient, setRecipient] = useState('');

  // ฟังก์ชันกดล็อกอิน
  const handleLogin = (e) => {
    e.preventDefault();
    if (email.trim() !== '' && password.trim() !== '') {
      setIsLoggedIn(true); // เปลี่ยนสถานะเป็นเข้าสู่ระบบแล้ว -> จะเด้งไปหน้าแดชบอร์ดทันที!
    } else {
      alert('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
    }
  };

  // ฟังก์ชันเพิ่มพัสดุใหม่
  const handleAddParcel = (e) => {
    e.preventDefault();
    if (trackingNo && recipient) {
      setParcels([...parcels, { id: trackingNo, recipient: recipient, status: 'รอดำเนินการ' }]);
      setTrackingNo('');
      setRecipient('');
    }
  };

  // --- ถ้ายังไม่ล็อกอิน ให้แสดงหน้า Login ---
  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#081028', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'Sarabun, sans-serif', color: '#f0f9ff' }}>
        <div style={{ backgroundColor: '#112240', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)', width: '420px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ backgroundColor: '#0d9488', borderRadius: '50%', width: '12px', height: '12px', marginRight: '8px' }}></span>
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>ระบบจัดการและติดตามพัสดุ</span>
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
            <span style={{ color: '#e0f2fe' }}>D-MAIL</span> <span style={{ color: '#38bdf8' }}>LOGISTICS</span>
          </h1>
          <p style={{ color: '#94a3b8', marginBottom: '35px', fontSize: '16px' }}>กรุณาเข้าสู่ระบบเพื่อเข้าใช้งานแดชบอร์ด</p>

          <form onSubmit={handleLogin}>
            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <label style={{ color: '#e0f2fe', display: 'block', marginBottom: '8px', fontWeight: '500' }}>อีเมลผู้ใช้งาน</label>
              <input 
                type="email" 
                placeholder="admin@gmail.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #2d3748', backgroundColor: '#050c20', color: 'white', fontSize: '16px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            <div style={{ textAlign: 'left', marginBottom: '30px' }}>
              <label style={{ color: '#e0f2fe', display: 'block', marginBottom: '8px', fontWeight: '500' }}>รหัสผ่าน</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #2d3748', backgroundColor: '#050c20', color: 'white', fontSize: '16px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            <button 
              type="submit"
              style={{ width: '100%', padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#0ea5e9', color: '#081028', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '25px' }}
            >
              เข้าสู่ระบบ
            </button>
          </form>

          <div style={{ color: '#94a3b8', fontSize: '14px' }}>
            ยังไม่มีบัญชีผู้ใช้? <a href="#" style={{ color: '#38bdf8', textDecoration: 'none' }}>ลงทะเบียนใหม่</a>
          </div>
        </div>
      </div>
    );
  }

  // --- ถ้าล็อกอินแล้ว จะเด้งมาหน้า Dashboard จัดการพัสดุหน้านี้ ---
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#081028', padding: '30px', fontFamily: 'Sarabun, sans-serif', color: '#f0f9ff' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '20px', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '24px', margin: '0', color: '#38bdf8' }}>📦 D-MAIL LOGISTICS DASHBOARD</h1>
            <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>ยินดีต้อนรับเข้าสู่ระบบจัดการพัสดุ</p>
          </div>
          <button 
            onClick={() => setIsLoggedIn(false)}
            style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ออกจากระบบ
          </button>
        </header>

        {/* ฟอร์มเพิ่มพัสดุ */}
        <div style={{ backgroundColor: '#112240', padding: '25px', borderRadius: '10px', marginBottom: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#e2e8f0' }}>➕ เพิ่มรายการพัสดุใหม่</h3>
          <form onSubmit={handleAddParcel} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="เลขพัสดุ (Tracking No.)" 
              value={trackingNo}
              onChange={(e) => setTrackingNo(e.target.value)}
              style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #2d3748', backgroundColor: '#050c20', color: 'white' }}
            />
            <input 
              type="text" 
              placeholder="ชื่อผู้รับ / ภาควิชา" 
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #2d3748', backgroundColor: '#050c20', color: 'white' }}
            />
            <button 
              type="submit"
              style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              บันทึกพัสดุ
            </button>
          </form>
        </div>

        {/* ตารางแสดงรายการพัสดุ */}
        <div style={{ backgroundColor: '#112240', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>📋 รายการพัสดุทั้งหมดในระบบ</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #2d3748', color: '#94a3b8' }}>
                <th style={{ padding: '12px' }}>เลขพัสดุ</th>
                <th style={{ padding: '12px' }}>ผู้รับ</th>
                <th style={{ padding: '12px' }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {parcels.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '12px', color: '#38bdf8', fontWeight: 'bold' }}>{item.id}</td>
                  <td style={{ padding: '12px' }}>{item.recipient}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ backgroundColor: '#065f46', color: '#34d399', padding: '4px 10px', borderRadius: '4px', fontSize: '12px' }}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
