import { Component, signal, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-home',
  standalone: true,
  // imports: [Router], // kaldırıldı
  template: `
    <div class="home-container">
      <div class="home-card">
        <img src="/badem.png" alt="Badem" class="home-logo" />
        <h1>Event Center</h1>
        <p>Etkinliklerinizi kolayca yönetin ve keşfedin.</p>
        <div class="home-actions">
          <button class="home-btn" (click)="goToEvents()">Etkinlikleri Görüntüle</button>
          <button class="home-btn home-btn-secondary">Yeni Etkinlik Ekle</button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './home.component.css'
})
export class HomeComponent {
  constructor(private router: Router) {}
  goToEvents() {
    this.router.navigate(['/etkinlikler']);
  }
}

@Component({
  selector: 'app-event-search',
  standalone: true,
  imports: [HttpClientModule, NgIf, NgFor, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="event-search-container">
      <div class="event-search-card">
        <h1>Etkinlik Ara</h1>
        <input class="event-search-input" [(ngModel)]="city" (ngModelChange)="onCityInputChange()" (keyup.enter)="searchEvents()" placeholder="Şehir girin... (örn: Istanbul)" />
        <button class="event-search-btn" (click)="searchEvents()">Ara</button>
        <div *ngIf="loading" class="event-search-list-empty">
          <p>Yükleniyor...</p>
        </div>
        <div *ngIf="!loading && error" class="event-search-list-empty">
          <p>Bir hata oluştu: {{error}}</p>
        </div>
        <div *ngIf="!loading && searched && events.length === 0 && !error" class="event-search-list-empty">
          <img src="/badem.png" alt="Badem" class="event-search-logo" />
          <p>Bu şehirde etkinlik bulunamadı.</p>
        </div>
        <div *ngIf="!loading && events.length > 0" class="event-list">
          <div *ngFor="let event of pagedEvents" class="event-card">
            <img *ngIf="event.image" [src]="event.image" class="event-img" alt="{{event.name}}" />
            <div class="event-info">
              <h2>{{event.name}}</h2>
              <p>{{event.date}} - {{event.venue}}</p>
              <a [href]="event.url" target="_blank" class="event-link">Bilet Al</a>
            </div>
          </div>
        </div>
        <div *ngIf="!loading && events.length > 0" class="pagination-controls">
          <button (click)="setPage(page - 1)" [disabled]="page === 1">Geri</button>
          <span>Sayfa {{page}} / {{totalPages}}</span>
          <button (click)="setPage(page + 1)" [disabled]="page === totalPages">İleri</button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './event-search.component.css'
})
export class EventSearchComponent {
  city = '';
  events: any[] = [];
  loading = false;
  error = '';
  searched = false;
  page = 1;
  pageSize = 6;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  get pagedEvents() {
    const start = (this.page - 1) * this.pageSize;
    return this.events.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.events.length / this.pageSize);
  }

  setPage(p: number) {
    if (p >= 1 && p <= this.totalPages) {
      this.page = p;
    }
  }

  searchEvents() {
    if (!this.city) return;
    this.loading = true;
    this.error = '';
    this.events = [];
    this.searched = false;
    this.page = 1;
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?classificationName=music&city=${encodeURIComponent(this.city)}&apikey=6s20YXGCGRq5xtMg56hiJcJHk8aYHa0U`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        console.log('API yanıtı:', res);
        this.loading = false;
        this.searched = true;
        const rawEvents = res._embedded?.events;
        if (Array.isArray(rawEvents) && rawEvents.length > 0) {
          this.events = rawEvents.map((ev: any) => ({
            name: ev.name,
            date: ev.dates?.start?.localDate + (ev.dates?.start?.localTime ? ' ' + ev.dates.start.localTime : ''),
            venue: ev._embedded?.venues?.[0]?.name || '',
            url: ev.url,
            image: ev.images?.[0]?.url || ''
          }));
          console.log('events dizisi:', this.events);
        } else {
          this.events = [];
          console.log('events dizisi: [] (boş)');
        }
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.searched = true;
        this.error = 'Etkinlikler alınamadı veya bulunamadı.';
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    });
  }

  onCityInputChange() {
    if (!this.city) {
      this.events = [];
      this.searched = false;
      this.error = '';
    }
  }
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, NgIf, MatDatepickerModule, MatFormFieldModule, MatInputModule, MatNativeDateModule],
  template: `
    <div class="register-container">
      <div class="register-card">
        <h2>Kayıt Ol</h2>
        <form #registerForm="ngForm" (ngSubmit)="onSubmit()">
          <input class="register-input" name="ad" [(ngModel)]="ad" placeholder="Ad" required />
          <input class="register-input" name="soyad" [(ngModel)]="soyad" placeholder="Soyad" required />
          <input class="register-input" name="email" [(ngModel)]="email" placeholder="E-posta" type="email" required />
          <div class="input-group">
            <span class="input-prefix">+90</span>
            <input class="register-input phone-input" name="telefon" [(ngModel)]="telefon" placeholder="5__ ___ __ __" type="tel" pattern="[5-9][0-9]{9}" maxlength="10" minlength="10" required (input)="onPhoneInput($event)" />
          </div>
          <div class="date-group">
            <mat-form-field appearance="outline" style="width:100%;">
              <mat-label>Doğum Tarihi</mat-label>
              <input matInput [matDatepicker]="picker" [(ngModel)]="dogumTarihi" name="dogumTarihi" required placeholder="gg.aa.yyyy" style="font-family:'Inter', 'Segoe UI', Arial, sans-serif; font-size:1.08rem;" />
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>
          </div>
          <button class="register-btn" type="submit">Kayıt Ol</button>
        </form>
        <div *ngIf="registerSuccess" class="register-success">Kayıt başarılı!</div>
      </div>
    </div>
  `,
  styles: [
    `.register-container {
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background: #f8fafc;
      }
      .register-card {
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 2px 16px #0001, 0 1.5px 8px #f1c27d33;
        padding: 40px 32px 32px 32px;
        min-width: 340px;
        max-width: 96vw;
        font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
        border: 1.5px solid #f1c27d33;
      }
      .register-card h2 {
        margin: 0 0 18px 0;
        font-size: 2rem;
        font-weight: 800;
        color: #22223b;
        letter-spacing: -1px;
        text-align: center;
      }
      .register-input, .phone-input, .register-btn, .input-prefix {
        height: 48px;
        font-size: 1.08rem;
        box-sizing: border-box;
      }
      .register-input {
        width: 100%;
        margin-bottom: 16px;
        padding: 0 12px;
        border-radius: 8px;
        border: 1.5px solid #f1c27d;
        background: #f8fafc;
        color: #22223b;
        outline: none;
        transition: border 0.18s;
        line-height: 48px;
      }
      .register-input:focus {
        border: 1.5px solid #f7b267;
      }
      .register-btn {
        width: 100%;
        background: linear-gradient(90deg,#f1c27d 0%,#f7b267 100%);
        color: #22223b;
        border: none;
        border-radius: 8px;
        padding: 0;
        font-size: 1.13rem;
        font-weight: 600;
        cursor: pointer;
        margin-top: 8px;
        box-shadow: 0 2px 8px #f1c27d22;
        transition: background 0.18s, box-shadow 0.18s, transform 0.13s;
        line-height: 48px;
      }
      .register-btn:hover {
        background: linear-gradient(90deg,#f7b267 0%,#f1c27d 100%);
        box-shadow: 0 4px 16px #f1c27d33;
        transform: translateY(-2px) scale(1.03);
      }
      .register-success {
        color: green;
        margin-top: 16px;
        text-align: center;
        font-weight: 500;
      }
      .input-group {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
      }
      .input-prefix {
        background: #f8fafc;
        border: 1.5px solid #f1c27d;
        border-right: none;
        border-radius: 8px 0 0 8px;
        padding: 0 12px;
        font-size: 1.08rem;
        color: #888;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 48px;
        line-height: 48px;
      }
      .phone-input {
        border-radius: 0 8px 8px 0;
        border-left: none;
        margin-bottom: 0;
        width: 100%;
        padding: 0 12px;
        line-height: 48px;
      }
      .date-group {
        margin-bottom: 16px;
      }
      .mat-form-field {
        width: 100%;
      }
      .mat-input-element {
        font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
        font-size: 1.08rem;
      }
    `
  ]
})
export class RegisterComponent {
  ad = '';
  soyad = '';
  email = '';
  telefon = '';
  dogumTarihi = '';
  registerSuccess = false;

  onSubmit() {
    console.log({ ad: this.ad, soyad: this.soyad, email: this.email, telefon: this.telefon, dogumTarihi: this.dogumTarihi });
    this.registerSuccess = true;
  }

  onPhoneInput(event: any) {
    // Sadece rakam girilmesine izin ver, başında 0 olmasın, 10 haneli olsun
    let value = event.target.value.replace(/\D/g, '');
    if (value.startsWith('0')) value = value.slice(1);
    if (value.length > 10) value = value.slice(0, 10);
    event.target.value = value;
    this.telefon = value;
  }
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HomeComponent, EventSearchComponent, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('event_center');

  showAuthModal = true;

  constructor(private router: Router) {}

  goTo(path: string) {
    this.showAuthModal = false;
    this.router.navigate([path]);
  }
}
