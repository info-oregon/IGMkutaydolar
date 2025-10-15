from pathlib import Path
text = Path('components/pdf/PdfTemplate.tsx').read_bytes()
idx = text.index(b'return (')
print(idx)
print(text[idx:idx+10])
