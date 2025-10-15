from pathlib import Path
text = Path('components/pdf/PdfTemplate.tsx').read_text(encoding='utf8')
start = text.index('uygun d')
print(text[start:start+20])
