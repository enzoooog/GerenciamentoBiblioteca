package com.example.GerenciamentoBiblioteca.controller;

import com.example.GerenciamentoBiblioteca.model.Livro;
import com.example.GerenciamentoBiblioteca.service.LivroService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/livros")

public class LivroController {

    private final LivroService livroService;

    public LivroController (LivroService livroService){
        this.livroService = livroService;
    }

    @PostMapping
    public Livro cadastrar (@RequestBody Livro livro){
        return livroService.cadastrar(livro);
    }

    @GetMapping
    public List<Livro> listarTodos(){
        return livroService.listarTodos();
    }

    @GetMapping("/{id}")
    public Livro buscarPorId(@PathVariable Long id){
        return livroService.buscarPorId(id);
    }

    @GetMapping("/titulo/{titulo}")
    public List<Livro> buscarPorTitulo(@PathVariable String titulo){
        return livroService.buscarPorTitulo(titulo);
    }

    @GetMapping("/autor/{autor}")
    public List<Livro> buscarPorAutor(@PathVariable String autor){
        return livroService.buscarPorAutor(autor);
    }

    @GetMapping("/categoria/{categoria}")
    public List<Livro> buscarPorCategoria(@PathVariable String categoria){
        return livroService.buscarPorCategoria(categoria);
    }

    @PutMapping("/{id}")
    public Livro atualizar(@PathVariable Long id, @RequestBody Livro livro){
        return livroService.atualizar(id, livro);
    }

    @DeleteMapping("/{id}")
    public void deletar(@PathVariable Long id){
        livroService.deletar(id);
    }


}
