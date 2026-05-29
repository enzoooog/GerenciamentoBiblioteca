package com.example.GerenciamentoBiblioteca.repository;

import com.example.GerenciamentoBiblioteca.enums.StatusEmprestimo;
import com.example.GerenciamentoBiblioteca.model.Emprestimo;
import com.example.GerenciamentoBiblioteca.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmprestimoRepository extends JpaRepository<Emprestimo, Long> {

    List<Emprestimo> findByUsuario(Usuario usuario);

    List<Emprestimo> findByStatus(StatusEmprestimo status);
}
