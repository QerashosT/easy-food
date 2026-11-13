# SQLite com Prisma — execução local sem Docker

Esta versão usa **Prisma ORM + SQLite**. Não requer PostgreSQL, Docker, pgAdmin nem um serviço de banco separado. O arquivo de banco é criado localmente pelo Prisma.

## 1. Preparar o ambiente

1. Instale Node.js 20 ou superior.
2. No CMD, entre na pasta do projeto.
3. Crie o ambiente: `copy .env.example .env`.
4. Confirme que `DATABASE_URL="file:./dev.db"` está no `.env`.

## 2. Instalar e criar o banco

Execute: 

```cmd
npm install
npx prisma generate
npx prisma migrate deploy
```

O Prisma criará o arquivo `prisma/dev.db` e aplicará as migrações versionadas. O arquivo é local e está incluído no `.gitignore`, portanto não será enviado ao GitHub.

## 3. Iniciar

```cmd
npm start
```

Acesse `http://localhost:3000`.

## 4. Inspecionar os dados

Para abrir uma interface visual do banco, execute: `npx prisma studio`. Ela permite consultar e editar os registros usando os modelos do Prisma.

## 5. Backup

Para preservar seus dados, faça uma cópia do arquivo `prisma/dev.db` com a aplicação parada. Não apague esse arquivo ao atualizar o código.

## Observação sobre a atividade

O Prisma ORM permanece como camada de persistência, mas o provider desta variante é `sqlite`. O enunciado da Atividade 8 cita PostgreSQL; SQLite não é equivalente a PostgreSQL. Use esta versão para desenvolvimento local sem servidor de banco, sabendo que a troca do provider diverge desse requisito literal.
