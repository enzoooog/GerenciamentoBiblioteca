package com.example.GerenciamentoBiblioteca.config;

import com.example.GerenciamentoBiblioteca.enums.StatusEmprestimo;
import com.example.GerenciamentoBiblioteca.enums.TipoUsuario;
import com.example.GerenciamentoBiblioteca.model.Emprestimo;
import com.example.GerenciamentoBiblioteca.model.Livro;
import com.example.GerenciamentoBiblioteca.model.Usuario;
import com.example.GerenciamentoBiblioteca.repository.EmprestimoRepository;
import com.example.GerenciamentoBiblioteca.repository.LivroRepository;
import com.example.GerenciamentoBiblioteca.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.LocalDate;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedDatabase(
            LivroRepository livroRepository,
            UsuarioRepository usuarioRepository,
            EmprestimoRepository emprestimoRepository
    ) {
        return args -> {
            if (livroRepository.findAll().stream().noneMatch(livro -> "Dom Casmurro".equalsIgnoreCase(livro.getTitulo()))) {
                livroRepository.save(new Livro("Dom Casmurro", "Machado de Assis", "romance", 5, 5));
                livroRepository.save(new Livro("Harry Potter e a Pedra Filosofal", "J. K. Rowling", "fantasia", 4, 4));
                livroRepository.save(new Livro("1984", "George Orwell", "ficcao", 3, 3));
                livroRepository.save(new Livro("Clean Code", "Robert C. Martin", "programacao", 2, 2));
                livroRepository.save(new Livro("O Pequeno Principe", "Antoine de Saint-Exupery", "fantasia", 6, 6));
                livroRepository.save(new Livro("A Revolucao dos Bichos", "George Orwell", "ficcao", 4, 4));
                livroRepository.save(new Livro("O Alquimista", "Paulo Coelho", "romance", 3, 3));
                livroRepository.save(new Livro("Algoritmos", "Thomas H. Cormen", "programacao", 2, 2));
            }

            if (usuarioRepository.findByEmail("enzo@email.com").isEmpty()) {
                usuarioRepository.save(new Usuario("Enzo Sacramento", "52998224725", "enzo@email.com", "71999999999", "123456", TipoUsuario.CLIENTE));
                usuarioRepository.save(new Usuario("Maria Silva", "39053344705", "maria@email.com", "71988888888", "123456", TipoUsuario.CLIENTE));
                usuarioRepository.save(new Usuario("Bibliotecario", "11144477735", "biblioteca@email.com", "71977777777", "123456", TipoUsuario.BIBLIOTECARIO));
            }

            if (emprestimoRepository.count() == 0 && livroRepository.count() > 0 && usuarioRepository.count() > 0) {
                Usuario usuario = usuarioRepository.findAll().get(0);
                Livro livro = livroRepository.findAll().get(0);

                livro.setQuantidadeDisponivel(Math.max(0, livro.getQuantidadeDisponivel() - 1));
                livroRepository.save(livro);

                Emprestimo emprestimo = new Emprestimo();
                emprestimo.setUsuario(usuario);
                emprestimo.setLivro(livro);
                emprestimo.setDataEmprestimo(LocalDate.now().minusDays(2));
                emprestimo.setDataPrevistaDevolucao(LocalDate.now().plusDays(5));
                emprestimo.setStatus(StatusEmprestimo.ATIVO);
                emprestimo.setMulta(BigDecimal.ZERO);
                emprestimoRepository.save(emprestimo);
            }
        };
    }
}
