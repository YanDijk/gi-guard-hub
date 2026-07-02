Vou dividir em blocos claros. Confirme antes de eu começar.

## 1. Mobile — abas do professor
Reescrever layout mobile das telas ainda bugadas, preservando o desktop:
- **Calendário**: grade de 7 colunas hoje quebra no celular. No mobile vira lista vertical por dia (accordion/coluna única), no desktop mantém a grade.
- **Graduações**: cards empilhados, badges e datas com truncate; formulário em coluna única no mobile.
- **Campeonatos**: cards em `grid-cols-1 md:grid-cols-2`, ações (editar/excluir/inscrever) em botões de ícone com toque grande.
- **Mensalidades / Fotos**: ajustes finos de padding, `min-w-0`, `truncate`, botões full-width no mobile.

## 2. Foto do dia — galeria melhorada
- Preview grande: clicar abre um `Dialog` com a foto em tamanho quase-fullscreen.
- Botão **Excluir** (apenas professor) com confirmação — remove do Storage e da tabela.
- **Categorização por dia**: agrupar a listagem por data (`Hoje`, `Ontem`, `DD/MM/AAAA`) com um cabeçalho por grupo. Filtro rápido por data no topo.

## 3. Editar campeonato
- Botão "Editar" no card do professor abre o mesmo formulário de criação pré-preenchido.
- Atualiza `name, city, event_date, registration_deadline, description`, etc.
- Mantém as inscrições existentes.

## 4. RSVP de treino (aluno confirma presença antecipada)
Novo fluxo:
- Aluno vê aulas do dia/semana e clica **"Vou treinar"** (toggle).
- Professor vê no dashboard e na tela de calendário quantos alunos confirmaram por aula, com a lista de nomes.
- Ao chegar no tatame, o professor marca **presença confirmada** (converte RSVP em `attendance` real).
- Se ninguém confirmar até X horas antes, o professor sabe que pode não abrir.

**Banco**: nova tabela `class_rsvps (id, class_id, student_id, class_date, status: 'going'|'confirmed'|'no_show', academy_id, timestamps)` com RLS por academia, trigger de `academy_id`, GRANTs corretos. Índice único `(class_id, student_id, class_date)`.

## 5. Notificações push (Web Push via FCM)
Este bloco é o mais pesado — precisa de:
- Firebase project + VAPID keys (você cria e me passa, ou eu explico o passo-a-passo).
- Service worker `firebase-messaging-sw.js` no `public/`.
- Tabela `push_subscriptions (user_id, fcm_token, academy_id)`.
- Server function que envia push via FCM HTTP v1 usando `INNGEST`/`fetch` + service account.
- Triggers de envio:
  - **Mensalidade**: cron diário (`pg_cron` + `pg_net` → endpoint público) avisando vencimentos em 3 dias e atrasos.
  - **Campeonato**: ao criar campeonato → push para todos alunos da academia.
  - **Feedback**: ao inserir feedback → push para o aluno alvo.
  - **Foto do dia**: ao inserir foto → push para todos alunos da academia.

⚠️ Antes de eu começar o bloco 5, preciso saber:
- Você tem/quer criar um projeto Firebase agora? (é grátis) — sem isso, push web não funciona.
- Se preferir, posso deixar tudo pronto do lado do app e você conecta o Firebase depois.

## Ordem de execução sugerida
1. Blocos 1–4 (fixes mobile + RSVP + editar campeonato + galeria) — entrego numa leva só.
2. Bloco 5 (push) depois que você confirmar o Firebase.

Posso seguir com 1–4 já?