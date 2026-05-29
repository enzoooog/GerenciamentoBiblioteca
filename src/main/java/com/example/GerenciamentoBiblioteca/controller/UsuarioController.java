package com.example.GerenciamentoBiblioteca.controller;

import com.example.GerenciamentoBiblioteca.model.Usuario;
import com.example.GerenciamentoBiblioteca.service.UsuarioService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/usuarios")

public class UsuarioController {
    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping
    public Usuario cadastrar(@RequestBody Usuario usuario) {
        return usuarioService.cadastrar(usuario);
    }

    @GetMapping
    public List<Usuario> listarTodos() {
        return usuarioService.listarTodos();
    }

    @GetMapping("/{id}")
    public Usuario buscarPorId(@PathVariable Long id) {
        return usuarioService.buscarPorId(id);
    }

    @GetMapping("/email/{email}")
    public Usuario buscarPorEmail(@PathVariable String email) {
        return usuarioService.buscarPorEmail(email);
    }

    @PutMapping("/{id}")
    public Usuario atualizar(@PathVariable Long id, @RequestBody Usuario usuario) {
        return usuarioService.atualizar(id, usuario);
    }

    @DeleteMapping("/{id}")
    public void deletar(@PathVariable Long id) {
        usuarioService.deletar(id);
    }

}
