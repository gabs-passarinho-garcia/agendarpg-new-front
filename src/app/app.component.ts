import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NaviComponent } from "./shared/navi/navi.component";
import { FooterComponent } from "./shared/footer/footer.component";
import { CookieBannerComponent } from "./shared/cookie-banner/cookie-banner.component";
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  providers: [],
  imports: [RouterOutlet, NaviComponent, FooterComponent, CookieBannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'agendarpd-new-front';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.triggerHealthCheck();
    }
  }

  private triggerHealthCheck(): void {
    // Fire and forget health check to wake up the backend (cold start mitigation)
    fetch(`${environment.apiUrl}/health`).catch(() => {
      // Ignore errors, we just want to trigger the request
    });
  }
}
