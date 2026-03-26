"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CadastroPage() {
  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 6) return alert("A senha deve ter no mínimo 6 caracteres.");
    setCarregando(true);

    const { error } = await supabase.auth.signUp({
      email: `${usuario.toLowerCase().trim()}@wasenac.com`,
      password: senha,
      options: {
        data: { 
          full_name: nome,
          username: usuario.toLowerCase().trim(),
          cargo: "Aluno(a)" 
        }
      }
    });

    if (error) {
      alert("Erro ao cadastrar: " + error.message);
      setCarregando(false);
    } else {
      alert("Cadastro realizado! Faça seu login.");
      router.push("/login");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f0f2f5] p-4 font-sans text-gray-800">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <h1 className="text-2xl font-bold text-[#075e54] mb-2 text-center">Criar Conta</h1>
        <p className="text-gray-400 text-sm text-center mb-8">Cadastre-se para acessar o WaSenac</p>
        <form onSubmit={handleCadastro} className="space-y-4">
          <input required placeholder="Nome Completo" className="w-full p-3 bg-[#f8f9fa] border rounded-lg outline-none focus:border-[#25d366]" onChange={(e) => setNome(e.target.value)} />
          <input required placeholder="Usuário (ex: prof_jose)" className="w-full p-3 bg-[#f8f9fa] border rounded-lg outline-none focus:border-[#25d366]" onChange={(e) => setUsuario(e.target.value)} />
          <input required type="password" placeholder="Senha (mín. 6 dígitos)" className="w-full p-3 bg-[#f8f9fa] border rounded-lg outline-none focus:border-[#25d366]" onChange={(e) => setSenha(e.target.value)} />
          <button disabled={carregando} className="w-full bg-[#25d366] text-white p-4 rounded-lg font-bold hover:bg-[#1ebe57] transition-all disabled:bg-gray-400">
            {carregando ? "CADASTRANDO..." : "FINALIZAR CADASTRO"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link href="/login" className="text-[#075e54] font-bold hover:underline text-sm">Voltar para o Login</Link>
        </div>
      </div>
    </div>
  );
}