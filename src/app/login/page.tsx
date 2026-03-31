"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: `${usuario.toLowerCase().trim()}@wasenac.com`,
      password: senha,
    });

    if (error) {
      alert("Usuário ou senha inválidos.");
      setCarregando(false);
    } else {
      router.push("/chat");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f0f2f5] p-4 font-sans text-gray-800">
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
      <div className="flex flex-col items-center mb-8">
        <img
          src="/navegador-1024x1024.png"
          alt="Logo WaSenac-Ti"
          className="w-16 h-16 object-contain mb-2"
        />
        <p className="text-gray-400 text-sm">Entre com suas credenciais</p>
  </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Usuário</label>
            <input required placeholder="Usuário de login" className="w-full p-3 mt-1 bg-[#f8f9fa] border rounded-lg outline-none focus:border-[#075e54]" onChange={(e) => setUsuario(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Senha</label>
            <input required type="password" placeholder="••••••" className="w-full p-3 mt-1 bg-[#f8f9fa] border rounded-lg outline-none focus:border-[#075e54]" onChange={(e) => setSenha(e.target.value)} />
          </div>
          <button disabled={carregando} className="w-full bg-[#075e54] text-white p-4 rounded-lg font-bold hover:bg-[#054c44] transition-all disabled:bg-gray-400 shadow-md mt-2">
            {carregando ? "AUTENTICANDO..." : "ENTRAR"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-gray-500 text-sm mb-2">Ainda não tem acesso?</p>
          <Link href="/cadastro" className="text-[#25d366] font-bold hover:text-[#1ebe57] transition-colors text-sm uppercase tracking-wide">
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}
