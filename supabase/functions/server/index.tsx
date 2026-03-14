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
      },
    });
  } catch (error) {
    console.error("❌ Erro no login step1:", error);
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
    
    if (!code) {
      return c.json({ success: false, error: "Código obrigatório" }, 400);
    }
    
    // Detectar tipo pelo prefixo
    const prefix = code.split("-")[0];
    console.log("📌 Prefixo detectado:", prefix);
    let type = "";
    
    if (prefix === "V") type = "vendedor";
    else if (prefix === "C") type = "cliente";
    else if (prefix === "M") type = "motorista";
    else {
      console.log("❌ Prefixo inválido:", prefix);
      return c.json({ success: false, error: "Código inválido" }, 400);
    }
    
    console.log("📋 Tipo detectado:", type);
    
    // Buscar código
    const codes = await kv.get(`codes:${type}`) || [];
    console.log("📊 Códigos no banco:", codes);
    console.log("🔢 Total de códigos:", codes.length);
    
    const codeObj = codes.find((c: any) => c.code === code);
    console.log("🎯 Código encontrado?", codeObj ? "SIM" : "NÃO");
    console.log("📄 Dados do código:", codeObj);
    
    if (!codeObj) {
      console.log("❌ Código não encontrado na lista");
      return c.json({ success: false, error: "Código não encontrado" }, 404);
    }
    
    if (codeObj.used) {
      console.log("❌ Código já foi usado por:", codeObj.usedBy);
      return c.json({ success: false, error: "Código já utilizado" }, 400);
    }
    
    console.log("✅ Código válido!");
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
app.post("/make-server-42377006/register", async (c) => {
  try {
    const { username, pin, name, role, inviteCode } = await c.req.json();
    console.log("👤 REGISTRO - Recebido:", { username, role, name, inviteCode });
    
    if (!username || !pin || !name || !role) {
      return c.json({ success: false, error: "Dados incompletos" }, 400);
    }
    
    // Verificar se username já existe
    const existing = await kv.get(`user:${username}`);
    if (existing) {
      return c.json({ success: false, error: "Username já existe" }, 400);
    }
    
    let createdByUser = null;
    
    // Se não for admin, validar código de convite
    if (role !== "admin" && inviteCode) {
      console.log("🔍 Validando código de convite:", inviteCode);
      const codes = await kv.get(`codes:${role}`) || [];
      console.log("📋 Códigos no banco:", codes);
      
      const codeIndex = codes.findIndex((c: any) => c.code === inviteCode);
      const codeObj = codes[codeIndex];
      console.log("🎯 Código encontrado?", codeObj ? "SIM" : "NÃO");
      
      if (!codeObj) {
        console.log("❌ Código não encontrado");
        return c.json({ success: false, error: "Código inválido" }, 400);
      }
      
      if (codeObj.used) {
        console.log("❌ Código já foi usado por:", codeObj.usedBy);
        return c.json({ success: false, error: "Este código já foi utilizado" }, 400);
      }
      
      // Marcar código como usado IMEDIATAMENTE
      codes[codeIndex].used = true;
      codes[codeIndex].usedBy = username;
      codes[codeIndex].usedAt = new Date().toISOString();
      
      await kv.set(`codes:${role}`, codes);
      console.log("✅ Código marcado como usado:", codes[codeIndex]);
      
      // Guardar quem criou este usuário
      createdByUser = codeObj.generatedBy;
    }
    
    // Criar usuário
    const newUser = {
      username,
      pin,
      name,
      role,
      photo: name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2),
      createdAt: new Date().toISOString(),
      createdBy: createdByUser || "direct", // Username de quem criou este usuário
    };
    
    console.log("💾 Salvando usuário:", newUser);
    await kv.set(`user:${username}`, newUser);
    
    // Adicionar à lista de usuários do tipo
    const users = await kv.get(`users:${role}`) || [];
    users.push(username);
    await kv.set(`users:${role}`, users);
    
    // Adicionar à lista de usuários criados pelo criador
    if (createdByUser) {
      const createdUsers = await kv.get(`created_by:${createdByUser}`) || [];
      createdUsers.push({ username, role, createdAt: newUser.createdAt });
      await kv.set(`created_by:${createdByUser}`, createdUsers);
      console.log(`✅ Usuário adicionado à lista de ${createdByUser}`);
    }
    
    console.log("✅ Usuário registrado com sucesso!");
    
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
    
    const createdList = await kv.get(`created_by:${username}`) || [];
    console.log("📋 Lista de criados:", createdList);
    
    const users = [];
    
    for (const item of createdList) {
      const user = await kv.get(`user:${item.username}`);
      if (user) {
        const { pin, ...userWithoutPin } = user;
        users.push(userWithoutPin);
      }
    }
    
    console.log("✅ Usuários encontrados:", users);
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

Deno.serve(app.fetch);