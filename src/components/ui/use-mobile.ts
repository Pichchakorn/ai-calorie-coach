// src/components/ui/use-mobile.ts
import * as React from "react";

/**
 * ฮุคเช็คว่า viewport เป็น "mobile" หรือไม่ตาม breakpoint (ดีฟอลต์ 768px)
 * ทำงานแบบ SSR‑safe (เช็ค typeof window ก่อน) และอัปเดตเมื่อมีการ resize
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const getInitial = () => {
    if (typeof window === "undefined") return false;
    // ใช้ matchMedia ถ้ามี
    if (typeof window.matchMedia === "function") {
      return window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches;
    }
    return window.innerWidth < breakpoint;
  };

  const [isMobile, setIsMobile] = React.useState<boolean>(getInitial);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => setIsMobile(mql.matches);

    // เริ่มต้นอัปเดตครั้งหนึ่ง (กันค่าเพี้ยนตอน hydration)
    onChange();

    // รองรับทั้ง addEventListener และ addListener (บางบราวเซอร์เก่า)
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    } else {
      // @ts-ignore
      mql.addListener(onChange);
      // @ts-ignore
      return () => mql.removeListener(onChange);
    }
  }, [breakpoint]);

  return isMobile;
}

export default useIsMobile;
