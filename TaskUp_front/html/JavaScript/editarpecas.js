document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.formulario');
    const precoInput = document.querySelector('input[name="preco"]');
    const params = new URLSearchParams(window.location.search);
    const pecaId = params.get('id');

    // Aplica a máscara para o campo de preço
    VMasker(precoInput).maskMoney();

    // Função para buscar os dados de uma peça na API e preencher o formulário
    async function buscarEPreencherPeca(id) {
        try {
            // Substitua esta URL pela da sua API para buscar uma peça
            const response = await fetch(`/api/pecas/${id}`);
            
            if (!response.ok) {
                throw new Error(`Erro ao buscar peça: ${response.statusText}`);
            }
            
            const peca = await response.json();
            
            // Preenche os campos do formulário
            form.querySelector('input[name="peca"]').value = peca.peca || '';
            form.querySelector('input[name="descricao"]').value = peca.descricao || '';
            form.querySelector('input[name="preco"]').value = peca.preco || '';

        } catch (error) {
            console.error("Houve um erro na busca da peça:", error);
            alert("Não foi possível carregar os dados da peça. Por favor, tente novamente.");
            // Redireciona para a página de onde o usuário veio
            window.location.href = 'estoque.html';
        }
    }

    // Função para enviar os dados atualizados para a API
    async function salvarAlteracoes(id, dados) {
        try {
            // Substitua esta URL pela da sua API para atualizar uma peça
            const response = await fetch(`/api/pecas/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dados),
            });

            if (!response.ok) {
                throw new Error(`Erro ao salvar alterações: ${response.statusText}`);
            }
            
            alert('Peça atualizada com sucesso!');
            window.location.href = 'estoque.html';

        } catch (error) {
            console.error("Houve um erro ao salvar os dados:", error);
            alert("Não foi possível salvar as alterações. Tente novamente.");
        }
    }

    // --- Lógica de inicialização da página ---
    if (pecaId) {
        buscarEPreencherPeca(pecaId);
    } else {
        console.log('Nenhum ID de peça encontrado. O formulário está vazio.');
    }

    // Adiciona o "listener" para o evento de envio do formulário
    form.addEventListener('submit', function(event) {
        event.preventDefault();

        if (!pecaId) {
            alert('Não é possível salvar sem um ID de peça.');
            return;
        }

        const dadosAtualizados = {
            id: pecaId,
            peca: form.querySelector('input[name="peca"]').value,
            descricao: form.querySelector('input[name="descricao"]').value,
            preco: form.querySelector('input[name="preco"]').value,
        };

        salvarAlteracoes(pecaId, dadosAtualizados);
    });
});