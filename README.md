# EasyFood

Aplicação web e API de gerenciamento de restaurantes e cardápios, construída com **Node.js, Express, Prisma ORM e SQLite**, com autenticação JWT e arquitetura modular. O Prisma continua sendo a camada de acesso aos dados; o SQLite é o banco local em arquivo.

## Funcionalidades

- Cadastro e autenticação de usuários com senha em hash e token JWT.
- Cadastro e listagem de restaurantes; cada restaurante é associado ao usuário autenticado que o criou.
- Cardápio público em página própria para cada restaurante (`/restaurantes/:id/cardapio`).
- Cadastro de pratos por JSON com nome, categoria, descrição e preço.
- Upload independente de foto para cada prato.
- Upload de foto do perfil do usuário autenticado.
- Processamento compartilhado de imagens com Multer e Sharp: validação real do conteúdo, rotação EXIF, redimensionamento e conversão para WebP.
- Imagens públicas acessíveis por URL em `/uploads/...`.
- Autorização no backend: somente o criador do restaurante pode cadastrar, editar, excluir ou enviar foto para os pratos daquele restaurante.
- Notificação opcional por e-mail ao proprietário no cadastro de prato (API do Resend, mantida da versão anterior).

## Requisitos

- Node.js 20 ou superior (Node 22 recomendado).
- npm.
- Não é necessário instalar PostgreSQL, Docker ou outro servidor de banco de dados.

## Instalação local (Windows CMD)

1. Extraia o projeto e abra o CMD na pasta `easy-food`.
2. Crie seu arquivo de ambiente:

   ```cmd
   copy .env.example .env
   ```

3. Instale as dependências:

   ```cmd
   npm install
   ```

4. Gere o Prisma Client e aplique a migração inicial (o banco SQLite será criado automaticamente em `prisma/dev.db`):

   ```cmd
   npx prisma generate
   npx prisma migrate deploy
   ```

5. Inicie a aplicação:

   ```cmd
   npm start
   ```

Acesse `http://localhost:3000`. A página `/health` retorna o status da API.

Para desenvolvimento com reinício automático:

```cmd
npm run dev
```

## Banco de dados e Prisma

O projeto **continua usando Prisma ORM**. O Prisma é o ORM (camada que mapeia modelos e operações JavaScript para o banco); ele não é, por si só, um banco de dados. Nesta versão, o provider configurado no `prisma/schema.prisma` é `sqlite`, e o arquivo local é definido pela variável `DATABASE_URL="file:./dev.db"`. Como o caminho é relativo ao schema, o banco fica em `prisma/dev.db`.

As migrações versionadas criam as tabelas `User`, `Restaurant`, `Dish` e `Activity`. Para alterações futuras no modelo durante o desenvolvimento, use `npx prisma migrate dev --name nome-da-alteracao`. Não apague `prisma/dev.db` se quiser manter os dados cadastrados.

**Diferença em relação ao enunciado:** o texto da Atividade 8 menciona PostgreSQL. Esta variante foi configurada deliberadamente para SQLite porque você solicitou não utilizar PostgreSQL. Ela mantém Prisma ORM, mas não atende literalmente ao requisito de banco PostgreSQL. Se o professor exigir esse banco, será necessário alterar apenas o provider/conexão e gerar migrações PostgreSQL compatíveis.

## Arquitetura de imagens

A lógica comum está em `src/modules/shared/image.service.js`:

1. `upload.middleware.js` recebe um único arquivo no campo `image` com Multer em memória.
2. O middleware limita o arquivo a 5 MB e aceita somente os MIME types JPEG, PNG e WebP.
3. O `image.service.js` valida o formato real lendo os metadados com Sharp, corrige orientação EXIF, redimensiona e converte a imagem para WebP.
4. O arquivo otimizado é armazenado em `public/uploads/profiles` ou `public/uploads/dishes`, com nome UUID.
5. O caminho público é salvo em `User.imageUrl` ou `Dish.imageUrl`.
6. As imagens podem ser visualizadas pelo navegador em `/uploads/profiles/...` e `/uploads/dishes/...`.

