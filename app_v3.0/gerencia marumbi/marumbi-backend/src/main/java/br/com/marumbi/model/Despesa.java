package br.com.marumbi.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity @Table(name = "despesa")
@Data                                        // Lombok gera tudo
public class Despesa {

  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotNull
  private LocalDate data;

  private String fornecedor;
  private String tipo;
  private String unidade;
  
  // Novos campos para banco e método de pagamento
  private String banco;
  private String metodo;

  @NotNull @PositiveOrZero
  private BigDecimal valor;

  @NotNull
  private Boolean pago = false;
}