package com.example.GerenciamentoBiblioteca.service;

import com.example.GerenciamentoBiblioteca.model.Usuario;
import com.example.GerenciamentoBiblioteca.repository.UsuarioRepository;
import org.springframework.stereotype.Service;

import java.util.List;
@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioService (UsuarioRepository usuarioRepository){
        this.usuarioRepository = usuarioRepository;
    }

    public Usuario cadastrar (Usuario usuario){
        prepararUsuarioParaSalvar(usuario, null);
        return usuarioRepository.save(usuario);
    }

    public List <Usuario> listarTodos(){
        return usuarioRepository.findAll();
    }

    public Usuario buscarPorId (Long id){
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }

    public Usuario buscarPorEmail(String email){
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }

    public Usuario atualizar (Long id, Usuario usuarioAtualizado){
        Usuario usuario = buscarPorId(id);
        prepararUsuarioParaSalvar(usuarioAtualizado, id);

        usuario.setNome(usuarioAtualizado.getNome());
        usuario.setCpf(usuarioAtualizado.getCpf());
        usuario.setEmail(usuarioAtualizado.getEmail());
        usuario.setTelefone(usuarioAtualizado.getTelefone());
        usuario.setSenha(usuarioAtualizado.getSenha());
        usuario.setTipoUsuario(usuarioAtualizado.getTipoUsuario());

        return usuarioRepository.save(usuario);
    }

    public void deletar (Long id){
            Usuario usuario = buscarPorId(id);
            usuarioRepository.delete(usuario);
    }

    private void prepararUsuarioParaSalvar(Usuario usuario, Long idAtual) {
        String cpf = apenasDigitos(usuario.getCpf());
        String telefone = apenasDigitos(usuario.getTelefone());

        if (!cpfValido(cpf)) {
            throw new RuntimeException("CPF inválido");
        }

        if (!telefoneValido(telefone)) {
            throw new RuntimeException("Telefone inválido");
        }

        usuarioRepository.findByCpf(cpf)
                .filter(usuarioExistente -> !usuarioExistente.getId().equals(idAtual))
                .ifPresent(usuarioExistente -> {
                    throw new RuntimeException("CPF já cadastrado");
                });

        usuarioRepository.findByEmail(usuario.getEmail())
                .filter(usuarioExistente -> !usuarioExistente.getId().equals(idAtual))
                .ifPresent(usuarioExistente -> {
                    throw new RuntimeException("E-mail já cadastrado");
                });

        usuario.setCpf(cpf);
        usuario.setTelefone(telefone);
    }

    private String apenasDigitos(String valor) {
        return valor == null ? "" : valor.replaceAll("\\D", "");
    }

    private boolean telefoneValido(String telefone) {
        return telefone.matches("[1-9]{2}9?[0-9]{8}");
    }

    private boolean cpfValido(String cpf) {
        if (cpf == null || !cpf.matches("\\d{11}") || cpf.matches("(\\d)\\1{10}")) {
            return false;
        }

        int soma = 0;
        for (int i = 0; i < 9; i++) {
            soma += Character.getNumericValue(cpf.charAt(i)) * (10 - i);
        }
        int primeiroDigito = 11 - (soma % 11);
        if (primeiroDigito >= 10) {
            primeiroDigito = 0;
        }
        if (primeiroDigito != Character.getNumericValue(cpf.charAt(9))) {
            return false;
        }

        soma = 0;
        for (int i = 0; i < 10; i++) {
            soma += Character.getNumericValue(cpf.charAt(i)) * (11 - i);
        }
        int segundoDigito = 11 - (soma % 11);
        if (segundoDigito >= 10) {
            segundoDigito = 0;
        }

        return segundoDigito == Character.getNumericValue(cpf.charAt(10));
    }
}
