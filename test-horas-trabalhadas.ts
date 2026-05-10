/**
 * Script de teste: Validar cálculo automático de horas_trabalhadas
 * 
 * Fluxo:
 * 1. Autenticar
 * 2. Criar uma OS (status: ABERTO)
 * 3. Mover para EM_ANDAMENTO (registra inicioEm automaticamente)
 * 4. Aguardar alguns segundos
 * 5. Finalizar para CONCLUIDO (registra conclusaoEm + calcula horasTrabalhadas)
 * 6. Validar que horasTrabalhadas foi preenchido corretamente
 */

const API_URL = "http://localhost:3000";

interface TestResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
}

const results: TestResult[] = [];
let authToken = "";

async function fetchJSON(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options?.headers,
    },
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `HTTP ${response.status}: ${error}`
    );
  }
  return response.json();
}

async function runTest() {
  console.log("\n🧪 Iniciando teste de cálculo automático de horas_trabalhadas\n");

  // ====== PASSO 0: AUTENTICAR ======
  console.log("🔐 [PASSO 0] Autenticando...");
  try {
    const loginRes = await fetchJSON(`${API_URL}/auth/login`, {
      method: "POST",
      body: JSON.stringify({
        email: "admin@email.com",
        senha: "admin123",
      }),
    });

    authToken = loginRes.token;
    console.log(`  ✓ Token obtido: ${authToken.substring(0, 20)}...`);
    results.push({
      step: "Autenticação",
      success: true,
      data: { token: authToken.substring(0, 20) + "..." },
    });
  } catch (error: any) {
    console.error(`  ✗ Erro ao autenticar:`, error.message);
    results.push({
      step: "Autenticação",
      success: false,
      error: error.message,
    });
    console.log("\n⚠️  Verifique se o banco tem um usuário admin com email 'admin@email.com' e senha 'admin123'");
    return;
  }

  // ====== PASSO 1: Criar OS ======
  console.log("\n📝 [PASSO 1] Criando nova Ordem de Serviço...");
  let ordemId: string;
  let equipamentoId: string;
  let tecnicoId: string;

  try {
    // Primeiro, buscar um equipamento e um técnico existentes
    const equipamentos = await fetchJSON(`${API_URL}/app/equipamentos`);
    if (!equipamentos || equipamentos.length === 0) {
      throw new Error("Nenhum equipamento encontrado no banco");
    }
    equipamentoId = equipamentos[0].id;
    console.log(`  ✓ Equipamento encontrado: ${equipamentoId}`);

    const usuarios = await fetchJSON(`${API_URL}/app/usuarios`);
    if (!usuarios || usuarios.length === 0) {
      throw new Error("Nenhum usuário encontrado no banco");
    }
    tecnicoId = usuarios.find(
      (u: any) => u.perfilUsuario === "TECNICO"
    )?.idUsuario;
    if (!tecnicoId) {
      tecnicoId = usuarios[0].idUsuario;
    }
    console.log(`  ✓ Técnico encontrado: ${tecnicoId}`);

    const novaOrdem = await fetchJSON(`${API_URL}/app/ordens`, {
      method: "POST",
      body: JSON.stringify({
        idEquipamento: equipamentoId,
        idTecnico: tecnicoId,
        tipoManutencao: "CORRETIVA",
        prioridadeOrdemServico: "MEDIA",
        statusOrdemServico: "ABERTO",
        descricaoFalha: "Teste automático de horas",
      }),
    });

    ordemId = novaOrdem.idOrdemServico;
    console.log(`  ✓ OS criada: ${ordemId}`);
    console.log(`  ✓ Número OS: ${novaOrdem.numeroOrdemServico}`);
    results.push({
      step: "Criar OS",
      success: true,
      data: { id: ordemId, numero: novaOrdem.numeroOrdemServico },
    });
  } catch (error: any) {
    console.error(`  ✗ Erro ao criar OS:`, error.message);
    results.push({
      step: "Criar OS",
      success: false,
      error: error.message,
    });
    return;
  }

  // ====== PASSO 2: Mover para EM_ANDAMENTO ======
  console.log("\n📝 [PASSO 2] Movendo OS para EM_ANDAMENTO...");
  try {
    const updateRes = await fetchJSON(`${API_URL}/app/ordens/${ordemId}`, {
      method: "PATCH",
      body: JSON.stringify({
        statusOrdemServico: "EM_ANDAMENTO",
      }),
    });

    const inicioEm = updateRes.inicioEm;
    console.log(`  ✓ Status alterado para EM_ANDAMENTO`);
    console.log(`  ✓ inicioEm registrado: ${inicioEm}`);
    results.push({
      step: "Mover para EM_ANDAMENTO",
      success: true,
      data: { inicioEm },
    });
  } catch (error: any) {
    console.error(`  ✗ Erro ao mover para EM_ANDAMENTO:`, error.message);
    results.push({
      step: "Mover para EM_ANDAMENTO",
      success: false,
      error: error.message,
    });
    return;
  }

  // ====== PASSO 3: Aguardar e Finalizar ======
  console.log("\n⏳ [PASSO 3] Aguardando 3 segundos antes de finalizar...");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log("\n📝 [PASSO 3b] Finalizando OS para CONCLUIDO...");
  try {
    const finalRes = await fetchJSON(`${API_URL}/app/ordens/${ordemId}`, {
      method: "PATCH",
      body: JSON.stringify({
        statusOrdemServico: "CONCLUIDO",
        descricaoServico: "Teste automático - horas calculadas",
        // NÃO enviando horasTrabalhadas propositalmente!
      }),
    });

    console.log(`  ✓ Status alterado para CONCLUIDO`);
    console.log(`  ✓ conclusaoEm: ${finalRes.conclusaoEm}`);
    console.log(`  ✓ horasTrabalhadas: ${finalRes.horasTrabalhadas}`);

    results.push({
      step: "Finalizar com cálculo automático",
      success: true,
      data: {
        conclusaoEm: finalRes.conclusaoEm,
        horasTrabalhadas: finalRes.horasTrabalhadas,
      },
    });
  } catch (error: any) {
    console.error(`  ✗ Erro ao finalizar:`, error.message);
    results.push({
      step: "Finalizar com cálculo automático",
      success: false,
      error: error.message,
    });
    return;
  }

  // ====== PASSO 4: Validar resultado ======
  console.log("\n✅ [PASSO 4] Validando resultado...");
  try {
    const getRes = await fetchJSON(`${API_URL}/app/ordens/${ordemId}`);
    const {
      horasTrabalhadas,
      inicioEm,
      conclusaoEm,
      statusOrdemServico,
    } = getRes;

    console.log("\n📊 Resultado Final:");
    console.log(`  Status: ${statusOrdemServico}`);
    console.log(`  Início: ${inicioEm}`);
    console.log(`  Conclusão: ${conclusaoEm}`);
    console.log(`  Horas Trabalhadas: ${horasTrabalhadas}`);

    // Validar se horasTrabalhadas foi preenchido
    if (horasTrabalhadas !== null && horasTrabalhadas !== undefined) {
      console.log(`\n✅ SUCESSO! horasTrabalhadas foi calculado automaticamente!`);
      console.log(
        `   Valor: ${horasTrabalhadas} horas (esperado: ~0.08 horas = 3 segundos)`
      );
      results.push({
        step: "Validação",
        success: true,
        data: { horasTrabalhadas, status: "CALCULADO AUTOMATICAMENTE" },
      });
    } else {
      console.log(`\n❌ FALHA! horasTrabalhadas está NULL ou undefined`);
      results.push({
        step: "Validação",
        success: false,
        error: `horasTrabalhadas é ${horasTrabalhadas}`,
      });
    }
  } catch (error: any) {
    console.error(`  ✗ Erro ao validar:`, error.message);
    results.push({
      step: "Validação",
      success: false,
      error: error.message,
    });
  }

  // ====== RESUMO ======
  console.log("\n" + "=".repeat(60));
  console.log("📋 RESUMO DO TESTE");
  console.log("=".repeat(60));
  const successCount = results.filter((r) => r.success).length;
  const totalCount = results.length;

  results.forEach((r) => {
    const icon = r.success ? "✅" : "❌";
    console.log(`${icon} ${r.step}`);
    if (r.data) {
      console.log(
        `   ${JSON.stringify(r.data, null, 2)
          .split("\n")
          .join("\n   ")}`
      );
    }
    if (r.error) {
      console.log(`   Erro: ${r.error}`);
    }
  });

  console.log(`\nResultado: ${successCount}/${totalCount} testes passaram`);
  console.log("=".repeat(60) + "\n");

  process.exit(successCount === totalCount ? 0 : 1);
}

