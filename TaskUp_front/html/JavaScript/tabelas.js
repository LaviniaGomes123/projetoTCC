// ====== Função para criar botões Editar e Excluir ======
function criarBotoesEditarExcluir(tipoTabela) {
  const btnEditar = document.createElement('button');
  btnEditar.className = 'btn-editar';
  btnEditar.textContent = 'Editar';

  btnEditar.addEventListener('click', (event) => {
    const tr = event.target.closest('tr');
    const id = tr.querySelector('td').textContent.trim();

    let urlEditar;
    switch (tipoTabela) {
      case 'clientes':
        urlEditar = `editarCliente.html?id=${id}`;
        break;
      case 'aparelhos':
        urlEditar = `editarAparelho.html?id=${id}`;
        break;
      case 'pecas':
        urlEditar = `editarpeca.html?id=${id}`;
        break;
      default:
        alert('Tipo de tabela desconhecido');
        return;
    }
    window.location.href = urlEditar;
  });

  const btnExcluir = document.createElement('button');
  btnExcluir.className = 'btn-excluir';
  btnExcluir.textContent = 'Excluir';

  btnExcluir.addEventListener('click', async (event) => {
    const tr = event.target.closest('tr');
    const id = tr.querySelector('td').textContent.trim();

    if (confirm(`Deseja realmente excluir o registro de ID ${id}?`)) {
      try {
        let urlExcluir;
        switch (tipoTabela) {
          case 'clientes':
            urlExcluir = `http://localhost:8080/api/cliente/${id}`;
            break;
          case 'aparelhos':
            urlExcluir = `http://localhost:8080/api/aparelhos/${id}`;
            break;
          case 'pecas':
            urlExcluir = `http://localhost:8080/api/peca/${id}`;
            break;
          default:
            alert('Tipo de tabela desconhecido');
            return;
        }

        const res = await fetch(urlExcluir, { method: 'DELETE' });
        if (!res.ok) throw new Error('Erro ao excluir');
        alert(`Registro ${id} excluído com sucesso.`);
        tr.remove();
      } catch (error) {
        alert('Erro ao excluir registro.');
        console.error(error);
      }
    }
  });

  const container = document.createElement('div');
  container.appendChild(btnEditar);
  container.appendChild(btnExcluir);
  return container;
}

