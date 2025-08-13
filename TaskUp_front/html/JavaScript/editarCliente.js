document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.formulario');
    const tipoClienteSelect = document.getElementById('tipoCliente');
    const nomeLabel = document.getElementById('nomeLabel');
    const nomeInput = document.querySelector('input[name="nome"]');
    const cpfCnpjLabel = document.getElementById('cpfCnpjLabel');
    const cpfCnpjInput = document.querySelector('input[name="cpfCnpj"]');
    const telefoneInput = document.querySelector('input[name="telefone"]');
    const cepInput = document.querySelector('input[name="cep"]');
    const enderecoInput = document.querySelector('input[name="endereco"]');
    const bairroInput = document.querySelector('input[name="bairro"]');
    const cidadeInput = document.querySelector('input[name="cidade"]');
    const estadoInput = document.querySelector('input[name="estado"]');

    let tipoAnterior = tipoClienteSelect.value;
    const params = new URLSearchParams(window.location.search);
    const clienteId = params.get('id');

    // Aplica as máscaras nos campos
    VMasker(telefoneInput).maskPattern('(99) 99999-9999');
    VMasker(cepInput).maskPattern('99999-999');
    
    // Função para aplicar a máscara correta de CPF ou CNPJ e atualizar os rótulos
    function aplicarMascaraCpfCnpj(tipo) {
        if (tipo === 'fisica') {
            VMasker(cpfCnpjInput).maskPattern('999.999.999-99');
            nomeLabel.textContent = 'Nome:';
            nomeInput.placeholder = 'Nome Completo';
            cpfCnpjLabel.textContent = 'CPF:';
            cpfCnpjInput.placeholder = 'Digite o CPF';
        } else {
            VMasker(cpfCnpjInput).maskPattern('99.999.999/9999-99');
            nomeLabel.textContent = 'Nome da Empresa:';
            nomeInput.placeholder = 'Razão Social ou Nome Fantasia';
            cpfCnpjLabel.textContent = 'CNPJ:';
            cpfCnpjInput.placeholder = 'Digite o CNPJ';
        }
    }

    // Função para buscar os dados do cliente na API e preencher o formulário
    async function buscarEPreencherCliente(id) {
        try {
            const response = await fetch(`http://localhost:8080/api/cliente/${id}`);
            
            if (!response.ok) {
                throw new Error(`Erro ao buscar cliente: ${response.statusText}`);
            }
            
            const cliente = await response.json();
            
            // Identifica se é pessoa física (CPF) ou jurídica (CNPJ)
            const tipoCliente = cliente.cpf ? 'fisica' : 'juridica';

            tipoClienteSelect.value = tipoCliente;
            tipoAnterior = tipoCliente;
            aplicarMascaraCpfCnpj(tipoCliente);
            
            // Preenche os campos do formulário com os dados da API
            nomeInput.value = cliente.nome_cliente || '';
            cpfCnpjInput.value = cliente.cpf || cliente.cnpj || '';
            telefoneInput.value = cliente.telefone || '';
            form.querySelector('input[name="email"]').value = cliente.email || '';
            cepInput.value = cliente.cep || '';
            enderecoInput.value = cliente.endereco || '';
            bairroInput.value = cliente.bairro || '';
            cidadeInput.value = cliente.cidade || '';
            estadoInput.value = cliente.estado || '';

        } catch (error) {
            console.error("Houve um erro na busca do cliente:", error);
            alert("Não foi possível carregar os dados do cliente. Por favor, tente novamente.");
            window.location.href = 'tabelas.html';
        }
    }

    // Função para enviar os dados atualizados para a API
    async function salvarAlteracoes(id, dados) {
        try {
            const response = await fetch(`http://localhost:8080/api/cliente/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dados),
            });

            if (!response.ok) {
                throw new Error(`Erro ao salvar alterações: ${response.statusText}`);
            }
            
            alert('Cliente atualizado com sucesso!');
            window.location.href = 'tabelas.html';

        } catch (error) {
            console.error("Houve um erro ao salvar os dados:", error);
            alert("Não foi possível salvar as alterações. Tente novamente.");
        }
    }

    // --- Lógica de inicialização da página ---
    if (clienteId) {
        buscarEPreencherCliente(clienteId);
    } else {
        aplicarMascaraCpfCnpj('fisica');
        console.log('Nenhum ID de cliente encontrado. O formulário está vazio.');
    }

    // Evento para quando o tipo de cliente mudar
    tipoClienteSelect.addEventListener('change', function() {
        const tipoSelecionado = this.value;
        const confirmacao = confirm('Você tem certeza que deseja mudar o tipo de pessoa? Esta ação irá reformatar o campo de CPF/CNPJ.');
        
        if (confirmacao) {
            aplicarMascaraCpfCnpj(tipoSelecionado);
            tipoAnterior = tipoSelecionado;
            cpfCnpjInput.value = '';
        } else {
            this.value = tipoAnterior;
        }
    });

    // Adiciona o "listener" para o evento de envio do formulário
    form.addEventListener('submit', function(event) {
        event.preventDefault();

        if (!clienteId) {
            alert('Não é possível salvar sem um ID de cliente.');
            return;
        }
        
        const dadosAtualizados = {
            nome_cliente: nomeInput.value,
            telefone: telefoneInput.value,
            email: form.querySelector('input[name="email"]').value,
            cep: cepInput.value,
            endereco: enderecoInput.value,
            bairro: bairroInput.value,
            cidade: cidadeInput.value,
            estado: estadoInput.value,
        };

        // Adiciona o CPF ou CNPJ ao objeto antes de enviar
        if (tipoClienteSelect.value === 'fisica') {
            dadosAtualizados.cpf = cpfCnpjInput.value.replace(/[^\d]/g, '');
            dadosAtualizados.cnpj = null;
        } else { // 'juridica'
            dadosAtualizados.cnpj = cpfCnpjInput.value.replace(/[^\d]/g, '');
            dadosAtualizados.cpf = null;
        }

        salvarAlteracoes(clienteId, dadosAtualizados);
    });
});