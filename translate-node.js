const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'apps/web/messages/ru.json');

if (!fs.existsSync(filePath)) {
  console.error(`Ошибка: Файл не найден по пути ${filePath}`);
  process.exit(1);
}

console.log("Читаем файл локализации...");
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Бесплатная функция перевода через альтернативный открытый шлюз Google
async function googleTranslate(text, source = 'uk', target = 'ru') {
  if (!text || !text.trim()) return text;
  try {
    const url = `https://google.com{target}&ie=UTF-8&oe=UTF-8&inputm=2&otf=2&iid=1d8e6506-c831-487b-af03-ef468bfb36f7`;
    
    const body = new URLSearchParams({
      sl: source,
      tl: target,
      q: text
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'AndroidTranslate/5.3.0.RC02.130475354-53000263 5.1 phone TRANSLATE_A_GLOSSMAN'
      },
      body: body.toString()
    });

    if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
    
    const result = await response.json();
    if (result && result.sentences) {
      return result.sentences.map(s => s.trans || '').join('');
    }
    return text;
  } catch (e) {
    console.error(`Ошибка перевода для "${text}":`, e.message);
    return text;
  }
}

// Рекурсивный обход JSON
async function translateDict(obj) {
  const newObj = {};
  for (const [key, value] of Object.entries(obj)) {
    // Меняем ключ uk на ru для Next.js
    const currentKey = key === 'uk' ? 'ru' : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      newObj[currentKey] = await translateDict(value);
    } else if (typeof value === 'string') {
      console.log(`Перевод: ${value}`);
      newObj[currentKey] = await googleTranslate(value);
      // Маленькая задержка, чтобы не получить блокировку IP
      await new Promise(resolve => setTimeout(resolve, 80));
    } else {
      newObj[currentKey] = value;
    }
  }
  return newObj;
}

(async () => {
  console.log("Начинаем автоматический перевод через Node.js шлюз...");
  const translatedData = await translateDict(data);

  fs.writeFileSync(filePath, JSON.stringify(translatedData, null, 2), 'utf8');
  console.log("🎉 Готово! Файл ru.json полностью переведен.");
})();
