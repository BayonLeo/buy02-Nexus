import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService} from "./services/auth.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
    public isLoggedIn$: Observable<boolean>;
    public currentUser$: Observable<any>;
    public isSeller$: Observable<boolean>;

    constructor(private authService: AuthService) {
        this.isLoggedIn$ = this.authService.isLoggedIn$;
        this.currentUser$ = this.authService.currentUser$;
        this.isSeller$ = this.authService.isSeller$;
    }


    logout(): void {
        this.authService.logout();
    }
}
