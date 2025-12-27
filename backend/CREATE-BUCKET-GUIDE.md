# როგორ შევქმნათ Supabase Bucket

## მეთოდი 1: ავტომატური შექმნა (რეკომენდებული)

კოდი ავტომატურად შექმნის bucket-ს პირველი ატვირთვისას. თუ ეს არ მუშაობს, გამოიყენეთ:

### API-ით შექმნა:
```bash
curl -X POST http://localhost:3000/api/test/create-bucket
```

ან ბრაუზერში გახსენით:
```
http://localhost:3000/api/test/create-bucket
```

---

## მეთოდი 2: ხელით შექმნა Supabase Dashboard-ში

### ნაბიჯი 1: გახსენით Supabase Dashboard
1. გადადით [https://app.supabase.com/](https://app.supabase.com/)
2. შედით თქვენს პროექტში

### ნაბიჯი 2: გადადით Storage-ში
1. მარცხენა მენიუში იპოვეთ **"Storage"** (ან **"საცავი"**)
2. დააჭირეთ მასზე

### ნაბიჯი 3: შექმენით ახალი Bucket
1. დააჭირეთ **"New bucket"** ღილაკს (ან **"ახალი bucket"**)
2. შეიყვანეთ სახელი: `book-uploads` (ზუსტად ასე, პატარა ასოებით)
3. მონიშნეთ **"Public bucket"** (ან **"საჯარო bucket"**)
   - ეს საშუალებას იძლევა ყველას წაიკითხოს სურათები
4. დააჭირეთ **"Create bucket"** (ან **"შექმნა"**)

### ნაბიჯი 4: შეამოწმეთ
1. უნდა გამოჩნდეს `book-uploads` bucket-ი სიაში
2. დააჭირეთ მასზე - უნდა იყოს ცარიელი

---

## ვიზუალური ინსტრუქცია

```
Supabase Dashboard
├── Storage (დააჭირეთ აქ)
    ├── New bucket (დააჭირეთ)
    │   ├── Name: book-uploads
    │   ├── ☑️ Public bucket (მონიშნეთ)
    │   └── Create bucket (დააჭირეთ)
    └── ✅ book-uploads (ახლა უნდა გამოჩნდეს)
```

---

## რა უნდა იყოს Bucket-ის პარამეტრები

- **სახელი**: `book-uploads` (ზუსტად ასე)
- **Public**: ✅ დიახ (Public bucket)
- **File size limit**: 10MB (ან მეტი)
- **Allowed MIME types**: 
  - image/jpeg
  - image/jpg
  - image/png
  - image/gif
  - image/webp

---

## შემდეგი ნაბიჯები

Bucket-ის შექმნის შემდეგ:

1. **გადატვირთეთ სერვერი** (თუ გაქვთ გაშვებული):
   ```bash
   npm run dev
   ```

2. **შეამოწმეთ კავშირი**:
   - გახსენით: `http://localhost:3000/api/test/connections`
   - `supabase` სექცია უნდა აჩვენოს `status: "ok"`

3. **სცადეთ სურათის ატვირთვა**:
   - გახსენით `/upload.html`
   - ატვირთეთ სურათი
   - უნდა იმუშაოს!

---

## პრობლემების გადაჭრა

### "Bucket not found" შეცდომა
- შეამოწმეთ, რომ bucket-ის სახელი არის `book-uploads` (ზუსტად)
- შეამოწმეთ, რომ bucket არის Public
- გადატვირთეთ სერვერი

### "Permission denied" შეცდომა
- დარწმუნდით, რომ იყენებთ **service_role** key-ს, არა anon key-ს
- შეამოწმეთ `.env` ფაილში `SUPABASE_SERVICE_ROLE_KEY`

### Bucket არ იქმნება ავტომატურად
- გამოიყენეთ API endpoint: `POST /api/test/create-bucket`
- ან შექმენით ხელით Dashboard-ში

---

## დამატებითი ინფორმაცია

- Supabase Storage Docs: [https://supabase.com/docs/guides/storage](https://supabase.com/docs/guides/storage)
- Bucket Policies: [https://supabase.com/docs/guides/storage/policies](https://supabase.com/docs/guides/storage/policies)

