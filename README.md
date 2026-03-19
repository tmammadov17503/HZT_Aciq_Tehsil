# AçıqTəhsil — Azərbaycanın Pulsuz Rəqəmsal Təhsil Platforması

> Coğrafi mövqedən və sosial vəziyyətdən asılı olmayaraq hər kəs üçün keyfiyyətli və pulsuz təhsil.

**Live site:** https://tmammadov17503.github.io/HZT_Aciq_Tehsil/

---

## Layihə haqqında

AçıqTəhsil — 9, 10 və 11-ci sinif şagirdləri üçün hazırlanmış pulsuz onlayn tədris platformasıdır. Şagirdlər qeydiyyatdan keçərək buraxılış fənnləri üzrə resursları (test kitabları, qayda kitabları), video dərs seanslarını rezerv edə, rəylərini bölüşə bilərlər. Müəllimlər isə başvuru forması vasitəsilə platformaya qoşula bilərlər.

Platform Firebase Authentication + Firestore üzərində qurulub və tamamilə statik — heç bir backend server tələb etmir. Bütün fayllar GitHub Pages-də host edilir.

---

## İmkanlar

### 👤 İstifadəçi hesabı
- E-poçt + şifrə ilə qeydiyyat (e-poçt təsdiqləməsi tələb olunur)
- Google hesabı ilə bir klikdə daxil ol / qeydiyyat
- Şifrəni unutdunuz? → e-poçta sıfırlama linki göndərilir
- Enter düyməsi ilə form göndərmə dəstəyi
- Bildiriş zəngi — ilk girişdə "Hesabınız aktivləşdirildi" bildirişi
- Profil avatarı (ad baş hərfi) + çıxış menyusu

### 📚 Kurslar (`kurslar.html`)
Qeydiyyatdan keçmiş istifadəçilər aşağıdakı proqramlara daxil ola bilər:

| Sinif | Buraxılış Fənnləri | Blok Fənnləri |
|-------|--------------------|---------------|
| 9-cu  | Azərbaycan dili, İngilis dili, Riyaziyyat | — |
| 10-cu | Azərbaycan dili, İngilis dili, Riyaziyyat | I, II, III, IV qrup |
| 11-ci | Azərbaycan dili, İngilis dili, Riyaziyyat | I, II, III, IV qrup |

**Blok qrupları:**
- **I qrup** — Riyaziyyat, Fizika, Kimya, İnformatika
- **II qrup** — Riyaziyyat, Coğrafiya, Azərbaycan tarixi, Ümumi tarix
- **III qrup** — Azərbaycan dili, Ədəbiyyat, Azərbaycan tarixi, Ümumi tarix
- **IV qrup (Tibb)** — Biologiya, Kimya, Fizika, Riyaziyyat

Hər fənn səhifəsində: **Test kitabları / Qayda kitabları** filtri + axtarış çubuğu + resurs kartları.

### 🎥 Video Dərslər (`video_dersler.html`)
Qeydiyyatdan keçmiş istifadəçilər seansları rezerv edə bilər:
- Math Tutoring — 70 ₼ / 1.5 saat
- Study Skills Course — 50 ₼ / 1 saat
- Science Workshops — 60 ₼ / 1.5 saat

Rezervasiya axını: tarix seçimi (həftə sonları blokdur) → saat slotu → təsdiq ekranı. Rezervasiyalar Firestore-da saxlanılır.

### 💬 Kommentlər (`kommentler.html`)
- 1–5 ulduz qiymətləndirmə
- Ad, e-poçt, rəy mətni
- Göndərilən rəy dərhal ekranda görünür (Firestore-dan əvvəl)
- Bütün rəylər Firestore `comments` kolleksiyasında saxlanılır
- Səhifəni açanda bütün əvvəlki rəylər yüklənir

### ✍️ Başvur (`bashvur.html`)
Müəllim / Təlimçi olmaq üçün müraciət forması. Ad, soyad, e-poçt, telefon (məcburi), vəzifə, iş yeri, təcrübə. Məlumatlar Firestore `applications` kolleksiyasına yazılır.

