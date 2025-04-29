package br.com.marumbi.service;

import br.com.marumbi.model.Despesa;
import br.com.marumbi.repository.DespesaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor   // Lombok injeta repo via construtor
public class DespesaService {

  private final DespesaRepository repo;

  public Despesa salvar(Despesa d) { return repo.save(d); }
  public List<Despesa> listar()    { return repo.findAll(); }
  public void excluir(Long id)     { repo.deleteById(id); }
}
