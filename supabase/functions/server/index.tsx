import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ==================== INICIALIZAÇÃO DO BANCO ====================
// Criar usuário admin inicial se não existir
app.post("/make-server-42377006/init", async (c) => {
  try {
    console.log("📦 Iniciando verificação do banco...");
    
    // Verificar se admin já existe
    const existingAdmin = await kv.get("user:admin");
    console.log("🔍 Admin existente?", existingAdmin ? "SIM" : "NÃO");
    
    if (!existingAdmin) {
      console.log("🆕 Criando usuário admin...");
      
      // Criar admin
      const adminUser = {
        username: "admin",
        pin: "414243",
        role: "admin",
        name: "Administrador",
        photo: "AD",
        createdAt: new Date().toISOString(),
      };
      
      await kv.set("user:admin", adminUser);
      console.log("✅ Admin criado:", adminUser);
      
      // Verificar se foi salvo
      const checkAdmin = await kv.get("user:admin");
      console.log("✔️ Verificação após criação:", checkAdmin);
      
      // Inicializar arrays vazios
      await kv.set("users:vendedor", []);
      await kv.set("users:cliente", []);
      await kv.set("users:motorista", []);
      await kv.set("codes:vendedor", []);
      await kv.set("codes:cliente", []);
      await kv.set("codes:motorista", []);
      console.log("✅ Arrays inicializados");
      
      return c.json({ success: true, message: "Banco inicializado com sucesso!" });
    }
    
    console.log("✅ Admin já existe:", existingAdmin);
    return c.json({ success: true, message: "Admin já existe!", admin: existingAdmin });
  } catch (error) {
    console.error("❌ Erro ao inicializar banco:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Rota para FORÇAR recriação do admin (para debug)
app.post("/make-server-42377006/force-init", async (c) => {
  try {
    console.log("🔄 FORÇANDO recriação do admin...");
    
    // Criar admin (SEMPRE)
    const adminUser = {
      username: "admin",
      pin: "414243",
      role: "admin",
      name: "Administrador",
      photo: "AD",
      createdAt: new Date().toISOString(),
    };
    
    console.log("📝 Salvando admin:", adminUser);
    await kv.set("user:admin", adminUser);
    console.log("✅ Admin salvo!");
    
    // Verificar se foi salvo
    console.log("🔍 Verificando...");
    const checkAdmin = await kv.get("user:admin");
    console.log("✔️ Admin no banco:", checkAdmin);
    
    if (!checkAdmin) {
      throw new Error("ERRO: Admin não foi salvo no banco!");
    }
    
    // Inicializar arrays vazios
    await kv.set("users:vendedor", []);
    await kv.set("users:cliente", []);
    await kv.set("users:motorista", []);
    await kv.set("codes:vendedor", []);
    await kv.set("codes:cliente", []);
    await kv.set("codes:motorista", []);
    console.log("✅ Arrays inicializados");
    
    return c.json({ 
      success: true, 
      message: "Admin FORÇADO com sucesso!",
      admin: checkAdmin
    });
  } catch (error) {
    console.error("❌ Erro ao forçar criação:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Rota para DEBUG - ver todos os dados no banco
app.get("/make-server-42377006/debug/all", async (c) => {
  try {
    console.log("🔍 Buscando todos os dados...");
    
    // Buscar todos os dados importantes
    const admin = await kv.get("user:admin");
    const vendedores = await kv.get("users:vendedor");
    const clientes = await kv.get("users:cliente");
    const motoristas = await kv.get("users:motorista");
    const codesVendedor = await kv.get("codes:vendedor");
    const codesCliente = await kv.get("codes:cliente");
    const codesMotorista = await kv.get("codes:motorista");
    
    const allData = {
      admin,
      vendedores,
      clientes,
      motoristas,
      codesVendedor,
      codesCliente,
      codesMotorista,
    };
    
    console.log("📊 Todos os dados:", allData);
    
    return c.json({ success: true, data: allData });
  } catch (error) {
    console.error("❌ Erro ao buscar dados:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== LIMPEZA TOTAL (exceto admin) ====================
app.post("/make-server-42377006/cleanup", async (c) => {
  try {
    console.log("🧹 Iniciando limpeza total de contas e códigos...");

    // 1. Buscar listas de usernames
    const vendedorUsernames = await kv.get("users:vendedor") || [];
    const clienteUsernames = await kv.get("users:cliente") || [];
    const motoristaUsernames = await kv.get("users:motorista") || [];

    console.log("📋 Vendedores a remover:", vendedorUsernames);
    console.log("📋 Clientes a remover:", clienteUsernames);
    console.log("📋 Motoristas a remover:", motoristaUsernames);

    // 2. Deletar dados de cada vendedor
    for (const username of vendedorUsernames) {
      await kv.del(`user:${username}`);
      await kv.del(`created_by:${username}`);
      await kv.del(`products:${username}`);
      await kv.del(`orders:vendor:${username}`);
      await kv.del(`status:${username}`);
      console.log(`  🗑️ Vendedor removido: ${username}`);
    }

    // 3. Deletar dados de cada cliente
    for (const username of clienteUsernames) {
      await kv.del(`user:${username}`);
      await kv.del(`orders:client:${username}`);
      await kv.del(`status:${username}`);
      console.log(`  🗑️ Cliente removido: ${username}`);
    }

    // 4. Deletar dados de cada motorista
    for (const username of motoristaUsernames) {
      await kv.del(`user:${username}`);
      await kv.del(`orders:driver:${username}`);
      await kv.del(`status:${username}`);
      console.log(`  🗑️ Motorista removido: ${username}`);
    }

    // 5. Limpar chats entre todos os usuários
    const allUsernames = [...vendedorUsernames, ...clienteUsernames, ...motoristaUsernames, "admin"];
    for (let i = 0; i < allUsernames.length; i++) {
      for (let j = i + 1; j < allUsernames.length; j++) {
        const chatId = [allUsernames[i], allUsernames[j]].sort().join(":");
        await kv.del(`chat:${chatId}`);
      }
    }
    console.log("  🗑️ Chats removidos");

    // 6. Limpar created_by do admin
    await kv.del("created_by:admin");

    // 7. Resetar listas para vazio
    await kv.set("users:vendedor", []);
    await kv.set("users:cliente", []);
    await kv.set("users:motorista", []);
    await kv.set("codes:vendedor", []);
    await kv.set("codes:cliente", []);
    await kv.set("codes:motorista", []);

    const totalRemoved = vendedorUsernames.length + clienteUsernames.length + motoristaUsernames.length;
    console.log(`✅ Limpeza concluída! ${totalRemoved} contas removidas.`);

    return c.json({
      success: true,
      message: `Limpeza concluída! ${totalRemoved} contas e todos os códigos removidos.`,
      removed: {
        vendedores: vendedorUsernames.length,
        clientes: clienteUsernames.length,
        motoristas: motoristaUsernames.length,
      },
    });
  } catch (error) {
    console.error("❌ Erro na limpeza:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== LOGIN ====================
app.post("/make-server-42377006/login/step1", async (c) => {
  try {
    const { username } = await c.req.json();
    console.log("🔐 Login Step1 - Username:", username);
    
    if (!username) {
      return c.json({ success: false, error: "Username obrigatório" }, 400);
    }
    
    // Verificar se usuário existe
    const user = await kv.get(`user:${username}`);
    console.log("👤 Usuário encontrado?", user ? "SIM" : "NÃO");
    console.log("📊 Dados do usuário:", user);
    
    if (!user) {
      return c.json({ success: false, error: "Usuário não encontrado" }, 404);
    }
    
    // Retornar dados do usuário (sem PIN)
    return c.json({
      success: true,
      user: {
        username: user.username,
        name: user.name,
        photo: user.photo,
        role: user.role,
        hasFaceData: user.hasFaceData || false,
      },
    });
  } catch (error) {
    console.error("❌ Erro no login step1:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== FACE DATA ====================
app.get("/make-server-42377006/users/:username/face", async (c) => {
  try {
    const username = c.req.param("username");
    const faceRecord = await kv.get(`face:${username}`);
    if (!faceRecord || !faceRecord.faceData) {
      return c.json({ success: false, error: "Dados faciais não encontrados" }, 404);
    }
    return c.json({ success: true, faceData: faceRecord.faceData });
  } catch (error) {
    console.error("❌ Erro ao buscar face data:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Login por reconhecimento facial (para clientes)
app.post("/make-server-42377006/login/face-verify", async (c) => {
  try {
    const { username } = await c.req.json();
    console.log("📸 Face Verify - Username:", username);
    
    if (!username) {
      return c.json({ success: false, error: "Username obrigatório" }, 400);
    }
    
    const user = await kv.get(`user:${username}`);
    if (!user) {
      return c.json({ success: false, error: "Usuário não encontrado" }, 404);
    }
    
    if (user.role !== "cliente") {
      return c.json({ success: false, error: "Verificação facial disponível apenas para clientes" }, 400);
    }
    
    // Verificar se tem face data
    const faceRecord = await kv.get(`face:${username}`);
    if (!faceRecord || !faceRecord.faceData) {
      return c.json({ success: false, error: "Dados faciais não cadastrados para este usuário" }, 404);
    }
    
    // Retornar dados do usuário (login aprovado - a comparação visual é feita no frontend)
    console.log("✅ Face verify - dados encontrados para:", username);
    return c.json({
      success: true,
      user: {
        username: user.username,
        name: user.name,
        photo: user.photo,
        role: user.role,
        createdBy: user.createdBy || null,
      },
      faceData: faceRecord.faceData,
    });
  } catch (error) {
    console.error("❌ Erro no face verify:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-42377006/login/step2", async (c) => {
  try {
    const { username, pin } = await c.req.json();
    console.log("🔐 Login Step2 - Username:", username, "PIN recebido:", pin);
    
    if (!username || !pin) {
      return c.json({ success: false, error: "Username e PIN obrigatórios" }, 400);
    }
    
    // Buscar usuário
    const user = await kv.get(`user:${username}`);
    console.log("👤 Usuário encontrado?", user ? "SIM" : "NÃO");
    console.log("📊 Dados completos do usuário:", JSON.stringify(user, null, 2));
    console.log("📊 PIN no banco:", user?.pin, "(tipo:", typeof user?.pin, ")");
    console.log("📊 PIN recebido:", pin, "(tipo:", typeof pin, ")");
    console.log("📊 Comparação:", user?.pin, "===", pin, "?", user?.pin === pin);
    
    if (!user) {
      return c.json({ success: false, error: "Usuário não encontrado" }, 404);
    }
    
    // Verificar PIN (converter ambos para string)
    const storedPin = String(user.pin);
    const receivedPin = String(pin);
    
    console.log("🔍 PIN armazenado (string):", storedPin);
    console.log("🔍 PIN recebido (string):", receivedPin);
    console.log("🔍 Match?", storedPin === receivedPin);
    
    if (storedPin !== receivedPin) {
      console.log("❌ PIN incorreto!");
      return c.json({ success: false, error: "PIN incorreto" }, 401);
    }
    
    console.log("✅ Login bem-sucedido!");
    
    // Login bem-sucedido
    return c.json({
      success: true,
      user: {
        username: user.username,
        name: user.name,
        photo: user.photo,
        role: user.role,
        createdBy: user.createdBy || null,
      },
    });
  } catch (error) {
    console.error("❌ Erro no login step2:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== CÓDIGOS DE CONVITE ====================
app.post("/make-server-42377006/codes/generate", async (c) => {
  try {
    const { type, generatedBy } = await c.req.json();
    console.log("🎫 Gerando código - Tipo:", type, "Gerado por:", generatedBy);
    
    if (!type || !generatedBy) {
      return c.json({ success: false, error: "Tipo e gerador obrigatórios" }, 400);
    }
    
    // Validar tipo
    if (!["vendedor", "cliente", "motorista"].includes(type)) {
      return c.json({ success: false, error: "Tipo inválido" }, 400);
    }
    
    // Gerar código único
    const prefix = type === "vendedor" ? "V" : type === "cliente" ? "C" : "M";
    const code = `${prefix}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    console.log("✨ Código gerado:", code);
    
    const newCode = {
      code,
      type,
      used: false,
      generatedBy,
      generatedAt: new Date().toISOString(),
      usedBy: null,
      usedAt: null,
    };
    
    // Buscar códigos existentes
    const existingCodes = await kv.get(`codes:${type}`) || [];
    console.log("📋 Códigos existentes antes:", existingCodes);
    
    existingCodes.push(newCode);
    
    // Salvar
    await kv.set(`codes:${type}`, existingCodes);
    console.log("💾 Códigos salvos:", existingCodes);
    
    // Verificar se foi salvo
    const check = await kv.get(`codes:${type}`);
    console.log("✅ Verificação após salvar:", check);
    
    return c.json({ success: true, code: newCode });
  } catch (error) {
    console.error("❌ Erro ao gerar código:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-42377006/codes/validate", async (c) => {
  try {
    const { code } = await c.req.json();
    console.log("🔍 Validando código:", code);
    
    if (!code || typeof code !== "string" || code.trim() === "") {
      return c.json({ success: false, error: "Código obrigatório" }, 400);
    }

    const trimmedCode = code.trim().toUpperCase();
    
    // Detectar tipo pelo prefixo
    const prefix = trimmedCode.split("-")[0];
    console.log("📌 Prefixo detectado:", prefix);
    let type = "";
    
    if (prefix === "V") type = "vendedor";
    else if (prefix === "C") type = "cliente";
    else if (prefix === "M") type = "motorista";
    else {
      console.log("❌ Prefixo inválido:", prefix);
      return c.json({ success: false, error: "Este código não é válido. Verifique e tente novamente." }, 400);
    }
    
    console.log("📋 Tipo detectado:", type);
    
    // Buscar código
    const codes = await kv.get(`codes:${type}`) || [];
    console.log("🔢 Total de códigos do tipo", type, ":", codes.length);
    
    const codeObj = codes.find((c: any) => c.code === trimmedCode);
    
    if (!codeObj) {
      console.log("❌ Código não encontrado na lista");
      return c.json({ success: false, error: "Este código não é válido. Verifique se digitou corretamente." }, 404);
    }
    
    if (codeObj.used) {
      console.log("❌ Código já foi usado por:", codeObj.usedBy, "em:", codeObj.usedAt);
      return c.json({ 
        success: false, 
        error: "Este código já foi utilizado e não pode ser usado novamente. Cada código é de uso único. Solicite um novo código." 
      }, 400);
    }
    
    console.log("✅ Código válido e disponível para uso!");
    return c.json({ success: true, type, code: codeObj });
  } catch (error) {
    console.error("❌ Erro ao validar código:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.get("/make-server-42377006/codes/:type", async (c) => {
  try {
    const type = c.req.param("type");
    
    if (!["vendedor", "cliente", "motorista"].includes(type)) {
      return c.json({ success: false, error: "Tipo inválido" }, 400);
    }
    
    const codes = await kv.get(`codes:${type}`) || [];
    
    return c.json({ success: true, codes });
  } catch (error) {
    console.error("Erro ao buscar códigos:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== REGISTRO DE USUÁRIOS ====================

// Verificar disponibilidade de username
app.get("/make-server-42377006/users/check/:username", async (c) => {
  try {
    const username = c.req.param("username").toLowerCase();
    if (!username || username.length < 2) {
      return c.json({ success: true, available: false, reason: "Username muito curto (mínimo 2 caracteres)" });
    }
    const existing = await kv.get(`user:${username}`);
    return c.json({ 
      success: true, 
      available: !existing,
      reason: existing ? "Este nome de usuário já está em uso" : null 
    });
  } catch (error) {
    console.log("❌ Erro ao verificar username:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-42377006/register", async (c) => {
  try {
    const { username, pin, name, role, inviteCode, photo, faceData, whatsapp } = await c.req.json();
    console.log("👤 REGISTRO - Recebido:", { username, role, name, inviteCode, hasPhoto: !!photo, hasFaceData: !!faceData });
    
    if (!username || !pin || !name || !role) {
      return c.json({ success: false, error: "Dados incompletos" }, 400);
    }
    
    // REGRA: Código de convite é OBRIGATÓRIO para qualquer role que não seja admin
    if (role !== "admin") {
      if (!inviteCode || typeof inviteCode !== "string" || inviteCode.trim() === "") {
        console.log("❌ Tentativa de registro sem código de convite para role:", role);
        return c.json({ 
          success: false, 
          error: "Código de convite obrigatório. Você precisa de um código válido para criar uma conta." 
        }, 400);
      }
    }
    
    // Verificar se username já existe
    const existing = await kv.get(`user:${username}`);
    if (existing) {
      return c.json({ success: false, error: "Este nome de usuário já está em uso. Escolha outro." }, 400);
    }
    
    let createdByUser = null;
    let usedInviteCode = null;
    
    // Validar e consumir código de convite (OBRIGATÓRIO para não-admin)
    if (role !== "admin") {
      const trimmedCode = inviteCode.trim().toUpperCase();
      console.log("🔍 Validando código de convite:", trimmedCode);
      
      // Verificar se o prefixo do código corresponde ao role
      const prefix = trimmedCode.split("-")[0];
      const expectedPrefix = role === "vendedor" ? "V" : role === "cliente" ? "C" : "M";
      
      if (prefix !== expectedPrefix) {
        console.log("❌ Tipo de código incompatível. Prefixo:", prefix, "Role esperado:", role);
        return c.json({ 
          success: false, 
          error: `Este código é para outro tipo de conta. Você precisa de um código de ${role}.` 
        }, 400);
      }
      
      const codes = await kv.get(`codes:${role}`) || [];
      console.log("📋 Total de códigos do tipo", role, ":", codes.length);
      
      const codeIndex = codes.findIndex((c: any) => c.code === trimmedCode);
      const codeObj = codes[codeIndex];
      
      if (!codeObj) {
        console.log("❌ Código não encontrado no banco");
        return c.json({ 
          success: false, 
          error: "Este código não é válido. Verifique se digitou corretamente ou solicite um novo código." 
        }, 400);
      }
      
      if (codeObj.used) {
        console.log("❌ Código já utilizado por:", codeObj.usedBy, "em:", codeObj.usedAt);
        return c.json({ 
          success: false, 
          error: `Este código já foi utilizado e não pode ser usado novamente. Cada código é de uso único. Solicite um novo código ao seu superior.` 
        }, 400);
      }
      
      // ✅ Código válido! Marcar como usado IMEDIATAMENTE (antes de criar o usuário)
      codes[codeIndex].used = true;
      codes[codeIndex].usedBy = username;
      codes[codeIndex].usedAt = new Date().toISOString();
      
      await kv.set(`codes:${role}`, codes);
      console.log("✅ Código marcado como usado:", codes[codeIndex]);
      
      // Guardar quem criou este usuário e qual código foi usado
      createdByUser = codeObj.generatedBy;
      usedInviteCode = trimmedCode;
    }
    
    // Se é cliente e tem faceData, salvar separadamente (base64 grande)
    if (faceData && role === "cliente") {
      await kv.set(`face:${username}`, { faceData, createdAt: new Date().toISOString() });
      console.log("📸 Face data salvo separadamente para:", username);
    }
    
    // Criar usuário
    const newUser = {
      username,
      pin,
      name,
      role,
      photo: photo || faceData || name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2),
      whatsapp: whatsapp || null,
      hasFaceData: !!faceData,
      createdAt: new Date().toISOString(),
      createdBy: createdByUser || "system",
      inviteCodeUsed: usedInviteCode,
    };
    
    console.log("💾 Salvando usuário:", newUser);
    await kv.set(`user:${username}`, newUser);
    
    // Adicionar à lista de usuários do tipo
    const users = await kv.get(`users:${role}`) || [];
    if (!users.includes(username)) {
      users.push(username);
      await kv.set(`users:${role}`, users);
    }
    
    // Adicionar à lista de usuários criados pelo criador (vínculo hierárquico)
    if (createdByUser) {
      const createdUsers = await kv.get(`created_by:${createdByUser}`) || [];
      if (!createdUsers.some((item: any) => item.username === username)) {
        createdUsers.push({ username, role, createdAt: newUser.createdAt });
        await kv.set(`created_by:${createdByUser}`, createdUsers);
        console.log(`✅ Vínculo hierárquico criado: ${username} → ${createdByUser}`);
      }
    }
    
    console.log("✅ Usuário registrado com sucesso! Vínculo:", username, "→", createdByUser);
    
    return c.json({ success: true, user: newUser });
  } catch (error) {
    console.error("❌ Erro ao registrar usuário:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== USUÁRIOS ====================
app.get("/make-server-42377006/users/:role", async (c) => {
  try {
    const role = c.req.param("role");
    
    if (!["admin", "vendedor", "cliente", "motorista"].includes(role)) {
      return c.json({ success: false, error: "Role inválido" }, 400);
    }
    
    const usernames = await kv.get(`users:${role}`) || [];
    const users = [];
    
    for (const username of usernames) {
      const user = await kv.get(`user:${username}`);
      if (user) {
        // Remover PIN dos dados retornados
        const { pin, ...userWithoutPin } = user;
        users.push(userWithoutPin);
      }
    }
    
    return c.json({ success: true, users });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Buscar usuários criados por um usuário específico
app.get("/make-server-42377006/users/created-by/:username", async (c) => {
  try {
    const username = c.req.param("username");
    console.log("🔍 Buscando usuários criados por:", username);
    
    // MÉTODO 1: Buscar da lista auxiliar
    const createdList = await kv.get(`created_by:${username}`) || [];
    console.log("📋 Lista auxiliar created_by:", createdList);
    
    const usersFromList = new Map();
    
    for (const item of createdList) {
      const user = await kv.get(`user:${item.username}`);
      if (user) {
        const { pin, ...userWithoutPin } = user;
        usersFromList.set(item.username, userWithoutPin);
      }
    }
    
    // MÉTODO 2: Escanear TODOS os usuários para encontrar vínculos perdidos
    // Isso garante que mesmo se a lista auxiliar estiver dessincronizada, os vínculos funcionam
    const roles = ["vendedor", "cliente", "motorista"];
    const missingUsers: any[] = [];
    
    for (const role of roles) {
      const usernames = await kv.get(`users:${role}`) || [];
      for (const uname of usernames) {
        if (usersFromList.has(uname)) continue; // Já encontrado
        
        const user = await kv.get(`user:${uname}`);
        if (user && user.createdBy === username) {
          const { pin, ...userWithoutPin } = user;
          usersFromList.set(uname, userWithoutPin);
          missingUsers.push({ username: uname, role: user.role, createdAt: user.createdAt });
        }
      }
    }
    
    // Se encontrou usuários que não estavam na lista auxiliar, reparar a lista
    if (missingUsers.length > 0) {
      console.log(`🔧 Reparando lista created_by:${username} - adicionando ${missingUsers.length} usuários faltantes`);
      const updatedList = [...createdList];
      for (const missing of missingUsers) {
        if (!updatedList.some((item: any) => item.username === missing.username)) {
          updatedList.push(missing);
        }
      }
      await kv.set(`created_by:${username}`, updatedList);
      console.log("✅ Lista reparada:", updatedList);
    }
    
    const users = Array.from(usersFromList.values());
    console.log("✅ Total de usuários vinculados encontrados:", users.length);
    return c.json({ success: true, users });
  } catch (error) {
    console.error("❌ Erro ao buscar usuários criados:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Buscar quem criou um usuário específico
app.get("/make-server-42377006/users/:username/creator", async (c) => {
  try {
    const username = c.req.param("username");
    console.log("🔍 Buscando criador de:", username);
    
    const user = await kv.get(`user:${username}`);
    
    if (!user) {
      return c.json({ success: false, error: "Usuário não encontrado" }, 404);
    }
    
    if (!user.createdBy || user.createdBy === "direct") {
      return c.json({ success: true, creator: null });
    }
    
    const creator = await kv.get(`user:${user.createdBy}`);
    
    if (creator) {
      const { pin, ...creatorWithoutPin } = creator;
      return c.json({ success: true, creator: creatorWithoutPin });
    }
    
    return c.json({ success: true, creator: null });
  } catch (error) {
    console.error("❌ Erro ao buscar criador:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== DELETAR VENDEDOR EM CASCATA ====================
app.delete("/make-server-42377006/vendor/:username", async (c) => {
  try {
    const vendorUsername = c.req.param("username");
    console.log(`🗑️ Deletando vendedor em cascata: ${vendorUsername}`);

    const vendor = await kv.get(`user:${vendorUsername}`);
    if (!vendor || vendor.role !== "vendedor") {
      return c.json({ success: false, error: "Vendedor não encontrado" }, 404);
    }

    // Buscar todos os usuários vinculados a este vendedor
    const createdByList = await kv.get(`created_by:${vendorUsername}`) || [];
    const linkedUsernames = createdByList.map((item: any) => item.username);
    console.log(`📋 Vinculados ao vendedor ${vendorUsername}:`, linkedUsernames);

    // Deletar cada usuário vinculado (clientes e motoristas)
    for (const linkedUsername of linkedUsernames) {
      const linkedUser = await kv.get(`user:${linkedUsername}`);
      if (!linkedUser) continue;
      
      await kv.del(`user:${linkedUsername}`);
      await kv.del(`status:${linkedUsername}`);
      
      if (linkedUser.role === "cliente") {
        await kv.del(`orders:client:${linkedUsername}`);
        const clienteList = await kv.get("users:cliente") || [];
        await kv.set("users:cliente", clienteList.filter((u: string) => u !== linkedUsername));
      } else if (linkedUser.role === "motorista") {
        await kv.del(`orders:driver:${linkedUsername}`);
        const motoristaList = await kv.get("users:motorista") || [];
        await kv.set("users:motorista", motoristaList.filter((u: string) => u !== linkedUsername));
      }

      // Limpar chats do usuário vinculado
      const chatPeers = [...linkedUsernames, vendorUsername, "admin"];
      for (const otherUser of chatPeers) {
        if (otherUser === linkedUsername) continue;
        const chatId = [linkedUsername, otherUser].sort().join(":");
        await kv.del(`chat:${chatId}`);
      }
      console.log(`  🗑️ Vinculado removido: ${linkedUsername} (${linkedUser.role})`);
    }

    // Deletar dados do vendedor
    await kv.del(`user:${vendorUsername}`);
    await kv.del(`created_by:${vendorUsername}`);
    await kv.del(`products:${vendorUsername}`);
    await kv.del(`orders:vendor:${vendorUsername}`);
    await kv.del(`status:${vendorUsername}`);
    const chatIdAdmin = ["admin", vendorUsername].sort().join(":");
    await kv.del(`chat:${chatIdAdmin}`);

    // Remover vendedor da lista
    const vendedorList = await kv.get("users:vendedor") || [];
    await kv.set("users:vendedor", vendedorList.filter((u: string) => u !== vendorUsername));

    // Remover da lista created_by do admin
    const adminCreatedBy = await kv.get("created_by:admin") || [];
    await kv.set("created_by:admin", adminCreatedBy.filter((item: any) => item.username !== vendorUsername));

    // Limpar códigos gerados por este vendedor
    const codesCliente = await kv.get("codes:cliente") || [];
    await kv.set("codes:cliente", codesCliente.filter((c: any) => c.generatedBy !== vendorUsername));
    const codesMotorista = await kv.get("codes:motorista") || [];
    await kv.set("codes:motorista", codesMotorista.filter((c: any) => c.generatedBy !== vendorUsername));

    // Liberar o código que criou o vendedor
    const codesVendedor = await kv.get("codes:vendedor") || [];
    await kv.set("codes:vendedor", codesVendedor.map((c: any) =>
      c.usedBy === vendorUsername ? { ...c, used: false, usedBy: null, usedAt: null } : c
    ));

    console.log(`✅ Vendedor ${vendorUsername} e ${linkedUsernames.length} vinculados removidos!`);
    return c.json({
      success: true,
      message: `Vendedor ${vendorUsername} e ${linkedUsernames.length} usuários vinculados removidos.`,
      removed: { vendedor: vendorUsername, linkedUsers: linkedUsernames, total: 1 + linkedUsernames.length },
    });
  } catch (error) {
    console.error("❌ Erro ao deletar vendedor:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== HIERARQUIA COMPLETA ====================
app.get("/make-server-42377006/hierarchy", async (c) => {
  try {
    console.log("🌳 Buscando hierarquia completa...");
    
    // Buscar admin
    const admin = await kv.get("user:admin");
    
    // Buscar todos os vendedores
    const vendedorUsernames = await kv.get("users:vendedor") || [];
    const clienteUsernames = await kv.get("users:cliente") || [];
    const motoristaUsernames = await kv.get("users:motorista") || [];
    
    // Buscar todos os códigos
    const codesVendedor = await kv.get("codes:vendedor") || [];
    const codesCliente = await kv.get("codes:cliente") || [];
    const codesMotorista = await kv.get("codes:motorista") || [];
    const allCodes = [...codesVendedor, ...codesCliente, ...codesMotorista];
    
    // Construir árvore de vendedores com seus subordinados
    const vendedores = [];
    for (const vUsername of vendedorUsernames) {
      const vendedor = await kv.get(`user:${vUsername}`);
      if (!vendedor) continue;
      const { pin, ...vData } = vendedor;
      
      // Código que criou este vendedor
      const originCode = allCodes.find((c: any) => c.usedBy === vUsername);
      
      // Buscar clientes e motoristas vinculados a este vendedor
      const createdByList = await kv.get(`created_by:${vUsername}`) || [];
      const linkedClientes = [];
      const linkedMotoristas = [];
      
      for (const item of createdByList) {
        const u = await kv.get(`user:${item.username}`);
        if (!u) continue;
        const { pin: _, ...uData } = u;
        const uCode = allCodes.find((c: any) => c.usedBy === item.username);
        const entry = { ...uData, inviteCodeUsed: uCode?.code || null, registeredAt: u.createdAt };
        if (u.role === "cliente") linkedClientes.push(entry);
        else if (u.role === "motorista") linkedMotoristas.push(entry);
      }
      
      // Códigos gerados por este vendedor
      const vendorCodesCliente = codesCliente.filter((c: any) => c.generatedBy === vUsername);
      const vendorCodesMotorista = codesMotorista.filter((c: any) => c.generatedBy === vUsername);
      
      vendedores.push({
        ...vData,
        inviteCodeUsed: originCode?.code || null,
        registeredAt: vendedor.createdAt,
        clientes: linkedClientes,
        motoristas: linkedMotoristas,
        codesGenerated: {
          cliente: vendorCodesCliente.map((c: any) => ({
            code: c.code, used: c.used, usedBy: c.usedBy, generatedAt: c.generatedAt, usedAt: c.usedAt,
          })),
          motorista: vendorCodesMotorista.map((c: any) => ({
            code: c.code, used: c.used, usedBy: c.usedBy, generatedAt: c.generatedAt, usedAt: c.usedAt,
          })),
        },
        stats: {
          totalClientes: linkedClientes.length,
          totalMotoristas: linkedMotoristas.length,
        },
      });
    }
    
    // Códigos gerados pelo admin
    const adminCodes = codesVendedor.map((c: any) => ({
      code: c.code, used: c.used, usedBy: c.usedBy, generatedAt: c.generatedAt, usedAt: c.usedAt,
    }));
    
    return c.json({
      success: true,
      hierarchy: {
        admin: {
          username: admin?.username || "admin",
          name: admin?.name || "Administrador",
          role: "admin",
          codesGenerated: adminCodes,
          stats: {
            totalVendedores: vendedores.length,
            totalClientes: clienteUsernames.length,
            totalMotoristas: motoristaUsernames.length,
            totalCodesGenerated: codesVendedor.length,
            totalCodesUsed: codesVendedor.filter((c: any) => c.used).length,
            totalCodesAvailable: codesVendedor.filter((c: any) => !c.used).length,
          },
        },
        vendedores,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao buscar hierarquia:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== REPARAR VÍNCULOS ====================
// Endpoint para reconstruir todas as listas created_by a partir dos dados dos usuários
app.post("/make-server-42377006/repair-links", async (c) => {
  try {
    console.log("🔧 Iniciando reparo de vínculos...");
    
    const roles = ["vendedor", "cliente", "motorista"];
    const allUsers: any[] = [];
    
    // Coletar todos os usuários
    for (const role of roles) {
      const usernames = await kv.get(`users:${role}`) || [];
      for (const uname of usernames) {
        const user = await kv.get(`user:${uname}`);
        if (user) {
          allUsers.push(user);
        }
      }
    }
    
    console.log(`📊 Total de usuários encontrados: ${allUsers.length}`);
    
    // Reconstruir listas created_by
    const createdByMap: Record<string, any[]> = {};
    
    for (const user of allUsers) {
      if (user.createdBy && user.createdBy !== "direct") {
        if (!createdByMap[user.createdBy]) {
          createdByMap[user.createdBy] = [];
        }
        createdByMap[user.createdBy].push({
          username: user.username,
          role: user.role,
          createdAt: user.createdAt,
        });
      }
    }
    
    // Salvar listas reconstruídas
    let repairedCount = 0;
    for (const [creator, users] of Object.entries(createdByMap)) {
      await kv.set(`created_by:${creator}`, users);
      repairedCount += users.length;
      console.log(`✅ created_by:${creator} -> ${users.length} usuários`);
    }
    
    console.log(`🔧 Reparo concluído. ${repairedCount} vínculos reparados.`);
    
    return c.json({ 
      success: true, 
      message: `Vínculos reparados: ${repairedCount} conexões em ${Object.keys(createdByMap).length} criadores`,
      details: createdByMap 
    });
  } catch (error) {
    console.error("❌ Erro ao reparar vínculos:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== VINCULAR USUÁRIO A VENDEDOR ====================
// Endpoint para conectar um usuário existente a um vendedor via código de convite
app.post("/make-server-42377006/link-user", async (c) => {
  try {
    const { username, inviteCode } = await c.req.json();
    console.log("🔗 Vinculando usuário:", username, "com código:", inviteCode);
    
    if (!username || !inviteCode) {
      return c.json({ success: false, error: "Username e código obrigatórios" }, 400);
    }
    
    // Buscar o usuário
    const user = await kv.get(`user:${username}`);
    if (!user) {
      return c.json({ success: false, error: "Usuário não encontrado" }, 404);
    }
    
    // Detectar tipo pelo prefixo
    const prefix = inviteCode.split("-")[0];
    let type = "";
    if (prefix === "V") type = "vendedor";
    else if (prefix === "C") type = "cliente";
    else if (prefix === "M") type = "motorista";
    else {
      return c.json({ success: false, error: "Código inválido" }, 400);
    }
    
    // Buscar e validar código
    const codes = await kv.get(`codes:${type}`) || [];
    const codeIndex = codes.findIndex((c: any) => c.code === inviteCode);
    const codeObj = codes[codeIndex];
    
    if (!codeObj) {
      return c.json({ success: false, error: "Código não encontrado" }, 404);
    }
    
    if (codeObj.used) {
      return c.json({ success: false, error: "Este código já foi utilizado" }, 400);
    }
    
    const creatorUsername = codeObj.generatedBy;
    
    // Marcar código como usado
    codes[codeIndex].used = true;
    codes[codeIndex].usedBy = username;
    codes[codeIndex].usedAt = new Date().toISOString();
    await kv.set(`codes:${type}`, codes);
    
    // Atualizar createdBy do usuário
    user.createdBy = creatorUsername;
    await kv.set(`user:${username}`, user);
    
    // Atualizar lista created_by do criador
    const createdUsers = await kv.get(`created_by:${creatorUsername}`) || [];
    if (!createdUsers.some((item: any) => item.username === username)) {
      createdUsers.push({ username, role: user.role, createdAt: user.createdAt });
      await kv.set(`created_by:${creatorUsername}`, createdUsers);
    }
    
    // Buscar dados do criador para retornar
    const creator = await kv.get(`user:${creatorUsername}`);
    const { pin: _pin, ...creatorWithoutPin } = creator || {};
    
    console.log(`✅ Usuário ${username} vinculado ao vendedor ${creatorUsername}`);
    
    return c.json({ 
      success: true, 
      message: `Vinculado com sucesso a ${creatorUsername}`,
      creator: creatorWithoutPin
    });
  } catch (error) {
    console.error("❌ Erro ao vincular usuário:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== RESET DO BANCO ====================
app.post("/make-server-42377006/reset", async (c) => {
  try {
    // Limpar todos os dados
    const allKeys = await kv.getByPrefix("");
    
    for (const item of allKeys) {
      await kv.del(item.key);
    }
    
    // Recriar apenas o admin
    const adminUser = {
      username: "admin",
      pin: "414243",
      role: "admin",
      name: "Administrador",
      photo: "AD",
      createdAt: new Date().toISOString(),
    };
    
    await kv.set("user:admin", adminUser);
    await kv.set("users:admin", ["admin"]);
    await kv.set("users:vendedor", []);
    await kv.set("users:cliente", []);
    await kv.set("users:motorista", []);
    await kv.set("codes:vendedor", []);
    await kv.set("codes:cliente", []);
    await kv.set("codes:motorista", []);
    
    return c.json({ success: true, message: "Banco resetado com sucesso!" });
  } catch (error) {
    console.error("Erro ao resetar banco:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Health check endpoint
app.get("/make-server-42377006/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== CHAT / MENSAGENS ====================
app.post("/make-server-42377006/chat/send", async (c) => {
  try {
    const { from, to, text, type = "text", mediaId, audioDuration } = await c.req.json();
    if (!from || !to || !text) {
      return c.json({ success: false, error: "from, to e text obrigatórios" }, 400);
    }
    const chatId = [from, to].sort().join(":");
    const msg: Record<string, unknown> = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      from,
      to,
      text,
      type,
      timestamp: new Date().toISOString(),
      read: false,
    };
    if (mediaId) msg.mediaId = mediaId;
    if (audioDuration !== undefined) msg.audioDuration = audioDuration;
    const messages = await kv.get(`chat:${chatId}`) || [];
    messages.push(msg);
    await kv.set(`chat:${chatId}`, messages);
    return c.json({ success: true, message: msg });
  } catch (error) {
    console.error("❌ Erro ao enviar mensagem:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ─── Upload media (audio/image base64) to separate KV key ───
app.post("/make-server-42377006/chat/media", async (c) => {
  try {
    const { data } = await c.req.json();
    if (!data) {
      return c.json({ success: false, error: "data obrigatório" }, 400);
    }
    const id = `media-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    await kv.set(`media:${id}`, data);
    return c.json({ success: true, id });
  } catch (error) {
    console.error("❌ Erro ao salvar media:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ─── Get media by ID ───
app.get("/make-server-42377006/chat/media/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await kv.get(`media:${id}`);
    if (!data) {
      return c.json({ success: false, error: "Media não encontrada" }, 404);
    }
    return c.json({ success: true, data });
  } catch (error) {
    console.error("❌ Erro ao buscar media:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.get("/make-server-42377006/chat/:user1/:user2", async (c) => {
  try {
    const user1 = c.req.param("user1");
    const user2 = c.req.param("user2");
    const chatId = [user1, user2].sort().join(":");
    const messages = await kv.get(`chat:${chatId}`) || [];
    return c.json({ success: true, messages });
  } catch (error) {
    console.error("❌ Erro ao buscar mensagens:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-42377006/chat/read", async (c) => {
  try {
    const { user1, user2, reader } = await c.req.json();
    const chatId = [user1, user2].sort().join(":");
    const messages = await kv.get(`chat:${chatId}`) || [];
    let updated = false;
    for (const msg of messages) {
      if (msg.to === reader && !msg.read) {
        msg.read = true;
        updated = true;
      }
    }
    if (updated) {
      await kv.set(`chat:${chatId}`, messages);
    }
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== CLEAR CHAT (vendedor only) ====================
app.post("/make-server-42377006/chat/clear", async (c) => {
  try {
    const { user1, user2, requester } = await c.req.json();
    if (!user1 || !user2 || !requester) {
      return c.json({ success: false, error: "user1, user2 e requester obrigatórios" }, 400);
    }
    // Only vendedores can clear chat
    const reqUser = await kv.get(`user:${requester}`);
    if (!reqUser || reqUser.role !== "vendedor") {
      return c.json({ success: false, error: "Apenas vendedores podem apagar conversas" }, 403);
    }
    const chatId = [user1, user2].sort().join(":");
    const messages = await kv.get(`chat:${chatId}`) || [];
    // Collect media IDs to delete
    const mediaIds: string[] = [];
    for (const msg of messages) {
      if (msg.mediaId) mediaIds.push(msg.mediaId);
    }
    // Delete chat messages
    await kv.del(`chat:${chatId}`);
    // Delete associated media files
    if (mediaIds.length > 0) {
      await kv.mdel(mediaIds.map((id: string) => `media:${id}`));
    }
    console.log(`🗑️ Chat limpo: ${chatId} (${messages.length} msgs, ${mediaIds.length} medias) por ${requester}`);
    return c.json({ success: true, deletedMessages: messages.length, deletedMedia: mediaIds.length });
  } catch (error) {
    console.error("❌ Erro ao limpar chat:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== PRODUTOS ====================
app.post("/make-server-42377006/products", async (c) => {
  try {
    const { vendorUsername, name, description, price, category } = await c.req.json();
    if (!vendorUsername || !name || !price) {
      return c.json({ success: false, error: "Dados incompletos" }, 400);
    }
    const product = {
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      vendorUsername,
      name,
      description: description || "",
      price: Number(price),
      category: category || "geral",
      active: true,
      createdAt: new Date().toISOString(),
    };
    const products = await kv.get(`products:${vendorUsername}`) || [];
    products.push(product);
    await kv.set(`products:${vendorUsername}`, products);
    return c.json({ success: true, product });
  } catch (error) {
    console.error("❌ Erro ao criar produto:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.get("/make-server-42377006/products/:vendorUsername", async (c) => {
  try {
    const vendorUsername = c.req.param("vendorUsername");
    const products = await kv.get(`products:${vendorUsername}`) || [];
    return c.json({ success: true, products });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.put("/make-server-42377006/products/:productId", async (c) => {
  try {
    const productId = c.req.param("productId");
    const updates = await c.req.json();
    const vendorUsername = updates.vendorUsername;
    if (!vendorUsername) {
      return c.json({ success: false, error: "vendorUsername obrigatório" }, 400);
    }
    const products = await kv.get(`products:${vendorUsername}`) || [];
    const idx = products.findIndex((p: any) => p.id === productId);
    if (idx === -1) {
      return c.json({ success: false, error: "Produto não encontrado" }, 404);
    }
    products[idx] = { ...products[idx], ...updates, id: productId };
    await kv.set(`products:${vendorUsername}`, products);
    return c.json({ success: true, product: products[idx] });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.delete("/make-server-42377006/products/:vendorUsername/:productId", async (c) => {
  try {
    const vendorUsername = c.req.param("vendorUsername");
    const productId = c.req.param("productId");
    let products = await kv.get(`products:${vendorUsername}`) || [];
    products = products.filter((p: any) => p.id !== productId);
    await kv.set(`products:${vendorUsername}`, products);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== PEDIDOS ====================
app.post("/make-server-42377006/orders", async (c) => {
  try {
    const { clientUsername, vendorUsername, items, total, deliveryAddress } = await c.req.json();
    if (!clientUsername || !vendorUsername || !items || !total) {
      return c.json({ success: false, error: "Dados incompletos" }, 400);
    }
    const order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      clientUsername,
      vendorUsername,
      items,
      total: Number(total),
      deliveryAddress: deliveryAddress || "",
      status: "pending", // pending, accepted, preparing, delivering, delivered, cancelled
      driverUsername: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // Salvar no vendedor
    const vendorOrders = await kv.get(`orders:vendor:${vendorUsername}`) || [];
    vendorOrders.push(order);
    await kv.set(`orders:vendor:${vendorUsername}`, vendorOrders);
    // Salvar no cliente
    const clientOrders = await kv.get(`orders:client:${clientUsername}`) || [];
    clientOrders.push(order);
    await kv.set(`orders:client:${clientUsername}`, clientOrders);
    return c.json({ success: true, order });
  } catch (error) {
    console.error("❌ Erro ao criar pedido:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.get("/make-server-42377006/orders/vendor/:username", async (c) => {
  try {
    const username = c.req.param("username");
    const orders = await kv.get(`orders:vendor:${username}`) || [];
    return c.json({ success: true, orders });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.get("/make-server-42377006/orders/client/:username", async (c) => {
  try {
    const username = c.req.param("username");
    const orders = await kv.get(`orders:client:${username}`) || [];
    return c.json({ success: true, orders });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.get("/make-server-42377006/orders/driver/:username", async (c) => {
  try {
    const username = c.req.param("username");
    const orders = await kv.get(`orders:driver:${username}`) || [];
    return c.json({ success: true, orders });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.put("/make-server-42377006/orders/:orderId/status", async (c) => {
  try {
    const orderId = c.req.param("orderId");
    const { status, vendorUsername, clientUsername, driverUsername } = await c.req.json();
    if (!status || !vendorUsername || !clientUsername) {
      return c.json({ success: false, error: "status, vendorUsername e clientUsername obrigatórios" }, 400);
    }
    // Atualizar no vendedor
    const vendorOrders = await kv.get(`orders:vendor:${vendorUsername}`) || [];
    const vIdx = vendorOrders.findIndex((o: any) => o.id === orderId);
    if (vIdx !== -1) {
      vendorOrders[vIdx].status = status;
      vendorOrders[vIdx].updatedAt = new Date().toISOString();
      if (driverUsername) vendorOrders[vIdx].driverUsername = driverUsername;
      await kv.set(`orders:vendor:${vendorUsername}`, vendorOrders);
    }
    // Atualizar no cliente
    const clientOrders = await kv.get(`orders:client:${clientUsername}`) || [];
    const cIdx = clientOrders.findIndex((o: any) => o.id === orderId);
    if (cIdx !== -1) {
      clientOrders[cIdx].status = status;
      clientOrders[cIdx].updatedAt = new Date().toISOString();
      if (driverUsername) clientOrders[cIdx].driverUsername = driverUsername;
      await kv.set(`orders:client:${clientUsername}`, clientOrders);
    }
    // Se tem motorista, salvar/atualizar na lista do motorista
    if (driverUsername) {
      const driverOrders = await kv.get(`orders:driver:${driverUsername}`) || [];
      const dIdx = driverOrders.findIndex((o: any) => o.id === orderId);
      const orderData = vendorOrders[vIdx] || clientOrders[cIdx];
      if (dIdx !== -1) {
        driverOrders[dIdx] = { ...driverOrders[dIdx], status, updatedAt: new Date().toISOString() };
      } else if (orderData) {
        driverOrders.push({ ...orderData, driverUsername });
      }
      await kv.set(`orders:driver:${driverUsername}`, driverOrders);
    }
    return c.json({ success: true, message: `Pedido atualizado para ${status}` });
  } catch (error) {
    console.error("❌ Erro ao atualizar pedido:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== VENDOR COMMISSION RATE ====================
app.put("/make-server-42377006/vendor-commission/:username", async (c) => {
  try {
    const username = c.req.param("username");
    const { rate } = await c.req.json();
    if (rate === undefined || rate === null || isNaN(Number(rate)) || Number(rate) < 0 || Number(rate) > 100) {
      return c.json({ success: false, error: "Rate deve ser entre 0 e 100" }, 400);
    }
    const user = await kv.get(`user:${username}`);
    if (!user || user.role !== "vendedor") {
      return c.json({ success: false, error: "Vendedor não encontrado" }, 404);
    }
    user.adminCommissionRate = Number(rate);
    await kv.set(`user:${username}`, user);
    console.log(`✅ Taxa admin para ${username} definida: ${rate}%`);
    return c.json({ success: true, rate: Number(rate) });
  } catch (error) {
    console.error("❌ Erro ao definir taxa:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.get("/make-server-42377006/vendor-commission/:username", async (c) => {
  try {
    const username = c.req.param("username");
    const user = await kv.get(`user:${username}`);
    if (!user) return c.json({ success: false, error: "Usuário não encontrado" }, 404);
    const rate = user.adminCommissionRate !== undefined ? user.adminCommissionRate : 15;
    return c.json({ success: true, rate });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== STATUS ONLINE/OFFLINE ====================
app.post("/make-server-42377006/status", async (c) => {
  try {
    const { username, online } = await c.req.json();
    if (!username) {
      return c.json({ success: false, error: "username obrigatório" }, 400);
    }
    const statusData = {
      username,
      online: !!online,
      lastSeen: new Date().toISOString(),
    };
    await kv.set(`status:${username}`, statusData);
    return c.json({ success: true, status: statusData });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.get("/make-server-42377006/status/:username", async (c) => {
  try {
    const username = c.req.param("username");
    const status = await kv.get(`status:${username}`);
    return c.json({ success: true, status: status || { username, online: false, lastSeen: null } });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== MÉTRICAS / DASHBOARD ====================
app.get("/make-server-42377006/metrics/:username", async (c) => {
  try {
    const username = c.req.param("username");
    const user = await kv.get(`user:${username}`);
    if (!user) {
      return c.json({ success: false, error: "Usuário não encontrado" }, 404);
    }
    
    if (user.role === "admin") {
      // Métricas do admin: vendedores, total vendas, taxas (com taxa variável por vendedor)
      const vendedores = await kv.get("users:vendedor") || [];
      let totalSales = 0;
      let totalOrders = 0;
      let todaySales = 0;
      let totalAdminTax = 0;
      const today = new Date().toISOString().split("T")[0];
      
      for (const vUsername of vendedores) {
        const vendorUser = await kv.get(`user:${vUsername}`);
        const vendorRate = vendorUser?.adminCommissionRate !== undefined ? vendorUser.adminCommissionRate : 15;
        const vendorRateDecimal = vendorRate / 100;
        let vendorSales = 0;
        const orders = await kv.get(`orders:vendor:${vUsername}`) || [];
        for (const order of orders) {
          if (order.status !== "cancelled" && order.paymentStatus === "paid") {
            vendorSales += order.total || 0;
            totalOrders++;
            if (order.createdAt?.startsWith(today)) {
              todaySales += order.total || 0;
            }
          }
        }
        // Inclui vendas diretas PIX do vendedor
        const directPixSales = await kv.get(`pix_direct_sales:${vUsername}`) || [];
        for (const sale of directPixSales) {
          vendorSales += sale.amount || 0;
          if (sale.createdAt?.startsWith(today)) todaySales += sale.amount || 0;
        }
        totalSales += vendorSales;
        totalAdminTax += vendorSales * vendorRateDecimal;
      }
      
      return c.json({
        success: true,
        metrics: {
          totalVendedores: vendedores.length,
          totalSales,
          totalOrders,
          todaySales,
          adminTax: totalAdminTax,
        },
      });
    }
    
    if (user.role === "vendedor") {
      const orders = await kv.get(`orders:vendor:${username}`) || [];
      const products = await kv.get(`products:${username}`) || [];
      const createdBy = await kv.get(`created_by:${username}`) || [];
      const directPixSales = await kv.get(`pix_direct_sales:${username}`) || [];
      let totalSales = 0;
      let todaySales = 0;
      let pendingOrders = 0;
      const today = new Date().toISOString().split("T")[0];
      
      for (const order of orders) {
        if (order.status !== "cancelled") {
          if (order.status === "pending") pendingOrders++;
          // Só conta como venda se o pagamento PIX foi confirmado
          if (order.paymentStatus === "paid") {
            totalSales += order.total || 0;
            if (order.createdAt?.startsWith(today)) todaySales += order.total || 0;
          }
        }
      }
      
      // Adiciona vendas diretas PIX (sem comissão de motorista)
      let directPixTotal = 0;
      let directPixToday = 0;
      for (const sale of directPixSales) {
        directPixTotal += sale.amount || 0;
        if (sale.createdAt?.startsWith(today)) directPixToday += sale.amount || 0;
      }
      totalSales += directPixTotal;
      todaySales += directPixToday;
      
      const commissionRate = user.adminCommissionRate !== undefined ? user.adminCommissionRate : 15;
      const commissionDecimal = commissionRate / 100;
      
      return c.json({
        success: true,
        metrics: {
          totalSales,
          todaySales,
          totalOrders: orders.length,
          pendingOrders,
          totalProducts: products.length,
          totalClientes: createdBy.filter((u: any) => u.role === "cliente").length,
          totalMotoristas: createdBy.filter((u: any) => u.role === "motorista").length,
          adminCommissionRate: commissionRate,
          adminTax: totalSales * commissionDecimal,
          netSales: totalSales * (1 - commissionDecimal),
          directPixSales: directPixTotal,
          directPixCount: directPixSales.length,
        },
      });
    }
    
    if (user.role === "motorista") {
      const orders = await kv.get(`orders:driver:${username}`) || [];
      let totalDeliveries = 0;
      let totalCommission = 0;
      
      for (const order of orders) {
        if (order.status === "delivered" && order.paymentStatus === "paid") {
          totalDeliveries++;
          totalCommission += (order.total || 0) * 0.08 + 5;
        }
      }
      
      return c.json({
        success: true,
        metrics: {
          totalDeliveries,
          totalCommission,
          pendingDeliveries: orders.filter((o: any) => o.status === "delivering").length,
          totalOrders: orders.length,
        },
      });
    }
    
    // Cliente
    const orders = await kv.get(`orders:client:${username}`) || [];
    return c.json({
      success: true,
      metrics: {
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum: number, o: any) => sum + (o.status !== "cancelled" ? (o.total || 0) : 0), 0),
        activeOrders: orders.filter((o: any) => !["delivered", "cancelled"].includes(o.status)).length,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao buscar métricas:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== DIAGNÓSTICO DE VÍNCULO ====================
app.get("/make-server-42377006/debug/link/:username", async (c) => {
  try {
    const username = c.req.param("username");
    console.log("🔍 DEBUG LINK - Verificando vínculo para:", username);
    
    // 1. Buscar usuário
    const user = await kv.get(`user:${username}`);
    if (!user) {
      return c.json({ success: false, error: "Usuário não encontrado", username }, 404);
    }
    
    // 2. Informações do vínculo
    const linkInfo: any = {
      username: user.username,
      role: user.role,
      createdBy: user.createdBy || "NENHUM",
      createdAt: user.createdAt,
    };
    
    // 3. Se tem createdBy, buscar dados do criador
    if (user.createdBy && user.createdBy !== "direct") {
      const creator = await kv.get(`user:${user.createdBy}`);
      linkInfo.creatorExists = !!creator;
      linkInfo.creatorData = creator ? { username: creator.username, name: creator.name, role: creator.role } : null;
      
      // 4. Verificar se está na lista created_by do criador
      const createdByList = await kv.get(`created_by:${user.createdBy}`) || [];
      linkInfo.inCreatorList = createdByList.some((item: any) => item.username === username);
      linkInfo.creatorListSize = createdByList.length;
      linkInfo.creatorListItems = createdByList.map((item: any) => ({ username: item.username, role: item.role }));
    }
    
    // 5. Verificar se código de convite foi usado
    const codeType = user.role;
    const allCodes = await kv.get(`codes:${codeType}`) || [];
    const usedCode = allCodes.find((code: any) => code.usedBy === username);
    linkInfo.inviteCode = usedCode ? {
      code: usedCode.code,
      generatedBy: usedCode.generatedBy,
      used: usedCode.used,
      usedAt: usedCode.usedAt,
    } : "NENHUM CÓDIGO ENCONTRADO";
    
    // 6. Verificar consistência
    linkInfo.diagnostics = {
      hasCreatedBy: !!user.createdBy && user.createdBy !== "direct",
      creatorMatchesCode: usedCode ? user.createdBy === usedCode.generatedBy : false,
      isConsistent: !!(user.createdBy && user.createdBy !== "direct" && linkInfo.inCreatorList),
    };
    
    // 7. Auto-repair se inconsistente
    if (user.createdBy && user.createdBy !== "direct" && !linkInfo.inCreatorList) {
      console.log("🔧 Auto-reparando vínculo...");
      const createdByList = await kv.get(`created_by:${user.createdBy}`) || [];
      createdByList.push({ username: user.username, role: user.role, createdAt: user.createdAt });
      await kv.set(`created_by:${user.createdBy}`, createdByList);
      linkInfo.autoRepaired = true;
      linkInfo.diagnostics.isConsistent = true;
      console.log("✅ Vínculo reparado automaticamente");
    }
    
    // Se o código existe mas createdBy está errado, corrigir
    if (usedCode && (!user.createdBy || user.createdBy === "direct") && usedCode.generatedBy) {
      console.log("🔧 Corrigindo createdBy a partir do código de convite...");
      user.createdBy = usedCode.generatedBy;
      await kv.set(`user:${username}`, user);
      
      // Adicionar à lista created_by
      const createdByList = await kv.get(`created_by:${usedCode.generatedBy}`) || [];
      if (!createdByList.some((item: any) => item.username === username)) {
        createdByList.push({ username: user.username, role: user.role, createdAt: user.createdAt });
        await kv.set(`created_by:${usedCode.generatedBy}`, createdByList);
      }
      
      linkInfo.createdByFixed = true;
      linkInfo.createdBy = usedCode.generatedBy;
      linkInfo.diagnostics.isConsistent = true;
      console.log("✅ createdBy corrigido para:", usedCode.generatedBy);
    }
    
    console.log("📊 DEBUG LINK resultado:", JSON.stringify(linkInfo, null, 2));
    
    return c.json({ success: true, linkInfo });
  } catch (error) {
    console.error("❌ Erro no debug link:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== PIXWAVE / DEPIX INTEGRATION ====================
const PIXWAVE_BASE = "https://pixwave.cash/invoice/api/v1";

async function getPixwaveKey(): Promise<string | null> {
  const config = await kv.get("config:pixwave");
  return config?.apiKey || null;
}

// Save PixWave API key + validate
app.post("/make-server-42377006/pixwave/config", async (c) => {
  try {
    const { apiKey } = await c.req.json();
    if (!apiKey || typeof apiKey !== "string") {
      return c.json({ success: false, error: "API Key obrigatória" }, 400);
    }
    const testRes = await fetch(`${PIXWAVE_BASE}/?limit=1`, {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });
    if (!testRes.ok) {
      const errText = await testRes.text();
      console.log("❌ PixWave key validation failed:", testRes.status, errText);
      return c.json({ success: false, error: `API Key inválida (status ${testRes.status})` }, 400);
    }
    await kv.set("config:pixwave", { apiKey, connectedAt: new Date().toISOString(), active: true });
    console.log("✅ PixWave API key saved and validated");
    return c.json({ success: true, message: "API Key validada e salva com sucesso" });
  } catch (error) {
    console.error("❌ Erro ao salvar config PixWave:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.get("/make-server-42377006/pixwave/config", async (c) => {
  try {
    const config = await kv.get("config:pixwave");
    if (!config || !config.apiKey) return c.json({ success: true, connected: false });
    return c.json({ success: true, connected: true, connectedAt: config.connectedAt, active: config.active !== false });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.delete("/make-server-42377006/pixwave/config", async (c) => {
  try {
    await kv.del("config:pixwave");
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Create invoice
app.post("/make-server-42377006/pixwave/invoice", async (c) => {
  try {
    const apiKey = await getPixwaveKey();
    if (!apiKey) return c.json({ success: false, error: "PixWave não configurado" }, 400);

    const { description, price, externalId, redirectTo, metadata } = await c.req.json();
    if (!description || !price) return c.json({ success: false, error: "description e price obrigatórios" }, 400);

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return c.json({ success: false, error: "Valor inválido" }, 400);
    }

    const supaUrl = Deno.env.get("SUPABASE_URL") || "";
    const serverUrl = `${supaUrl}/functions/v1/make-server-42377006`;

    const webhooks = [
      { hookType: "PAYMENT_CONFIRMED", url: `${serverUrl}/pixwave/webhook` },
      { hookType: "INVOICE_EXPIRED", url: `${serverUrl}/pixwave/webhook` },
      { hookType: "PAYMENT_CANCELLED", url: `${serverUrl}/pixwave/webhook` },
    ];

    // PixWave API expects price in REAIS (float) - NOT centavos!
    // Sending centavos (price * 100) was causing 100x overcharge bug
    // Round to 2 decimal places to avoid floating point issues
    const priceFinal = Math.round(priceNum * 100) / 100;

    // Strategy: try multiple approaches with exponential backoff
    // The 520 "Erro ao gerar QR Code" is a transient PixWave backend error
    // Approaches: with webhooks first, then without webhooks (simpler request)
    const strategies = [
      { label: "standard", includeWebhooks: true },
      { label: "standard-retry", includeWebhooks: true },
      { label: "no-webhooks", includeWebhooks: false },
      { label: "no-webhooks-retry", includeWebhooks: false },
      { label: "minimal", includeWebhooks: false },
    ];

    let lastError = "";
    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];
      if (i > 0) {
        const delay = 2000 + (i - 1) * 1000;
        console.log(`🔄 Strategy "${strategy.label}" (attempt ${i + 1}/${strategies.length}), waiting ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }

      const body: Record<string, unknown> = {
        description,
        price: priceFinal,
        invoiceType: "SINGLE",
        paymentTypes: ["PIX"],
      };
      if (strategy.includeWebhooks) body.webhooks = webhooks;
      if (externalId) body.externalId = externalId;
      if (redirectTo && strategy.label !== "minimal") body.redirectTo = redirectTo;

      console.log(`📤 PixWave create (${strategy.label}, R$ ${priceFinal}):`, JSON.stringify(body));

      let res: Response;
      try {
        res = await fetch(`${PIXWAVE_BASE}/create`, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch (fetchErr) {
        console.error(`❌ PixWave fetch error (${strategy.label}):`, fetchErr);
        lastError = `Erro de conexão: ${String(fetchErr)}`;
        continue;
      }

      const responseText = await res.text();
      console.log(`📥 PixWave response (${strategy.label}):`, res.status, responseText);

      let data: any;
      try { data = JSON.parse(responseText); } catch {
        console.error("❌ PixWave returned non-JSON:", responseText);
        lastError = `Resposta inválida do PixWave (${res.status})`;
        continue;
      }

      if (!res.ok) {
        const errDetail = data.detail || data.message || data.error || "";
        console.error(`❌ PixWave error (${strategy.label}):`, res.status, errDetail);
        lastError = errDetail || `Erro PixWave (${res.status})`;
        if (res.status >= 500 || String(errDetail).includes("QR Code") || String(errDetail).includes("520") || String(errDetail).includes("not bound to a Session")) {
          console.log(`🔄 Transient error ${res.status}, trying next strategy...`);
          continue;
        }
        return c.json({ success: false, error: lastError, detail: data }, res.status);
      }

      // Success!
      const invoice = { ...data, localMetadata: metadata || {}, createdLocally: new Date().toISOString() };
      await kv.set(`pixwave:invoice:${data.id}`, invoice);
      if (externalId) await kv.set(`pixwave:ext:${externalId}`, data.id);

      if (!strategy.includeWebhooks) {
        console.log(`ℹ️ Invoice created without webhooks, polling will handle status updates`);
      }

      const invoiceList = (await kv.get("pixwave:invoices")) || [];
      invoiceList.unshift({ id: data.id, externalId: externalId || "", amount: data.amount || priceFinal, description: data.description, status: data.status, createdAt: data.createdAt, metadata: metadata || {} });
      if (invoiceList.length > 500) invoiceList.length = 500;
      await kv.set("pixwave:invoices", invoiceList);

      console.log(`✅ PixWave invoice created (${strategy.label}):`, data.id, `R$ ${priceFinal}`);
      return c.json({ success: true, invoice: data });
    }

    // All strategies failed
    console.error("❌ All PixWave strategies failed. Last error:", lastError);
    return c.json({ success: false, error: `Erro ao gerar PIX: ${lastError || "Todos os métodos falharam"}. O servidor PixWave pode estar instável - tente novamente em 30 segundos.` }, 502);
  } catch (error) {
    console.error("❌ Erro ao criar invoice PixWave:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get invoice details
app.get("/make-server-42377006/pixwave/invoice/:id", async (c) => {
  try {
    const apiKey = await getPixwaveKey();
    if (!apiKey) return c.json({ success: false, error: "PixWave não configurado" }, 400);
    const invoiceId = c.req.param("id");
    const res = await fetch(`${PIXWAVE_BASE}/${invoiceId}`, {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (!res.ok) return c.json({ success: false, error: data.message || `Erro (${res.status})` }, res.status);
    return c.json({ success: true, invoice: data });
  } catch (error) {
    console.error("❌ Erro ao buscar invoice:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// List invoices
app.get("/make-server-42377006/pixwave/invoices", async (c) => {
  try {
    const invoiceList = (await kv.get("pixwave:invoices")) || [];
    return c.json({ success: true, invoices: invoiceList });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Webhook receiver
app.post("/make-server-42377006/pixwave/webhook", async (c) => {
  try {
    const payload = await c.req.json();
    console.log("🔔 PixWave Webhook:", JSON.stringify(payload));

    const event = payload.event;
    const invoiceData = payload.invoice;
    const paymentData = payload.payment;
    if (!invoiceData?.id) return c.json({ success: false, error: "Invalid webhook" }, 400);

    const localInvoice = await kv.get(`pixwave:invoice:${invoiceData.id}`);
    if (localInvoice) {
      localInvoice.status = invoiceData.status;
      localInvoice.payment = { ...localInvoice.payment, ...paymentData };
      if (invoiceData.paidAt) localInvoice.paidAt = invoiceData.paidAt;
      if (invoiceData.cancelledAt) localInvoice.cancelledAt = invoiceData.cancelledAt;
      if (invoiceData.expiredAt) localInvoice.expiredAt = invoiceData.expiredAt;
      localInvoice.lastWebhookEvent = event;
      localInvoice.lastWebhookAt = new Date().toISOString();
      await kv.set(`pixwave:invoice:${invoiceData.id}`, localInvoice);
    }

    const invoiceList = (await kv.get("pixwave:invoices")) || [];
    const idx = invoiceList.findIndex((inv: any) => inv.id === invoiceData.id);
    if (idx !== -1) {
      invoiceList[idx].status = invoiceData.status;
      if (invoiceData.paidAt) invoiceList[idx].paidAt = invoiceData.paidAt;
      await kv.set("pixwave:invoices", invoiceList);
    }

    if (event === "PAYMENT_CONFIRMED" && localInvoice?.localMetadata?.orderId) {
      const orderId = localInvoice.localMetadata.orderId;
      const vendorUsername = localInvoice.localMetadata.vendorUsername;
      if (vendorUsername) {
        const orders = (await kv.get(`orders:${vendorUsername}`)) || [];
        const orderIdx = orders.findIndex((o: any) => o.id === orderId);
        if (orderIdx !== -1) {
          orders[orderIdx].paymentStatus = "paid";
          orders[orderIdx].pixPaidAt = invoiceData.paidAt || new Date().toISOString();
          orders[orderIdx].pixPayerName = paymentData?.payerName || "";
          await kv.set(`orders:${vendorUsername}`, orders);
          console.log(`✅ Order ${orderId} marked as paid via PIX`);
        }
      }
    }

    const webhookLogs = (await kv.get("pixwave:webhook_logs")) || [];
    webhookLogs.unshift({ event, invoiceId: invoiceData.id, status: invoiceData.status, timestamp: new Date().toISOString(), payerName: paymentData?.payerName });
    if (webhookLogs.length > 200) webhookLogs.length = 200;
    await kv.set("pixwave:webhook_logs", webhookLogs);

    return c.json({ success: true });
  } catch (error) {
    console.error("❌ Erro no webhook PixWave:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Dashboard stats
app.get("/make-server-42377006/pixwave/dashboard", async (c) => {
  try {
    const invoiceList = (await kv.get("pixwave:invoices")) || [];
    const webhookLogs = (await kv.get("pixwave:webhook_logs")) || [];
    const config = await kv.get("config:pixwave");
    const stats = {
      connected: !!(config?.apiKey),
      connectedAt: config?.connectedAt || null,
      totalInvoices: invoiceList.length,
      pending: invoiceList.filter((i: any) => i.status === "pending").length,
      paid: invoiceList.filter((i: any) => i.status === "paid").length,
      expired: invoiceList.filter((i: any) => i.status === "expired").length,
      cancelled: invoiceList.filter((i: any) => i.status === "cancelled").length,
      totalRevenue: invoiceList.filter((i: any) => i.status === "paid").reduce((sum: number, i: any) => sum + (i.amount || 0), 0),
      recentInvoices: invoiceList.slice(0, 20),
      recentWebhooks: webhookLogs.slice(0, 10),
    };
    return c.json({ success: true, stats });
  } catch (error) {
    console.error("❌ Erro no dashboard PixWave:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== DIRECT PIX SALES (Vendedor) ====================
app.post("/make-server-42377006/pix-direct-sale", async (c) => {
  try {
    const { vendorUsername, amount, invoiceId, description } = await c.req.json();
    if (!vendorUsername || !amount || !invoiceId) {
      return c.json({ success: false, error: "vendorUsername, amount e invoiceId obrigatórios" }, 400);
    }
    const user = await kv.get(`user:${vendorUsername}`);
    if (!user || user.role !== "vendedor") {
      return c.json({ success: false, error: "Vendedor não encontrado" }, 404);
    }
    const sale = {
      id: `pix-sale-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      vendorUsername,
      amount: Number(amount),
      invoiceId,
      description: description || "Venda direta PIX",
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    const sales = (await kv.get(`pix_direct_sales:${vendorUsername}`)) || [];
    sales.push(sale);
    await kv.set(`pix_direct_sales:${vendorUsername}`, sales);
    console.log(`✅ Venda direta PIX registrada: R$${amount} para ${vendorUsername}`);
    return c.json({ success: true, sale });
  } catch (error) {
    console.error("❌ Erro ao registrar venda direta PIX:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== CALL SIGNALING ====================
app.post("/make-server-42377006/calls/initiate", async (c) => {
  try {
    const { from, to, type, fromName, fromPhoto } = await c.req.json();
    if (!from || !to || !type) {
      return c.json({ success: false, error: "from, to e type obrigatórios" }, 400);
    }
    const toUser = await kv.get(`user:${to}`);
    const callId = `call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const callData = {
      callId, from, to, type,
      fromName: fromName || from,
      fromPhoto: fromPhoto || "",
      toName: toUser?.name || to,
      toPhoto: toUser?.photo || "",
      status: "ringing",
      startedAt: new Date().toISOString(),
    };
    await kv.set(`call:incoming:${to}`, callData);
    await kv.set(`call:outgoing:${from}`, callData);
    console.log(`📞 Chamada iniciada: ${from} -> ${to} (${type})`);
    return c.json({ success: true, callId, call: callData });
  } catch (error) {
    console.error("❌ Erro ao iniciar chamada:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.get("/make-server-42377006/calls/incoming/:username", async (c) => {
  try {
    const username = c.req.param("username");
    const call = await kv.get(`call:incoming:${username}`);
    if (call && call.status === "ringing") {
      return c.json({ success: true, hasCall: true, call });
    }
    const outgoing = await kv.get(`call:outgoing:${username}`);
    if (outgoing) {
      return c.json({ success: true, hasCall: false, outgoingCall: outgoing });
    }
    return c.json({ success: true, hasCall: false });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-42377006/calls/answer", async (c) => {
  try {
    const { username, callId } = await c.req.json();
    const incoming = await kv.get(`call:incoming:${username}`);
    if (!incoming || incoming.callId !== callId) {
      return c.json({ success: false, error: "Chamada não encontrada" }, 404);
    }
    incoming.status = "connected";
    incoming.connectedAt = new Date().toISOString();
    await kv.set(`call:incoming:${username}`, incoming);
    const outgoing = await kv.get(`call:outgoing:${incoming.from}`);
    if (outgoing && outgoing.callId === callId) {
      outgoing.status = "connected";
      outgoing.connectedAt = incoming.connectedAt;
      await kv.set(`call:outgoing:${incoming.from}`, outgoing);
    }
    console.log(`✅ Chamada atendida: ${incoming.from} <-> ${username}`);
    return c.json({ success: true, call: incoming });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-42377006/calls/end", async (c) => {
  try {
    const { username } = await c.req.json();
    const incoming = await kv.get(`call:incoming:${username}`);
    if (incoming) {
      await kv.del(`call:outgoing:${incoming.from}`);
      await kv.del(`call:incoming:${username}`);
      console.log(`📵 Chamada encerrada por receptor: ${username}`);
      return c.json({ success: true });
    }
    const outgoing = await kv.get(`call:outgoing:${username}`);
    if (outgoing) {
      await kv.del(`call:incoming:${outgoing.to}`);
      await kv.del(`call:outgoing:${username}`);
      console.log(`📵 Chamada encerrada por chamador: ${username}`);
      return c.json({ success: true });
    }
    return c.json({ success: true, message: "Nenhuma chamada ativa" });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.get("/make-server-42377006/calls/status/:username", async (c) => {
  try {
    const username = c.req.param("username");
    const incoming = await kv.get(`call:incoming:${username}`);
    const outgoing = await kv.get(`call:outgoing:${username}`);
    return c.json({
      success: true,
      incoming: incoming || null,
      outgoing: outgoing || null,
      inCall: !!(incoming?.status === "connected" || outgoing?.status === "connected")
    });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);