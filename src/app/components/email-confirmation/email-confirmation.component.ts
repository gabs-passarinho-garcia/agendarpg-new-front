import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { UserService } from '../../services/user/user.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-email-confirmation',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './email-confirmation.component.html',
  styleUrls: ['./email-confirmation.component.scss']
})
export class EmailConfirmationComponent {
  loading = false;
  email: string = '';

  constructor(
    private router: Router,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    // Recuperar email do state ou localStorage se disponível
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['email']) {
      this.email = navigation.extras.state['email'];
    }
  }

  resendEmail(): void {
    if (!this.email) {
      this.snackBar.open(
        'Email não encontrado. Tente fazer o cadastro novamente.',
        'Fechar',
        {
          duration: 3000,
          panelClass: ['snackbar-error']
        }
      );
      this.router.navigate(['/cadastro']);
      return;
    }

    this.loading = true;
    this.userService.resendActivationEmail(this.email).subscribe({
      next: (response) => {
        this.loading = false;
        this.snackBar.open(
          'Email de ativação reenviado com sucesso!',
          'Fechar',
          {
            duration: 4000,
            panelClass: ['snackbar-success']
          }
        );
      },
      error: (error) => {
        this.loading = false;
        console.error('Erro ao reenviar email:', error);
        this.snackBar.open(
          'Erro ao reenviar email. Tente novamente.',
          'Fechar',
          {
            duration: 3000,
            panelClass: ['snackbar-error']
          }
        );
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}