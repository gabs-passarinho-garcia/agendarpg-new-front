# Modal de Troca de Senha - Documentação

## Visão Geral
O modal de troca de senha foi implementado na página de perfil do usuário, permitindo que usuários logados alterem suas senhas de forma segura e intuitiva.

## Localização
- **Componente Principal**: `src/app/components/user-profile/user-profile.component.ts`
- **Modal**: `src/app/shared/change-password-modal/change-password-modal.component.ts`
- **Template**: `src/app/shared/change-password-modal/change-password-modal.component.html`
- **Estilos**: `src/app/shared/change-password-modal/change-password-modal.component.scss`

## Funcionalidades

### 1. Botão de Acesso
- Localizado na seção de ações do card de perfil
- Visível apenas quando não está em modo de edição
- Cor laranja (#FF6B35) para se destacar dos outros botões
- Ícone de cadeado para identificação visual

### 2. Modal de Troca de Senha
- **Campos obrigatórios**:
  - Senha atual
  - Nova senha
  - Confirmação da nova senha

- **Validações**:
  - Todos os campos são obrigatórios
  - Nova senha deve ter mínimo de 6 caracteres
  - Confirmação deve ser igual à nova senha
  - Validação em tempo real

- **Recursos de UX**:
  - Botões de visibilidade para mostrar/ocultar senhas
  - Loading state durante o processamento
  - Mensagens de erro contextuais
  - Design responsivo para mobile

### 3. Integração com API
- Utiliza o endpoint `changePassword` do `UserService`
- Envia dados no formato `ChangePasswordProfileModel`
- Tratamento de erros específicos:
  - 401/400: Senha atual incorreta
  - 422: Dados inválidos
  - Outros: Erro genérico

## Estrutura dos Dados

### ChangePasswordProfileModel
```typescript
export interface ChangePasswordProfileModel {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
```

## Fluxo de Uso

1. **Acesso**: Usuário clica no botão "Alterar Senha" na página de perfil
2. **Preenchimento**: Preenche os três campos obrigatórios
3. **Validação**: Sistema valida dados em tempo real
4. **Submissão**: Clica em "Alterar Senha" para enviar
5. **Processamento**: Loading state é exibido
6. **Resultado**:
   - Sucesso: Modal fecha e exibe mensagem de sucesso
   - Erro: Exibe mensagem de erro específica

## Segurança

### Validações Frontend
- Senha atual obrigatória
- Nova senha com mínimo de 6 caracteres
- Confirmação de senha deve coincidir
- Validação de formulário reativo

### Tratamento de Erros
- Mensagens específicas para cada tipo de erro
- Não exposição de informações sensíveis
- Timeout adequado para mensagens

## Responsividade

### Desktop
- Modal com largura de 500px
- Layout horizontal para botões
- Campos com aparência outline

### Mobile
- Modal adaptável até 90% da viewport
- Botões empilhados verticalmente
- Campos mantêm funcionalidade de visibilidade

## Acessibilidade

### Conformidade
- Labels adequados para todos os campos
- Estados de foco visíveis
- Mensagens de erro associadas aos campos
- Navegação por teclado suportada
- Contraste adequado nas cores

### ARIA
- `aria-label` nos botões de visibilidade
- `aria-pressed` para estado dos botões
- Roles adequados para elementos

## Estilos Customizáveis

### Cores Principais
- Primária: #2196F3 (azul Material)
- Accent: #FF6B35 (laranja para botão principal)
- Erro: #f44336 (vermelho Material)
- Sucesso: Verde (através de classes snackbar)

### Animações
- Ícone de loading rotativo
- Transições suaves nos estados
- Efeitos hover nos botões

## Testes

### Casos de Teste Implementados
- Criação do componente
- Validação de formulário
- Validação de senhas iguais
- Validação de comprimento mínimo
- Chamada do serviço com dados corretos
- Tratamento de erros da API
- Fechamento do modal
- Alternância de visibilidade das senhas

## Manutenção

### Pontos de Atenção
- Manter sincronização com modelo `ChangePasswordProfileModel`
- Atualizar validações conforme regras de negócio
- Monitorar performance em dispositivos móveis
- Verificar compatibilidade com versões Angular

### Possíveis Melhorias Futuras
- Indicador de força da senha
- Sugestões de senha segura
- Histórico de senhas (evitar repetição)
- Autenticação em duas etapas
- Logout automático após troca de senha
