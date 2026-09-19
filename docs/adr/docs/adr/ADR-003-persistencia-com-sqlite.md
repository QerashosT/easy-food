# ADR-003 — Persistência do SQLite utilizando Prisma ORM

## Contexto

Após a decisão de utilizar SQLite como solução de persistência da EasyFood, registrada no ADR-002, tornou-se necessário escolher como a aplicação Node.js faria a comunicação com o banco de dados.

Uma implementação baseada diretamente em comandos SQL e drivers nativos, utilizando as próprias rotas da API, aumentaria a quantidade de código necessário e dificultaria sua manutenção. Além disso, seria necessário controlar manualmente a criação e evolução da estrutura das tabelas.

Por esse motivo, foi necessário avaliar uma ferramenta que simplificasse a comunicação entre a API e o banco de dados, mantendo o código organizado e facilitando a evolução do esquema.

## Alternativas avaliadas

1. **Driver nativo (`sqlite3`):** utilização direta de comandos SQL para consultar e modificar o banco. Essa opção foi descartada por exigir mais código, oferecer menos recursos de tipagem e deixar a administração do esquema sob responsabilidade da aplicação.

2. **Query Builders (ex.: Knex.js):** bibliotecas que permitem montar consultas SQL utilizando JavaScript. Apesar de reduzirem parte da complexidade na construção das queries, oferecem menos automação para gerenciamento do modelo, criação das tabelas e controle das migrações quando comparadas à solução escolhida.

3. **Prisma ORM:** ORM moderno que utiliza o arquivo declarativo `schema.prisma` para representar a estrutura do banco e disponibiliza um cliente específico para realizar as operações de acesso aos dados.

## Decisão

A EasyFood utilizará o **Prisma ORM** como camada oficial de integração entre a API Node.js/Express e o banco SQLite.

O Prisma será responsável pelo gerenciamento do modelo de dados, criação e evolução das tabelas e operações de leitura e escrita realizadas pela aplicação.

## Justificativa

O Prisma oferece uma maneira mais estruturada de trabalhar com o banco de dados.

A definição das entidades é realizada no arquivo `schema.prisma`, permitindo representar a estrutura da aplicação de forma declarativa. A partir dessa definição, as ferramentas do Prisma auxiliam na criação e atualização do banco e das respectivas tabelas.

O `PrismaClient` também permite substituir a construção manual de comandos SQL por métodos JavaScript, como:

`prisma.restaurant.findMany()`

Com isso, as rotas do Express podem permanecer mais enxutas e legíveis, enquanto a camada de acesso aos dados fica centralizada e padronizada.

A utilização de consultas parametrizadas pelo ORM também reduz a exposição a problemas comuns relacionados à construção manual de SQL, incluindo vulnerabilidades de SQL Injection.

## Consequências positivas

* **Código mais organizado:** a lógica das rotas fica separada das operações específicas do banco de dados.
* **Maior produtividade:** operações comuns de consulta, criação, atualização e exclusão podem ser realizadas por meio da API do Prisma.
* **Controle de versões do banco:** o sistema de migrations, utilizando comandos como `prisma migrate dev`, permite registrar e aplicar alterações na estrutura do banco de forma versionada.
* **Facilidade para trabalho em equipe:** as alterações no schema podem ser acompanhadas por meio do histórico de migrações.
* **Seed simplificado:** o `PrismaClient` pode ser utilizado no `seed.js` para inserir registros iniciais destinados aos testes e desenvolvimento.

## Consequências negativas e trade-offs

* **Necessidade de aprendizado:** a equipe precisa compreender inicialmente a estrutura do `schema.prisma`, o funcionamento do Prisma ORM e seus comandos de CLI.
* **Dependências adicionais:** a utilização do Prisma adiciona pacotes como `prisma` e `@prisma/client` ao projeto, aumentando o tamanho do `node_modules` em comparação com uma implementação baseada somente no driver nativo.
* **Camada adicional de abstração:** o acesso ao banco deixa de ocorrer diretamente por SQL em grande parte da aplicação, o que pode exigir conhecimento específico do ORM em consultas mais avançadas.

Apesar desses custos, a equipe considera que os ganhos de organização, produtividade e manutenção justificam a adoção do Prisma neste estágio do projeto.

## Critérios de revisão

Esta decisão deverá ser reconsiderada caso a arquitetura da EasyFood seja alterada para um banco de dados NoSQL, cenário em que ferramentas específicas, como o Mongoose para MongoDB, poderiam ser mais adequadas.

A decisão também poderá ser revisada caso a abstração proporcionada pelo Prisma passe a representar uma limitação relevante para consultas analíticas extremamente complexas ou operações que exijam otimizações específicas de baixo nível.

Nessas situações, deverá ser avaliado se a utilização direta de SQL, outra biblioteca de acesso a dados ou uma combinação entre ORM e consultas especializadas oferece uma solução mais adequada.
