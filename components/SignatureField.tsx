"use client";
import dynamic from "next/dynamic";
import { useRef } from "react";
const SignatureCanvas = dynamic(() => import("react-signature-canvas"), { ssr: false });

export default function SignatureField({
  value,
  onChange,
  label = "mza",
}: { value?: string; onChange: (v?: string) => void; label?: string; }) {
  const ref = useRef<any>(null);
  const clear = () => { ref.current?.clear(); onChange(undefined); };
  const save = () => { const data = ref.current?.toDataURL(); if (data) onChange(data); };
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{label}</div>
      <div className="border rounded">
        <SignatureCanvas ref={ref} penColor="black" canvasProps={{ width: 500, height: 150 }} />
      </div>
      <div className="flex gap-2">
        <button type="button" className="px-2 py-1 bg-gray-200 rounded" onClick={clear}>Temizle</button>
        <button type="button" className="px-2 py-1 bg-blue-500 text-white rounded" onClick={save}>Kaydet</button>
      </div>
    </div>
  );
}
