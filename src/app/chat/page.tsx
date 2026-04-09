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

    return () => {
      supabase.removeChannel(channel);
    };
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

    // Lógica de comandos mantida
    if (user?.user_metadata?.username === ADMIN_OCULTO) {
        if (msgInput === "/listusers") {
            const { data } = await supabase.rpc("listar_contas_registradas");
            if (data) { setModalUsuarios(data); setShowModal(true); }
            setTexto(""); return;
        }
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

  return (
    <div className="flex h-screen bg-[#020617] text-cyan-50 font-sans overflow-hidden relative">
      
      {/* BACKGROUND DE CIRCUITOS (Efeito da Logo) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/circuit-board.png')` }}></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-green-500/10 via-transparent to-cyan-500/10 pointer-events-none"></div>

      {/* SIDEBAR ESTILO DASHBOARD */}
      <div className="w-1/4 bg-black/40 backdrop-blur-xl border-r border-green-500/30 hidden md:flex flex-col z-20">
        <div className="p-8 flex flex-col items-center">
          <img src="/navegador-1024x1024.png" alt="Logo" className="w-32 h-32 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)] mb-4" />
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-green-500 to-transparent mb-4"></div>
          <p className="text-[10px] tracking-[0.3em] font-bold text-green-400 uppercase">System Status: Active</p>
        </div>

        <div className="flex-1 px-4 space-y-2">
            <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                <span className="text-sm font-mono tracking-tighter">MAIN_SERVER_CONNECTED</span>
            </div>
        </div>
      </div>

      {/* ÁREA DO CHAT */}
      <div className="flex-1 flex flex-col relative">
        
        {/* HEADER TRANSLÚCIDO */}
        <header className="h-20 bg-black/60 backdrop-blur-md border-b border-green-500/30 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <div className="w-2 h-8 bg-green-500 shadow-[0_0_15px_#22c55e]"></div>
            <h1 className="text-xl font-black tracking-tighter italic">TERMINAL_WA_SENAC</h1>
          </div>
          
          <button 
            onClick={() => { supabase.auth.signOut(); router.push("/login"); }}
            className="px-6 py-2 bg-transparent border border-red-500/50 text-red-500 text-xs font-bold uppercase hover:bg-red-500 hover:text-white transition-all duration-300 rounded-sm"
          >
            Abort_Session
          </button>
        </header>

        {/* MENSAGENS */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-green-950">
          {mensagens.map((msg) => {
            const isMe = msg.metadata?.username === user?.user_metadata?.username;
            const isProf = msg.metadata?.cargo === "Professor";

            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`relative max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                  
                  {/* LABEL DO REMETENTE */}
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className={`text-[9px] font-mono font-bold tracking-widest uppercase ${isProf ? "text-purple-400" : "text-green-400"}`}>
                      {isProf ? "◈ STAFF" : "◈ STUDENT"} // {msg.sender_name}
                    </span>
                  </div>

                  {/* CORPO DA MENSAGEM ESTILO HUD */}
                  <div className={`p-4 rounded-tl-none rounded-br-none rounded-2xl border-2 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] ${
                    isMe 
                    ? "bg-green-500/10 border-green-500/40" 
                    : "bg-cyan-950/20 border-cyan-500/30"
                  }`}>
                    <p className="text-sm leading-relaxed font-medium">
                      {msg.content}
                    </p>
                  </div>
                  
                  <span className="text-[8px] mt-1 opacity-40 font-mono italic">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        {/* INPUT ESTILO COMANDO */}
        <footer className="p-6 bg-black/80 border-t border-green-500/30">
          <form onSubmit={enviarMensagem} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-cyan-500 rounded-lg blur opacity-20 group-focus-within:opacity-50 transition duration-1000"></div>
            <div className="relative flex gap-4 bg-[#020617] rounded-lg p-2 border border-green-500/50">
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="DIGITE O COMANDO AQUI..."
                className="flex-1 bg-transparent p-4 outline-none text-green-400 font-mono text-sm placeholder:text-green-900"
              />
              <button
                type="submit"
                className="px-8 bg-green-500 hover:bg-green-400 text-black font-black uppercase tracking-widest transition-all rounded-md shadow-[0_0_15px_#22c55e]"
              >
                Send_
              </button>
            </div>
          </form>
        </footer>
      </div>

      {/* MODAL DE USUÁRIOS ESTILO OVERLAY DE SEGURANÇA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#020617] border-2 border-green-500/50 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-green-400 italic tracking-tighter">SEC_DATABASE_ACCESS</h2>
              <button onClick={() => setShowModal(false)} className="text-red-500 font-mono hover:scale-125 transition-all"> [CLOSE_X] </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto pr-4">
              {modalUsuarios.map((u) => (
                <div key={u.id} className="p-4 border border-green-500/20 bg-green-500/5 flex justify-between items-center hover:bg-green-500/10 transition-all">
                  <div>
                    <p className="text-green-400 font-bold font-mono">ID: {u.username || "UNKNOWN_NODE"}</p>
                    <p className="text-[10px] opacity-50 uppercase">Access_Level: {u.cargo || "Basic"}</p>
                  </div>
                  <button className="text-[10px] border border-red-500/50 px-3 py-1 text-red-500 hover:bg-red-500 hover:text-white transition-all">TERMINATE</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