runTest().catch((error) => {
  console.error("Erro fatal:", error);
  process.exit(1);
});
  console.log("\n🧪 Iniciando teste de cálculo automático de horas_trabalhadas\n");

  // ====== PASSO 1: Criar OS ======
  console.log("📝 [PASSO 1] Criando nova Ordem de Serviço...");
  let ordemId: string;
  let equipamentoId: string;
  let tecnicoId: string;

  try {
    // Primeiro, buscar um equipamento e um técnico existentes
    const equipamentos = await fetchJSON(`${API_URL}/app/equipamentos`);
    if (!equipamentos || equipamentos.length === 0) {
      throw new Error("Nenhum equipamento encontrado no banco");
    }
    equipamentoId = equipamentos[0].id;
    console.log(`  ✓ Equipamento encontrado: ${equipamentoId}`);

    const usuarios = await fetchJSON(`${API_URL}/app/usuarios`);
    if (!usuarios || usuarios.length === 0) {
      throw new Error("Nenhum usuário encontrado no banco");
    }
    tecnicoId = usuarios.find(
      (u: any) => u.perfilUsuario === "TECNICO"
    )?.idUsuario;
    if (!tecnicoId) {
      tecnicoId = usuarios[0].idUsuario;
    }
    console.log(`  ✓ Técnico encontrado: ${tecnicoId}`);

    const novaOrdem = await fetchJSON(`${API_URL}/app/ordens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idEquipamento: equipamentoId,
        idTecnico: tecnicoId,
        tipoManutencao: "CORRETIVA",
        prioridadeOrdemServico: "MEDIA",
        statusOrdemServico: "ABERTO",
        descricaoFalha: "Teste automático de horas",
      }),
    });

    ordemId = novaOrdem.idOrdemServico;
    console.log(`  ✓ OS criada: ${ordemId}`);
    console.log(`  ✓ Número OS: ${novaOrdem.numeroOrdemServico}`);
    results.push({
      step: "Criar OS",
      success: true,
      data: { id: ordemId, numero: novaOrdem.numeroOrdemServico },
    });
  } catch (error: any) {
    console.error(`  ✗ Erro ao criar OS:`, error.message);
    results.push({
      step: "Criar OS",
      success: false,
      error: error.message,
    });
    return;
  }

  // ====== PASSO 2: Mover para EM_ANDAMENTO ======
  console.log("\n📝 [PASSO 2] Movendo OS para EM_ANDAMENTO...");
  try {
    const updateRes = await fetchJSON(`${API_URL}/app/ordens/${ordemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        statusOrdemServico: "EM_ANDAMENTO",
      }),
    });

    const inicioEm = updateRes.inicioEm;
    console.log(`  ✓ Status alterado para EM_ANDAMENTO`);
    console.log(`  ✓ inicioEm registrado: ${inicioEm}`);
    results.push({
      step: "Mover para EM_ANDAMENTO",
      success: true,
      data: { inicioEm },
    });
  } catch (error: any) {
    console.error(`  ✗ Erro ao mover para EM_ANDAMENTO:`, error.message);
    results.push({
      step: "Mover para EM_ANDAMENTO",
      success: false,
      error: error.message,
    });
    return;
  }

  // ====== PASSO 3: Aguardar e Finalizar ======
  console.log("\n⏳ [PASSO 3] Aguardando 3 segundos antes de finalizar...");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log("\n📝 [PASSO 3b] Finalizando OS para CONCLUIDO...");
  try {
    const finalRes = await fetchJSON(`${API_URL}/app/ordens/${ordemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        statusOrdemServico: "CONCLUIDO",
        descricaoServico: "Teste automático - horas calculadas",
        // NÃO enviando horasTrabalhadas propositalmente!
      }),
    });

    console.log(`  ✓ Status alterado para CONCLUIDO`);
    console.log(`  ✓ conclusaoEm: ${finalRes.conclusaoEm}`);
    console.log(`  ✓ horasTrabalhadas: ${finalRes.horasTrabalhadas}`);

    results.push({
      step: "Finalizar com cálculo automático",
      success: true,
      data: {
        conclusaoEm: finalRes.conclusaoEm,
        horasTrabalhadas: finalRes.horasTrabalhadas,
      },
    });
  } catch (error: any) {
    console.error(`  ✗ Erro ao finalizar:`, error.message);
    results.push({
      step: "Finalizar com cálculo automático",
      success: false,
      error: error.message,
    });
    return;
  }

  // ====== PASSO 4: Validar resultado ======
  console.log("\n✅ [PASSO 4] Validando resultado...");
  try {
    const getRes = await fetchJSON(`${API_URL}/app/ordens/${ordemId}`);
    const {
      horasTrabalhadas,
      inicioEm,
      conclusaoEm,
      statusOrdemServico,
    } = getRes;

    console.log("\n📊 Resultado Final:");
    console.log(`  Status: ${statusOrdemServico}`);
    console.log(`  Início: ${inicioEm}`);
    console.log(`  Conclusão: ${conclusaoEm}`);
    console.log(`  Horas Trabalhadas: ${horasTrabalhadas}`);

    // Validar se horasTrabalhadas foi preenchido
    if (horasTrabalhadas !== null && horasTrabalhadas !== undefined) {
      console.log(`\n✅ SUCESSO! horasTrabalhadas foi calculado automaticamente!`);
      console.log(
        `   Valor: ${horasTrabalhadas} horas (esperado: ~0.08 horas = 3 segundos)`
      );
      results.push({
        step: "Validação",
        success: true,
        data: { horasTrabalhadas, status: "CALCULADO AUTOMATICAMENTE" },
      });
    } else {
      console.log(`\n❌ FALHA! horasTrabalhadas está NULL ou undefined`);
      results.push({
        step: "Validação",
        success: false,
        error: `horasTrabalhadas é ${horasTrabalhadas}`,
      });
    }
  } catch (error: any) {
    console.error(`  ✗ Erro ao validar:`, error.message);
    results.push({
      step: "Validação",
      success: false,
      error: error.message,
    });
  }

  // ====== RESUMO ======
  console.log("\n" + "=".repeat(60));
  console.log("📋 RESUMO DO TESTE");
  console.log("=".repeat(60));
  const successCount = results.filter((r) => r.success).length;
  const totalCount = results.length;

  results.forEach((r) => {
    const icon = r.success ? "✅" : "❌";
    console.log(`${icon} ${r.step}`);
    if (r.data) {
      console.log(
        `   ${JSON.stringify(r.data, null, 2)
          .split("\n")
          .join("\n   ")}`
      );
    }
    if (r.error) {
      console.log(`   Erro: ${r.error}`);
    }
  });

  console.log(`\nResultado: ${successCount}/${totalCount} testes passaram`);
  console.log("=".repeat(60) + "\n");

  process.exit(successCount === totalCount ? 0 : 1);
}

runTest().catch((error) => {
  console.error("Erro fatal:", error);
  process.exit(1);
});
