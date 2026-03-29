export interface VehicleOption {
  key: string;
  label_en: string;
  label_ko: string;
  label_ar: string;
  label_fr: string;
  label_sw: string;
  category: "driving" | "comfort" | "av" | "exterior";
}

export const vehicleOptions: VehicleOption[] = [
  // ─── DRIVING & SAFETY ────────────────────────────────────────────────
  { key: "four_wd", label_en: "Four-Wheel Drive", label_ko: "사륜구동", label_ar: "دفع رباعي", label_fr: "Quatre roues motrices", label_sw: "Gari la Nne za Magurudumu", category: "driving" },
  { key: "ldws", label_en: "Lane Departure Warning (LDWS)", label_ko: "차선이탈경고시스템", label_ar: "نظام تحذير مغادرة الحارة", label_fr: "Avertissement de sortie de voie", label_sw: "Mfumo wa Onyo la Kupotoka Njia", category: "driving" },
  { key: "sensor_front", label_en: "Front Detection Sensor", label_ko: "전방 감지 센서", label_ar: "حساس كشف أمامي", label_fr: "Capteur de détection avant", label_sw: "Kihisi cha Ugunduzi wa Mbele", category: "driving" },
  { key: "sensor_rear", label_en: "Rear Detection Sensor", label_ko: "후방 감지 센서", label_ar: "حساس كشف خلفي", label_fr: "Capteur de détection arrière", label_sw: "Kihisi cha Ugunduzi wa Nyuma", category: "driving" },
  { key: "aeb", label_en: "Automatic Emergency Braking (AEB)", label_ko: "자동 긴급 제동", label_ar: "الفرملة الطارئة التلقائية", label_fr: "Freinage d'urgence automatique", label_sw: "Kuvunja Dharura Otomatiki", category: "driving" },
  { key: "brake_lock", label_en: "Brake Lock Protection (ABS)", label_ko: "브레이크 잠김 방지 (ABS)", label_ar: "حماية من انغلاق الفرامل (ABS)", label_fr: "Protection anti-blocage (ABS)", label_sw: "Kinga ya Kufungwa kwa Breki (ABS)", category: "driving" },
  { key: "electronic_parking", label_en: "Electronic Parking Brake (EPB)", label_ko: "전자식 파킹 브레이크", label_ar: "فرملة وقوف إلكترونية", label_fr: "Frein de stationnement électronique", label_sw: "Breki ya Kuegesha Kielektroniki", category: "driving" },
  { key: "suspension_ctrl", label_en: "Electronically Controlled Suspension", label_ko: "전자제어 서스펜션", label_ar: "تعليق إلكتروني", label_fr: "Suspension à contrôle électronique", label_sw: "Usimamizi wa Msimamo Kielektroniki", category: "driving" },
  { key: "body_posture", label_en: "Body Posture Control (ESC)", label_ko: "차체자세제어장치 (ESC)", label_ar: "نظام التحكم في وضعية السيارة", label_fr: "Contrôle de posture (ESC)", label_sw: "Udhibiti wa Muundo wa Gari", category: "driving" },
  { key: "diff_lock", label_en: "Differential Limiter", label_ko: "차동제한장치", label_ar: "قافل التفاضل", label_fr: "Limiteur de différentiel", label_sw: "Kizuizi cha Differensheli", category: "driving" },
  { key: "anti_slip", label_en: "Anti-Slip (TCS)", label_ko: "미끄럼 방지 (TCS)", label_ar: "نظام منع الانزلاق", label_fr: "Anti-patinage (TCS)", label_sw: "Kuzuia Kuteleza (TCS)", category: "driving" },
  { key: "slope_hold", label_en: "Hill Hold Control", label_ko: "경사 밀림 방지", label_ar: "منع التدحرج على المنحدرات", label_fr: "Aide au démarrage en côte", label_sw: "Kuzuia Kutelezesha Mlimani", category: "driving" },
  { key: "tpms", label_en: "Tire Pressure Sensor (TPMS)", label_ko: "타이어 공기압 센서", label_ar: "مستشعر ضغط الإطارات", label_fr: "Capteur de pression des pneus", label_sw: "Kihisi cha Msukumo wa Tairi", category: "driving" },
  { key: "hud", label_en: "Head Up Display (HUD)", label_ko: "헤드업 디스플레이", label_ar: "شاشة عرض علوية", label_fr: "Affichage tête haute (HUD)", label_sw: "Onyesho la Juu (HUD)", category: "driving" },
  { key: "daytime_lights", label_en: "Daytime Running Lights (DRL)", label_ko: "주간 주행등 (DRL)", label_ar: "أضواء النهار", label_fr: "Feux de jour (DRL)", label_sw: "Taa za Mchana", category: "driving" },
  { key: "cruise_adjusted", label_en: "Adaptive Cruise Control (ACC)", label_ko: "어드밴스드 스마트 크루즈 컨트롤", label_ar: "تحكم تكيفي في السرعة الثابتة", label_fr: "Régulateur de vitesse adaptatif", label_sw: "Udhibiti wa Kasi wa Kujibadilisha", category: "driving" },
  { key: "cruise_general", label_en: "General Cruise Control", label_ko: "일반 크루즈 컨트롤", label_ar: "مثبت السرعة العام", label_fr: "Régulateur de vitesse standard", label_sw: "Udhibiti wa Kasi wa Kawaida", category: "driving" },
  { key: "gps", label_en: "GPS Tracking", label_ko: "GPS 추적", label_ar: "تتبع GPS", label_fr: "Suivi GPS", label_sw: "Ufuatiliaji wa GPS", category: "driving" },

  // ─── COMFORT & CONVENIENCE ───────────────────────────────────────────
  { key: "ecm_mirror", label_en: "Auto-Dimming Rear Mirror (ECM)", label_ko: "자동조광 룸미러 (ECM)", label_ar: "مرآة داخلية ذكية", label_fr: "Rétroviseur anti-éblouissement (ECM)", label_sw: "Kioo cha Nyuma cha Kujizima", category: "comfort" },
  { key: "smart_key", label_en: "Smart Key", label_ko: "스마트 키", label_ar: "مفتاح ذكي", label_fr: "Clé intelligente", label_sw: "Ufunguo wa Akili", category: "comfort" },
  { key: "stop_go", label_en: "Auto Stop/Go (ISG)", label_ko: "오토 스탑/고 (ISG)", label_ar: "توقف/تشغيل تلقائي", label_fr: "Arrêt/Démarrage automatique", label_sw: "Kusimama/Kwenda Otomatiki", category: "comfort" },
  { key: "sunroof", label_en: "Sunroof", label_ko: "선루프", label_ar: "فتحة سقف", label_fr: "Toit ouvrant", label_sw: "Sunrufu", category: "comfort" },
  { key: "panorama_sunroof", label_en: "Panoramic Sunroof", label_ko: "파노라마 선루프", label_ar: "فتحة سقف بانورامية", label_fr: "Toit panoramique", label_sw: "Sunrufu ya Panorama", category: "comfort" },
  { key: "aircon", label_en: "Air Conditioner", label_ko: "에어컨", label_ar: "مكيف هواء", label_fr: "Climatisation", label_sw: "Kiyoyozi", category: "comfort" },
  { key: "full_auto_aircon", label_en: "Full Auto Air Conditioner", label_ko: "풀 오토 에어컨", label_ar: "مكيف أوتوماتيكي كامل", label_fr: "Climatisation automatique", label_sw: "Kiyoyozi cha Otomatiki Kamili", category: "comfort" },
  { key: "auto_door_lock", label_en: "Auto Door Lock", label_ko: "자동 도어 잠금", label_ar: "قفل الأبواب التلقائي", label_fr: "Verrouillage automatique", label_sw: "Kufunga Mlango Otomatiki", category: "comfort" },
  { key: "auto_slide_door", label_en: "Automatic Sliding Door", label_ko: "자동 슬라이딩 도어", label_ar: "باب انزلاقي أوتوماتيكي", label_fr: "Porte coulissante automatique", label_sw: "Mlango wa Kuteleza Otomatiki", category: "comfort" },
  { key: "ghost_door", label_en: "Soft Close Door", label_ko: "소프트 클로즈 도어", label_ar: "إغلاق الأبواب الهادئ", label_fr: "Fermeture douce des portes", label_sw: "Mlango wa Kufunga Laini", category: "comfort" },
  { key: "auto_parking", label_en: "Automatic Parking System", label_ko: "자동 주차 시스템", label_ar: "نظام الانتظار التلقائي", label_fr: "Stationnement automatique", label_sw: "Mfumo wa Kuegesha Otomatiki", category: "comfort" },
  { key: "steering_elec", label_en: "Electric Power Steering", label_ko: "전동식 파워 스티어링", label_ar: "توجيه كهربائي", label_fr: "Direction assistée électrique", label_sw: "Usukani wa Umeme", category: "comfort" },
  { key: "folding_mirror", label_en: "Electric Folding Side Mirror", label_ko: "전동 폴딩 사이드미러", label_ar: "مرآة جانبية طوية كهربائية", label_fr: "Rétroviseur électrique rabattable", label_sw: "Kioo cha Kukunja Kielektroniki", category: "comfort" },
  { key: "rear_camera", label_en: "Rear View Camera", label_ko: "후방 카메라", label_ar: "كاميرا خلفية", label_fr: "Caméra de recul", label_sw: "Kamera ya Nyuma", category: "comfort" },
  { key: "front_camera", label_en: "Front View Camera", label_ko: "전방 카메라", label_ar: "كاميرا أمامية", label_fr: "Caméra frontale", label_sw: "Kamera ya Mbele", category: "comfort" },
  { key: "around_view", label_en: "360° Around View Monitor", label_ko: "어라운드 뷰 모니터", label_ar: "شاشة رؤية 360°", label_fr: "Caméra 360°", label_sw: "Kamera ya Pembe Zote 360°", category: "comfort" },
  { key: "remote_start", label_en: "Remote Start", label_ko: "원격 시동", label_ar: "بدء تشغيل عن بُعد", label_fr: "Démarrage à distance", label_sw: "Kuanzisha kwa Mbali", category: "comfort" },
  { key: "wireless_charge", label_en: "Wireless Charging", label_ko: "무선 충전", label_ar: "شحن لاسلكي", label_fr: "Chargement sans fil", label_sw: "Kuchaji bila Waya", category: "comfort" },
  { key: "wireless_door", label_en: "Wireless Door Lock", label_ko: "무선 도어 잠금", label_ar: "قفل أبواب لاسلكي", label_fr: "Verrouillage sans fil", label_sw: "Kufunga Mlango bila Waya", category: "comfort" },
  { key: "power_window", label_en: "Power Window", label_ko: "파워 윈도우", label_ar: "نوافذ كهربائية", label_fr: "Vitres électriques", label_sw: "Madirisha ya Nguvu", category: "comfort" },
  { key: "power_trunk", label_en: "Power Trunk / Boot", label_ko: "파워 트렁크", label_ar: "غطاء صندوق كهربائي", label_fr: "Coffre électrique", label_sw: "Sanduku la Nguvu", category: "comfort" },
  { key: "electric_seat_front", label_en: "Electric Front Seat Adjustment", label_ko: "전동 앞좌석 조절", label_ar: "تعديل المقعد الأمامي كهربائياً", label_fr: "Siège avant électrique", label_sw: "Kiti cha Mbele cha Umeme", category: "comfort" },
  { key: "electric_seat_rear", label_en: "Electric Rear Seat Adjustment", label_ko: "전동 뒷좌석 조절", label_ar: "تعديل المقعد الخلفي كهربائياً", label_fr: "Siège arrière électrique", label_sw: "Kiti cha Nyuma cha Umeme", category: "comfort" },
  { key: "memory_seat", label_en: "Memory Seat (Driver)", label_ko: "메모리 시트 (운전석)", label_ar: "مقعد ذاكرة (السائق)", label_fr: "Siège à mémoire (conducteur)", label_sw: "Kiti cha Kumbukumbu", category: "comfort" },
  { key: "heated_seat_front", label_en: "Heated Front Seat", label_ko: "열선 앞좌석", label_ar: "مقعد أمامي مدفأ", label_fr: "Siège avant chauffant", label_sw: "Kiti cha Mbele chenye Joto", category: "comfort" },
  { key: "heated_seat_rear", label_en: "Heated Rear Seat", label_ko: "열선 뒷좌석", label_ar: "مقعد خلفي مدفأ", label_fr: "Siège arrière chauffant", label_sw: "Kiti cha Nyuma chenye Joto", category: "comfort" },
  { key: "ventilation_front", label_en: "Ventilated Front Seat", label_ko: "통풍 앞좌석", label_ar: "مقعد أمامي مهوّى", label_fr: "Siège avant ventilé", label_sw: "Kiti cha Mbele chenye Uingizaji Hewa", category: "comfort" },
  { key: "ventilation_rear", label_en: "Ventilated Rear Seat", label_ko: "통풍 뒷좌석", label_ar: "مقعد خلفي مهوّى", label_fr: "Siège arrière ventilé", label_sw: "Kiti cha Nyuma chenye Uingizaji Hewa", category: "comfort" },
  { key: "massage_seat", label_en: "Massage Seat", label_ko: "마사지 시트", label_ar: "مقعد مساج", label_fr: "Siège massage", label_sw: "Kiti cha Masaji", category: "comfort" },
  { key: "air_purifier", label_en: "Air Purifier", label_ko: "공기청정기", label_ar: "منقي الهواء", label_fr: "Purificateur d'air", label_sw: "Kisafishaji Hewa", category: "comfort" },
  { key: "rain_sensor", label_en: "Rain Sensor Wiper", label_ko: "레인 센서 와이퍼", label_ar: "ماسحة بمستشعر المطر", label_fr: "Essuie-glace à détection pluie", label_sw: "Kipangusa cha Kihisi cha Mvua", category: "comfort" },
  { key: "electric_sunshade", label_en: "Electric Sunshade", label_ko: "전동 선쉐이드", label_ar: "ظلال شمسية كهربائية", label_fr: "Pare-soleil électrique", label_sw: "Kivuli cha Jua cha Umeme", category: "comfort" },
  { key: "autolight", label_en: "Auto Light Sensor", label_ko: "오토라이트", label_ar: "إضاءة تلقائية", label_fr: "Lumières automatiques", label_sw: "Taa Otomatiki", category: "comfort" },
  { key: "alarm", label_en: "Burglar Alarm", label_ko: "도난 경보기", label_ar: "إنذار السطو", label_fr: "Alarme anti-vol", label_sw: "Kengele ya Wizi", category: "comfort" },
  { key: "trip_computer", label_en: "Trip Computer", label_ko: "트립 컴퓨터", label_ar: "حاسبة الرحلة", label_fr: "Ordinateur de bord", label_sw: "Kompyuta ya Safari", category: "comfort" },
  { key: "airbag_driver", label_en: "Driver Airbag", label_ko: "운전석 에어백", label_ar: "وسادة هوائية للسائق", label_fr: "Airbag conducteur", label_sw: "Mfuko wa Hewa wa Dereva", category: "comfort" },
  { key: "airbag_passenger", label_en: "Passenger Airbag", label_ko: "동승석 에어백", label_ar: "وسادة هوائية للراكب", label_fr: "Airbag passager", label_sw: "Mfuko wa Hewa wa Abiria", category: "comfort" },
  { key: "airbag_side", label_en: "Side Airbag", label_ko: "사이드 에어백", label_ar: "وسادة هوائية جانبية", label_fr: "Airbag latéral", label_sw: "Mfuko wa Hewa wa Pembeni", category: "comfort" },
  { key: "airbag_curtain", label_en: "Curtain Airbag", label_ko: "커튼 에어백", label_ar: "وسادة هوائية ستارة", label_fr: "Airbag rideau", label_sw: "Mfuko wa Hewa wa Mapazia", category: "comfort" },
  { key: "airbag_occupant", label_en: "Occupant Sensing Airbag", label_ko: "탑승자 감지 에어백", label_ar: "وسادة هوائية تحسس الركاب", label_fr: "Airbag à détection d'occupant", label_sw: "Mfuko wa Hewa wa Kuhisi Abiria", category: "comfort" },
  { key: "rear_side_alarm", label_en: "Rear Side Alarm System (BSD)", label_ko: "후측방 경보 시스템 (BSD)", label_ar: "نظام إنذار الجانب الخلفي", label_fr: "Alerte angle mort (BSD)", label_sw: "Mfumo wa Onyo la Nyuma", category: "comfort" },
  { key: "electric_step", label_en: "Electric Side Step", label_ko: "전동 사이드 스텝", label_ar: "درجة جانبية كهربائية", label_fr: "Marchepied électrique", label_sw: "Hatua ya Pembeni ya Umeme", category: "comfort" },
  { key: "handle_remote", label_en: "Handle Remote Control", label_ko: "핸들 리모컨", label_ar: "تحكم عن بُعد بالمقود", label_fr: "Télécommande au volant", label_sw: "Udhibiti wa Usukani kwa Mbali", category: "comfort" },
  { key: "paddle_shift", label_en: "Paddle Shift", label_ko: "패들 시프트", label_ar: "تحويل بالإبهام (Paddle Shift)", label_fr: "Palettes au volant", label_sw: "Kubadilisha Gia kwa Mkono", category: "comfort" },
  { key: "navigation", label_en: "Navigation System", label_ko: "내비게이션", label_ar: "نظام الملاحة", label_fr: "Système de navigation", label_sw: "Mfumo wa Uelekezaji", category: "comfort" },
  { key: "blackbox", label_en: "Black Box (Dashcam)", label_ko: "블랙박스", label_ar: "كاميرا لوحة عدادات (بلاك بوكس)", label_fr: "Boîte noire (dashcam)", label_sw: "Sanduku Jeusi (Kamera ya Gari)", category: "comfort" },
  { key: "supervision", label_en: "Super Vision Instrument Board", label_ko: "슈퍼 비전 계기판", label_ar: "لوحة أدوات Super Vision", label_fr: "Tableau de bord Super Vision", label_sw: "Ubao wa Vyombo wa Super Vision", category: "comfort" },

  // ─── AUDIO / VISUAL ──────────────────────────────────────────────────
  { key: "bluetooth", label_en: "Bluetooth", label_ko: "블루투스", label_ar: "بلوتوث", label_fr: "Bluetooth", label_sw: "Bluetooth", category: "av" },
  { key: "usb", label_en: "USB Terminal", label_ko: "USB 단자", label_ar: "منفذ USB", label_fr: "Port USB", label_sw: "Bandari ya USB", category: "av" },
  { key: "aux", label_en: "AUX Terminal", label_ko: "AUX 단자", label_ar: "مدخل AUX", label_fr: "Entrée AUX", label_sw: "Bandari ya AUX", category: "av" },
  { key: "av_system", label_en: "AV System", label_ko: "AV 시스템", label_ar: "نظام AV", label_fr: "Système AV", label_sw: "Mfumo wa AV", category: "av" },
  { key: "cd_player", label_en: "CD Player", label_ko: "CD 플레이어", label_ar: "مشغل CD", label_fr: "Lecteur CD", label_sw: "Kichezaji cha CD", category: "av" },
  { key: "dvd", label_en: "DVD Player", label_ko: "DVD 플레이어", label_ar: "مشغل DVD", label_fr: "Lecteur DVD", label_sw: "Kichezaji cha DVD", category: "av" },
  { key: "mp3", label_en: "MP3 Player", label_ko: "MP3 플레이어", label_ar: "مشغل MP3", label_fr: "Lecteur MP3", label_sw: "Kichezaji cha MP3", category: "av" },
  { key: "dmb", label_en: "DMB (Digital TV)", label_ko: "DMB (디지털 TV)", label_ar: "تلفزيون رقمي DMB", label_fr: "TV numérique DMB", label_sw: "Televisheni ya DMB", category: "av" },
  { key: "rear_monitor", label_en: "Rear Seat Monitor", label_ko: "뒷좌석 모니터", label_ar: "شاشة المقعد الخلفي", label_fr: "Écran siège arrière", label_sw: "Mfuatiliaji wa Kiti cha Nyuma", category: "av" },
  { key: "front_monitor", label_en: "Front Seat Monitor", label_ko: "앞좌석 모니터", label_ar: "شاشة المقعد الأمامي", label_fr: "Écran siège avant", label_sw: "Mfuatiliaji wa Kiti cha Mbele", category: "av" },
  { key: "smartphone_mirror", label_en: "Smartphone Mirroring (Android/Apple)", label_ko: "스마트폰 미러링", label_ar: "عكس الشاشة (أندرويد/أبل)", label_fr: "Miroir smartphone (Android/Apple)", label_sw: "Kuakisi Simu (Android/Apple)", category: "av" },
  { key: "amplifier", label_en: "Amplifier", label_ko: "앰프", label_ar: "مكبر صوت", label_fr: "Amplificateur", label_sw: "Kiimarisha Sauti", category: "av" },
  { key: "woofer", label_en: "Subwoofer", label_ko: "서브우퍼", label_ar: "مضخم صوت منخفض", label_fr: "Caisson de basses", label_sw: "Spika ya Sauti za Chini", category: "av" },
  { key: "tuning_speaker", label_en: "Premium Tuning Speaker", label_ko: "프리미엄 튜닝 스피커", label_ar: "مكبر صوت متميز", label_fr: "Enceinte premium", label_sw: "Spika ya Ubora wa Juu", category: "av" },

  // ─── EXTERIOR & STYLE ────────────────────────────────────────────────
  { key: "hid_lamp", label_en: "HID Lamp", label_ko: "HID 램프", label_ar: "مصباح HID", label_fr: "Feux HID", label_sw: "Taa ya HID", category: "exterior" },
  { key: "led_lamp", label_en: "LED Headlamp", label_ko: "LED 헤드램프", label_ar: "مصباح أمامي LED", label_fr: "Feux avant LED", label_sw: "Taa ya LED ya Mbele", category: "exterior" },
  { key: "led_rear", label_en: "LED Rear Lamp", label_ko: "LED 후미등", label_ar: "مصباح خلفي LED", label_fr: "Feux arrière LED", label_sw: "Taa ya LED ya Nyuma", category: "exterior" },
  { key: "xenon", label_en: "Xenon Lamp", label_ko: "제논 램프", label_ar: "مصباح زينون", label_fr: "Feux xénon", label_sw: "Taa ya Xenon", category: "exterior" },
  { key: "adaptive_headlamp", label_en: "Adaptive Headlamps (AFS)", label_ko: "어댑티브 헤드램프 (AFS)", label_ar: "مصابيح تكيفية", label_fr: "Feux adaptatifs (AFS)", label_sw: "Taa za Kubadilika (AFS)", category: "exterior" },
  { key: "high_beam_assist", label_en: "High Beam Assist (HBA)", label_ko: "하이빔 어시스트 (HBA)", label_ar: "مساعد الضوء العالي", label_fr: "Feux de route automatiques", label_sw: "Msaada wa Mwanga wa Juu", category: "exterior" },
  { key: "leather_seat", label_en: "Leather Seat", label_ko: "가죽 시트", label_ar: "مقاعد جلدية", label_fr: "Sièges en cuir", label_sw: "Kiti cha Ngozi", category: "exterior" },
  { key: "bucket_seat", label_en: "Bucket Seat", label_ko: "버킷 시트", label_ar: "مقعد كرسي", label_fr: "Siège baquet", label_sw: "Kiti cha Baketi", category: "exterior" },
  { key: "aluminum_wheel", label_en: "Alloy / Aluminum Wheel", label_ko: "알루미늄 휠", label_ar: "جنط ألومنيوم", label_fr: "Jantes en alliage", label_sw: "Gurudumu la Alumini", category: "exterior" },
  { key: "chrome_wheel", label_en: "Chrome Wheel", label_ko: "크롬 휠", label_ar: "جنط كروم", label_fr: "Jantes chromées", label_sw: "Gurudumu la Kromi", category: "exterior" },
  { key: "wide_tire", label_en: "Wide Tire", label_ko: "와이드 타이어", label_ar: "إطارات واسعة", label_fr: "Pneus larges", label_sw: "Tairi Pana", category: "exterior" },
  { key: "rear_spoiler", label_en: "Rear Spoiler", label_ko: "리어 스포일러", label_ar: "مكسر الهواء الخلفي", label_fr: "Becquet arrière", label_sw: "Spoila ya Nyuma", category: "exterior" },
  { key: "wood_grain", label_en: "Wood Grain Interior", label_ko: "우드그레인 내장", label_ar: "تشطيبات خشبية داخلية", label_fr: "Décors en bois", label_sw: "Mapambo ya Mbao Ndani", category: "exterior" },
  { key: "metal_grain", label_en: "Metal Grain / Metallic Trim", label_ko: "메탈그레인 트림", label_ar: "تشطيبات معدنية", label_fr: "Décors métalliques", label_sw: "Mapambo ya Chuma", category: "exterior" },
  { key: "tinting", label_en: "Window Tinting", label_ko: "윈도우 틴팅", label_ar: "تعتيم النوافذ", label_fr: "Vitrage teinté", label_sw: "Kutiwa Giza Madirisha", category: "exterior" },
  { key: "bumper_guard", label_en: "Bumper Guard", label_ko: "범퍼 가드", label_ar: "حاجز الصدام", label_fr: "Protection de pare-chocs", label_sw: "Kinga ya Bumper", category: "exterior" },
  { key: "strut_bar", label_en: "Strut Bar", label_ko: "스트럿 바", label_ar: "بار الدعامة", label_fr: "Barre de train avant", label_sw: "Fimbo ya Strut", category: "exterior" },
  { key: "ambient_light", label_en: "Ambient Interior Lighting", label_ko: "앰비언트 라이트", label_ar: "إضاءة داخلية محيطية", label_fr: "Éclairage intérieur ambiant", label_sw: "Mwanga wa Ndani wa Mazingira", category: "exterior" },
  { key: "air_dam", label_en: "Air Dam / Front Lip", label_ko: "에어댐", label_ar: "حاجز هوائي أمامي", label_fr: "Spoiler avant", label_sw: "Kifungo cha Hewa cha Mbele", category: "exterior" },
  { key: "refrigerator", label_en: "In-Car Refrigerator", label_ko: "차량 냉장고", label_ar: "ثلاجة داخل السيارة", label_fr: "Réfrigérateur de bord", label_sw: "Friji ya Gari", category: "exterior" },
  { key: "roof_rack", label_en: "Roof Rack / Carrier", label_ko: "루프 랙/캐리어", label_ar: "حامل سقف", label_fr: "Galerie de toit", label_sw: "Reki ya Paa", category: "exterior" },
];

export type OptionCategory = "driving" | "comfort" | "av" | "exterior";

export const optionsByCategory = (category: OptionCategory) =>
  vehicleOptions.filter((o) => o.category === category);

export const getLabelForOption = (opt: VehicleOption, lang: string): string => {
  switch (lang) {
    case "ko": return opt.label_ko;
    case "ar": return opt.label_ar;
    case "fr": return opt.label_fr;
    case "sw": return opt.label_sw;
    default: return opt.label_en;
  }
};
