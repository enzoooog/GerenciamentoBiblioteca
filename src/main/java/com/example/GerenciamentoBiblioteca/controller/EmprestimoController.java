package com.example.GerenciamentoBiblioteca.controller;

import com.example.GerenciamentoBiblioteca.enums.StatusEmprestimo;
import com.example.GerenciamentoBiblioteca.model.Emprestimo;
import com.example.GerenciamentoBiblioteca.service.EmprestimoService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/emprestimos")

public class EmprestimoController {
    private final EmprestimoService emprestimoService;

    public EmprestimoController(EmprestimoService emprestimoService) {
        this.emprestimoService = emprestimoService;
    }

    @PostMapping
    public Emprestimo registrarEmprestimo(
            @RequestParam Long usuarioId,
            @RequestParam Long livroId,
            @RequestParam(required = false) LocalDate dataEmprestimo,
            @RequestParam(required = false) LocalDate dataPrevistaDevolucao
    ) {
        return emprestimoService.registrarEmprestimo(usuarioId, livroId, dataEmprestimo, dataPrevistaDevolucao);
    }

    @PutMapping("/{id}/devolucao")
    public Emprestimo registrarDevolucao(@PathVariable Long id) {
        return emprestimoService.registrarDevolucao(id);
    }

    @GetMapping
    public List<Emprestimo> listarTodos() {
        return emprestimoService.listarTodos();
    }

    @GetMapping("/{id}")
    public Emprestimo buscarPorId(@PathVariable Long id) {
        return emprestimoService.buscarPorId(id);
    }

    @GetMapping("/usuario/{usuarioId}")
    public List<Emprestimo> listarPorUsuario(@PathVariable Long usuarioId) {
        return emprestimoService.listarPorUsuario(usuarioId);
    }

    @GetMapping("/status/{status}")
    public List<Emprestimo> listarPorStatus(@PathVariable StatusEmprestimo status) {
        return emprestimoService.listarPorStatus(status);
    }

    @PutMapping("/{id}")
    public Emprestimo atualizar(@PathVariable Long id, @RequestBody Emprestimo emprestimo) {
        return emprestimoService.atualizar(id, emprestimo);
    }

    @DeleteMapping("/{id}")
    public void deletar(@PathVariable Long id) {
        emprestimoService.deletar(id);
    }
}
