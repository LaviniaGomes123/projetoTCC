package com.example.TaskUpAPI.TaskUpAPI.Controller;

import com.example.TaskUpAPI.TaskUpAPI.Model.AparelhoModel;
import com.example.TaskUpAPI.TaskUpAPI.Repository.AparelhoRepository;
import com.example.TaskUpAPI.TaskUpAPI.Service.AparelhoService;
import com.example.TaskUpAPI.TaskUpAPI.DTO.AparelhoComPecasDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "*") 
@RestController
@RequestMapping("/api/aparelhos")
public class AparelhoController {

    @Autowired
    private AparelhoService aparelhoService;

    @Autowired
    private AparelhoRepository aparelhoRepository;

    @GetMapping
    public ResponseEntity<List<AparelhoModel>> getAllAparelhos() {
        List<AparelhoModel> aparelhos = aparelhoService.findAllAparelhos();
        if (aparelhos.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(aparelhos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AparelhoModel> getAparelhoById(@PathVariable Long id) {
        Optional<AparelhoModel> aparelho = aparelhoService.findAparelhoById(id);
        return aparelho.map(ResponseEntity::ok)
                       .orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<?> createAparelho(@RequestBody AparelhoModel aparelho) {
        try {
            aparelho.setId(null);
            AparelhoModel saved = aparelhoService.saveAparelho(aparelho);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAparelho(@PathVariable Long id, @RequestBody AparelhoModel aparelho) {
        try {
            aparelho.setId(id);
            AparelhoModel updated = aparelhoService.updateAparelho(aparelho);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAparelho(@PathVariable Long id) {
        if (aparelhoService.findAparelhoById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        aparelhoService.deleteAparelho(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/com-pecas")
    public ResponseEntity<?> salvarAparelhoComPecas(@RequestBody AparelhoComPecasDTO dto) {
        try {
            dto.getAparelho().setId(null);
            AparelhoModel aparelhoSalvo = aparelhoService.salvarAparelhoComPecas(dto.getAparelho(), dto.getPecasUtilizadas());
            return ResponseEntity.status(HttpStatus.CREATED).body(aparelhoSalvo);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro interno: " + e.getMessage());
        }
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<AparelhoModel>> buscarPorStatus(@PathVariable String status) {
        List<AparelhoModel> aparelhos = aparelhoRepository.findByStatusContainingIgnoreCase(status);
        if (aparelhos.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(aparelhos);
    }

    @GetMapping("/resumo-semanal")
    public ResponseEntity<List<Map<String, Object>>> getResumoSemanal() {
        List<Map<String, Object>> resumo = aparelhoService.resumoSemanal();
        return ResponseEntity.ok(resumo);
    }
}