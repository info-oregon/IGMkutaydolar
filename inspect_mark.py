from pathlib import Path
text = Path('components/pdf/PdfTemplate.tsx').read_text(encoding='utf8')
idx = text.index('normalizeBoolean(value) === expected')
segment = text[idx:idx+60]
print(segment)
