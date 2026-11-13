# Esquina da Esfiha — app de pedidos (PWA)

React + Vite + Tailwind + Lucide. Sem backend, sem login. O cardápio vem de uma planilha
do Google Sheets e o pedido sai pelo WhatsApp.

## 1. Planilha (cardápio)
1. Crie uma planilha com a linha 1 exatamente assim: `id, categoria, nome, descricao, preco, imagem_url`
   (veja `public/cardapio-exemplo.csv`).
2. Categorias: `Esfihas Salgadas`, `Esfihas Doces`, `Combos`, `Bebidas` (escreva igual em todas as linhas).
3. Arquivo > Compartilhar > **Publicar na Web** > aba do cardápio > formato **CSV** > Publicar. Copie o link.
4. Preço pode ser `2,99` ou `2.99`. `imagem_url` pode ficar vazio (aparece um ícone no lugar).

## 2. Rodar local
```bash
npm install
cp .env.example .env      # depois edite o .env
npm run dev               # abre em http://localhost:5173
```
No `.env`: `VITE_WHATSAPP_NUMBER` (só dígitos, ex.: 5511999999999) e `VITE_MENU_CSV_URL` (link do passo 1).
Sem o link, o app mostra um cardápio de demonstração.

Teste: adicione itens, abra o carrinho, preencha o endereço e toque em "Finalizar Pedido no WhatsApp".
No celular, use o IP que o Vite mostra no terminal (mesmo Wi-Fi).

## 3. Deploy na Vercel
1. Suba a pasta para um repositório no GitHub.
2. Na Vercel: Add New > Project > importe o repositório (ela detecta Vite sozinha).
3. Em **Environment Variables**, cadastre `VITE_WHATSAPP_NUMBER` e `VITE_MENU_CSV_URL`.
4. Deploy. Para atualizar preços, basta editar a planilha (o Google leva alguns minutos para refletir).

## Onde está cada coisa
- `src/App.jsx` — tela principal
- `src/lib/menu.js` — fetch + parse do CSV
- `src/lib/whatsapp.js` — montagem da mensagem e do link wa.me
- `src/hooks/useCart.js` — carrinho (guardado no aparelho)
