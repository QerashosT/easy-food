# ADR-004 — Processamento compartilhado de imagens

## Status

Aceito. O conteúdo deste ADR descreve o serviço de imagens e não determina o banco de dados.

## Contexto

A atividade pede upload autenticado de imagens para o perfil do usuário e para pratos do cardápio. As imagens devem ser recebidas com Multer, otimizadas com Sharp e processadas por um serviço reutilizável pelos dois módulos.

## Decisão

- Manter Prisma ORM para acesso aos dados (o provider do banco é definido em `prisma/schema.prisma`; nesta variante local é SQLite).
- Manter a arquitetura modular `routes → controllers → services`.
- Receber arquivos com Multer em memória e limitar cada arquivo a 5 MB.
- Centralizar validação, orientação, redimensionamento, conversão e armazenamento em `src/modules/shared/image.service.js`.
- Armazenar imagens otimizadas no diretório de uploads, separando `profiles` e `dishes`, e persistir os caminhos em `User.imageUrl` e `Dish.imageUrl`.
- Proteger os endpoints por JWT; para pratos, verificar também a propriedade do restaurante no service.

## Consequências

- Usuários e pratos reutilizam as mesmas regras de validação e otimização.
- Controllers não precisam conhecer detalhes do Sharp nem diretórios de armazenamento.
- O disco local atende ao desenvolvimento em uma instância; deploys com múltiplas instâncias devem usar storage compartilhado.
