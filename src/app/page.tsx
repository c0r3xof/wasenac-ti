"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center gap-3">
      {/* O ?v=1 serve para limpar o cache do navegador e mostrar o ícone novo */}
      <img 
        src="/navegador-1024x1024.png"
        alt="Logo WaSenac-Ti" 
        className="w-[300px] h-[300px] animate-pulse object-contain"
/>
      />
      
      <p className="text-gray-400 animate-pulse font-sans">
        Carregando WaSenac-Ti...
      </p>
    </div>
  );
}
