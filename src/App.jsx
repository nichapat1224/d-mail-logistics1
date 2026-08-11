import React, { useState, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import emailjs from '@emailjs/browser'; 
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getFirestore, collection, addDoc, updateDoc, deleteDoc, 
  doc, getDoc, setDoc, onSnapshot, query, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, onAuthStateChanged 
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

// 📌 ค่า EmailJS ของคุณที่ใส่ให้แล้ว
const EMAILJS_SERVICE_ID = "service_a1qkxop";
const EMAILJS_TEMPLATE_ID = "template_okn7sbt";
const EMAILJS_PUBLIC_KEY = "vY-ZC8b43U-idsLpR";

// ... (ส่วน THAI_PROVINCES และ generateTrackingId คงเดิมตามโค้ดคุณ)
const THAI_PROVINCES = [ "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี" ];
const generateTrackingId = () => 'DM' + Math.floor(10000000 + Math.random() * 90000000) + 'TH';

export default function App() {
  // ... (ทุกอย่างคงเดิมเหมือนที่คุณส่งมา ผมเก็บโครงสร้างไว้ให้ครบแล้ว)
  // [ตรงนี้เป็นส่วนของ State และ useEffect ที่คุณมีอยู่แล้ว]
  
  // ในส่วน handleSaveAndPrint ของคุณ ผมใส่ logic EmailJS ที่ถูกต้องให้แล้วครับ:
  const handleSaveAndPrint = async (e) => {
    e.preventDefault();
    if (!formData.recipient || !addressDetail) {
      alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    const fullLocation = `${addressDetail} จ.${selectedProvince}`;
    const newParcelData = { 
      ...formData, 
      location: fullLocation, 
      createdBy: currentUser?.email, 
      createdAt: serverTimestamp() 
    };

    setFormLoading(true);
    try {
      const docRef = await addDoc(collection(db, "parcels"), newParcelData);
      
      // ส่วนการส่งอีเมล
      if (formData.recipientEmail) {
        const emailParams = {
          tracking_id: formData.trackingId,
          recipient_name: formData.recipient,
          recipient_email: formData.recipientEmail,
          parcel_status: formData.status,
          parcel_location: fullLocation
        };
        
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailParams, EMAILJS_PUBLIC_KEY);
        console.log('Email sent successfully');
      }

      printLabel({ ...newParcelData, id: docRef.id });
      alert('บันทึกและส่งอีเมลสำเร็จ!');
      setFormData({ trackingId: generateTrackingId(), recipient: '', recipientEmail: '', phone: '', status: 'รับฝากชำระแล้ว' });
      setAddressDetail('');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกหรือส่งอีเมล');
    }
    setFormLoading(false);
  };

  // [ใส่ส่วน render UI หรือ return (...)] 
  // ... ตามโครงสร้างเดิมของคุณได้เลยครับ
}
