"use client";
import { useRouter } from "next/navigation";

export default function Sucesso() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f0f2f5] text-center p-6">
      <div className="bg-white p-10 rounded-2xl shadow-xl flex flex-col items-center">
        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-12 h-12">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Conta Criada!</h1>
        <p className="text-gray-500 mb-6">Seu cadastro no WaSenac-Ti foi concluído com sucesso.</p>
        <button 
          onClick={() => router.push("/login")}
          className="w-full bg-[#075e54] text-white p-3 rounded-lg font-bold hover:bg-[#054c44] transition-all"
        >
          IR PARA O LOGIN
        </button>
      </div>
    </div>
  );
}