import React, { useState } from 'react';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    // พื้นหลังสีน้ำเงินเข้มมาก
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#081028', // ปรับสีให้เข้มขึ้นอีกนิด
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      fontFamily: 'Sarabun, sans-serif', // ฟอนต์ภาษาไทย
      color: '#f0f9ff' // สีข้อความหลักเป็นสีขาวสว่าง
    }}>
      {
        /* กล่อง Login สีน้ำเงินเข้ม */
      }
      <div style={{ 
        backgroundColor: '#112240', 
        padding: '40px', 
        borderRadius: '12px', 
        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)', 
        width: '420px',
        textAlign: 'center'
      }}>
        {
          /* แถบสถานะระบบ */
        }
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          marginBottom: '20px'
        }}>
          <span style={{ 
            backgroundColor: '#0d9488', 
            borderRadius: '50%', 
            width: '12px', 
            height: '12px',
            marginRight: '8px'
          }}></span>
          <span style={{ fontSize: '14px', color: '#94a3b8' }}>ระบบจัดการและติดตามพัสดุ</span>
        </div>

        {
          /* ชื่อระบบ D-MAIL LOGISTICS */
        }
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 10px 0', letterSpacing: '1px' }}>
          <span style={{ color: '#e0f2fe' }}>D-MAIL</span> 
          <span style={{ color: '#38bdf8' }}> LOGISTICS</span>
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '35px', fontSize: '16px' }}>กรุณาเข้าสู่ระบบเพื่อเข้าใช้งานแดชบอร์ด</p>

        {
          /* ฟอร์ม Login - ปรับสีข้อความใน Label ให้ชัดเจนขึ้น */
        }
        <div style={{ textAlign: 'left', marginBottom: '20px' }}>
          <label style={{ color: '#e0f2fe', display: 'block', marginBottom: '8px', fontWeight: '500' }}>อีเมลผู้ใช้งาน</label>
          <input 
            type="email" 
            placeholder="admin@gmail.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '15px', 
              borderRadius: '8px', 
              border: '1px solid #2d3748', 
              backgroundColor: '#050c20', // สีช่อง Input เข้ม
              color: 'white', // ข้อความในช่องพิมพ์สีขาว
              fontSize: '16px',
              boxSizing: 'border-box',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#38bdf8'}
            onBlur={(e) => e.target.style.borderColor = '#2d3748'}
          />
        </div>

        <div style={{ textAlign: 'left', marginBottom: '30px' }}>
          <label style={{ color: '#e0f2fe', display: 'block', marginBottom: '8px', fontWeight: '500' }}>รหัสผ่าน</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '15px', 
              borderRadius: '8px', 
              border: '1px solid #2d3748', 
              backgroundColor: '#050c20', 
              color: 'white',
              fontSize: '16px',
              boxSizing: 'border-box',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#38bdf8'}
            onBlur={(e) => e.target.style.borderColor = '#2d3748'}
          />
        </div>

        {
          /* ปุ่มเข้าสู่ระบบ สีฟ้าสดใส */
        }
        <button 
          onClick={() => alert('เข้าสู่ระบบแล้ว')}
          style={{ 
            width: '100%', 
            padding: '16px', 
            borderRadius: '8px', 
            border: 'none', 
            backgroundColor: '#0ea5e9', 
            color: '#081028', // สีตัวอักษรบนปุ่มเข้ม
            fontSize: '18px', 
            fontWeight: 'bold', 
            cursor: 'pointer', 
            marginBottom: '25px',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#38bdf8'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#0ea5e9'}
        >
          เข้าสู่ระบบ
        </button>

        {
          /* ลิงก์สมัครสมาชิก */
        }
        <div style={{ color: '#94a3b8', fontSize: '14px' }}>
          ยังไม่มีบัญชีผู้ใช้? <a href="#" style={{ color: '#38bdf8', textDecoration: 'none' }}>ลงทะเบียนใหม่</a>
        </div>
      </div>
    </div>
  );
}
