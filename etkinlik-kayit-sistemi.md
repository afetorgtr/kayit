# Etkinlik Kayıt Sistemi

## Amacı
Afetlerde Büyük Veri Yönetimi Sempozyumu için Vercel'de barındırılabilecek, şık, hızlı ve kullanışlı bir ziyaretçi kayıt formu ile veri yönetim panelinin (yaka kartı yazdırma, e-posta bilgilendirme ve Excel çıktısı dahil) geliştirilmesi.

## Yapılacak İşler

- [x] Görev 1: Next.js Projesinin Kurulması → Doğrulama: `package.json` dosyasının oluşması ve `npm run dev` ile çalışması.
- [x] Görev 2: Supabase Entegrasyonu ve Veritabanı Şeması → Doğrulama: SQL komutunun hazırlanması ve veritabanı bağlantı kodlarının (`src/lib/supabase.ts`) eklenmesi.
- [x] Görev 3: Kayıt Sayfası ve T.C. Kimlik Kontrolü → Doğrulama: `/` sayfasında şık formun görüntülenmesi, geçersiz T.C. Kimlik numaralarının engellenmesi.
- [x] Görev 4: Resend E-posta Entegrasyonu → Doğrulama: `/api/register` rotasının çalışması ve kayıt sonrasında e-posta gönderilmesi.
- [x] Görev 5: Yönetici Paneli ve Excel Çıktısı → Doğrulama: `/admin` sayfasına şifreyle girilebilmesi, listeleme, arama ve CSV indirme butonunun çalışması.
- [x] Görev 6: Yaka Kartı Baskı Şablonu → Doğrulama: Seçilen katılımcılar için `/admin/print` sayfasında 10x15cm boyutlarında yazdırılabilir yaka kartlarının render edilmesi.

## Tamamlanma Kriteri
- [ ] Ziyaretçi bilgileri eksiksiz ve T.C. kimlik numaraları doğrulanarak kaydediliyor.
- [ ] Kayıt sonrasında katılımcıya onay e-postası gidiyor.
- [ ] Yönetici paneli üzerinden kayıtlar izleniyor, Excel çıktısı alınabiliyor ve yaka kartları doğrudan yazdırılabiliyor.
