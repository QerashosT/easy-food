# EasyFood — Rotas

## Páginas

- `GET /` — catálogo e área autenticada da aplicação.
- `GET /auth` — redireciona para `/auth/login`.
- `GET /auth/login` — tela de login.
- `GET /auth/register` — tela de cadastro.
- `GET /restaurantes/:restaurantId/cardapio` — página independente do cardápio.

## Autenticação

- `POST /auth/register` — cria usuário.
- `POST /auth/login` — autentica e emite JWT.
- `GET /auth/me` — retorna usuário autenticado, inclusive `imageUrl` (JWT).
- `POST /auth/me/image` — upload da foto do perfil autenticado (JWT + Multer + Sharp, campo `image`).

## Restaurantes

- `GET /restaurants` — lista restaurantes e contagem de pratos.
- `POST /restaurants` — cria restaurante e associa o usuário do JWT como proprietário.

## Pratos

- `GET /restaurants/:restaurantId/dishes` — consulta o cardápio; retorna `imageUrl`.
- `POST /restaurants/:restaurantId/dishes` — cria prato via JSON (`name`, `category`, `price`, `description`); JWT + propriedade.
- `PATCH /restaurants/:restaurantId/dishes/:dishId` — altera os campos do prato via JSON; JWT + propriedade.
- `DELETE /restaurants/:restaurantId/dishes/:dishId` — exclui prato e arquivo; JWT + propriedade.
- `POST /dishes/:dishId/image` — upload/atualização da imagem do prato (JWT + propriedade + Multer + Sharp, campo `image`).

## Infraestrutura

- `GET /health` — health check.
- `GET /uploads/profiles/:filename` — acesso público à imagem de perfil.
- `GET /uploads/dishes/:filename` — acesso público à imagem do prato.

As imagens aceitas na entrada são JPEG, PNG e WebP, com até 5 MB. O armazenamento converte as imagens válidas para WebP.
