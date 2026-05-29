# GerenciamentoBiblioteca

Sistema de gerenciamento de biblioteca desenvolvido para controlar livros, usuários, empréstimos, devoluções e multas.

## Objetivo

O objetivo do sistema é facilitar a administração de uma biblioteca, permitindo que administradores e bibliotecários acompanhem o acervo, registrem empréstimos, controlem prazos de devolução, gerenciem multas por atraso e visualizem informações importantes em um dashboard atualizado.

## Funcionalidades

- Cadastro, edição, exclusão e listagem de livros
- Cadastro, edição e gerenciamento de usuários
- Registro de empréstimos
- Registro de devoluções
- Controle de livros disponíveis e emprestados
- Cálculo automático de multas por atraso
- Histórico de multas pagas e pendentes
- Dashboard com indicadores atualizados
- Listagem de livros disponíveis
- Listagem de empréstimos recentes
- Alertas de devolução próxima ao prazo
- Aviso de devolução nos últimos 3 dias antes do vencimento
- Envio de mensagem via WhatsApp para avisar sobre devolução próxima
- Controle de acesso para administradores e bibliotecários
- Restrição de ações para bibliotecários na tela de livros
- Integração entre front-end, back-end e banco de dados

## Tecnologias Utilizadas

- Java
- Spring Boot
- Spring Data JPA
- Spring Security
- PostgreSQL
- Gradle
- HTML
- CSS
- JavaScript
- Git
- GitHub

## Estrutura do Projeto

GerenciamentoBiblioteca/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/GerenciamentoBiblioteca/
│   │   │       ├── controller/
│   │   │       ├── model/
│   │   │       ├── repository/
│   │   │       ├── service/
│   │   │       ├── config/
│   │   │       └── GerenciamentoBibliotecaApplication.java
│   │   └── resources/
│   │       ├── application.properties
│   │       └── static/
│   │           └── Trabalho Engenharia de Requisitos/
│   │               └── FrontEnd/
│   │                   ├── dashboard.html
│   │                   ├── livros.html
│   │                   ├── usuarios.html
│   │                   ├── emprestimos.html
│   │                   ├── devolucoes.html
│   │                   ├── multas.html
│   │                   ├── login.html
│   │                   ├── *.css
│   │                   └── *.js
├── build.gradle
├── settings.gradle
├── gradlew
├── gradlew.bat
└── README.md
Banco de Dados
O sistema utiliza PostgreSQL como banco de dados.

As tabelas são geradas automaticamente pelo Spring Data JPA conforme as entidades do projeto.

Principais entidades do sistema:

Livro
Usuario
Emprestimo
Configuração do Banco de Dados
Antes de rodar o projeto, configure o PostgreSQL no arquivo:

src/main/resources/application.properties
Exemplo de configuração:

spring.application.name=GerenciamentoBiblioteca
spring.datasource.url=jdbc:postgresql://localhost:5432/postgres
spring.datasource.username=postgres
spring.datasource.password=SUA_SENHA

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
Altere SUA_SENHA para a senha do seu PostgreSQL.

Como Rodar o Projeto
Clone o repositório:
git clone https://github.com/enzoogog/GerenciamentoBiblioteca.git
Acesse a pasta do projeto:
cd GerenciamentoBiblioteca
Configure o banco de dados PostgreSQL no arquivo:
src/main/resources/application.properties
Execute o projeto:
./gradlew bootRun
No Windows, use:

gradlew.bat bootRun
Acesse o sistema no navegador:
http://localhost:8081
Como Usar
Após iniciar a aplicação, acesse a tela de login e entre com um perfil de administrador ou bibliotecário.

O administrador possui acesso completo ao sistema, podendo cadastrar, editar e excluir livros, além de gerenciar usuários, empréstimos, devoluções e multas.

O bibliotecário possui acesso ao sistema, mas não pode cadastrar, editar ou excluir livros.

Versionamento
O projeto utiliza Git e GitHub para controle de versão.

Comandos básicos:

git status
git add .
git commit -m "Mensagem do commit"
git push
Autor
Desenvolvido por Enzo.
```
