package com.example.GerenciamentoBiblioteca.service;

import com.example.GerenciamentoBiblioteca.model.Livro;
import com.example.GerenciamentoBiblioteca.repository.LivroRepository;

import org.springframework.stereotype.Service;

import java.util.List;
@Service

public class LivroService {

    private final LivroRepository livroRepository;

    public LivroService (LivroRepository livroRepository){
        this.livroRepository = livroRepository;
    }

    public Livro cadastrar (Livro livro){
        return livroRepository.save(livro);
    }

    public List<Livro>listarTodos(){
        return livroRepository.findAll();
    }

    public Livro buscarPorId (Long id){
        return livroRepository.findById(id)
         .orElseThrow(() -> new RuntimeException("Livro não encontrado"));
    }

    public List <Livro> buscarPorTitulo (String titulo){
        return livroRepository.findByTituloContainingIgnoreCase(titulo);
    }

    public List  <Livro> buscarPorAutor (String autor){
        return livroRepository.findByAutorContainingIgnoreCase(autor);
    }

    public List <Livro> buscarPorCategoria (String categoria){
        return livroRepository.findByCategoriaContainingIgnoreCase(categoria);
    }

    public Livro atualizar (Long id, Livro livroAtualizado){
        Livro livro = buscarPorId(id);

        livro.setTitulo(livroAtualizado.getTitulo());
        livro.setAutor(livroAtualizado.getAutor());
        livro.setIsbn(livroAtualizado.getIsbn());
        livro.setCategoria(livroAtualizado.getCategoria());
        livro.setAno(livroAtualizado.getAno());
        livro.setEdicao(livroAtualizado.getEdicao());
        livro.setFormato(livroAtualizado.getFormato());
        livro.setPaginas(livroAtualizado.getPaginas());
        livro.setDimensao(livroAtualizado.getDimensao());
        livro.setAvaliacao(livroAtualizado.getAvaliacao());
        livro.setStatus(livroAtualizado.getStatus());
        livro.setAtribuido(livroAtualizado.getAtribuido());
        livro.setQuantidadeTotal(livroAtualizado.getQuantidadeTotal());
        livro.setQuantidadeDisponivel(livroAtualizado.getQuantidadeDisponivel());

        return livroRepository.save(livro);

    }
    public void deletar (Long id){
        Livro livro = buscarPorId(id);
        livroRepository.delete(livro);
    }
}
