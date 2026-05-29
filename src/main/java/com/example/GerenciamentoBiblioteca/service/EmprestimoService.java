package com.example.GerenciamentoBiblioteca.service;

import com.example.GerenciamentoBiblioteca.enums.StatusEmprestimo;
import com.example.GerenciamentoBiblioteca.model.Emprestimo;
import com.example.GerenciamentoBiblioteca.model.Livro;
import com.example.GerenciamentoBiblioteca.model.Usuario;
import com.example.GerenciamentoBiblioteca.repository.EmprestimoRepository;
import com.example.GerenciamentoBiblioteca.repository.LivroRepository;
import com.example.GerenciamentoBiblioteca.repository.UsuarioRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class EmprestimoService {

    private final EmprestimoRepository emprestimoRepository;
    private final LivroRepository livroRepository;
    private final UsuarioRepository usuarioRepository;

    public EmprestimoService (
            EmprestimoRepository emprestimoRepository,
            LivroRepository livroRepository,
            UsuarioRepository usuarioRepository
    ){
        this.emprestimoRepository = emprestimoRepository;
        this.livroRepository = livroRepository;
        this.usuarioRepository = usuarioRepository;

    }
    public Emprestimo registrarEmprestimo (Long usuarioId, Long livroId){
        return registrarEmprestimo(usuarioId, livroId, LocalDate.now(), LocalDate.now().plusDays(7));
    }

    public Emprestimo registrarEmprestimo (Long usuarioId, Long livroId, LocalDate dataEmprestimo, LocalDate dataPrevistaDevolucao){
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        Livro livro = livroRepository.findById(livroId)
                .orElseThrow(() -> new RuntimeException("Livro não encontrado"));

        if (livro.getQuantidadeDisponivel() <= 0) {
            throw new RuntimeException("Livro indisponível para empréstimo");
        }

        LocalDate dataInicio = dataEmprestimo != null ? dataEmprestimo : LocalDate.now();
        LocalDate dataFim = dataPrevistaDevolucao != null ? dataPrevistaDevolucao : dataInicio.plusDays(7);

        if (!dataFim.isAfter(dataInicio)) {
            throw new RuntimeException("A data de devolução deve ser após a data de empréstimo");
        }

        livro.setQuantidadeDisponivel(livro.getQuantidadeDisponivel() - 1);
        livroRepository.save(livro);

                Emprestimo emprestimo = new Emprestimo();
        emprestimo.setUsuario(usuario);
        emprestimo.setLivro(livro);
        emprestimo.setDataEmprestimo(dataInicio);
        emprestimo.setDataPrevistaDevolucao(dataFim);
        emprestimo.setStatus(StatusEmprestimo.ATIVO);
        emprestimo.setMulta(BigDecimal.ZERO);

        return emprestimoRepository.save(emprestimo);

    }
    public Emprestimo registrarDevolucao(Long emprestimoId) {
        Emprestimo emprestimo = emprestimoRepository.findById(emprestimoId)
                .orElseThrow(() -> new RuntimeException("Empréstimo não encontrado"));

        if (emprestimo.getStatus() == StatusEmprestimo.DEVOLVIDO) {
            throw new RuntimeException("Este empréstimo já foi devolvido");
        }

        LocalDate dataDevolucao = LocalDate.now();
        emprestimo.setDataDevolucao(dataDevolucao);

        long diasAtraso = 0;
        if (dataDevolucao.isAfter(emprestimo.getDataPrevistaDevolucao())) {
            diasAtraso = ChronoUnit.DAYS.between(
                    emprestimo.getDataPrevistaDevolucao(),
                    dataDevolucao
            );
        BigDecimal valorMulta = BigDecimal.valueOf(diasAtraso * 2.00);
        emprestimo.setMulta(valorMulta);
        emprestimo.setStatus(StatusEmprestimo.ATRASADO);
        }else{
            emprestimo.setMulta(BigDecimal.ZERO);
            emprestimo.setStatus(StatusEmprestimo.DEVOLVIDO);
        }
        Livro livro = emprestimo.getLivro();
        livro.setQuantidadeDisponivel(livro.getQuantidadeDisponivel() + 1);
        livroRepository.save(livro);

        return emprestimoRepository.save(emprestimo);
    }

    public List<Emprestimo> listarTodos() {
        return emprestimoRepository.findAll();
    }

    public Emprestimo buscarPorId (Long id){
    return emprestimoRepository.findById(id)
            .orElseThrow(()-> new RuntimeException("Empréstimo não encontrado"));
    }

    public List<Emprestimo>listarPorUsuario(Long usuarioId){
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(()-> new RuntimeException("Usuário não encontrado"));

        return emprestimoRepository.findByUsuario(usuario);
    }

    public List<Emprestimo> listarPorStatus (StatusEmprestimo status){
        return emprestimoRepository.findByStatus(status);
    }

    public Emprestimo atualizar(Long id, Emprestimo emprestimoAtualizado) {
        Emprestimo emprestimo = buscarPorId(id);

        emprestimo.setDataEmprestimo(emprestimoAtualizado.getDataEmprestimo());
        emprestimo.setDataPrevistaDevolucao(emprestimoAtualizado.getDataPrevistaDevolucao());
        emprestimo.setStatus(emprestimoAtualizado.getStatus());

        if (emprestimoAtualizado.getDataDevolucao() != null) {
            emprestimo.setDataDevolucao(emprestimoAtualizado.getDataDevolucao());
        }

        if (emprestimoAtualizado.getMulta() != null) {
            emprestimo.setMulta(emprestimoAtualizado.getMulta());
        }

        return emprestimoRepository.save(emprestimo);
    }

    public void deletar(Long id) {
        Emprestimo emprestimo = buscarPorId(id);

        if (emprestimo.getStatus() != StatusEmprestimo.DEVOLVIDO) {
            Livro livro = emprestimo.getLivro();
            livro.setQuantidadeDisponivel(livro.getQuantidadeDisponivel() + 1);
            livroRepository.save(livro);
        }

        emprestimoRepository.delete(emprestimo);
    }

}
