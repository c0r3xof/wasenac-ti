"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ChatFuturista() {
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [texto, setTexto] = useState("");
  const [user, setUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const ADMIN_OCULTO = "gbask";
  const [modalUsuarios, setModalUsuarios] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) router.push("/login");
      else setUser(data.user);
    };
    checkUser();

    const carregarMensagens = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (data) setMensagens(data);
    };
    carregarMensagens();

    const channel = supabase
      .channel("sala_geral")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        carregarMensagens();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const temPoder =
    user?.user_metadata?.username === ADMIN_OCULTO ||
    user?.user_metadata?.cargo === "Professor";

  async function enviarMensagem(e: React.FormEvent) {
    e.preventDefault();
    const msgInput = texto.trim();
    if (!msgInput || !user) return;

    if (user?.user_metadata?.username === ADMIN_OCULTO && msgInput === "/listusers") {
      const { data } = await supabase.rpc("listar_contas_registradas");
      if (data) { setModalUsuarios(data); setShowModal(true); }
      setTexto(""); return;
    }

    if (msgInput === "/clear" && temPoder) {
      await supabase.from("messages").delete().gt("id", 0);
      setTexto("");
      return;
    }

    await supabase.from("messages").insert([{
      content: msgInput,
      sender_name: user?.user_metadata?.full_name || "Usuário",
      user_id: user.id,
      metadata: {
        username: user?.user_metadata?.username,
        cargo: user?.user_metadata?.cargo || "Aluno(a)",
      },
    }]);
    setTexto("");
  }

  // Função para deletar uma mensagem específica
  async function deletarMensagem(id: number) {
    if (confirm("Deseja apagar esta mensagem permanentemente?")) {
      const { error } = await supabase.from("messages").delete().eq("id", id);
      if (error) alert("Erro ao deletar: " + error.message);
    }
  }

  return (
    <div className="flex h-screen bg-[#020617] text-cyan-50 font-sans overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/circuit-board.png')` }}></div>

      <aside className="w-1/4 bg-black/40 backdrop-blur-xl border-r border-green-500/30 hidden md:flex flex-col z-20">
        <div className="p-8 flex flex-col items-center">
          <img src="/navegador-1024x1024.png" alt="Logo" className="w-32 h-32 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)] mb-4" />
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-green-500 to-transparent mb-4"></div>
          <p className="text-[10px] tracking-[0.3em] font-bold text-green-400 uppercase">WA-SENAC // OS</p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative">
        <header className="h-20 bg-black/60 backdrop-blur-md border-b border-green-500/30 flex items-center justify-between px-8 z-10">
          <h1 className="text-xl font-black tracking-tighter italic text-green-500">WaSenac-Ti</h1>
          <button onClick={() => { supabase.auth.signOut(); router.push("/login"); }} className="border border-red-500/50 text-red-500 px-6 py-2 text-xs hover:bg-red-500 hover:text-white transition-all uppercase font-bold tracking-widest rounded-md">
            Sair
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-green-500/20">
          {mensagens.map((msg) => {
            const isMe = msg.metadata?.username === user?.user_metadata?.username;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} group relative`}>
                <div className={`p-4 rounded-xl border-2 shadow-2xl transition-all relative ${
                  isMe ? "bg-green-500/10 border-green-500/40" : "bg-cyan-950/20 border-cyan-500/30"
                }`}>
                  
                  {/* Botão Deletar Individual (Aparece no Hover) */}
                  {temPoder && (
                    <button 
                      onClick={() => deletarMensagem(msg.id)}
                      className={`absolute top-1 ${isMe ? "-left-8" : "-right-8"} opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-500 hover:text-red-500 text-xs`}
                      title="Apagar mensagem"
                    >
                      🗑️
                    </button>
                  )}

                  <p className="text-[9px] font-mono text-green-400 mb-1 uppercase tracking-tighter">[{msg.sender_name}]</p>
                  <p className="text-sm font-medium">{msg.content}</p>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        <footer className="p-6 bg-black/80 border-t border-green-500/30">
          <form onSubmit={enviarMensagem} className="flex gap-4 bg-[#020617] rounded-lg p-2 border border-green-500/50 group focus-within:border-green-400 transition-all">
            <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="DIGITE O COMANDO..." className="flex-1 bg-transparent p-4 outline-none text-green-400 font-mono text-sm placeholder:text-green-900" />
            <button type="submit" className="px-8 bg-green-500 text-black font-black uppercase rounded-md shadow-[0_0_15px_#22c55e]">
              Enviar_
            </button>
          </form>
        </footer>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-transparent">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-2xl transition-opacity" onClick={() => setShowModal(false)}></div>
          <div className="relative w-full max-w-3xl bg-black/70 border border-green-500/40 rounded-3xl shadow-[0_0_60px_rgba(34,197,94,0.2)] flex flex-col max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-green-500/20 flex justify-between items-center bg-green-500/5">
              <h2 className="text-xl font-black text-green-400 italic tracking-widest">USER_REGISTRY_DATABASE</h2>
              <button onClick={() => setShowModal(false)} className="text-green-500 border border-green-500/30 px-3 py-1 hover:bg-green-500 hover:text-black transition-all font-mono">X</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-green-500/40 text-[10px] uppercase font-mono tracking-[0.2em]">
                    <th className="px-4 pb-2">Node_User</th>
                    <th className="px-4 pb-2">Last_Access_Log</th>
                    <th className="px-4 pb-2 text-right">System_Action</th>
                  </tr>
                </thead>
                <tbody>
                  {modalUsuarios.map((u) => (
                    <tr key={u.id} className="bg-green-500/5 border border-green-500/10 hover:bg-green-500/10 transition-all group">
                      <td className="px-4 py-4 font-mono text-sm text-green-400">@{u.username || "NODE_UNDEFINED"}</td>
                      <td className="px-4 py-4 font-mono text-[11px] text-cyan-400/80">
                        {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString('pt-BR') : "DISCONNECTED"}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button className="text-[10px] font-bold text-red-500/40 hover:text-red-500 uppercase tracking-tighter">[Terminate]</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
