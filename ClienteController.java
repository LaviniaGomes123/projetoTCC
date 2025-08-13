package com.example.TaskUpAPI.TaskUpAPI.Controller;

import com.example.TaskUpAPI.TaskUpAPI.Model.ClienteModel;
import com.example.TaskUpAPI.TaskUpAPI.Service.ClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/cliente")
@CrossOrigin(origins = "*") // Permite requisições de diferentes origens (importante para o front-end)
public class ClienteController {

    @Autowired
    private ClienteService clienteService;

    @GetMapping
    public ResponseEntity<List<ClienteModel>> listarClientes() {
        return ResponseEntity.ok(clienteService.listar());
    }

    @PostMapping
    public ResponseEntity<ClienteModel> salvarCliente(@RequestBody ClienteModel cliente) {
        try {
            ClienteModel novoCliente = clienteService.salvar(cliente);
            return ResponseEntity.status(HttpStatus.CREATED).body(novoCliente);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClienteModel> buscarClientePorId(@PathVariable Long id) {
        Optional<ClienteModel> cliente = clienteService.buscarPorId(id);
        return cliente.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id_cliente}")
    public ResponseEntity<ClienteModel> atualizarCliente(@PathVariable Long id_cliente, @RequestBody ClienteModel cliente) {
        try {
            ClienteModel clienteAtualizado = clienteService.atualizar(id_cliente, cliente);
            if (clienteAtualizado != null) {
                return ResponseEntity.ok(clienteAtualizado);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @DeleteMapping("/{id_cliente}")
    public ResponseEntity<Void> deletarCliente(@PathVariable Long id_cliente) {
        if (clienteService.deletar(id_cliente)) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/cpf/{cpf}")
    public ResponseEntity<ClienteModel> buscarClientePorCpf(@PathVariable String cpf) {
        Optional<ClienteModel> cliente = clienteService.buscarPorCpf(cpf);
        return cliente.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/cnpj/{cnpj}")
    public ResponseEntity<ClienteModel> buscarClientePorCnpj(@PathVariable String cnpj) {
        Optional<ClienteModel> cliente = clienteService.buscarPorCnpj(cnpj);
        return cliente.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
}