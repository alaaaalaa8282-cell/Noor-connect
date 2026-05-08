import { useEffect, useRef, useState } from 'react';

const KAABA = { lat: 21.4225, lon: 39.8262 };

function calcQiblaBearing(lat: number, lon: number): number {
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (KAABA.lat * Math.PI) / 180;
  const Δλ = ((KAABA.lon - lon) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function calcDistance(lat: number, lon: number): number {
  const R = 6371;
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (KAABA.lat * Math.PI) / 180;
  const Δφ = ((KAABA.lat - lat) * Math.PI) / 180;
  const Δλ = ((KAABA.lon - lon) * Math.PI) / 180;
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function fmtDistance(km: number): string {
  if (km < 1) return `${Math.round(km*1000)} م`;
  if (km < 10) return `${km.toFixed(1)} كم`;
  return `${Math.round(km).toLocaleString()} كم`;
}

const QiblaCompassModern = () => {
  const [status, setStatus] = useState<'loading'|'ready'|'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [qiblaBearing, setQiblaBearing] = useState<number|null>(null);
  const [distance, setDistance] = useState<number|null>(null);
  const [heading, setHeading] = useState<number|null>(null);
  const [aligned, setAligned] = useState(false);
  const smoothRef = useRef<number|null>(null);
  const cleanupRef = useRef<(()=>void)|null>(null);

  const startCompass = () => {
    if (cleanupRef.current) cleanupRef.current();
    const handler = (e: DeviceOrientationEvent) => {
      const ev = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
      let raw: number|null = null;
      if (typeof ev.webkitCompassHeading === 'number' && !isNaN(ev.webkitCompassHeading)) {
        raw = ev.webkitCompassHeading;
      } else if (typeof ev.alpha === 'number' && !isNaN(ev.alpha)) {
        raw = (360 - ev.alpha + 360) % 360;
      }
      if (raw === null) return;
      const prev = smoothRef.current;
      let smooth = raw;
      if (prev !== null) {
        let diff = raw - prev;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        smooth = (prev + diff * 0.15 + 360) % 360;
      }
      smoothRef.current = smooth;
      setHeading(smooth);
    };
    window.addEventListener('deviceorientationabsolute', handler as EventListener, true);
    window.addEventListener('deviceorientation', handler as EventListener, true);
    cleanupRef.current = () => {
      window.removeEventListener('deviceorientationabsolute', handler as EventListener, true);
      window.removeEventListener('deviceorientation', handler as EventListener, true);
    };
  };

  const getLocation = () => {
    setStatus('loading');
    setErrorMsg('');
    const onSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      setQiblaBearing(calcQiblaBearing(latitude, longitude));
      setDistance(calcDistance(latitude, longitude));
      setStatus('ready');
      startCompass();
    };
    const onError = () => {
      setQiblaBearing(calcQiblaBearing(30.0444, 31.2357));
      setDistance(calcDistance(30.0444, 31.2357));
      setErrorMsg('تعذّر تحديد موقعك — يتم عرض اتجاه القاهرة تقريباً');
      setStatus('ready');
      startCompass();
    };
    try {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy: true, timeout: 10000, maximumAge: 60000,
      });
    } catch { onError(); }
  };

  useEffect(() => {
    if (heading === null || qiblaBearing === null) return;
    let diff = Math.abs(heading - qiblaBearing);
    if (diff > 180) diff = 360 - diff;
    const isAligned = diff < 8;
    setAligned(isAligned);
    if (isAligned && 'vibrate' in navigator) navigator.vibrate([80,40,80]);
  }, [heading, qiblaBearing]);

  useEffect(() => {
    getLocation();
    return () => { if (cleanupRef.current) cleanupRef.current(); };
  }, []);

  const dialRotation = heading !== null && qiblaBearing !== null ? -heading + qiblaBearing : 0;
  const hasCompass = heading !== null;

  if (status === 'loading') {
    return (
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',
        justifyContent:'center',height:'100%',gap:16,background:'#fdf5e6'}}>
        <div style={{width:56,height:56,borderRadius:'50%',
          border:'4px solid #f5e6d3',borderTopColor:'#b8860b',
          animation:'spin 1s linear infinite'}} />
        <p style={{color:'#8b7355',fontSize:14,fontFamily:'system-ui'}}>
          جاري تحديد موقعك...
        </p>
      </div>
    );
  }

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',
      minHeight:'100%',background:'#fdf5e6',padding:'16px 16px 32px',
      gap:16,overflowY:'auto'}}>

      <div style={{textAlign:'center',paddingTop:8}}>
        <p style={{color:'#b8860b',fontSize:11,letterSpacing:'0.25em',
          fontWeight:700,margin:0,fontFamily:'system-ui'}}>اتجاه القبلة</p>
        <p style={{color:'#2c2416',fontSize:52,fontWeight:800,
          margin:'4px 0',fontFamily:'system-ui',lineHeight:1}}>
          {qiblaBearing !== null ? `${Math.round(qiblaBearing)}°` : '--'}
        </p>
        {distance !== null && (
          <p style={{color:'#8b7355',fontSize:13,margin:0,fontFamily:'system-ui'}}>
            🕋 {fmtDistance(distance)} من الكعبة المشرفة
          </p>
        )}
      </div>

      <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%'}}>
        <div style={{position:'relative',width:'min(82vw, 340px)',height:'min(82vw, 340px)',
          borderRadius:'50%',background:'linear-gradient(145deg,#fdf5e6 0%,#2c2416 100%)',
          boxShadow: aligned
            ? '0 0 0 3px #d4af37, 0 0 40px #d4af3766'
            : '0 0 0 2px #b8860b44, 0 20px 40px #00000044',
          transition:'box-shadow 0.5s ease'}}>

          <div style={{position:'absolute',inset:24,borderRadius:'50%',
            transform:`rotate(${dialRotation}deg)`,
            transition: hasCompass ? 'transform 0.12s ease-out' : 'none'}}>
            {['N','E','S','W'].map((dir,i) => (
              <div key={dir} style={{position:'absolute',inset:0,display:'flex',
                alignItems:'flex-start',justifyContent:'center',
                transform:`rotate(${i*90}deg)`}}>
                <span style={{fontSize:13,marginTop:4,fontFamily:'system-ui',
                  color: dir==='N' ? '#d4af37' : '#8b7355',
                  fontWeight: dir==='N' ? 800 : 600}}>{dir}</span>
              </div>
            ))}
            {Array.from({length:72},(_,i)=>i*5).map(angle => {
              const isCard = angle%90===0, isMaj = angle%30===0;
              return (
                <div key={angle} style={{position:'absolute',left:'50%',top:0,
                  height:'100%',transform:`rotate(${angle}deg) translateX(-50%)`,
                  display:'flex',justifyContent:'center'}}>
                  <div style={{width:isCard?3:isMaj?2:1,height:isCard?20:isMaj?12:7,
                    marginTop:isCard?4:8,borderRadius:2,
                    background:isCard?'#b8860b':isMaj?'#8b735588':'#8b735530'}} />
                </div>
              );
            })}
          </div>

          <div style={{position:'absolute',inset:0,display:'flex',
            alignItems:'center',justifyContent:'center'}}>
            <svg width="20" height="120" viewBox="0 0 20 120" style={{overflow:'visible'}}>
              <polygon points="10,2 3,26 17,26" fill={aligned?'#d4af37':'#b8860b'} />
              <rect x="8" y="24" width="4" height="70" rx="2"
                fill={aligned?'#d4af37':'#b8860b'} opacity="0.9" />
              <rect x="8" y="96" width="4" height="18" rx="2" fill="#8b735544" />
            </svg>
          </div>

          <div style={{position:'absolute',width:68,height:68,borderRadius:'50%',
            background:'linear-gradient(145deg,#fdf5e6,#2c2416)',
            display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:'0 8px 24px #00000033',top:'50%',left:'50%',
            transform:'translate(-50%,-50%)',
            border:`2px solid ${aligned?'#d4af37':'#b8860b44'}`}}>
            <span style={{fontSize:28}}>🕋</span>
          </div>
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'center'}}>
        {aligned ? (
          <div style={{padding:'8px 18px',borderRadius:999,border:'1px solid #d4af37',
            background:'#d4af3722',color:'#92701c',fontSize:13,fontWeight:600,fontFamily:'system-ui'}}>
            ✅ أنت تواجه القبلة
          </div>
        ) : hasCompass ? (
          <div style={{padding:'8px 18px',borderRadius:999,border:'1px solid #b8860b44',
            background:'#ffffff88',color:'#5c4a32',fontSize:13,fontWeight:600,fontFamily:'system-ui'}}>
            🧭 {Math.round(heading!)}° — استمر في الدوران
          </div>
        ) : (
          <div style={{padding:'8px 18px',borderRadius:999,border:'1px solid #b8860b30',
            background:'#ffffff44',color:'#8b7355',fontSize:13,fontFamily:'system-ui'}}>
            حرّك جهازك لتفعيل البوصلة
          </div>
        )}
      </div>

      {errorMsg ? (
        <p style={{color:'#b8860b',fontSize:12,textAlign:'center',margin:0,
          fontFamily:'system-ui',padding:'0 16px'}}>{errorMsg}</p>
      ) : null}

      <button style={{padding:'10px 28px',borderRadius:12,border:'1px solid #b8860b44',
        background:'#ffffff88',color:'#5c4a32',fontSize:14,fontWeight:600,
        fontFamily:'system-ui',cursor:'pointer'}} onClick={getLocation}>
        🔄 تحديث الموقع
      </button>

      <p style={{color:'#8b735588',fontSize:11,textAlign:'center',
        fontStyle:'italic',margin:0,fontFamily:'system-ui'}}>
        القبلة تقريبية — استخدم بوصلة فيزيائية للتثبت
      </p>
    </div>
  );
};

export default QiblaCompassModern;
