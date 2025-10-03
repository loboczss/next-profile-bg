# Next Profile BG

Aplicação base construída com Next.js 15 e autenticação via [NextAuth.js](https://next-auth.js.org/). Este documento reúne o passo a passo para depurar problemas de login (Google OAuth e credenciais) e explica como a confirmação visual de login bem-sucedido foi implementada.

## Visão geral do fluxo de autenticação
- A configuração dos provedores está centralizada em [`auth.ts`](auth.ts).
- A tela de login fica em [`app/signin/page.tsx`](app/signin/page.tsx) e envia formulários diretamente para os endpoints padrão do NextAuth.
- Após autenticação bem-sucedida, o usuário é redirecionado para `/dashboard?login=success`, onde um toast confirma o sucesso do login.

## Debug do login com Google OAuth
1. **Verifique variáveis de ambiente obrigatórias**
   - `AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET` devem existir e corresponder às credenciais geradas no [Google Cloud Console](https://console.cloud.google.com/).
   - `NEXTAUTH_URL` deve apontar para a URL pública (ou `http://localhost:3000` em desenvolvimento) para que o fluxo OAuth finalize corretamente.
2. **Confirme URIs autorizadas no Google**
   - A URI de redirecionamento deve incluir `https://<host>/api/auth/callback/google` e, em desenvolvimento, `http://localhost:3000/api/auth/callback/google`.
3. **Cheque a configuração do provedor**
   - Abra [`auth.ts`](auth.ts) e confirme que o provider Google está sendo registrado com os valores esperados.
4. **Habilite logs detalhados**
   - Execute o app com `NEXTAUTH_DEBUG=true npm run dev` para imprimir no terminal o passo a passo do fluxo e erros retornados pelo Google.
5. **Inspecione a requisição no navegador**
   - No DevTools, acompanhe a chamada `POST /api/auth/signin/google` gerada pela tela de login e verifique se há erros de CORS, cookies bloqueados ou status HTTP inesperados.
6. **Verifique o relógio do servidor**
   - Grandes divergências de horário podem invalidar tokens OAuth. Garanta que a máquina está sincronizada (ex.: `timedatectl status`).

## Debug do login com credenciais (email/senha)
1. **Banco de dados acessível**
   - `DATABASE_URL` precisa apontar para um banco acessível. Rode `npx prisma migrate status` ou `npx prisma studio` para confirmar conectividade.
2. **Usuário com hash armazenado**
   - Verifique na tabela `User` se o campo `passwordHash` está preenchido. Caso contrário, crie/atualize o usuário usando a mesma rotina de hash utilizada em [`prisma/seed.ts`](prisma/seed.ts) ou pela API de signup.
3. **Logs do NextAuth**
   - Ative `NEXTAUTH_DEBUG=true` para exibir no terminal mensagens de erro lançadas durante `authorize` em [`auth.ts`](auth.ts).
4. **Conferência manual da senha**
   - Utilize um script Node para validar `bcrypt.compare` entre a senha digitada e o hash salvo, descartando problemas de encoding ou espaçamento.
5. **Inspecione os envios da tela de login**
   - Na aba Network do DevTools, confira o `POST /api/auth/callback/credentials`: o corpo deve conter `email` e `password`, e a resposta deve ser `302` em caso de sucesso.
6. **Audite middlewares ou policies**
   - Caso haja middlewares ou edge functions customizadas (não presentes por padrão), confirme que elas não estão barrando a requisição.

## Confirmação visual de login bem-sucedido
1. A tela de login envia `callbackUrl=/dashboard?login=success` (veja [`app/signin/page.tsx`](app/signin/page.tsx)).
2. A página protegida inclui o componente [`LoginSuccessToast`](components/login-success-toast.tsx), que lê o parâmetro `login=success`, dispara um toast com o `sonner` e remove o parâmetro da URL usando `router.replace`.
3. O toaster global já está registrado em [`app/layout.tsx`](app/layout.tsx); portanto, nenhum ajuste adicional é necessário para que a notificação apareça.

## Como executar o projeto localmente
```bash
npm install
npm run dev
```
A aplicação estará disponível em `http://localhost:3000`.
