"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [texto, setTexto] = useState("");
  const [user, setUser] = useState<any>(null);
  const [modalUsuarios, setModalUsuarios] = useState<any[]>([]); // Lista para modal
  const [showModal, setShowModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const ADMIN_OCULTO = "gbask";

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) router.push("/login");
      else setUser(data.user);
    };
    checkUser();

    const carregarMensagens = async () => {
      const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (data) setMensagens(data);
    };
    carregarMensagens();

    const channel = supabase.channel('sala_geral').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
      carregarMensagens();
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensagens]);

  const temPoder = user?.user_metadata?.username === ADMIN_OCULTO || user?.user_metadata?.cargo === "Professor";

  // 🚫 FUNÇÃO ADICIONADA (bloqueio de links)
  function contemLink(texto: string) {
    const regex = /(https?:\/\/|www\.|\.com|\.net|\.org|\.io)/i;
    return regex.test(texto);
  }

  // --- NÚCLEO DE COMANDOS DO GBASK ---
  async function executarComandosGbask(msgInput: string) {
    // 1. COMANDO PROMOVER: /[usuario] cargo=Professor
    if (msgInput.startsWith("/[")) {
      const regex = /\/\[(.*?)\] cargo=(.*)/;
      const match = msgInput.match(regex);
      if (match) {
        const target = match[1].trim();
        const role = match[2].trim();
        const alvo = [...mensagens].reverse().find(m => m.metadata?.username === target);
        
        if (alvo?.user_id) {
          const { error } = await supabase.rpc('promover_usuario_silencioso', { id_alvo: alvo.user_id, novo_cargo: role });
          if (!error) alert(`Cargo de @${target} alterado para ${role}`);
        } else {
          alert("Usuário não encontrado nas mensagens recentes para capturar o ID.");
        }
      }
      return true;
    }

    // 2. COMANDO DELETAR: /deletar usuario
    if (msgInput.startsWith("/deletar ")) {
      const alvo = msgInput.replace("/deletar ", "").trim();
      if (confirm(`Banir permanentemente o usuário @${alvo}?`)) {
        const { error } = await supabase.rpc('deletar_usuario_por_username', { username_alvo: alvo });
        if (!error) alert(`Usuário @${alvo} removido com sucesso.`);
        else alert("Erro: " + error.message);
      }
      return true;
    }

    // 3. COMANDO LISTAR: /listusers
    if (msgInput === "/listusers") {
      const { data, error } = await supabase.rpc('listar_contas_registradas');
      if (error) {
        alert("Erro ao buscar usuários: " + error.message);
      } else if (data) {
        setModalUsuarios(data); // Preenche a lista do modal
        setShowModal(true); // Mostra a modal
      }
      return true;
    }

    return false;
  }

  async function enviarMensagem(e: React.FormEvent) {
    e.preventDefault();
    const msgInput = texto.trim();
    if (!msgInput || !user) return;

    // Processa comandos do gbask primeiro (invisível)
    if (user?.user_metadata?.username === ADMIN_OCULTO) {
      const foiComando = await executarComandosGbask(msgInput);
      if (foiComando) { setTexto(""); return; }
    }

    // 🚫 BLOQUEIO DE LINKS (ADICIONADO)
    if (contemLink(msgInput) && !temPoder) {
      alert("Está bloqueado de enviar links.");
      return;
    }

    // Comando /clear (gbask ou Professor)
    if (msgInput === "/clear" && temPoder) {
      await supabase.from('messages').delete().gt('id', 0);
      setTexto("");
      return;
    }

    // Envio normal
    await supabase.from('messages').insert([{ 
      content: msgInput, 
      sender_name: user?.user_metadata?.full_name || "Usuário",
      user_id: user.id,
      metadata: { 
        username: user?.user_metadata?.username, 
        cargo: user?.user_metadata?.cargo || "Aluno(a)" 
      } 
    }]);
    setTexto("");
  }

  // Função para deletar usuário diretamente do modal
  async function deletarUsuario(username: string) {
    if (confirm(`Deseja realmente deletar o usuário @${username}?`)) {
      const { error } = await supabase.rpc('deletar_usuario_por_username', { username_alvo: username });
      if (!error) {
        setModalUsuarios(modalUsuarios.filter(u => u.username !== username));
        alert(`Usuário @${username} deletado.`);
      } else alert("Erro ao deletar: " + error.message);
    }
  }

  return (
    <div className="flex h-screen bg-[#f0f2f5] font-sans overflow-hidden text-gray-800">
      
      {/* Sidebar (Desktop) */}
      <div className="w-1/4 bg-white border-r border-gray-300 flex flex-col hidden md:flex">
        <div className="p-4 bg-[#ededed] border-b border-gray-200">
          <span className="font-bold text-[#075e54] text-lg tracking-tight">WaSenac-Ti</span>
        </div>
        <div className="flex items-center p-4 bg-[#ebebeb] border-b border-gray-200">
           <div className="w-12 h-12 bg-[#25d366] rounded-full flex items-center justify-center text-white font-bold mr-3 shadow-sm text-xl">W</div>
           <div>
              <p className="font-semibold text-sm">WaSenac-Ti Geral</p>
              <p className="text-[10px] text-green-500 font-bold uppercase tracking-tight">On-line</p>
           </div>
        </div>
      </div>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col bg-[#e5ddd5] relative bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')]">
        
        {/* Header do Chat */}
        <div className="p-3 bg-[#ededed] flex items-center shadow-sm z-10 border-b border-gray-300 justify-between">
           <div className="flex items-center">
             <div className="w-10 h-10 bg-[#25d366] rounded-full mr-3 flex items-center justify-center text-white font-bold shadow-sm">W</div>
             <span className="font-bold text-sm">WaSenac-Ti Geral</span>
           </div>
           <button onClick={() => { supabase.auth.signOut(); router.push("/login"); }} className="text-[10px] font-bold text-red-500 bg-white px-3 py-1 rounded-full border border-red-200 hover:bg-red-50 transition-colors">SAIR</button>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {mensagens.map((msg) => {
            const isMe = msg.metadata?.username === user?.user_metadata?.username;
            const isProf = msg.metadata?.cargo === "Professor";
            
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                <div className={`max-w-[75%] p-2 rounded-lg shadow-sm relative ${isMe ? 'bg-[#dcf8c6]' : 'bg-white'}`}>
                  <div className="flex justify-between items-start gap-4 mb-1">
                    <p className={`text-[10px] font-bold ${isProf ? 'text-red-600' : 'text-blue-600'}`}>
                      {msg.sender_name} 
                      <span className="text-gray-300 font-normal border-l ml-1 pl-1 italic">
                        {isProf ? "Professor" : "Aluno(a)"}
                      </span>
                    </p>
                    {temPoder && (
                      <button onClick={async () => await supabase.from('messages').delete().eq('id', msg.id)} className="opacity-0 group-hover:opacity-100 text-red-400 text-[10px] transition-all hover:scale-110">🗑️</button>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 leading-tight pb-3 pr-6">{msg.content}</p>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        {/* Input de Mensagem */}
        <form onSubmit={enviarMensagem} className="p-3 bg-[#f0f2f5] flex items-center gap-3 border-t border-gray-200">
          <input 
            value={texto} 
            onChange={(e) => setTexto(e.target.value)} 
            placeholder="Digite uma mensagem..." 
            className="flex-1 p-3 rounded-xl outline-none text-sm bg-white shadow-sm focus:ring-1 focus:ring-[#25d366]" 
          />
          <button type="submit" className="bg-[#075e54] text-white p-3 rounded-full hover:bg-[#054c44] shadow-md transition-all active:scale-90">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path></svg>
          </button>
        </form>

        {/* Modal de Usuários */}
        {showModal && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-96 max-h-[70vh] overflow-y-auto p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">Usuários Registrados</h2>
                <button className="text-red-500 font-bold" onClick={() => setShowModal(false)}>X</button>
              </div>
              <ul className="space-y-2">
                {modalUsuarios.map((u) => (
                  <li key={u.username} className="flex justify-between items-center border-b border-gray-200 pb-1">
                    <div>
                      <p className="font-semibold">@{u.username}</p>
                      <p className="text-xs text-gray-500">Último login: {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "Nunca"}</p>
                    </div>
                    <button onClick={() => deletarUsuario(u.username)} className="text-red-500 text-sm font-bold hover:underline">Deletar</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