---

## Fayl strukturu

```
docs/
├── index.html           # Ana səhifə
├── kurslar.html         # Kurslar siyahısı (login tələb edir)
├── sinif_9.html         # 9-cu sinif detail + resurslar
├── sinif_10.html        # 10-cu sinif + blok qrupları
├── sinif_11.html        # 11-ci sinif + blok qrupları
├── video_dersler.html   # Video dərslər + booking calendar
├── kommentler.html      # Rəylər + ulduz reytinq formu
├── bashvur.html         # Müraciət forması
├── firebase-config.js   # Firebase init + bütün auth/Firestore funksiyalar
└── auth-modal.js        # Login/register/Google/forgot-pw modal + nav widget
```

---

## Texnologiyalar

| Texnologiya | İstifadə |
|-------------|----------|
| **HTML / CSS / JavaScript** | Bütün UI — framework yoxdur, static files |
| **Firebase Authentication** | E-poçt+şifrə, Google sign-in, e-poçt təsdiqləməsi, şifrə sıfırlama |
| **Cloud Firestore** | Rəylər, müraciətlər, rezervasiyalar, istifadəçi profilləri |
| **GitHub Pages** | Hosting — `docs/` qovluğundan deploy |
| **Firebase CDN** | Firebase SDK-ları ES module kimi `gstatic.com`-dan yüklənir |

---

## Firebase quraşdırması

### 1. Authentication
**Firebase Console** → layihə → **Authentication** → **Sign-in method**:
- ✅ Email/Password — aktiv et
- ✅ Google — aktiv et, layihə adı və e-poçtu daxil et

**Authentication → Settings → Authorised domains** — əlavə et:
```
tmammadov17503.github.io
```

### 2. Firestore Database
**Firestore Database → Create database → Start in test mode** → region: `europe-west1`

İstifadə olunan kolleksiyalar (avtomatik yaranır):

| Kolleksiya | Məzmun |
|------------|--------|
| `users` | `displayName`, `email`, `createdAt`, `notified` |
| `comments` | `name`, `email`, `stars`, `text`, `createdAt` |
| `applications` | `name`, `email`, `phone`, `position`, `company`, `experience`, `createdAt` |
| `bookings` | `userId`, `service`, `price`, `date`, `time`, `createdAt` |

### 3. Production üçün Firestore qaydaları
Test modunun 30 günlük müddəti bitdikdən sonra **Firestore → Rules** bölməsini yeniləyin:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // İstifadəçilər yalnız öz profilini oxuya/yaza bilər
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // Kommentlər — hər kəs oxuya bilər, yalnız giriş etmiş yazan bilər
    match /comments/{doc} {
      allow read: if true;
      allow create: if true;
    }

    // Müraciətlər — yalnız yazma
    match /applications/{doc} {
      allow create: if true;
    }

    // Rezervasiyalar — giriş etmiş istifadəçilər
    match /bookings/{doc} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## Deploy

Repo `docs/` qovluğundan GitHub Pages üzərindən deploy edilir.

**Settings → Pages → Source:** `Deploy from a branch` → `main` → `/docs`

Hər dəfə `docs/` qovluğuna push etdikdən sonra sayt avtomatik yenilənir (1–2 dəqiqə).

---

## İnkişaf yolu

- [ ] Real video dərs linkləri (YouTube / Vimeo embed)
- [ ] Real PDF resurs linkləri hər fənn üçün
- [ ] Admin paneli — müraciətlərə və rezervasiyalara baxmaq üçün
- [ ] E-poçt bildirişləri (rezervasiya təsdiqi)
- [ ] Mobil tətbiq (PWA)

---

## Lisenziya

Bu layihə açıq mənbəlidir. Məqsəd Azərbaycanda pulsuz keyfiyyətli təhsilə dəstək verməkdir.