// ====== Funções auxiliares ======
function formatarDataArray(dataArray) {
  if (!dataArray) return '';
  const [ano, mes, dia, hora, minuto] = dataArray;
  return `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${ano} ${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
}

// ====== Funções para gerar PDFs ======
function gerarPDF(historico) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("TaskUP - Ordem de Serviço", 10, 10);
  doc.text(`ID Histórico: ${historico.id_historico ?? ''}`, 10, 20);
  doc.text(`Cliente: ${historico.cliente?.nome_cliente ?? ''}`, 10, 30);
  doc.text(`Aparelho: ${historico.aparelho?.nomeAparelho ?? ''}`, 10, 40);
  doc.text(`Defeito: ${historico.defeito ?? ''}`, 10, 50);
  doc.text(`Entrada: ${formatarDataArray(historico.data_entrada)}`, 10, 60);
  doc.text(`Saída: ${formatarDataArray(historico.data_saida)}`, 10, 70);
  doc.text(`Peças Utilizadas: ${historico.pecas_aplicadas ?? ''}`, 10, 80);
  doc.text(`Status: ${historico.status_servico ?? ''}`, 10, 90);
  doc.text(`Técnico: ${historico.nome_tecnico ?? ''}`, 10, 100);
  doc.text(`Valor: R$ ${historico.valor_total?.toFixed(2) ?? ''}`, 10, 110);

  doc.save(`OrdemServico_${historico.id_historico ?? 'sem-id'}.pdf`);
}


    
    async function gerarRelatorioPecasUtilizadas(dataInicio, dataFim) {
  try {
    // Verificar se as datas são válidas
    if (!dataInicio || !dataFim) {
      throw new Error('Datas de início e fim são obrigatórias');
    }
    
    // Converter para formato ISO e ajustar o horário para cobrir todo o dia
    const dataInicioISO = new Date(dataInicio).toISOString();
    const dataFimISO = new Date(new Date(dataFim).setHours(23, 59, 59, 999)).toISOString();

    // Montar URL com parâmetros de filtro
    const url = `http://localhost:8080/api/pecas_utilizadas?dataInicio=${encodeURIComponent(dataInicioISO)}&dataFim=${encodeURIComponent(dataFimISO)}`;
    
    console.log('URL da requisição:', url); // Para debug

    const res = await fetch(url);
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erro ao buscar peças utilizadas: ${res.status} - ${errorText}`);
    }
    
    const pecasUtilizadas = await res.json();
    
    // Verificar se os dados foram recebidos corretamente
    if (!Array.isArray(pecasUtilizadas)) {
      throw new Error('Dados recebidos não estão no formato esperado');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Título do relatório
    doc.setFontSize(16);
    doc.text("Relatório de Consumo de Peças", 105, 15, null, null, "center");
    doc.setFontSize(12);
    doc.text(`Período: ${formatarDataParaExibicao(dataInicio)} a ${formatarDataParaExibicao(dataFim)}`, 105, 22, null, null, "center");

    // Cabeçalho da tabela
    const headers = [
      "ID",
      "Aparelho ID", 
      "Peça ID",
      "Quantidade",
      "Data Utilização"
    ];

    // Preparar dados da tabela
    const dadosTabela = pecasUtilizadas.map(item => {
      // Validar cada item antes de usar
      if (!item) return ['Dado inválido', '', '', '', ''];
      
      return [
        item.id || 'N/A',
        item.aparelho?.id || 'N/A',
        item.peca?.id || 'N/A',
        item.quantidade_utilizada || '0',
        item.data_utilizacao ? formatarDataArray(item.data_utilizacao) : 'Data não informada'
      ];
    });

    // Se não houver dados, adicionar uma mensagem
    if (dadosTabela.length === 0) {
      doc.setFontSize(12);
      doc.text("Nenhuma peça foi utilizada no período selecionado", 105, 40, null, null, "center");
    } else {
      // Gerar tabela usando autoTable
      doc.autoTable({
        head: [headers],
        body: dadosTabela,
        startY: 30,
        styles: { fontSize: 10 },
        headStyles: { 
          fillColor: [36, 192, 235], 
          textColor: 255, 
          fontStyle: 'bold' 
        },
        margin: { left: 10, right: 10 }
      });

      // Calcular total de peças utilizadas
      const totalPecas = pecasUtilizadas.reduce((sum, item) => {
        const quantidade = parseInt(item.quantidade_utilizada) || 0;
        return sum + quantidade;
      }, 0);
      
      // Adicionar total ao final do relatório
      const finalY = doc.lastAutoTable.finalY || 30;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Total de peças utilizadas: ${totalPecas}`, 10, finalY + 10);
    }

    // Salvar o PDF
    doc.save(`Relatorio_Pecas_Utilizadas_${dataInicio}_a_${dataFim}.pdf`);

  } catch (error) {
    console.error('Erro detalhado:', error);
    alert('Erro ao gerar relatório: ' + error.message);
    
    // Criar um PDF com mensagem de erro
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text("Erro ao gerar relatório", 105, 15, null, null, "center");
    doc.text(error.message, 10, 30);
    doc.save(`Erro_Relatorio_Pecas_${new Date().toISOString()}.pdf`);
  }
}

// Função auxiliar para formatar data para exibição
function formatarDataParaExibicao(dataString) {
  try {
    const date = new Date(dataString);
    return date.toLocaleDateString('pt-BR');
  } catch (e) {
    return dataString; // Retorna o original se não puder formatar
  }
}

