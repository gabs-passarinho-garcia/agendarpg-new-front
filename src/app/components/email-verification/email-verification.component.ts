import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user/user.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './email-verification.component.html',
  styleUrls: ['./email-verification.component.scss']
})
export class EmailVerificationComponent implements OnInit {
  isVerifying = true;
  isSuccess = false;
  isError = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParams['token'];

    if (!token) {
      this.isVerifying = false;
      this.isError = true;
      this.errorMessage = 'Token de verificação não encontrado na URL.';
      return;
    }

    this.verifyEmail(token);
  }

  private verifyEmail(token: string): void {
    this.userService.verifyEmail(token).subscribe({
      next: (response) => {
        this.isVerifying = false;
        this.isSuccess = true;
        this.snackBar.open(
          'Email verificado com sucesso!',
          'Fechar',
          {
            duration: 4000,
            panelClass: ['snackbar-success']
          }
        );
      },
      error: (error) => {
        this.isVerifying = false;
        this.isError = true;
        console.error('Erro na verificação do email:', error);

        // Tentar extrair mensagem de erro da resposta
        if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else if (error.status === 400) {
          this.errorMessage = 'Token inválido ou expirado.';
        } else if (error.status === 404) {
          this.errorMessage = 'Token não encontrado.';
        } else {
          this.errorMessage = 'Erro ao verificar email. Tente novamente.';
        }

        this.snackBar.open(
          this.errorMessage,
          'Fechar',
          {
            duration: 5000,
            panelClass: ['snackbar-error']
          }
        );
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }
}