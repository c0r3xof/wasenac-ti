"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/login");
    }, 5000); // 5 segundos

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center gap-3">
      <img
        src="/navegador-1024x1024.png"
        alt="Logo WaSenac-Ti"
        className="w-[300px] h-[300px] animate-pulse object-contain"
      />

      <p className="text-gray-400 animate-pulse font-sans">
        Carregando WaSenac-Ti...
      </p>
    </div>
  );
}
