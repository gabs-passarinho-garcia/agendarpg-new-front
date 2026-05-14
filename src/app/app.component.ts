import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NaviComponent } from "./shared/navi/navi.component";
import { FooterComponent } from "./shared/footer/footer.component";
import { CookieBannerComponent } from "./shared/cookie-banner/cookie-banner.component";
import { StateService } from './services/state/state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  providers: [],
  imports: [RouterOutlet, NaviComponent, FooterComponent, CookieBannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'agendarpd-new-front';
}
