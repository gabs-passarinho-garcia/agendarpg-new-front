import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent }     from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { NewEventComponent } from './components/new-event/new-event.component';
import { CreateActivityComponent } from './components/activities/create-activity/create-activity.component';
import { MyActivitiesCreatedComponent } from './components/my-activities-created/my-activities-created.component';
import { MyEventsComponent } from './components/my-events/my-events.component';
import { RegisteredEventsComponent } from './components/registered-events/registered-events.component';
import { RegisterNewUserComponent } from './components/register-new-user/register-new-user.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { AuthGuard } from './guards/auth.guard';
import { ActivityCreationGuard } from './guards/activity-creation.guard';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { EmailConfirmationComponent } from './components/email-confirmation/email-confirmation.component';
import { EmailVerificationComponent } from './components/email-verification/email-verification.component';
import { UserManagementComponent } from './components/admin/user-management/user-management.component';
import { EventManagementComponent } from './components/admin/event-management/event-management.component';
import { TagManagementComponent } from './components/admin/tag-management/tag-management.component';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '',         redirectTo: 'dashboard',    pathMatch: 'full' },
  { path: 'login',    component: LoginComponent },
  { path: 'cadastro', component: RegisterNewUserComponent },
  { path: 'confirmacao-email', component: EmailConfirmationComponent },
  { path: 'verify-email', component: EmailVerificationComponent },
  { path: 'dashboard',component: DashboardComponent },
  { path: 'recuperar-senha', component: ForgotPasswordComponent },
  {
    path: 'novo-evento',
    component: NewEventComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'meus-eventos',
    component: MyEventsComponent,
    canActivate: [AuthGuard, ActivityCreationGuard]
  },
  {
    path: 'minhas-atividades-criadas',
    component: MyActivitiesCreatedComponent,
    canActivate: [AuthGuard, ActivityCreationGuard]
  },
  {
    path: 'eventos-registrados',
    component: RegisteredEventsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'perfil',
    component: UserProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/usuarios',
    component: UserManagementComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'admin/eventos',
    component: EventManagementComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'atividades',
    component: CreateActivityComponent,
    canActivate: [AuthGuard, ActivityCreationGuard]
  },
  {
    path: 'admin/tags',
    component: TagManagementComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  { path: '**',       redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
