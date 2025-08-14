document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.formulario');
    const params = new URLSearchParams(window.location.search);
    const aparelhoId = params.get('id');

    // Seleciona todos os campos
    const modeloInput = document.querySelector('input[name="modelo"]');
    const dataHoraInput = document.querySelector('input[name="dataHora"]');
    const defeitoInput = document.querySelector('input[name="defeito"]');
    const observacaoInput = document.querySelector('textarea[name="observacao"]');
    const servicoInput = document.querySelector('input[name="servico"]');
    const pecasInput = document.querySelector('input[name="pecas"]');
    const valorInput = document.querySelector('input[name="valor"]');
    const statusSelect = document.getElementById('status');

    // Função para formatar dados para a API
    function formatarParaAPI() {
        return {
            id: aparelhoId,
            nomeAparelho: modeloInput.value.trim(),
            dataCadastro: dataHoraInput.value ? `${dataHoraInput.value}:00` : null,
            defeito: defeitoInput.value.trim(),
            observacoes: observacaoInput.value.trim(),
            servico_executados: servicoInput.value.trim(),
            pecas_aplicadas: pecasInput.value.trim(),
            valor_total: parseFloat(valorInput.value.replace(',', '.')) || 0,
            status: statusSelect.value
        };
    }

    // Carrega os dados do aparelho
    async function carregarDados() {
        try {
            const response = await fetch(`http://localhost:8080/api/aparelhos/${aparelhoId}`);
            
            if (!response.ok) throw new Error('Erro ao carregar dados');
            
            const data = await response.json();
            
            modeloInput.value = data.nomeAparelho || '';
            if (data.dataCadastro) {
                dataHoraInput.value = data.dataCadastro.substring(0, 16);
            }
            defeitoInput.value = data.defeito || '';
            observacaoInput.value = data.observacoes || '';
            servicoInput.value = data.servico_executados || '';
            pecasInput.value = data.pecas_aplicadas || '';
            valorInput.value = data.valor_total || '';
            statusSelect.value = data.status || 'EM_ANALISE';
            
        } catch (error) {
            console.error('Erro:', error);
            alert('Não foi possível carregar os dados');
            window.location.href = 'tabelas.html';
        }
    }

    // Salva as alterações
    async function salvarDados(dados) {
        try {
            console.log('Dados a serem enviados:', dados); // Para debug
            
            const response = await fetch(`http://localhost:8080/api/aparelhos/${aparelhoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dados)
            });

            const responseData = await response.json();
            console.log('Resposta da API:', responseData); // Para debug
            
            if (!response.ok) {
                throw new Error(responseData.message || 'Erro ao salvar');
            }

            alert('Alterações salvas com sucesso!');
            window.location.href = 'tabelas.html';
            
        } catch (error) {
            console.error('Erro:', error);
            alert(`Erro ao salvar: ${error.message}`);
        }
    }

    // Inicialização
    if (aparelhoId) {
        carregarDados();
    } else {
        alert('Nenhum aparelho selecionado');
        window.location.href = 'tabelas.html';
    }

    // Evento de submit
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!modeloInput.value.trim()) {
            alert('O modelo do aparelho é obrigatório');
            return;
        }

        const dados = formatarParaAPI();
        await salvarDados(dados);
    });
});