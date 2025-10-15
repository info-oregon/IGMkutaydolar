from pathlib import Path
text = Path('components/pdf/PdfTemplate.tsx').read_text(encoding='utf8')
start = text.index('["uygunsuz')
segment = text[start:start+80]
print(segment.encode('unicode_escape'))
