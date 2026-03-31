"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona automaticamente para a tela de login ao abrir o site
    router.push("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center gap-3">
      {/* Exibe o favicon. O caminho "/favicon.ico" aponta para a pasta public */}
      <img 
        src="/logo.ico" 
        alt="Logo" 
        className="w-12 h-12 mb-2 animate-pulse" 
      />
      
      <p className="text-gray-400 animate-pulse font-sans">
        Carregando WaSenac-Ti...
      </p>
    </div>
  );
}
