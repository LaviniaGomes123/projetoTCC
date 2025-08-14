// ===== Função para formatar datas =====
// Recebe uma string ISO do backend e retorna no formato DD/MM/AAAA HH:mm
function formatarData(dataString) {
  if (!dataString) return '-';
  const data = new Date(dataString);
  if (isNaN(data)) return '-';
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ===== Função para criar botão "Gerar PDF" =====
function criarBotaoGerarPDF(registro) {
  const btnPdf = document.createElement('button');
  btnPdf.className = 'btn-editar'; // reutiliza estilo de botão editar
  btnPdf.textContent = 'Gerar PDF';

  btnPdf.addEventListener('click', () => {
    // Supondo que você tenha a função gerarPDF definida em outro arquivo
    if (typeof gerarPDF === 'function') {
      gerarPDF(registro);
    } else {
      alert('Função gerarPDF não definida!');
    }
  });

  return btnPdf;
}

// ===== Função para carregar o histórico e preencher a tabela =====
async function carregarHistorico() {
  const tbody = document.querySelector('#tabela-historico tbody');
  tbody.innerHTML = '<tr><td colspan="13" class="loading">Carregando dados do histórico...</td></tr>';

  try {
    const response = await fetch('http://localhost:8080/api/historico');
    if (!response.ok) throw new Error(`Erro ao buscar histórico: ${response.status}`);

    const historicos = await response.json();

    if (historicos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="13" class="no-data">Nenhum registro no histórico</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    historicos.forEach(registro => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${registro.id_historico}</td>
        <td>${registro.cliente?.nome_cliente || '-'}</td>
        <td>${registro.aparelho?.nomeAparelho || '-'}</td>
        <td title="${registro.defeito || '-'}">${registro.defeito || '-'}</td>
        <td title="${registro.servico_executado || '-'}">${registro.servico_executado || '-'}</td>
        <td title="${registro.pecas_aplicadas || '-'}">${registro.pecas_aplicadas || '-'}</td>
        <td>${formatarData(registro.data_entrada)}</td>
        <td>${formatarData(registro.data_saida)}</td>
        <td>${registro.status_servico || '-'}</td>
        <td>${registro.nome_tecnico || '-'}</td>
        <td>R$ ${registro.valor_total?.toFixed(2).replace('.', ',') || '0,00'}</td>
        <td title="${registro.observacoes || '-'}">${registro.observacoes || '-'}</td>
        <td></td>
      `;

      // Adiciona o botão "Gerar PDF" na última coluna
      tr.querySelector('td:last-child').appendChild(criarBotaoGerarPDF(registro));

      tbody.appendChild(tr);
    });

  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="13" style="color:red; font-weight:600;">Erro: ${error.message}</td></tr>`;
    console.error('Erro carregarHistorico:', error);
  }
}

function gerarPDF(registro) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Cabeçalho
  doc.setFontSize(18);
  doc.text("Histórico de Serviço", 14, 15);
  doc.setFontSize(12);
  doc.text(`ID: ${registro.id_historico}`, 14, 25);

  // Informações do cliente/aparelho
  doc.text(`Cliente: ${registro.cliente?.nome_cliente || '-'}`, 14, 35);
  doc.text(`Aparelho: ${registro.aparelho?.nomeAparelho || '-'}`, 14, 42);

  // Datas formatadas
  const entrada = formatarData(registro.data_entrada);
  const saida = formatarData(registro.data_saida);

  doc.text(`Data de Entrada: ${entrada}`, 14, 50);
  doc.text(`Data de Saída: ${saida}`, 14, 57);

  // Outros detalhes
  doc.text(`Defeito: ${registro.defeito || '-'}`, 14, 65);
  doc.text(`Serviço Executado: ${registro.servico_executado || '-'}`, 14, 72);
  doc.text(`Peças Aplicadas: ${registro.pecas_aplicadas || '-'}`, 14, 79);
  doc.text(`Status: ${registro.status_servico || '-'}`, 14, 86);
  doc.text(`Técnico: ${registro.nome_tecnico || '-'}`, 14, 93);
  doc.text(`Valor Total: R$ ${registro.valor_total?.toFixed(2).replace('.', ',') || '0,00'}`, 14, 100);
  doc.text(`Observações: ${registro.observacoes || '-'}`, 14, 107);

  // Salva o PDF
  doc.save(`historico_${registro.id_historico}.pdf`);
}


// ===== Executa ao carregar a página =====
document.addEventListener('DOMContentLoaded', carregarHistorico);
