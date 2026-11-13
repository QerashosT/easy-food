# ADR-002 — Banco de dados local da EasyFood

## Status

Aceito para esta variante local: SQLite.

## Contexto

A EasyFood precisa persistir usuários, restaurantes e pratos. Para desenvolvimento local sem instalar um servidor de banco de dados, foi escolhida uma base relacional embutida em arquivo.

## Alternativas consideradas

- **PostgreSQL:** banco relacional cliente-servidor, adequado a ambientes compartilhados e produção, mas exige uma instância de servidor acessível.
- **MySQL:** outra opção cliente-servidor relacional, com requisito operacional semelhante.
- **SQLite:** banco relacional em arquivo, sem serviço separado, adequado a desenvolvimento local e aplicações pequenas com baixa concorrência de escrita.

## Decisão

Esta variante utiliza SQLite como banco e Prisma ORM para acesso aos dados. O arquivo é `prisma/dev.db`, configurado por `DATABASE_URL="file:./dev.db"`.

## Consequências

- Não é necessário instalar PostgreSQL ou Docker.
- Os dados persistem no arquivo local, que deve ser preservado e incluído em backups.
- SQLite possui limites de concorrência e operação em múltiplas instâncias; para um ambiente compartilhado/produção, PostgreSQL pode ser mais adequado.
- A escolha do banco é independente da escolha do ORM: Prisma continua sendo utilizado e pode conectar-se a diferentes bancos suportados.

## Nota de compatibilidade acadêmica

O enunciado da Atividade 8 cita PostgreSQL. Esta variante SQLite não atende literalmente a esse requisito, embora mantenha Prisma, JWT e os endpoints solicitados.
