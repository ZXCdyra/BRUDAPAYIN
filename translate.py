import json
import os
import urllib.request
import urllib.parse
import time

input_file = 'apps/web/messages/ru.json'
output_file = 'apps/web/messages/ru.json'

if not os.path.exists(input_file):
    print(f"Ошибка: Файл {input_file} не найден!")
    exit(1)

print("Читаем файл локализации...")
with open(input_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

def google_translate(text, source='uk', target='ru'):
    if not text or not str(text).strip():
        return text
    try:
        # Правильное формирование параметров запроса без склеивания строк вручную
        base_url = "https://googleapis.com"
        params = {
            'client': 'gtx',
            'sl': source,
            'tl': target,
            'dt': 't',
            'q': str(text)
        }
        url = f"{base_url}?{urllib.parse.urlencode(params)}"
        
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            # Извлекаем текст перевода из структуры ответа Google
            translated_parts = []
            if result and isinstance(result[0], list):
                for part in result[0]:
                    if part and isinstance(part, list) and part[0]:
                        translated_parts.append(part[0])
            
            return "".join(translated_parts) if translated_parts else text
    except Exception as e:
        print(f"Ошибка при запросе перевода для '{text}': {e}")
        return text

def translate_dict(d):
    new_dict = {}
    for k, v in d.items():
        current_key = 'ru' if k == 'uk' else k
        
        if isinstance(v, dict):
            new_dict[current_key] = translate_dict(v)
        elif isinstance(v, str):
            print(f"Перевод: {v}")
            new_dict[current_key] = google_translate(v)
            time.sleep(0.1) # Пауза против блокировок
        else:
            new_dict[current_key] = v
    return new_dict

print("Начинаем автоматический перевод (исправленная версия)...")
translated_data = translate_dict(data)

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(translated_data, f, ensure_ascii=False, indent=2)

print("🎉 Готово! Файл ru.json полностью переведен.")
