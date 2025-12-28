# ბექგრაუნდ სურათების გამოყენების გზამკვლევი

ეს გზამკვლევი განმარტავს, თუ როგორ გამოიყენოთ Supabase-დან ატვირთული სურათები ბექგრაუნდად Google AI-სთან ერთად.

## როგორ მუშაობს

1. **ატვირთეთ ბექგრაუნდ სურათები Supabase-ში** → მიიღებთ public URL-ებს
2. **ატვირთეთ ფორეგრაუნდ სურათები** → ბავშვების ან სხვა ობიექტების ფოტოები
3. **Google AI აერთიანებს მათ** → ბექგრაუნდ სურათს იყენებს ფორეგრაუნდ სურათისთვის

## API Endpoints

### 1. ბექგრაუნდ სურათების სიის მიღება

**GET** `/api/images/backgrounds`

ბექგრაუნდ სურათების სიის მიღება Supabase Storage-დან.

**Query Parameters:**
- `folder` (optional) - ფოლდერის სახელი (default: `backgrounds`)
- `limit` (optional) - მაქსიმალური რაოდენობა (default: 100)

**Example Request:**
```bash
GET http://localhost:3000/api/images/backgrounds?folder=backgrounds&limit=50
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "images": [
      {
        "name": "forest-background.jpg",
        "path": "backgrounds/forest-background.jpg",
        "url": "https://xxx.supabase.co/storage/v1/object/public/book-uploads/backgrounds/forest-background.jpg",
        "size": 245678,
        "created_at": "2024-01-01T12:00:00Z"
      }
    ],
    "count": 1
  }
}
```

### 2. ყველა სურათის სიის მიღება Supabase-დან

**GET** `/api/images/supabase/all`

ყველა სურათის სიის მიღება Supabase Storage-დან (ყველა ფოლდერიდან).

**Query Parameters:**
- `limit` (optional) - მაქსიმალური რაოდენობა (default: 100)

**Example Request:**
```bash
GET http://localhost:3000/api/images/supabase/all?limit=100
```

### 3. ზღაპრის გმირების შექმნა ბექგრაუნდით

**POST** `/api/ai/fairy-tale-characters`

ზღაპრის გმირების შექმნა ატვირთული სურათებიდან, ბექგრაუნდ სურათის გამოყენებით.

**Request Body:**
```json
{
  "imageUrls": [
    "https://xxx.supabase.co/storage/v1/object/public/book-uploads/child1.jpg",
    "https://xxx.supabase.co/storage/v1/object/public/book-uploads/child2.jpg"
  ],
  "backgroundImageUrl": "https://xxx.supabase.co/storage/v1/object/public/book-uploads/backgrounds/forest.jpg",
  "model": "gemini-2.5-flash"
}
```

**Parameters:**
- `imageUrls` (required) - Array of image URLs (ატვირთული სურათები)
- `backgroundImageUrl` (optional) - ბექგრაუნდ სურათის URL Supabase-დან
- `model` (optional) - AI მოდელი (default: `gemini-2.5-flash`)

**Example Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "characters": [
      {
        "success": true,
        "generatedImageUrl": "https://image.pollinations.ai/prompt/...",
        "backgroundUsed": true
      }
    ],
    "backgroundUsed": true
  }
}
```

## გამოყენების მაგალითი

### JavaScript/TypeScript Example

```javascript
// 1. მიიღეთ ბექგრაუნდ სურათების სია
const backgroundsResponse = await fetch('http://localhost:3000/api/images/backgrounds');
const backgroundsData = await backgroundsResponse.json();
const backgroundImage = backgroundsData.data.images[0]; // აირჩიეთ პირველი ბექგრაუნდი

// 2. ატვირთეთ ფორეგრაუნდ სურათები
const uploadFormData = new FormData();
uploadFormData.append('images', childPhotoFile);

const uploadResponse = await fetch('http://localhost:3000/api/upload/multiple', {
  method: 'POST',
  body: uploadFormData
});
const uploadData = await uploadResponse.json();
const uploadedImageUrls = uploadData.files.map(f => f.url);

// 3. შექმენით ზღაპრის გმირები ბექგრაუნდით
const aiResponse = await fetch('http://localhost:3000/api/ai/fairy-tale-characters', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrls: uploadedImageUrls,
    backgroundImageUrl: backgroundImage.url // Supabase-დან ბექგრაუნდი
  })
});

