package com.example.TaskUpAPI.TaskUpAPI.Service;

import com.example.TaskUpAPI.TaskUpAPI.Model.ClienteModel;
import com.example.TaskUpAPI.TaskUpAPI.Repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ClienteService {

    @Autowired
    private ClienteRepository repository;

    // Lista todos os clientes
    public List<ClienteModel> listar() {
        return repository.findAll();
    }

    // Salva ou atualiza um cliente
    public ClienteModel salvar(ClienteModel cliente) {
        return repository.save(cliente);
    }

    // Busca cliente por ID
    public Optional<ClienteModel> buscarPorId(Long id_cliente) {
        return repository.findById(id_cliente);
    }

    public ClienteModel atualizar(Long id_cliente, ClienteModel novoCliente) {
        return repository.findById(id_cliente)
                .map(clienteExistente -> {
                    // Validação de CPF/CNPJ único - CORRIGIDA
                    if (novoCliente.getCpf() != null &&
                        !novoCliente.getCpf().equals(clienteExistente.getCpf())) {
                        if (repository.existsByCpf(novoCliente.getCpf())) {
                            throw new IllegalArgumentException("CPF já está em uso por outro cliente");
                        }
                    }
                    
                    if (novoCliente.getCnpj() != null &&
                        !novoCliente.getCnpj().equals(clienteExistente.getCnpj())) {
                        if (repository.existsByCnpj(novoCliente.getCnpj())) {
                            throw new IllegalArgumentException("CNPJ já está em uso por outro cliente");
                        }
                    }
                    
                    // Atualiza todos os campos conforme a estrutura do banco
                    clienteExistente.setNome_cliente(novoCliente.getNome_cliente());
                    
                    // Garante que apenas CPF ou CNPJ seja definido (nunca ambos)
                    clienteExistente.setCpf(novoCliente.getCpf());
                    clienteExistente.setCnpj(novoCliente.getCnpj());
                    
                    // Atualiza dados de endereço
                    clienteExistente.setCep(novoCliente.getCep());
                    clienteExistente.setEndereco(novoCliente.getEndereco());
                    clienteExistente.setBairro(novoCliente.getBairro());
                    clienteExistente.setCidade(novoCliente.getCidade());
                    clienteExistente.setEstado(novoCliente.getEstado());
                    
                    // Atualiza dados de contato
                    clienteExistente.setEmail(novoCliente.getEmail());
                    clienteExistente.setTelefone(novoCliente.getTelefone());
                    
                    return repository.save(clienteExistente);
                })
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado com ID: " + id_cliente));
    }

    // Deleta cliente por ID
    public boolean deletar(Long id_cliente) {
        if (repository.existsById(id_cliente)) {
            repository.deleteById(id_cliente);
            return true;
        } else {
            return false;
        }
    }

    // Busca por CPF
    public Optional<ClienteModel> buscarPorCpf(String cpf) {
        return repository.findByCpf(cpf);
    }

    // Busca por CNPJ
    public Optional<ClienteModel> buscarPorCnpj(String cnpj) {
        return repository.findByCnpj(cnpj);
    }
}