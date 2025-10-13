"use client";
import { useRef } from "react";

type Props = {
  photos: string[];
  setPhotos: (p: string[]) => void;
};

const readAsDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.readAsDataURL(file);
  });

export default function PhotoInput({ photos, setPhotos }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const arr: string[] = [];
    for (const f of Array.from(files)) {
      const dataUrl = await readAsDataURL(f);
      arr.push(dataUrl);
    }
    setPhotos([...(photos ?? []), ...arr]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (i: number) => {
    const copy = [...(photos ?? [])];
    copy.splice(i, 1);
    setPhotos(copy);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Fotoğraflar</label>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => onFiles(e.target.files)}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {photos?.map((src, i) => (
          <div key={i} className="border rounded p-1">
      <img src={src} alt={`foto-${i}`} className="w-full h-32 object-cover" />

            <button
              type="button"
              className="w-full text-sm bg-red-500 text-white rounded mt-1"
              onClick={() => remove(i)}
            >
              Sil
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

