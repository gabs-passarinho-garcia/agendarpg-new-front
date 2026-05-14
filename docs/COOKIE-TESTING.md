# Guia de Teste - Sistema de Cookies

## Como testar o sistema de consentimento de cookies

### 1. Teste Básico - Primeira Visita
1. Abra o navegador em **modo privado/incógnito**
2. Acesse `http://localhost:4200`
3. **Resultado esperado:** Banner de cookies deve aparecer automaticamente

### 2. Teste de Aceitação
1. No banner, clique em **"Aceitar Cookies"**
2. Banner deve desaparecer
3. Tente fazer login normalmente
4. **Resultado esperado:** Login deve funcionar normalmente

### 3. Teste de Rejeição
1. Abra uma nova aba em modo privado
2. Acesse `http://localhost:4200`
3. No banner, clique em **"Rejeitar"**
4. Banner deve desaparecer
5. Tente fazer login
6. **Resultado esperado:** Login deve funcionar normalmente, mas com aviso de que dados são salvos apenas na sessão
7. Feche e reabra o navegador
8. **Resultado esperado:** Usuário NÃO deve estar logado (dados não persistem)

### 4. Teste de Configuração Manual
1. Com cookies aceitos ou rejeitados
2. Abra o menu lateral (ícone ☰)
3. Clique em **"Configurar Cookies"**
4. **Resultado esperado:** Banner deve aparecer novamente

### 5. Teste de Detalhes do Banner
1. Quando o banner estiver visível
2. Clique em **"Ver detalhes dos cookies"**
3. **Resultado esperado:** Seção com informações detalhadas deve expandir
4. Clique em **"Ocultar detalhes"**
5. **Resultado esperado:** Seção deve contrair

### 6. Teste Responsivo
1. Abra o navegador em modo privado
2. Acesse a aplicação
3. Redimensione a janela ou use o modo de dispositivo móvel
4. **Resultado esperado:** Banner deve se adaptar ao tamanho da tela

### 7. Teste de Persistência
1. Aceite os cookies
2. Feche e reabra o navegador (não em modo privado)
3. Acesse a aplicação
4. **Resultado esperado:** Banner NÃO deve aparecer (escolha foi salva)

## Verificações Importantes

### Console do Navegador
- **Com cookies aceitos:** Sem avisos sobre cookies
- **Com cookies rejeitados:** Avisos sobre tentativas de salvar cookies

### DevTools - Application/Storage
- **Cookies essenciais:** `cookie_consent` e `cookie_consent_date` sempre presentes
- **Cookies funcionais:** `auth_token` e `user_data` apenas se aceitos

### Comportamento de Login
- **Cookies aceitos:** Login funciona, usuário fica logado
- **Cookies rejeitados:** Login é bloqueado com snackbar de aviso

## Problemas Comuns e Soluções

### Banner não aparece
- Limpe cookies do navegador: F12 > Application > Storage > Clear storage
- Use modo privado
- Verifique console para erros

### Cookies não são salvos
- Verifique se está em HTTPS (produção) ou localhost (desenvolvimento)
- Verifique configurações de privacidade do navegador
- Confirme que consentimento foi dado

### Erro de compilação
- Execute `ng build` para ver erros detalhados
- Verifique importações nos arquivos TypeScript
- Reinicie o servidor: `Ctrl+C` e `npm start`

## Logs Úteis

Para debug, verifique no console:
```javascript
// Verificar estado do consentimento
localStorage.getItem('cookie_consent')

// Verificar cookies atuais
document.cookie

// Forçar reset do consentimento (teste)
document.cookie = "cookie_consent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
location.reload()
```

## Checklist Final

- [ ] Banner aparece na primeira visita
- [ ] Aceitação permite login normal
- [ ] Rejeição bloqueia login com aviso
- [ ] Detalhes expandem/contraem corretamente
- [ ] Configuração manual funciona
- [ ] Design responsivo
- [ ] Persistência entre sessões
- [ ] Sem erros no console
- [ ] Cookies corretos no DevTools
