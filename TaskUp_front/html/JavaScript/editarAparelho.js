document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.formulario');
    const params = new URLSearchParams(window.location.search);
    const aparelhoId = params.get('id');

    const modeloInput = document.querySelector('input[name="modelo"]');
    const dataInput = document.querySelector('input[name="data"]');
    const defeitoInput = document.querySelector('input[name="defeito"]');
    const observacaoInput = document.querySelector('textarea[name="observacao"]');
    const servicoInput = document.querySelector('input[name="servico"]');
    const pecasInput = document.querySelector('input[name="pecas"]');
    const valorInput = document.querySelector('input[name="valor"]');

    async function buscarEPreencherAparelho(id) {
        try {
            const response = await fetch(`http://localhost:8080/api/aparelhos/${id}`);
            
            if (!response.ok) {
                alert("Erro ao carregar dados do aparelho. Verifique se o ID está correto ou se a API está online.");
                throw new Error(`Erro ao buscar aparelho: ${response.statusText}`);
            }
            
            const aparelho = await response.json();
            
            modeloInput.value = aparelho.nomeAparelho || '';
            
            if (aparelho.dataCadastro) {
                dataInput.value = aparelho.dataCadastro.substring(0, 10);
            }
            
            defeitoInput.value = aparelho.defeito || '';
            observacaoInput.value = aparelho.observacoes || '';
            servicoInput.value = aparelho.servico_executados || '';
            pecasInput.value = aparelho.pecas_aplicadas || '';
            valorInput.value = aparelho.valor_total || '';

        } catch (error) {
            console.error("Houve um erro na busca do aparelho:", error);
            window.location.href = 'tabelas.html';
        }
    }

    async function salvarAlteracoes(id, dados) {
        try {
            const response = await fetch(`http://localhost:8080/api/aparelhos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dados),
            });

            if (!response.ok) {
                const errorText = await response.text();
                alert(`Não foi possível salvar as alterações. Tente novamente.\nDetalhes: ${response.statusText}`);
                throw new Error(`Erro ao salvar alterações: ${response.statusText} - ${errorText}`);
            }
            
            alert('Aparelho atualizado com sucesso!');
            window.location.href = 'tabelas.html';

        } catch (error) {
            console.error("Houve um erro ao salvar os dados:", error);
        }
    }

    if (aparelhoId) {
        buscarEPreencherAparelho(aparelhoId);
    } else {
        alert('Nenhum ID de aparelho encontrado. O formulário está vazio.');
    }

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        if (!aparelhoId) {
            alert('Não é possível salvar sem um ID de aparelho.');
            return;
        }

        const dadosAtualizados = {
            id: aparelhoId,
            nomeAparelho: modeloInput.value,
            dataCadastro: dataInput.value,
            defeito: defeitoInput.value,
            observacoes: observacaoInput.value,
            servico_executados: servicoInput.value,
            pecas_aplicadas: pecasInput.value,
            valor_total: parseFloat(valorInput.value) || 0,
        };

        salvarAlteracoes(aparelhoId, dadosAtualizados);
    });
});