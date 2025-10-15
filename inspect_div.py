from pathlib import Path
text = Path('components/pdf/PdfTemplate.tsx').read_bytes()
idx = text.index(b'<div')
print(idx)
print(text[idx-5:idx+5])
