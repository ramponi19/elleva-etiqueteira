# Como rodar o Elleva Tickets no seu computador

Guia rápido pra ligar o projeto na sua máquina (Windows) e trabalhar com o
Claude Code no terminal. Não precisa saber programar pra seguir.

---

## 1. O que você precisa ter instalado (só uma vez)

- **Node.js 20+** — https://nodejs.org (baixe a versão "LTS")
- **Git** — https://git-scm.com
- **Claude Code** — depois de instalar o Node, rode no PowerShell:
  ```powershell
  npm install -g @anthropic-ai/claude-code
  ```

Pra conferir se está tudo ok:
```powershell
node --version    # deve mostrar v20, v22 ou maior
git --version     # deve mostrar a versão do git
claude --version  # deve mostrar a versão do claude
```

---

## 2. Onde o projeto fica

```
D:\Empresa TI\Elleva Tickets\elleva-etiqueteira
```

Se um dia precisar baixar de novo do zero:
```powershell
cd "D:\Empresa TI\Elleva Tickets"
git clone https://github.com/ramponi19/elleva-etiqueteira.git
cd elleva-etiqueteira
npm install
```

---

## 3. Ligar o site (toda vez que for trabalhar)

Abra o **PowerShell** e rode:
```powershell
cd "D:\Empresa TI\Elleva Tickets\elleva-etiqueteira"
npm run dev
```

Quando aparecer `✓ Ready`, abra no navegador:
**http://localhost:3000**

Pra **parar** o site: clique no PowerShell e aperte **Ctrl + C**.

> Deixe essa janela aberta enquanto trabalha. É ela que mantém o site no ar.

---

## 4. Trabalhar com o Claude (o pulo do gato)

O site precisa continuar rodando na janela de cima. Então abra uma
**SEGUNDA janela** do PowerShell só pro Claude:

```powershell
cd "D:\Empresa TI\Elleva Tickets\elleva-etiqueteira"
claude
```

Agora é só **conversar em português**, como a gente já faz. Exemplos do que
você pode pedir:

- "deixa o botão Comprar maior"
- "muda o título do carrossel pra outra fonte"
- "o footer tá muito grande, diminui"

O Claude edita o código, você salva, e a página em **localhost:3000**
**atualiza sozinha** na hora. Sem deploy, sem espera.

### Comandos úteis dentro do Claude
- Escreva normalmente e aperte Enter pra pedir algo.
- Pra **sair** do Claude: digite `/exit` ou aperte **Ctrl + C** duas vezes.
- Se ele pedir permissão pra rodar algo, é só confirmar.

---

## 5. Publicar as mudanças no site de verdade (produção)

Enquanto você mexe no `localhost:3000`, é só no **seu** computador — o site
público (elleva-tickets.vercel.app) **não muda**.

Quando você (ou o Claude) estiver satisfeito e quiser publicar, peça ao
Claude: **"sobe isso pra produção"**. Ele cuida de commitar e enviar, e a
Vercel publica em poucos minutos.

Se quiser fazer manualmente:
```powershell
git add -A
git commit -m "descrição da mudança"
git push origin main
```

---

## 6. Se der algum erro

- **"claude não é reconhecido"** → rode `npm install -g @anthropic-ai/claude-code`
- **Erro de Supabase ao abrir o site** → falta o arquivo `.env.local` (peça
  as chaves ao Claude, ele te ajuda a recriar)
- **Qualquer outra coisa** → copie a mensagem de erro e cole pro Claude. Ele
  resolve.

---

## Resumo do dia a dia

1. PowerShell 1: `npm run dev` (deixa aberto)
2. PowerShell 2: `claude` (onde você pede as coisas)
3. Navegador: **localhost:3000** (onde você vê o resultado)
