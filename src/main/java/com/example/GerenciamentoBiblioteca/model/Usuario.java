package com.example.GerenciamentoBiblioteca.model;

import com.example.GerenciamentoBiblioteca.enums.TipoUsuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    @Column(unique = true)
    private String cpf;

    @Column(unique = true)
    private String email;

    private String telefone;
    private String senha;

    @Enumerated(EnumType.STRING)
    private TipoUsuario tipoUsuario;

    public Usuario() {
    }

    public Usuario(String nome, String cpf, String email, String telefone, String senha, TipoUsuario tipoUsuario) {
        this.nome = nome;
        this.cpf = cpf;
        this.email = email;
        this.telefone = telefone;
        this.senha = senha;
        this.tipoUsuario = tipoUsuario;
    }
}
