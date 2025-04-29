package br.com.marumbi.controller;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

@RestController
@RequestMapping("/api/opcoes")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class OpcoesController {

    private static final String OPCOES_FILE = "opcoes.json";
    private final ObjectMapper mapper = new ObjectMapper();

    @GetMapping
    public ResponseEntity<Map<String, List<OpcaoDTO>>> getOpcoes() {
        Map<String, List<OpcaoDTO>> opcoes = loadOptions();
        return ResponseEntity.ok(opcoes);
    }

    @PostMapping
    public ResponseEntity<Map<String, List<OpcaoDTO>>> saveOpcoes(@RequestBody Map<String, List<OpcaoDTO>> opcoes) {
        try {
            // Salva as opções em um arquivo JSON
            File file = new File(OPCOES_FILE);
            mapper.writeValue(file, opcoes);
            return ResponseEntity.ok(opcoes);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    private Map<String, List<OpcaoDTO>> loadOptions() {
        Map<String, List<OpcaoDTO>> opcoes = new HashMap<>();
        opcoes.put("bancos", new ArrayList<>());
        opcoes.put("metodos", new ArrayList<>());

        try {
            Path path = Paths.get(OPCOES_FILE);
            if (Files.exists(path)) {
                // Usando TypeReference que é mais simples e evita problemas
                TypeReference<Map<String, List<OpcaoDTO>>> typeRef = 
                    new TypeReference<Map<String, List<OpcaoDTO>>>() {};
                opcoes = mapper.readValue(path.toFile(), typeRef);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }

        return opcoes;
    }

    @Data
    public static class OpcaoDTO {
        private String id;
        private String label;
    }
}