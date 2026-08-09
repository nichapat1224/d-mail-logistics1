createdAt: serverTimestamp()
    };

    setFormLoading(true);
    try {
      await addDoc(collection(db, "parcels"), newParcelData);
      showToast('🎉 บันทึกรายการพัสดุและส่งแจ้งเตือน Discord สำเร็จ!');
      
      await sendDiscordNotification('🚨 มีพัสดุเข้าระบบใหม่ (D-Mail)', {
        ...newParcelData,
        phone: formData.phone || 'ไม่ระบุ'
      }, 3447003);

      printLabel(newParcelData);

      setFormData({
        trackingId: generateTrackingId(),
        recipient: '',
        phone: '',
        status: 'รับฝากชำระแล้ว'
      });
      setAddressDetail('');
    } catch (error) {
      console.error("Error saving parcel:", error);
      showToast('❌ เกิดข้อผิดพลาดในการบันทึกข้อมูลพัสดุ');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    if (userRole !== 'Admin') {
      showToast('❌ เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่เปลี่ยนสถานะได้');
      return;
    }
    try {
      const parcelRef = doc(db, "parcels", id);
      const parcelSnap = await getDoc(parcelRef);
      if (!parcelSnap.exists()) return;

      const parcelData = parcelSnap.data();
      await updateDoc(parcelRef, { 
        status: newStatus,
        updatedAt: serverTimestamp() 
      });

      showToast(`🔄 อัปเดตสถานะเป็น [${newStatus}] สำเร็จ`);
      
      await sendDiscordNotification(`🔄 อัปเดตสถานะพัสดุ: ${newStatus}`, {
        ...parcelData,
        status: newStatus
      }, 15844367);
    } catch (error) {
      console.error("Error updating status:", error);
      showToast('❌ ไม่สามารถอัปเดตสถานะได้');
    }
  };

  const handleDeleteParcel = async (id) => {
    if (userRole !== 'Admin') {
      showToast('❌ เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่ลบข้อมูลได้');
      return;
    }
    if (!window.confirm('คุณต้องการลบรายการพัสดุตารางนี้ใช่หรือไม่?')) return;

    try {
      await deleteDoc(doc(db, "parcels", id));
      showToast('🗑️ ลบรายการพัสดุสำเร็จ');
    } catch (error) {
      console.error("Error deleting parcel:", error);
      showToast('❌ ไม่สามารถลบรายการได้');
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#38bdf8', fontFamily: 'sans-serif' }}>
        <h2>กำลังโหลดระบบ D-MAIL LOGISTICS...</h2>
      </div>
    );
  }

  // หน้าเลือก Role (กรณีบัญชียังไม่มี Role ใน Firestore)
  if (currentUser && showRoleSelector) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif', color: '#f8fafc' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '40px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', width: '100%', maxWidth: '420px', textAlign: 'center', border: '1px solid #334155' }}>
          <h2 style={{ color: '#38bdf8', marginBottom: '10px' }}>เลือกสิทธิ์การใช้งาน</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '30px' }}>บัญชีของคุณยังไม่ได้กำหนดสิทธิ์ กรุณาเลือกบทบาทที่ต้องการใช้งาน:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button 
              onClick={() => handleSelectRole('Admin')}
              style={{ padding: '16px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
            >
              👑 ผู้ดูแลระบบ (Admin)
            </button>
            <button 
              onClick={() => handleSelectRole('User')}
              style={{ padding: '16px', backgroundColor: '#475569', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
            >
              👤 ผู้ใช้งานทั่วไป (User)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // หน้า Login / Register
  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif', color: '#f8fafc', padding: '20px' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '40px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', width: '100%', maxWidth: '420px', border: '1px solid #334155' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#38bdf8', margin: '0 0 8px 0' }}>D-MAIL LOGISTICS</h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>ระบบบริหารจัดการพัสดุด่วนและใบปะหน้าอัจฉริยะ</p>
          </div>

          {authError && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>อีเมล</label>
              <input 
                type="email" 
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>รหัสผ่าน</label>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            {isRegistering && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>ยืนยันรหัสผ่าน</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <button 
              type="submit"
              style={{ marginTop: '10px', padding: '14px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
            >
              {isRegistering ? 'ลงทะเบียนสมาชิก' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }}
              style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isRegistering ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบที่นี่' : 'ยังไม่มีบัญชี? สมัครสมาชิกใหม่'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard หลักหลัง Login สำเร็จ
  const filteredParcels = parcels.filter(item => {
    const matchSearch = item.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.phone && item.phone.includes(searchTerm));
    const matchStatus = statusFilter === 'ทั้งหมด' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'sans-serif', paddingBottom: '50px' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: '#334155', color: '#38bdf8', border: '1px solid #0284c7', padding: '14px 24px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)', zIndex: 9999, fontWeight: 'bold', animation: 'fadeIn 0.3s' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <header style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '10px' }}>
            📦 D-MAIL LOGISTICS <span style={{ fontSize: '12px', backgroundColor: userRole === 'Admin' ? '#0284c7' : '#475569', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>{userRole}</span>
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>ผู้ใช้งาน: {currentUser.email}</p>
        </div>
        <button 
          onClick={handleLogout}
          style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
        >
          ออกจากระบบ
        </button>
      </header>

      <main style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* ฟอร์มเพิ่มพัสดุเฉพาะ Admin */}
        {userRole === 'Admin' ? (
          <div style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#38bdf8', fontSize: '18px' }}>➕ สร้างรายการพัสดุใหม่ & พิมพ์ใบปะหน้า</h3>
            <form onSubmit={handleSaveAndPrint} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Tracking ID (Auto)</label>
                  <input 
                    type="text" 
                    readOnly
                    value={formData.trackingId}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#38bdf8', fontWeight: 'bold', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>ชื่อผู้รับ</label>
                  <input 
                    type="text" 
                    required
                    placeholder="ระบุชื่อ-นามสกุล ผู้รับ"
                    value={formData.recipient}
                    onChange={(e) => setFormData({...formData, recipient: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>เบอร์โทรศัพท์</label>
                  <input 
                    type="text" 
                    placeholder="0812345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>จังหวัดปลายทาง</label>
                  <select 
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', boxSizing: 'border-box' }}
                  >
                    {THAI_PROVINCES.map((prov, idx) => (
                      <option key={idx} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>ที่อยู่รายละเอียด (บ้านเลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="เช่น 99/9 ถ.สุขุมวิท แขวงคลองเตย"
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={formLoading}
                style={{ padding: '14px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', opacity: formLoading ? 0.7 : 1 }}
              >
                {formLoading ? 'กำลังบันทึกข้อมูล...' : '💾 บันทึกข้อมูล ส่ง Discord และพิมพ์ใบปะหน้า'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ backgroundColor: '#1e293b', padding: '20px 30px', borderRadius: '16px', border: '1px solid #334155', textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#94a3b8' }}>💡 คุณเข้าสู่ระบบในฐานะ **User** สามารถตรวจสอบสถานะพัสดุและค้นหาข้อมูลพัสดุได้ แต่ไม่สามารถเพิ่ม/แก้ไขข้อมูลพัสดุได้</p>
          </div>
        )}

        {/* ส่วนตารางรายการพัสดุ */}
        <div style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px' }}>📋 รายการพัสดุทั้งหมดในระบบ ({filteredParcels.length})</h3>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="🔍 ค้นหา Tracking, ผู้รับ, เบอร์โทร"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', fontSize: '14px', width: '240px' }}
              />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', fontSize: '14px' }}
              >
                <option value="ทั้งหมด">สถานะ: ทั้งหมด</option>
                <option value="รับฝากชำระแล้ว">รับฝากชำระแล้ว</option>
                <option value="กำลังจัดส่ง">กำลังจัดส่ง</option>
                <option value="จัดส่งสำเร็จ">จัดส่งสำเร็จ</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '12px' }}>Tracking ID</th>
                  <th style={{ padding: '12px' }}>ผู้รับ & เบอร์โทร</th>
                  <th style={{ padding: '12px' }}>ปลายทาง</th>
                  <th style={{ padding: '12px' }}>สถานะ</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>จัดการ / พิมพ์</th>
                </tr>
              </thead>
              <tbody>
                {filteredParcels.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>ไม่พบข้อมูลพัสดุในระบบ</td>
                  </tr>
                ) : (
                  filteredParcels.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '14px', color: '#38bdf8', fontWeight: 'bold' }}>{item.trackingId}</td>
                      <td style={{ padding: '14px' }}>
                        <div>{item.recipient}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.phone || 'ไม่ระบุเบอร์'}</div>
                      </td>
                      <td style={{ padding: '14px', maxWidth: '250px', wordBreak: 'break-word' }}>{item.location}</td>
                      <td style={{ padding: '14px' }}>
                        {userRole === 'Admin' ? (
                          <select 
                            value={item.status}
                            onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#38bdf8', fontSize: '13px' }}
                          >
                            <option value="รับฝากชำระแล้ว">รับฝากชำระแล้ว</option>
                            <option value="กำลังจัดส่ง">กำลังจัดส่ง</option>
                            <option value="จัดส่งสำเร็จ">จัดส่งสำเร็จ</option>
                          </select>
                        ) : (
                          <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: '#334155', fontSize: '12px', color: '#38bdf8' }}>
                            {item.status}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <button 
                            onClick={() => printLabel(item)}
                            title="พิมพ์ใบปะหน้า"
                            style={{ padding: '6px 12px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                          >
                            🖨️ พิมพ์
                          </button>
                          {userRole === 'Admin' && (
                            <button 
                              onClick={() => handleDeleteParcel(item.id)}
                              title="ลบรายการ"
                              style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                            >
                              🗑️
                            </button>
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

      </main>
    </div>
  );
}
