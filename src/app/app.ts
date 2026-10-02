import { Component, signal } from '@angular/core';
import { ShoeLandingComponent } from './shoe-landing/shoe-landing';

@Component({
  standalone: true,
  imports: [ShoeLandingComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('shoe-store');
}
