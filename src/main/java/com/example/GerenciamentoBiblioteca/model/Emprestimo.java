package com.example.GerenciamentoBiblioteca.model;

import com.example.GerenciamentoBiblioteca.enums.StatusEmprestimo;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Getter
@Setter
public class Emprestimo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate dataEmprestimo;
    private LocalDate dataPrevistaDevolucao;
    private LocalDate dataDevolucao;

    @Enumerated(EnumType.STRING)
    private StatusEmprestimo status;

    private BigDecimal multa;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "livro_id")
    private Livro livro;

    public Emprestimo() {
    }

    public Emprestimo(LocalDate dataEmprestimo, LocalDate dataPrevistaDevolucao, StatusEmprestimo status, Usuario usuario, Livro livro) {
        this.dataEmprestimo = dataEmprestimo;
        this.dataPrevistaDevolucao = dataPrevistaDevolucao;
        this.status = status;
        this.usuario = usuario;
        this.livro = livro;
        this.multa = BigDecimal.ZERO;
    }
}
