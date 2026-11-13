# Atividade 8 — roteiro de validação manual

Este roteiro cobre os endpoints e os resultados esperados do enunciado. Execute em uma instância local do EasyFood com SQLite criado pelas migrações Prisma.

## Preparação

1. Cadastre um usuário pela interface ou por `POST /auth/register`.
2. Faça login em `POST /auth/login` e copie o campo `token`.
3. Crie um restaurante em `POST /restaurants` com esse token e copie seu `id`.
4. Substitua `:restaurantId`, `:dishId` e `SEU_JWT` nos exemplos abaixo.

## 1. Cadastro do prato — JSON

**POST** `/restaurants/:restaurantId/dishes`

Cabeçalhos: `Authorization: Bearer SEU_JWT`, `Content-Type: application/json`.

```json
{
  "name": "Lasanha artesanal",
  "category": "Massas",
  "price": "39.90",
  "description": "Massa fresca, molho de tomate e queijo."
}
```

Resultado esperado: `201 Created`, registro persistido no arquivo SQLite por meio do Prisma, `restaurantId` correto e `imageUrl` inicialmente vazio. A resposta retorna o objeto `dish`; copie seu `id`.

## 2. Foto do perfil

**POST** `/auth/me/image`

- Cabeçalho: `Authorization: Bearer SEU_JWT`.
- Corpo: `multipart/form-data`.
- Campo do arquivo: `image`.
- Arquivo: JPEG, PNG ou WebP, no máximo 5 MB.

Resultado esperado: `200 OK`; resposta contém `user.imageUrl` no formato `/uploads/profiles/<uuid>.webp`. Abra essa URL no navegador e confira a imagem.

## 3. Foto de prato já cadastrado

**POST** `/dishes/:dishId/image`

- Cabeçalho: `Authorization: Bearer SEU_JWT`.
- Corpo: `multipart/form-data`.
- Campo do arquivo: `image`.

Resultado esperado: `200 OK`; resposta contém `dish.imageUrl` no formato `/uploads/dishes/<uuid>.webp`. Consulte `GET /restaurants/:restaurantId/dishes` e confirme que a URL foi retornada. Abra a URL no navegador.

## 4. Casos de erro e segurança

| Caso | Resultado esperado |
|---|---|
| Criar prato sem JWT | `401 Unauthorized` |
| Enviar foto de perfil sem JWT | `401 Unauthorized` |
| Enviar foto de prato sem JWT | `401 Unauthorized` |
| Arquivo com MIME/formatos não aceitos | `400 Bad Request` |
| Imagem acima de 5 MB | `413 Payload Too Large` |
| Arquivo corrompido ou que não é imagem | `400 Bad Request` |
| Enviar imagem para prato inexistente | `404 Not Found` |
| Usuário diferente tenta alterar/upload de prato | `403 Forbidden` |
| Perfil sem campo `image` | `400 Bad Request` |

## 5. Consultar o perfil e o cardápio

- **GET** `/auth/me` com JWT: confira `user.imageUrl`.
- **GET** `/restaurants/:restaurantId/dishes`: confira se cada prato retorna `imageUrl`.
- Abra as URLs retornadas para confirmar que o servidor está servindo as imagens.

## Observação

Os testes automatizados atuais validam a entrada/normalização dos campos do prato. Os testes HTTP e uploads reais devem ser executados com as dependências instaladas e o arquivo SQLite criado pelas migrações Prisma; não foram simulados como se tivessem sido executados neste ambiente.
