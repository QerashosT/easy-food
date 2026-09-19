# ADR-001 — Armazenamento temporário de restaurantes

## Status

Aceito

## Data

19/09/2026

## Responsável

Equipe EasyFood

## Contexto

A EasyFood está atualmente construindo a primeira versão de sua API.

Nesta etapa, o sistema deve oferecer as funcionalidades básicas de:

* consultar os restaurantes cadastrados;
* adicionar novos restaurantes.

O projeto ainda se encontra em uma etapa de prototipagem, experimentação e validação.

O objetivo principal desta versão é verificar se o fluxo da aplicação funciona corretamente de maneira rápida e simples, evitando introduzir complexidade arquitetural antes que ela seja realmente necessária.

## Alternativas avaliadas

1. Array armazenado em memória
2. PostgreSQL
3. MongoDB
4. SQLite
5. Firebase
6. Arquivo JSON

## Decisão

Para a primeira versão da aplicação, os restaurantes serão mantidos em um array na memória do processo da aplicação.

## Justificativa

Essa abordagem foi escolhida pelos seguintes motivos:

* acelera a implementação inicial;
* simplifica a realização dos primeiros testes da API;
* exige pouca configuração;
* mantém a arquitetura inicial simples;
* não depende de infraestrutura adicional;
* não gera custos adicionais durante esta etapa.

## Consequências

### Benefícios

* Menor tempo necessário para implementar a primeira versão.
* Facilidade na realização de testes com as operações GET e POST.
* Arquitetura inicial mais simples.
* Possibilidade de validar rapidamente o funcionamento do conceito proposto.

### Limitações

* As informações armazenadas são apagadas quando o servidor é reiniciado.
* Não existe persistência permanente dos registros.
* A solução não é apropriada para executar a aplicação em múltiplas instâncias.
* Consultas ou operações de análise mais elaboradas ficam limitadas.
* Não há os recursos de integridade e controle normalmente oferecidos por um banco de dados.

## Critérios para reavaliação

A decisão deverá ser revista quando ocorrer uma ou mais das seguintes situações:

1. O MVP estiver validado e o projeto avançar em direção ao ambiente de produção.
2. Passar a ser necessário conservar os dados após reinicializações ou novos deploys.
3. A quantidade de informações tornar inadequado mantê-las diretamente na memória.
4. A aplicação exigir consultas mais avançadas.
5. Surgir a necessidade de relacionar diferentes
