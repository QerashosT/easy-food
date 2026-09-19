# ADR-002 — Definição do banco de dados da EasyFood

## Contexto

Na primeira versão da API da EasyFood, os restaurantes eram armazenados diretamente em um array mantido na memória da aplicação.

Essa solução fazia com que todos os registros desaparecessem sempre que o servidor fosse reiniciado. Por isso, tornou-se necessário adotar uma forma de armazenamento persistente, capaz de conservar as informações em disco sem acrescentar uma estrutura de infraestrutura desproporcional ao estágio atual do projeto.

## Alternativas avaliadas

1. **PostgreSQL / MySQL:** bancos relacionais tradicionais que funcionam por meio de uma arquitetura cliente-servidor. Neste momento, foram considerados inadequados devido à necessidade de configuração adicional e de uma infraestrutura externa ou local, como Docker ou um servidor de banco de dados.

2. **MongoDB:** solução NoSQL baseada em documentos. Foi descartada porque a estrutura atual da aplicação possui uma organização relacional simples, tornando um banco baseado em tabelas mais apropriado para o modelo existente.

3. **SQLite:** banco de dados relacional compacto que mantém as informações dentro de um único arquivo local.

## Decisão

A EasyFood passará a utilizar o **SQLite** como mecanismo oficial de armazenamento de dados da API.

## Justificativa

O SQLite permite trabalhar com um banco de dados relacional e utilizar SQL, mas sem exigir a execução de um servidor de banco de dados independente.

Os registros são armazenados diretamente em um arquivo local, como `database.db`. Dessa forma, a aplicação consegue obter persistência dos dados sem precisar introduzir uma infraestrutura complexa nesta fase.

## Consequências positivas

* **Persistência:** os restaurantes cadastrados por meio das requisições POST continuam disponíveis mesmo depois que o servidor é reiniciado.
* **Configuração simplificada:** não é necessário instalar ou administrar uma infraestrutura externa de banco de dados.
* **Portabilidade:** todo o conteúdo do banco fica concentrado em um único arquivo, facilitando seu transporte e gerenciamento.

## Consequências negativas

* **Concorrência limitada:** o SQLite não é a alternativa mais adequada para cenários de grande escala com muitas operações de escrita ocorrendo simultaneamente.
* **Operações assíncronas:** a comunicação com o banco passa a exigir tratamento adequado das operações e de seus respectivos retornos, podendo envolver callbacks ou mecanismos assíncronos.

## Critérios para reavaliação

A escolha deverá ser novamente analisada caso a EasyFood passe a operar em múltiplos servidores na nuvem, situação em que depender de arquivos locais pode deixar de ser uma solução adequada.

A decisão também deverá ser revista se a aplicação passar a receber uma quantidade muito elevada de requisições simultâneas.

Nesses cenários, poderá ser considerada a migração para um sistema de gerenciamento de banco de dados baseado em arquitetura cliente-servidor, como o PostgreSQL.
# ADR-002 — Definição do banco de dados da EasyFood

## Contexto

Na primeira versão da API da EasyFood, os restaurantes eram armazenados diretamente em um array mantido na memória da aplicação.

Essa solução fazia com que todos os registros desaparecessem sempre que o servidor fosse reiniciado. Por isso, tornou-se necessário adotar uma forma de armazenamento persistente, capaz de conservar as informações em disco sem acrescentar uma estrutura de infraestrutura desproporcional ao estágio atual do projeto.

## Alternativas avaliadas

1. **PostgreSQL / MySQL:** bancos relacionais tradicionais que funcionam por meio de uma arquitetura cliente-servidor. Neste momento, foram considerados inadequados devido à necessidade de configuração adicional e de uma infraestrutura externa ou local, como Docker ou um servidor de banco de dados.

2. **MongoDB:** solução NoSQL baseada em documentos. Foi descartada porque a estrutura atual da aplicação possui uma organização relacional simples, tornando um banco baseado em tabelas mais apropriado para o modelo existente.

3. **SQLite:** banco de dados relacional compacto que mantém as informações dentro de um único arquivo local.

## Decisão

A EasyFood passará a utilizar o **SQLite** como mecanismo oficial de armazenamento de dados da API.

## Justificativa

O SQLite permite trabalhar com um banco de dados relacional e utilizar SQL, mas sem exigir a execução de um servidor de banco de dados independente.

Os registros são armazenados diretamente em um arquivo local, como `database.db`. Dessa forma, a aplicação consegue obter persistência dos dados sem precisar introduzir uma infraestrutura complexa nesta fase.

## Consequências positivas

* **Persistência:** os restaurantes cadastrados por meio das requisições POST continuam disponíveis mesmo depois que o servidor é reiniciado.
* **Configuração simplificada:** não é necessário instalar ou administrar uma infraestrutura externa de banco de dados.
* **Portabilidade:** todo o conteúdo do banco fica concentrado em um único arquivo, facilitando seu transporte e gerenciamento.

## Consequências negativas

* **Concorrência limitada:** o SQLite não é a alternativa mais adequada para cenários de grande escala com muitas operações de escrita ocorrendo simultaneamente.
* **Operações assíncronas:** a comunicação com o banco passa a exigir tratamento adequado das operações e de seus respectivos retornos, podendo envolver callbacks ou mecanismos assíncronos.

## Critérios para reavaliação

A escolha deverá ser novamente analisada caso a EasyFood passe a operar em múltiplos servidores na nuvem, situação em que depender de arquivos locais pode deixar de ser uma solução adequada.

A decisão também deverá ser revista se a aplicação passar a receber uma quantidade muito elevada de requisições simultâneas.

Nesses cenários, poderá ser considerada a migração para um sistema de gerenciamento de banco de dados baseado em arquitetura cliente-servidor, como o PostgreSQL.
