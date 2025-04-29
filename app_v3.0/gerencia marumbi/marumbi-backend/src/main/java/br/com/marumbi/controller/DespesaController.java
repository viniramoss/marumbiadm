package br.com.marumbi.controller;

import br.com.marumbi.model.Despesa;
import br.com.marumbi.service.DespesaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.text.Normalizer;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/despesas")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class DespesaController {

  private final DespesaService svc;

  @PostMapping
  public ResponseEntity<Despesa> criar(@RequestBody Despesa d){
    return ResponseEntity.ok(svc.salvar(d));
  }

  @GetMapping
  public List<Despesa> listar(
          @RequestParam(required = false) String unidade,
          @RequestParam(required = false) String tipo,
          @RequestParam(required = false) String status  // p | np | all
  ) {
      return svc.listar().stream()
          .filter(d -> unidade == null || norm(unidade).equals(norm(d.getUnidade())))
          .filter(d -> tipo    == null || norm(tipo)   .equals(norm(d.getTipo())))
          .filter(d -> {
              if (status == null || "all".equals(status)) return true;
              return "p".equals(status)  ? d.getPago()
                  : "np".equals(status) ? !d.getPago()
                  : true;
          })
          .toList();
  }

  /* remove acentos e converte para minúsculas */
  private static String norm(String s) {
      return s == null ? null
          : Normalizer.normalize(s, Normalizer.Form.NFD)
                      .replaceAll("\\p{M}","")   // tira acentos
                      .toLowerCase();
  }
  
  @PutMapping("/{id}/pago")
  public Despesa marcarPago(
      @PathVariable Long id, 
      @RequestParam boolean valor, 
      @RequestBody(required = false) Map<String, String> dadosPagamento
  ){
    Despesa d = svc.listar().stream()
                   .filter(x -> x.getId().equals(id))
                   .findFirst().orElseThrow();
    d.setPago(valor);
    
    // Se estiver marcando como pago e tiver dados de pagamento
    if (valor && dadosPagamento != null) {
      // Atualiza banco e método de acordo com o que foi enviado
      if (dadosPagamento.containsKey("banco")) {
        d.setBanco(dadosPagamento.get("banco"));
      }
      if (dadosPagamento.containsKey("metodo")) {
        d.setMetodo(dadosPagamento.get("metodo"));
      }
    }
    
    // Se estiver desmarcando como pago, limpa os dados de pagamento
    if (!valor) {
      d.setBanco(null);
      d.setMetodo(null);
    }
    
    return svc.salvar(d);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> excluir(@PathVariable Long id){
    svc.excluir(id);
    return ResponseEntity.ok().build();
  }
}