async function gerarRelatorioCustoOperacionalPDF(dataInicio, dataFim) {
  try {
    console.log("Iniciando relatório... Datas:", dataInicio, dataFim);

    // 1. Converter datas para o formato correto
    function parseDate(input) {
      if (input.includes('-')) { // Formato YYYY-MM-DD (input type="date")
        return new Date(input);
      } else { // Formato DD/MM/YYYY
        const [dia, mes, ano] = input.split('/');
        return new Date(ano, mes - 1, dia);
      }
    }

    const dataInicioObj = parseDate(dataInicio);
    const dataFimObj = parseDate(dataFim);
    dataFimObj.setHours(23, 59, 59, 999); // Ajusta para fim do dia

    console.log("Datas convertidas:", dataInicioObj, dataFimObj);

    // 2. Buscar dados da API
    const res = await fetch('http://localhost:8080/api/historico');
    if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
    const historico = await res.json();
    console.log("Dados da API:", historico);

    // 3. Filtrar por período
    const historicoFiltrado = historico.filter(item => {
      const dataItem = item.data_saida || item.data_entrada;
      if (!dataItem) return false;

      let dataObj;
      if (Array.isArray(dataItem)) { // Formato [ano, mês, dia, ...]
        dataObj = new Date(dataItem[0], dataItem[1] - 1, dataItem[2]);
      } else if (typeof dataItem === 'string') { // Formato ISO
        dataObj = new Date(dataItem);
      } else {
        return false;
      }

      return dataObj >= dataInicioObj && dataObj <= dataFimObj;
    });

    console.log("Dados filtrados:", historicoFiltrado);

    // 4. Gerar PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Cabeçalho
    doc.setFontSize(16);
    doc.text("Relatório de Custo Operacional", 105, 15, null, null, "center");
    doc.setFontSize(12);
    doc.text(`Período: ${dataInicio} a ${dataFim}`, 105, 22, null, null, "center");

    if (historicoFiltrado.length === 0) {
      doc.setFontSize(12);
      doc.text("Nenhum serviço encontrado no período selecionado", 105, 40, null, null, "center");
    } else {
      // Preparar dados da tabela
      const dadosTabela = historicoFiltrado.map(item => {
        const valor = parseFloat(item.valor_total || 0);
        return [
          item.id_historico || item.id || '',
          item.cliente?.nome_cliente || 'Cliente não informado',
          item.aparelho?.nomeAparelho || item.nomeAparelho || 'Aparelho não informado',
          `R$ ${valor.toFixed(2)}`,
          item.status_servico || item.status || 'Status não informado',
          item.nome_tecnico || 'Técnico não informado'
        ];
      });

      // Adicionar tabela
      doc.autoTable({
        head: [['ID', 'Cliente', 'Aparelho', 'Valor', 'Status', 'Técnico']],
        body: dadosTabela,
        startY: 30,
        styles: { fontSize: 9 },
        headStyles: { 
          fillColor: [36, 192, 235],
          textColor: 255,
          fontStyle: 'bold'
        }
      });

      // Calcular totais
      const total = historicoFiltrado.reduce((sum, item) => sum + (parseFloat(item.valor_total) || 0), 0);
      const finalY = doc.lastAutoTable.finalY || 30;

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Total: R$ ${total.toFixed(2)}`, 14, finalY + 10);
      doc.text(`Total de serviços: ${historicoFiltrado.length}`, 14, finalY + 20);
    }

    doc.save(`Relatorio_Custo_Operacional_${dataInicio.replace(/\//g, '-')}_a_${dataFim.replace(/\//g, '-')}.pdf`);

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    alert('Erro ao gerar relatório: ' + error.message);
    
    // Criar PDF de erro
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text("Erro ao gerar relatório", 105, 15, null, null, "center");
    doc.text(error.message, 10, 30);
    doc.save(`Erro_Relatorio_Custo_${new Date().toISOString()}.pdf`);
  }
}

// Função auxiliar para formatar data
function formatarDataParaExibicao(dataString) {
  try {
    const date = new Date(dataString);
    return date.toLocaleDateString('pt-BR');
  } catch (e) {
    return dataString;
  }
}
// ====== Funções para carregar tabelas ======
async function carregarClientes() {
  try {
    const res = await fetch('http://localhost:8080/api/cliente');
    if (!res.ok) throw new Error('Erro ao buscar clientes');
    const clientes = await res.json();

    const tbody = document.querySelector('#tabela-clientes tbody');
    tbody.innerHTML = '';
    const ultimos5 = clientes.slice(-5);

    ultimos5.forEach(cliente => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${cliente.id}</td>
        <td>${cliente.nome_cliente}</td>
        <td>${cliente.cpf ?? ""}</td>
        <td>${cliente.cnpj ?? ""}</td>
        <td>${cliente.cep}</td>
        <td>${cliente.endereco}</td>
        <td>${cliente.numero}</td>
        <td>${cliente.bairro}</td>
        <td>${cliente.cidade}</td>
        <td>${cliente.estado}</td>
        <td>${cliente.email}</td>
        <td>${cliente.telefone}</td>
      `;

      const tdAcoes = document.createElement('td');
      tdAcoes.appendChild(criarBotoesEditarExcluir('clientes'));
      tr.appendChild(tdAcoes);
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error(error);
    alert('Erro ao carregar clientes');
  }
}

async function carregarAparelhos() {
  try {
    const res = await fetch('http://localhost:8080/api/aparelhos');
    if (!res.ok) throw new Error('Erro ao buscar aparelhos');
    const aparelhos = await res.json();

    const tbody = document.querySelector('#tabela-aparelhos tbody');
    tbody.innerHTML = '';
    const ultimos5 = aparelhos.slice(-5);

    ultimos5.forEach(aparelho => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${aparelho.id}</td>
        <td>${aparelho.cliente?.id || ''}</td>
        <td>${aparelho.nomeAparelho || ''}</td>
        <td>${aparelho.defeito || ''}</td>
        <td>${aparelho.servico_executados || ''}</td>
        <td>${aparelho.pecas_aplicadas || ''}</td>
        <td>${aparelho.quantidade_aplicada || ''}</td>
        <td>${aparelho.nome_tecnico || ''}</td>
        <td>${aparelho.dataCadastro ? new Date(aparelho.dataCadastro).toLocaleDateString() : ''}</td>
        <td>${aparelho.observacoes || ''}</td>
        <td>${aparelho.valor_total || ''}</td>
        <td>${aparelho.status || ''}</td>
        <td><img src="${aparelho.foto_aparelho || '#'}" alt="Foto" style="max-width: 60px; max-height: 60px;"></td>
      `;

      const tdAcoes = document.createElement('td');
      tdAcoes.appendChild(criarBotoesEditarExcluir('aparelhos'));
      tr.appendChild(tdAcoes);
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error(error);
    alert('Erro ao carregar aparelhos');
  }
}

async function carregarHistorico() {
  try {
    const res = await fetch('http://localhost:8080/api/historico');
    if (!res.ok) throw new Error('Erro ao buscar histórico');
    const historico = await res.json();

    const tbody = document.querySelector('#tabela-historico tbody');
    if (!tbody) {
      console.error('tbody da tabela-historico não encontrado no DOM!');
      return;
    }
    tbody.innerHTML = '';

    historico.forEach(item => {
      const dataEntrada = Array.isArray(item.data_entrada) ? formatarDataArray(item.data_entrada) : (item.data_entrada ? new Date(item.data_entrada).toLocaleString() : '');
      const dataSaida = Array.isArray(item.data_saida) ? formatarDataArray(item.data_saida) : (item.data_saida ? new Date(item.data_saida).toLocaleString() : '');
      let valor = parseFloat(item.valor_total);
      valor = isNaN(valor) ? '' : `R$ ${valor.toFixed(2)}`;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.id_historico ?? item.id ?? ''}</td>
        <td>${item.cliente?.nome_cliente || ''}</td>
        <td>${item.aparelho?.nomeAparelho || ''}</td>
        <td>${item.defeito || ''}</td>
        <td>${dataEntrada}</td>
        <td>${dataSaida}</td>
        <td>${item.pecas_aplicadas || ''}</td>
        <td>${item.status_servico || ''}</td>
        <td>${item.nome_tecnico || ''}</td>
        <td>${valor}</td>
      `;

      const tdAcoes = document.createElement('td');
      const btnPdf = document.createElement('button');
      btnPdf.textContent = 'Gerar PDF';
      btnPdf.className = 'btn-os';
      btnPdf.addEventListener('click', () => gerarPDF(item));
      tdAcoes.appendChild(btnPdf);
      tr.appendChild(tdAcoes);
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Erro carregarHistorico:', error);
    alert('Erro ao carregar histórico');
  }
}

async function carregarPecas() {
  try {
    const res = await fetch('http://localhost:8080/api/peca');
    if (!res.ok) throw new Error('Erro ao buscar peças');
    const pecas = await res.json();

    const tbody = document.querySelector('#tabela-pecas tbody');
    tbody.innerHTML = '';
    const ultimos5 = pecas.slice(-5);

    ultimos5.forEach(peca => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${peca.id}</td>
        <td>${peca.nome}</td>
        <td>${peca.descricao || ''}</td>
        <td>${peca.preco_unitario || ''}</td>
        <td>${peca.quantidade_estoque || ''}</td>
        <td>${peca.estoque_minimo || ''}</td>
      `;

      const tdAcoes = document.createElement('td');
      tdAcoes.appendChild(criarBotoesEditarExcluir('pecas'));
      tr.appendChild(tdAcoes);
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error(error);
    alert('Erro ao carregar peças');
  }
}

async function carregarPecasUtilizadas() {
  try {
    const res = await fetch('http://localhost:8080/api/pecas_utilizadas');
    if (!res.ok) throw new Error('Erro ao buscar peças utilizadas');
    const pecasUtilizadas = await res.json();

    const tbody = document.querySelector('#tabela-pecas-utilizadas tbody');
    tbody.innerHTML = '';

    pecasUtilizadas.forEach(item => {
      const dataFormatada = formatarDataArray(item.data_utilizacao);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.id ?? ''}</td>
        <td>${item.aparelho?.id ?? ''}</td>
        <td>${item.peca?.id ?? ''}</td>
        <td>${item.quantidade_utilizada ?? ''}</td>
        <td>${dataFormatada}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error(error);
    alert('Erro ao carregar peças utilizadas');
  }
}

// ====== Configuração inicial ======
document.addEventListener('DOMContentLoaded', () => {
  // Carregar dados nas tabelas
  carregarClientes();
  carregarAparelhos();
  carregarPecas();
  carregarHistorico();
  carregarPecasUtilizadas();

  // Configurar botão de relatório de peças utilizadas
  const btnRelatorioPecas = document.getElementById('btnRelatorioPecas');
  if (btnRelatorioPecas) {
    btnRelatorioPecas.addEventListener('click', () => {
      console.log('Botão de relatório de peças clicado!');
      const modalPecas = document.getElementById('modalFiltroRelatorio');
      if (modalPecas) {
        modalPecas.style.display = 'flex';
        
        // Definir datas padrão
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('modalDataInicio').value = hoje;
        document.getElementById('modalDataFim').value = hoje;
      }
    });
  }

  // Configurar modal de filtro para peças utilizadas
  const modalPecas = document.getElementById('modalFiltroRelatorio');
  const btnCancelarPecas = document.getElementById('btnCancelarFiltro');
  const btnConfirmarPecas = document.getElementById('btnConfirmarFiltro');

  if (modalPecas && btnCancelarPecas && btnConfirmarPecas) {
    btnCancelarPecas.addEventListener('click', () => {
      modalPecas.style.display = 'none';
    });

    btnConfirmarPecas.addEventListener('click', async () => {
      const dataInicio = document.getElementById('modalDataInicio').value;
      const dataFim = document.getElementById('modalDataFim').value;

      if (!dataInicio || !dataFim) {
        alert('Por favor, preencha as duas datas');
        return;
      }
      if (new Date(dataFim) < new Date(dataInicio)) {
        alert('Data fim não pode ser menor que data início');
        return;
      }

      await gerarRelatorioPecasUtilizadas(dataInicio, dataFim);
      modalPecas.style.display = 'none';
    });
  }

  // Configurar modal de filtro para custo operacional
  const btnRelatorioCusto = document.getElementById('btnRelatorioCusto');
  const modalCusto = document.getElementById('modalFiltroCusto');
  const btnCancelarCusto = document.getElementById('btnCancelarCusto');
  const btnConfirmarCusto = document.getElementById('btnConfirmarCusto');

  if (btnRelatorioCusto && modalCusto && btnCancelarCusto && btnConfirmarCusto) {
    btnRelatorioCusto.addEventListener('click', () => {
      modalCusto.style.display = 'flex';
    });

    btnCancelarCusto.addEventListener('click', () => {
      modalCusto.style.display = 'none';
    });

    btnConfirmarCusto.addEventListener('click', () => {
      const dataInicio = document.getElementById('dataInicioCusto').value;
      const dataFim = document.getElementById('dataFimCusto').value;

      if (!dataInicio || !dataFim) {
        alert('Por favor, preencha as duas datas');
        return;
      }
      if (new Date(dataFim) < new Date(dataInicio)) {
        alert('Data fim não pode ser menor que data início');
        return;
      }

      gerarRelatorioCustoOperacionalPDF(dataInicio, dataFim);
      modalCusto.style.display = 'none';
    });
  }
});