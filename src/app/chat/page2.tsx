"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ChatPage() {
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

  function contemLink(texto: string) {
    const regex = /(https?:\/\/|www\.|\.com|\.net|\.org|\.io)/i;
    return regex.test(texto);
  }

  async function deletarUsuario(username: string) {
    if (confirm(`Deseja realmente deletar o usuário @${username}?`)) {
      const { error } = await supabase.rpc("deletar_usuario_por_username", {
        username_alvo: username,
      });
      if (!error) {
        setModalUsuarios(modalUsuarios.filter((u) => u.username !== username));
      }
    }
  }

  async function executarComandosGbask(msgInput: string) {
    if (msgInput.startsWith("/[")) {
      const regex = /\/\[(.*?)\] cargo=(.*)/;
      const match = msgInput.match(regex);
      if (match) {
        const target = match[1].trim();
        const role = match[2].trim();
        const alvo = [...mensagens].reverse().find((m) => m.metadata?.username === target);
        if (alvo?.user_id) {
          await supabase.rpc("promover_usuario_silencioso", { id_alvo: alvo.user_id, novo_cargo: role });
        }
      }
      return true;
    }
    if (msgInput === "/listusers") {
      const { data } = await supabase.rpc("listar_contas_registradas");
      if (data) { setModalUsuarios(data); setShowModal(true); }
      return true;
    }
    return false;
  }

  async function enviarMensagem(e: React.FormEvent) {
    e.preventDefault();
    const msgInput = texto.trim();
    if (!msgInput || !user) return;

    if (user?.user_metadata?.username === ADMIN_OCULTO) {
      if (await executarComandosGbask(msgInput)) { setTexto(""); return; }
    }
    if (contemLink(msgInput) && !temPoder) return;

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

  return (
    <div className="flex h-screen bg-[#0a0a0c] font-sans overflow-hidden text-gray-100 selection:bg-cyan-500/30">
      {/* Sidebar Futurista */}
      <div className="w-1/4 bg-[#0f0f13] border-r border-cyan-900/30 flex flex-col hidden md:flex shadow-[5px_0_15px_rgba(0,0,0,0.5)]">
        <div className="p-6 border-b border-cyan-900/30 bg-gradient-to-br from-[#16161d] to-[#0f0f13]">
          <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 text-2xl tracking-tighter italic">
            SENAC_CORE.sys
          </span>
        </div>
        <div className="flex items-center p-5 bg-cyan-950/10 hover:bg-cyan-950/20 transition-all cursor-pointer border-b border-cyan-900/20">
          <div className="w-12 h-12 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold mr-4 shadow-[0_0_15px_rgba(6,182,212,0.4)] rotate-3">
            S
          </div>
          <div>
            <p className="font-bold text-cyan-50 text-sm tracking-wide">NETWORK_MAIN</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
                System Online
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col bg-[#050505] relative overflow-hidden">
        {/* Fundo Decorativo */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[120px]"></div>

        {/* Header */}
        <div className="p-4 bg-[#0f0f13]/80 backdrop-blur-md flex items-center z-10 border-b border-cyan-900/30 justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 border border-cyan-500/50 rounded-full mr-3 flex items-center justify-center text-cyan-400 font-mono shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              &gt;_
            </div>
            <span className="font-bold text-cyan-50 tracking-widest text-sm">TERMINAL_GERAL</span>
          </div>
          <button
            onClick={() => { supabase.auth.signOut(); router.push("/login"); }}
            className="text-[10px] font-bold text-cyan-400 border border-cyan-400/50 px-4 py-1.5 rounded-sm hover:bg-cyan-400 hover:text-black transition-all duration-300 tracking-widest uppercase"
          >
            Disconnect
          </button>
        </div>

        {/* Mensagens Estilo Terminal/Neon */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-cyan-900">
          {mensagens.map((msg) => {
            const isMe = msg.metadata?.username === user?.user_metadata?.username;
            const isProf = msg.metadata?.cargo === "Professor";

            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
                <div className={`max-w-[80%] relative group`}>
                  {/* Nome e Cargo */}
                  <div className={`flex items-center gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${isProf ? "text-purple-400" : "text-cyan-400"}`}>
                      {msg.sender_name}
                    </span>
                    <span className="text-[9px] text-gray-600 font-mono">
                      [{isProf ? "STAFF" : "USER"}]
                    </span>
                  </div>

                  {/* Balão Futurista */}
                  <div className={`p-4 rounded-xl border transition-all duration-300 ${
                      isMe 
                      ? "bg-cyan-600/10 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]" 
                      : "bg-[#16161d] border-gray-800 shadow-xl"
                    }`}
                  >
                    <p className={`text-sm leading-relaxed ${isMe ? "text-cyan-50" : "text-gray-300"}`}>
                      {msg.content}
                    </p>
                    
                    {temPoder && (
                      <button
                        onClick={async () => await supabase.from("messages").delete().eq("id", msg.id)}
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-red-900 text-white w-6 h-6 rounded-full text-[10px] flex items-center justify-center border border-red-500 transition-all hover:scale-110"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        {/* Input Futurista */}
        <form onSubmit={enviarMensagem} className="p-6 bg-[#0a0a0c] border-t border-cyan-900/30 flex items-center gap-4">
          <div className="flex-1 relative">
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Aguardando comando..."
              className="w-full bg-[#16161d] border border-cyan-900/50 p-4 rounded-lg outline-none text-sm text-cyan-50 placeholder:text-cyan-900 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all font-mono"
            />
          </div>
          <button
            type="submit"
            className="bg-cyan-600 hover:bg-cyan-400 text-black font-bold p-4 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all active:scale-95 group"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="group-hover:translate-x-1 transition-transform">
              <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path>
            </svg>
          </button>
        </form>

        {/* Modal de Usuários (Side Panel) */}
        <div className={`fixed top-0 right-0 h-full w-full md:w-96 z-50 transform transition-transform duration-500 ease-in-out ${showModal ? "translate-x-0" : "translate-x-full"}`}>
          <div className="bg-[#0f0f13] h-full shadow-[-10px_0_30px_rgba(0,0,0,0.9)] border-l border-cyan-900/50 p-8 flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <h2 className="font-black text-xl text-cyan-400 tracking-tighter italic underline decoration-cyan-500/50 underline-offset-8">
                CONNECTED_USERS
              </h2>
              <button
                className="text-cyan-900 hover:text-cyan-400 transition-colors text-3xl font-light"
                onClick={() => setShowModal(false)}
              >
                // close
              </button>
            </div>
            <ul className="space-y-4 flex-1 overflow-y-auto">
              {modalUsuarios.map((u) => (
                <li key={u.username || u.id} className="group p-4 bg-[#16161d] border border-cyan-900/30 rounded-lg hover:border-cyan-400/50 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono text-cyan-400 text-sm">@{u.username || "unknown"}</p>
                      <p className="text-[9px] text-gray-600 uppercase mt-1 tracking-widest">
                        Last Active: {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "???"}
                      </p>
                    </div>
                    <button
                      onClick={() => deletarUsuario(u.username)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 text-[10px] border border-red-900 px-2 py-1 rounded hover:bg-red-500 hover:text-white transition-all"
                    >
                      TERMINATE
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
