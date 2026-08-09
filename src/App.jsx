import React, { useState } from 'react';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a192f', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif', color: '#e2e8f0' }}>
      <div style={{ backgroundColor: '#112240', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)', width: '400px', textAlign: 'center' }}>
        <div style={{ marginBottom: '20px' }}>
          <span style={{ fontSize: '24px' }}>●</span>
          <span style={{ fontSize: '14px', color: '#94a3b8', marginLeft: '10px' }}>ระบบจัดการและติดตามพัสดุ</span>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>D-MAIL LOGISTICS</h1>
        <p style={{ color: '#94a3b8', marginBottom: '30px' }}>กรุณาเข้าสู่ระบบเพื่อเข้าใช้งานแดชบอร์ด</p>

        <div style={{ textAlign: 'left', marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8' }}>อีเมลผู้ใช้งาน</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #2d3748', backgroundColor: '#0a192f', color: 'white', boxSizing: 'border-box' }} />
        </div>

        <div style={{ textAlign: 'left', marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8' }}>รหัสผ่าน</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #2d3748', backgroundColor: '#0a192f', color: 'white', boxSizing: 'border-box' }} />
        </div>

        <button style={{ width: '100%', padding: '12px', backgroundColor: '#0ea5e9', border: 'none', borderRadius: '5px', color: '#0a192f', fontWeight: 'bold', cursor: 'pointer' }}>เข้าสู่ระบบ</button>
        <p style={{ marginTop: '20px', color: '#94a3b8', fontSize: '14px' }}>ยังไม่มีบัญชีผู้ใช้? <a href="#" style={{ color: '#38bdf8' }}>ลงทะเบียนใหม่</a></p>
      </div>
    </div>
  );
}