A pasta de uploads deve permanecer em armazenamento persistente no ambiente de produção. Para deploy com múltiplas instâncias, substitua o armazenamento em disco local por um storage compartilhado (por exemplo, S3 compatível), mantendo o mesmo contrato do serviço de imagens.

## Endpoints

### Autenticação

- `POST /auth/register` — cria usuário.
- `POST /auth/login` — autentica e devolve JWT.
- `GET /auth/me` — retorna os dados do usuário autenticado, incluindo `imageUrl` (JWT obrigatório).
- `POST /auth/me/image` — envia/atualiza a foto do usuário autenticado (JWT obrigatório, `multipart/form-data`, campo `image`). O usuário é identificado exclusivamente pelo token.

### Restaurantes

- `GET /restaurants` — lista restaurantes e quantidade de pratos.
- `POST /restaurants` — cria restaurante e define o usuário autenticado como proprietário (JWT obrigatório).

### Pratos

- `GET /restaurants/:restaurantId/dishes` — lista pratos e retorna `imageUrl`.
- `POST /restaurants/:restaurantId/dishes` — cria prato por `application/json`; exige JWT e propriedade do restaurante. Campos: `name`, `category`, `price`, `description`. Retorna `201 Created`.
- `PATCH /restaurants/:restaurantId/dishes/:dishId` — atualiza campos do prato por JSON; exige JWT e propriedade do restaurante.
- `DELETE /restaurants/:restaurantId/dishes/:dishId` — exclui prato e foto vinculada; exige JWT e propriedade do restaurante. Retorna `204 No Content`.
- `POST /dishes/:dishId/image` — envia/atualiza a foto de um prato existente (JWT obrigatório; somente o proprietário do restaurante pode enviar; `multipart/form-data`, campo `image`).

Todas as rotas protegidas usam `Authorization: Bearer <token>`.

### Exemplo de criação de prato

`POST /restaurants/1/dishes`

Cabeçalhos:

```http
Authorization: Bearer SEU_JWT
Content-Type: application/json
```

Corpo:

```json
{
  "name": "Lasanha da casa",
  "category": "Massas",
  "price": "39.90",
  "description": "Lasanha artesanal com molho de tomate e queijo."
}
```

A foto é enviada em outra requisição:

`POST /dishes/1/image`

Com `Authorization: Bearer SEU_JWT` e corpo `multipart/form-data` com o campo `image` contendo o arquivo.

## Testes

Execute:

```cmd
npm test
```

A coleção de cenários manuais para a Atividade 8 está em [`docs/ATIVIDADE-8-TESTES.md`](docs/ATIVIDADE-8-TESTES.md).

## Configuração opcional de e-mail

Para manter a notificação de novo prato, configure `RESEND_API_KEY`, `EMAIL_FROM` e `APP_BASE_URL` no `.env`. O envio de e-mail não é requisito do upload da Atividade 8 e uma falha no Resend não desfaz o prato cadastrado.

## Reflexões de arquitetura (Atividade 8)

- **Reutilização:** usuários e pratos têm necessidades idênticas de recepção, validação, otimização e armazenamento de imagem. O serviço compartilhado evita duplicação e mantém as regras consistentes.
- **Controller:** interpreta HTTP, valida o contrato da requisição, chama serviços e escolhe status/corpo da resposta.
- **Service:** contém regras de negócio, acesso ao Prisma e processamento/armazenamento de imagens, sem depender de `req` ou `res`.
- **Rotas:** declaram método, caminho e middlewares; não executam processamento de imagem nem lógica de persistência.
- **Autenticação:** o middleware JWT define `req.user`; o endpoint de perfil não recebe identificador de usuário do cliente. Para prato, o service verifica se o usuário é proprietário do restaurante.
- **Falha de processamento:** a requisição retorna erro HTTP adequado e nenhum caminho de imagem é salvo. Se a gravação no banco falhar após a geração do arquivo, o controller tenta remover o arquivo recém-criado.
- **Evolução:** novos módulos podem reutilizar `upload.middleware.js` e `image.service.js`, com rotas/controladores específicos e sem copiar lógica de Sharp.
