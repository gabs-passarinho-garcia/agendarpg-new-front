import { Component }              from '@angular/core';
import { CommonModule }           from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule }          from '@angular/material/card';
import { MatFormFieldModule }     from '@angular/material/form-field';
import { MatInputModule }         from '@angular/material/input';
import { MatButtonModule }        from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule, Router } from '@angular/router';
import { LoginService } from '../../services/login/login.service';
import { LoginModel } from '../../models/login';
import { StateService } from '../../services/state/state.service';
import { HttpClientModule } from '@angular/common/http';
import { UserService } from '../../services/user/user.service';
import { CookieConsentService } from '../../services/cookie-consent/cookie-consent.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  providers: [
    LoginService,
    UserService
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    RouterModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private loginService: LoginService,
    private stateService: StateService,
    private userService: UserService,
    private router: Router,
    private cookieConsentService: CookieConsentService,
    private snackBar: MatSnackBar
  ) {}

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.login();
    }
  }

  // Função para decodificar JWT
  private decodeJWT(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
      return null;
    }
  }

  login() {
    if (this.loginForm.valid) {
      const credentials = this.loginForm.value;
      this.isLoading = true;

      this.loginService.login(credentials as LoginModel).subscribe({
        next: (response) => {
          // Primeiro salvar o token
          this.stateService.token = response.data.accessToken;
          this.stateService.refreshToken = response.data.refreshToken;
          this.stateService.isLoggedIn = true;

          // Depois buscar dados completos do usuário
          this.userService.getUserProfile().pipe(
            finalize(() => {
              this.isLoading = false;
            })
          ).subscribe({
            next: (userResponse) => {
              console.log('Resposta completa do getUserProfile:', userResponse);
              if (userResponse.data) {
                console.log('Dados do usuário recebidos:', userResponse.data);
                // Salvar dados completos do usuário
                this.stateService.userData = userResponse.data;

                // Informar sobre o método de armazenamento
                const storageMethod = this.stateService.getStorageMethod();
                const storageMessage = storageMethod === 'cookies'
                  ? 'Login realizado com sucesso! Dados salvos em cookies.'
                  : 'Login realizado com sucesso! Dados salvos apenas nesta sessão (sem cookies).';

                this.snackBar.open(
                  storageMessage,
                  'Fechar',
                  {
                    duration: 4000,
                    panelClass: ['snackbar-success']
                  }
                );

                this.router.navigate(['/dashboard']);
              }
            },
            error: (userError) => {
              console.error('Erro ao buscar dados do usuário:', userError);
              // Fallback: usar dados do token se busca falhar
              const tokenData = this.decodeJWT(response.data.accessToken);
              if (tokenData) {
                this.stateService.userData = {
                  id: tokenData.id,
                  email: tokenData.sub,
                  nomeCompleto: tokenData.nomeCompleto,
                  apelido: tokenData.apelido || tokenData.nomeCompleto || '',
                  tipo: tokenData.tipo,
                  password: '',
                  dataDeNascimento: '',
                  telefone: '',
                  menor: ''
                };

                this.snackBar.open(
                  'Login realizado com sucesso!',
                  'Fechar',
                  {
                    duration: 3000,
                    panelClass: ['snackbar-success']
                  }
                );

                this.router.navigate(['/dashboard']);
              }
            }
          });
        },
        error: (error) => {
          console.error('Login failed:', error);
          this.isLoading = false;
          this.snackBar.open(
            'Erro ao fazer login. Verifique suas credenciais.',
            'Fechar',
            {
              duration: 3000,
              panelClass: ['snackbar-error']
            }
          );
        }
      });
    }
  }

  goToRegister(): void {
    this.router.navigate(['/cadastro']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/recuperar-senha']);
  }
}
