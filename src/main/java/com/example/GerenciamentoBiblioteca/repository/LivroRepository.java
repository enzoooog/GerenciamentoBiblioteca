package com.example.GerenciamentoBiblioteca.repository;

import com.example.GerenciamentoBiblioteca.model.Livro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LivroRepository extends JpaRepository<Livro, Long> {

    List<Livro> findByTituloContainingIgnoreCase(String titulo);

    List<Livro> findByAutorContainingIgnoreCase(String autor);

    List<Livro> findByCategoriaContainingIgnoreCase(String categoria);
}
