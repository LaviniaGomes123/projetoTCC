package com.example.TaskUpAPI.TaskUpAPI.Service;

import com.example.TaskUpAPI.TaskUpAPI.Model.*;
import com.example.TaskUpAPI.TaskUpAPI.Repository.*;
import com.example.TaskUpAPI.TaskUpAPI.DTO.PecaUtilizadaDTO;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class AparelhoService {

    @Autowired
    private AgendaService agendaService;

    @Autowired
    private AparelhoRepository aparelhoRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private HistoricoService historicoService;

    @Autowired
    private PecasUtilizadasRepository pecasUtilizadasRepository;

    @Autowired
    private PecaRepository pecasRepository;

    public List<AparelhoModel> findAllAparelhos() {
        return aparelhoRepository.findAll();
    }

    public Optional<AparelhoModel> findAparelhoById(Long id) {
        return aparelhoRepository.findById(id);
    }
    
    @Transactional
    public AparelhoModel saveAparelho(AparelhoModel aparelho) {
        if (aparelho.getCliente() == null || aparelho.getCliente().getId() == null) {
            throw new IllegalArgumentException("Cliente é obrigatório");
        }
        if (!clienteRepository.existsById(aparelho.getCliente().getId())) {
            throw new IllegalArgumentException("Cliente não encontrado");
        }
        
        LocalDateTime dataEntrega = aparelho.getDataCadastro() != null ? 
            aparelho.getDataCadastro() : 
            LocalDateTime.now().plusHours(1);
        
        aparelho.setDataCadastro(dataEntrega);
        AparelhoModel saved = aparelhoRepository.save(aparelho);
        
        try {
            String descricao = String.format(
                "Entregar %s do cliente %s. Defeito: %s",
                saved.getNomeAparelho(),
                saved.getCliente().getNome_cliente(),
                saved.getDefeito()
            );
            agendaService.criarEventoNaAgenda(saved, descricao, saved.getDataCadastro());
            System.out.println("Evento criado na agenda para: " + saved.getDataCadastro() + 
                               " - Aparelho ID: " + saved.getId());
        } catch (Exception e) {
            System.err.println("Erro ao criar evento na agenda: " + e.getMessage());
        }

        return saved;
    }

    @Transactional
    public AparelhoModel updateAparelho(AparelhoModel novoAparelho) {
        return aparelhoRepository.findById(novoAparelho.getId())
                .map(aparelhoExistente -> {
                    aparelhoExistente.setNomeAparelho(novoAparelho.getNomeAparelho());
                    aparelhoExistente.setDefeito(novoAparelho.getDefeito());
                    aparelhoExistente.setServico_executados(novoAparelho.getServico_executados());
                    aparelhoExistente.setPecas_aplicadas(novoAparelho.getPecas_aplicadas());
                    aparelhoExistente.setObservacoes(novoAparelho.getObservacoes());
                    aparelhoExistente.setValor_total(novoAparelho.getValor_total());
                    aparelhoExistente.setDataCadastro(novoAparelho.getDataCadastro());
                    
                    AparelhoModel updated = aparelhoRepository.save(aparelhoExistente);
                    return updated;
                })
                .orElseThrow(() -> new IllegalArgumentException("Aparelho não encontrado"));
    }

    public void deleteAparelho(Long id) {
        aparelhoRepository.deleteById(id);
    }
    
    @Transactional
    public AparelhoModel salvarAparelhoComPecas(AparelhoModel aparelho, List<PecaUtilizadaDTO> pecasDTOs) {
        if (aparelho.getCliente() == null || aparelho.getCliente().getId() == null) {
            throw new IllegalArgumentException("Cliente é obrigatório");
        }
        
        ClienteModel cliente = clienteRepository.findById(aparelho.getCliente().getId())
                .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado"));
        
        LocalDateTime dataEntrega = aparelho.getDataCadastro() != null ? 
            aparelho.getDataCadastro() : 
            LocalDateTime.now().plusHours(1);
        
        aparelho.setCliente(cliente);
        aparelho.setDataCadastro(dataEntrega);
        AparelhoModel savedAparelho = aparelhoRepository.save(aparelho);
        
        for (PecaUtilizadaDTO dto : pecasDTOs) {
            PecaModel peca = pecasRepository.findById(dto.getIdPeca())
                    .orElseThrow(() -> new IllegalArgumentException("Peça não encontrada: ID " + dto.getIdPeca()));
            
            PecasUtilizadasModel utilizada = new PecasUtilizadasModel();
            utilizada.setAparelho(savedAparelho);
            utilizada.setPeca(peca);
            utilizada.setQuantidade_utilizada(dto.getQuantidadeUtilizada());
            utilizada.setData_utilizacao(LocalDateTime.now());
            
            pecasUtilizadasRepository.save(utilizada);
        }
        
        try {
            String descricao = String.format(
                "Entrega de %s (%s) - Peças: %s - Valor: R$%.2f",
                savedAparelho.getNomeAparelho(),
                savedAparelho.getDefeito(),
                savedAparelho.getPecas_aplicadas(),
                savedAparelho.getValor_total() != null ? savedAparelho.getValor_total() : 0.0
            );
            agendaService.criarEventoNaAgenda(savedAparelho, descricao, savedAparelho.getDataCadastro());
            System.out.println("Evento com peças criado na agenda para: " + savedAparelho.getDataCadastro());
        } catch (Exception e) {
            System.err.println("Erro ao criar evento na agenda (com peças): " + e.getMessage());
        }
        
        return savedAparelho;
    }
    
    public List<Map<String, Object>> resumoSemanal() {
        LocalDate hoje = LocalDate.now();
        LocalDate seteDiasAtras = hoje.minusDays(6);
    
        List<AparelhoModel> aparelhos = aparelhoRepository.findAll().stream()
            .filter(a -> a.getDataCadastro() != null && !a.getDataCadastro().toLocalDate().isBefore(seteDiasAtras))
            .collect(Collectors.toList());
    
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM");
    
        Map<String, Map<String, Long>> agrupado = aparelhos.stream()
            .collect(Collectors.groupingBy(
                a -> a.getDataCadastro().format(formatter),
                TreeMap::new,
                Collectors.groupingBy(
                    a -> a.getStatus().toLowerCase(),
                    Collectors.counting()
                )
            ));
    
        List<Map<String, Object>> resumo = new ArrayList<>();
    
        for (String dia : agrupado.keySet()) {
            Map<String, Long> statusCount = agrupado.get(dia);
    
            Long finalizadas = statusCount.getOrDefault("finalizado", 0L);
            Long emAndamento = statusCount.getOrDefault("em analise", 0L) + statusCount.getOrDefault("em andamento", 0L);
    
            Map<String, Object> diaResumo = new HashMap<>();
            diaResumo.put("dia", dia);
            diaResumo.put("finalizadas", finalizadas);
            diaResumo.put("emAndamento", emAndamento);
    
            resumo.add(diaResumo);
        }
    
        return resumo;
    }
}