const aiData = await aiResponse.json();
console.log('Generated characters:', aiData.data.characters);
```

## Supabase-ში ბექგრაუნდ სურათების ატვირთვა

### მეთოდი 1: Admin Panel-ის გამოყენებით

1. გადადით `/admin.html` გვერდზე
2. ატვირთეთ სურათები
3. სურათები ავტომატურად აიტვირთება Supabase Storage-ში

### მეთოდი 2: API-ს გამოყენებით

```bash
POST http://localhost:3000/api/upload/single
Content-Type: multipart/form-data

Form data:
  - file: [your-background-image.jpg]
```

**Note:** სურათები აიტვირთება `book-images` ფოლდერში. ბექგრაუნდ სურათებისთვის გირჩევთ `backgrounds` ფოლდერის გამოყენებას.

### მეთოდი 3: Supabase Dashboard-ის გამოყენებით

1. გადადით [Supabase Dashboard](https://app.supabase.com/)
2. აირჩიეთ თქვენი პროექტი
3. გადადით **Storage** → **book-uploads** bucket
4. შექმენით `backgrounds` ფოლდერი (თუ არ არსებობს)
5. ატვირთეთ ბექგრაუნდ სურათები

## როგორ მუშაობს AI

როდესაც `backgroundImageUrl` მოწოდებულია:

1. **Google AI იღებს ორ სურათს:**
   - ფორეგრაუნდ სურათი (ატვირთული ბავშვის ფოტო)
   - ბექგრაუნდ სურათი (Supabase-დან)

2. **AI აანალიზებს ორივეს:**
   - ბავშვის გარეგნობა, პოზა, გამოხატულება
   - ბექგრაუნდის სცენა, ფერები, სტილი, კომპოზიცია

3. **AI ქმნის აღწერას:**
   - როგორ უნდა გაერთიანდეს ბავშვი ბექგრაუნდ სცენაში
   - შენარჩუნდეს ბექგრაუნდის სტილი და ატმოსფერო

4. **გენერირდება ახალი სურათი:**
   - ბავშვი ბექგრაუნდ სცენაში
   - ბექგრაუნდის სტილის შენარჩუნებით

## რჩევები

1. **ბექგრაუნდ სურათების ორგანიზაცია:**
   - გამოიყენეთ `backgrounds` ფოლდერი ბექგრაუნდ სურათებისთვის
   - დაასახელეთ სურათები აღწერით (მაგ: `forest-scene.jpg`, `castle-background.png`)

2. **სურათების ზომა:**
   - რეკომენდებული: 1024x1024 ან მეტი
   - ფორმატი: JPEG, PNG, WEBP

3. **პროდუქტიულობა:**
   - ბექგრაუნდ სურათები უნდა იყოს საჯარო (public)
   - გამოიყენეთ CDN ან Supabase-ის public URLs

## Troubleshooting

### Error: "Failed to fetch background image"
- **მიზეზი:** ბექგრაუნდ სურათის URL არასწორია ან არ არის საჯარო
- **გადაწყვეტა:**
  - შეამოწმეთ URL სისწორე
  - დარწმუნდით, რომ Supabase bucket არის public
  - შეამოწმეთ storage policies

### Error: "Background image not found"
- **მიზეზი:** სურათი არ არსებობს ან წაშლილია
- **გადაწყვეტა:**
  - შეამოწმეთ Supabase Storage-ში
  - გამოიყენეთ `/api/images/backgrounds` endpoint სურათების სიის მისაღებად

### Background არ გამოიყენება
- **მიზეზი:** `backgroundImageUrl` არ არის მოწოდებული ან არასწორია
- **გადაწყვეტა:**
  - შეამოწმეთ request body-ში `backgroundImageUrl` პარამეტრი
  - დარწმუნდით, რომ URL არის სწორი Supabase public URL

## მაგალითები

### cURL Example

```bash
# 1. მიიღეთ ბექგრაუნდ სურათების სია
curl http://localhost:3000/api/images/backgrounds

# 2. შექმენით ზღაპრის გმირები ბექგრაუნდით
curl -X POST http://localhost:3000/api/ai/fairy-tale-characters \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrls": ["https://xxx.supabase.co/.../child1.jpg"],
    "backgroundImageUrl": "https://xxx.supabase.co/.../backgrounds/forest.jpg"
  }'
```

## შეჯამება

✅ **ბექგრაუნდ სურათები** → Supabase Storage-ში
✅ **API Endpoints** → სურათების სიის მისაღებად
✅ **Google AI** → აერთიანებს ფორეგრაუნდსა და ბექგრაუნდს
✅ **შედეგი** → პროფესიონალური ილუსტრაციები

ამ ფუნქციონალით შეგიძლიათ შექმნათ უფრო რეალისტური და მიმზიდველი ილუსტრაციები თქვენი ბავშვების ფოტოებით!

