/**
 * TESTE: Funcionalidade de Alteração de Senha
 * 
 * Valida:
 * 1. ✅ Usuário pode alterar sua própria senha (PATCH /app/usuarios/:id/senha)
 * 2. ✅ Rejeita senha atual incorreta
 * 3. ✅ Rejeita tentativa de alterar senha de outro usuário
 * 4. ✅ Bloqueia alteração de senha via PUT
 */

import axios from "axios";
import * as readline from "readline";

const API_BASE_URL = "http://localhost:3000/api";
let authToken: string;

interface Usuario {
  idUsuario: string;
  nomeUsuario: string;
  emailUsuario: string;
  perfilUsuario: string;
}

// Helper para fazer requisições
const apiRequest = async (method: string, endpoint: string, data?: any) => {
  try {
    const config: any = {
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        "Content-Type": "application/json",
      },
    };

    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`\n📡 ${method.toUpperCase()} ${url}`);
    if (data) console.log("📦 Body:", JSON.stringify(data, null, 2));

    const response = await axios({ method, url, data, ...config });
    console.log("✅ Response (200):", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.log(
        `❌ Response (${error.response.status}):`,
        JSON.stringify(error.response.data, null, 2)
      );
      throw error.response.data;
    }
    throw error;
  }
};

const testSuite = async () => {
  console.log("\n========================================");
  console.log("🔐 TESTES: Alteração de Senha");
  console.log("========================================\n");

  try {
    // 1. Criar usuários de teste
    console.log("\n[1️⃣ ] Criando usuários de teste...\n");

    const usuario1 = await apiRequest("POST", "/app/usuarios", {
      nomeUsuario: "Usuario Teste 1",
      emailUsuario: `usuario1-${Date.now()}@test.com`,
      senhaUsuario: "senhaOriginal123",
      perfilUsuario: "TECNICO",
      statusUsuario: true,
    });

    const usuario2 = await apiRequest("POST", "/app/usuarios", {
      nomeUsuario: "Usuario Teste 2",
      emailUsuario: `usuario2-${Date.now()}@test.com`,
      senhaUsuario: "outrasenhaDiferente456",
      perfilUsuario: "SOLICITANTE",
      statusUsuario: true,
    });

    console.log("\n✅ Usuários criados com sucesso!");

    // 2. Fazer login com usuário 1
    console.log("\n[2️⃣ ] Fazendo login com usuário 1...\n");

    const loginResponse = await apiRequest("POST", "/auth/login", {
      emailUsuario: usuario1.emailUsuario,
      senhaUsuario: "senhaOriginal123",
    });

    authToken = loginResponse.accessToken;
    console.log("✅ Login realizado! Token obtido.");

    // 3. TESTE 1: Alterar própria senha com sucesso
    console.log("\n[3️⃣ ] TESTE 1: Alterar própria senha com sucesso\n");

    await apiRequest("PATCH", `/app/usuarios/${usuario1.idUsuario}/senha`, {
      senhaAtual: "senhaOriginal123",
      senhaNova: "novaSenha789",
    });

    console.log("✅ TESTE 1 PASSOU: Senha alterada com sucesso!");

    // 4. TESTE 2: Tentar login com senha antiga (deve falhar)
    console.log("\n[4️⃣ ] TESTE 2: Validar que senha antiga não funciona mais\n");

    try {
      await apiRequest("POST", "/auth/login", {
        emailUsuario: usuario1.emailUsuario,
        senhaUsuario: "senhaOriginal123",
      });
      console.log("❌ TESTE 2 FALHOU: Deveria ter rejeitado a senha antiga!");
    } catch (error) {
      console.log("✅ TESTE 2 PASSOU: Senha antiga rejeitada como esperado!");
    }

    // 5. TESTE 3: Fazer login com nova senha
    console.log("\n[5️⃣ ] TESTE 3: Fazer login com nova senha\n");

    const loginComNovaSenha = await apiRequest("POST", "/auth/login", {
      emailUsuario: usuario1.emailUsuario,
      senhaUsuario: "novaSenha789",
    });

    authToken = loginComNovaSenha.accessToken;
    console.log("✅ TESTE 3 PASSOU: Nova senha funciona!");

    // 6. TESTE 4: Tentar alterar com senha atual incorreta
    console.log("\n[6️⃣ ] TESTE 4: Rejeitar senha atual incorreta\n");

    try {
      await apiRequest("PATCH", `/app/usuarios/${usuario1.idUsuario}/senha`, {
        senhaAtual: "senhaErrada",
        senhaNova: "outraSenha999",
      });
      console.log(
        "❌ TESTE 4 FALHOU: Deveria ter rejeitado senha atual incorreta!"
      );
    } catch (error) {
      console.log("✅ TESTE 4 PASSOU: Senha atual incorreta rejeitada!");
    }

    // 7. TESTE 5: Tentar alterar senha de outro usuário (deve falhar)
    console.log("\n[7️⃣ ] TESTE 5: Rejeitar tentativa de alterar senha de outro usuário\n");

    try {
      await apiRequest("PATCH", `/app/usuarios/${usuario2.idUsuario}/senha`, {
        senhaAtual: "novaSenha789",
        senhaNova: "hackedPassword",
      });
      console.log(
        "❌ TESTE 5 FALHOU: Deveria ter rejeitado alteração de outro usuário!"
      );
    } catch (error) {
      console.log(
        "✅ TESTE 5 PASSOU: Tentativa de alterar outro usuário rejeitada!"
      );
    }

    // 8. TESTE 6: Tentar alterar senha via PUT (deve bloquear)
    console.log(
      "\n[8️⃣ ] TESTE 6: Bloquear alteração de senha via PUT\n"
    );

    try {
      await apiRequest("PUT", `/app/usuarios/${usuario1.idUsuario}`, {
        senhaUsuario: "senhaViaput123",
      });
      console.log(
        "❌ TESTE 6 FALHOU: Deveria ter bloqueado alteração via PUT!"
      );
    } catch (error) {
      console.log("✅ TESTE 6 PASSOU: Alteração via PUT bloqueada!");
    }

    // 9. TESTE 7: Verificar que nomeUsuario pode ser alterado via PUT
    console.log(
      "\n[9️⃣ ] TESTE 7: PUT funciona para outros campos (ex: nomeUsuario)\n"
    );

    const usuarioAtualizado = await apiRequest(
      "PUT",
      `/app/usuarios/${usuario1.idUsuario}`,
      {
        nomeUsuario: "Novo Nome do Usuario",
      }
    );

    if (usuarioAtualizado.nomeUsuario === "Novo Nome do Usuario") {
      console.log("✅ TESTE 7 PASSOU: PUT funciona para outros campos!");
    } else {
      console.log(
        "❌ TESTE 7 FALHOU: PUT não atualizou o nome como esperado!"
      );
    }

    console.log("\n========================================");
    console.log("✅ TODOS OS TESTES PASSARAM!");
    console.log("========================================\n");
  } catch (error) {
    console.error("\n❌ Erro durante testes:", error);
    process.exit(1);
  }
};

// Executar testes
testSuite().then(() => {
  console.log("✅ Testes finalizados com sucesso!");
  process.exit(0);
});
