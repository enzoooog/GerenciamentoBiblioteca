package com.example.GerenciamentoBiblioteca.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Livro {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titulo;
    private String autor;
    private String isbn;
    private String categoria;
    private Integer ano;
    private String edicao;
    private String formato;
    private Integer paginas;
    private String dimensao;
    private Double avaliacao;
    private String status;
    private String atribuido;
    private Integer quantidadeTotal;
    private Integer quantidadeDisponivel;

    public Livro(){

    }

    public Livro (String titulo, String autor, String categoria, Integer quantidadeTotal, Integer quantidadeDisponivel) {
        this(titulo, autor, null, categoria, null, null, null, null, null, null, null, null, quantidadeTotal, quantidadeDisponivel);
    }

    public Livro (String titulo, String autor, String isbn, String categoria, Integer ano, String edicao, String formato, Integer paginas, String dimensao, Double avaliacao, String status, String atribuido, Integer quantidadeTotal, Integer quantidadeDisponivel) {
        this.autor = autor;
        this.titulo = titulo;
        this.isbn = isbn;
        this.categoria = categoria;
        this.ano = ano;
        this.edicao = edicao;
        this.formato = formato;
        this.paginas = paginas;
        this.dimensao = dimensao;
        this.avaliacao = avaliacao;
        this.status = status;
        this.atribuido = atribuido;
        this.quantidadeTotal = quantidadeTotal;
        this.quantidadeDisponivel = quantidadeDisponivel;
    }




}
