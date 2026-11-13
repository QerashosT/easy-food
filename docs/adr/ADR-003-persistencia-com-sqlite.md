# ADR-003 — Prisma ORM como camada de persistência

## Status

Aceito e vigente.

## Contexto

A aplicação precisa acessar dados relacionais sem espalhar SQL e detalhes do armazenamento por controllers e rotas.

## Decisão

Utilizar **Prisma ORM** como camada de acesso a dados e gerenciamento do schema/migrations. Nesta variante, o datasource do Prisma está configurado com `provider = "sqlite"`.

## Justificativa

O Prisma define os modelos em `prisma/schema.prisma`, gera o Prisma Client e gerencia migrações. Serviços da aplicação usam `PrismaClient` para operações de consulta e persistência. O ORM é independente do banco escolhido: o provider seleciona o conector usado pelo Prisma.

## Consequências

- Consultas e gravações ficam centralizadas por meio do Prisma Client.
- Alterações no schema são versionadas em `prisma/migrations`.
- O arquivo SQLite torna o ambiente local simples de preparar e transportar, mas deve ser protegido por backup e não deve ser compartilhado por várias instâncias simultâneas.
- Para trocar SQLite por PostgreSQL futuramente, é necessário mudar provider/URL, ajustar tipos incompatíveis quando existirem e criar/aplicar migrações compatíveis com o banco de destino.
