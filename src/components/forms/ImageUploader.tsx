import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Star, Trash2, ArrowRight, ArrowLeft, Link as LinkIcon, Plus } from 'lucide-react';
import { ProductImage } from '@/src/types/product';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';

interface ImageUploaderProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  maxFiles?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxFiles = 8,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [showUrlModal, setShowUrlModal] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remainingSlots = maxFiles - images.length;
      if (remainingSlots <= 0) {
        toast.error(`الحد الأقصى لرفع الصور هو ${maxFiles} صور فقط`);
        return;
      }

      const filesToAdd = acceptedFiles.slice(0, remainingSlots);
      const newImages: ProductImage[] = filesToAdd.map((file, idx) => ({
        id: `local_${Date.now()}_${idx}`,
        url: URL.createObjectURL(file),
        file,
        order: images.length + idx,
        is_primary: images.length === 0 && idx === 0,
      }));

      onChange([...images, ...newImages]);
      toast.success(`تمت إضافة ${newImages.length} صورة`);
    },
    [images, maxFiles, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: maxFiles - images.length,
    disabled: images.length >= maxFiles,
  });

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    const newImage: ProductImage = {
      id: `url_${Date.now()}`,
      url: urlInput.trim(),
      order: images.length,
      is_primary: images.length === 0,
    };
    onChange([...images, newImage]);
    setUrlInput('');
    setShowUrlModal(false);
    toast.success('تمت إضافة رابط الصورة بنجاح');
  };

  const setPrimary = (index: number) => {
    const updated = images.map((img, idx) => ({
      ...img,
      is_primary: idx === index,
    }));
    onChange(updated);
  };

  const removeImage = (index: number) => {
    const filtered = images.filter((_, idx) => idx !== index);
    if (filtered.length > 0 && !filtered.some((img) => img.is_primary)) {
      filtered[0].is_primary = true;
    }
    onChange(filtered.map((img, idx) => ({ ...img, order: idx })));
  };

  const moveImage = (index: number, direction: 'prev' | 'next') => {
    const targetIndex = direction === 'prev' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const reordered = [...images];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    onChange(reordered.map((img, idx) => ({ ...img, order: idx })));
  };

  return (
    <div className="space-y-4">
      {/* Dropzone container */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
            : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-900/50',
          images.length >= maxFiles && 'opacity-60 cursor-not-allowed pointer-events-none'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-xs text-blue-600 dark:text-blue-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              اسحب الصور هنا أو انقر لاختيار ملفات من جهازك
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              يدعم PNG, JPG, WEBP (حتى {maxFiles} صور كحد أقصى)
            </p>
          </div>
        </div>
      </div>

      {/* Manual URL button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowUrlModal(!showUrlModal)}
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>أو إضافة رابط صورة خارجي مباشرة</span>
        </button>
      </div>

      {showUrlModal && (
        <div className="flex items-center gap-2 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/toy-photo.jpg"
            className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md outline-hidden focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shrink-0"
          >
            إضافة
          </button>
        </div>
      )}

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className={cn(
                'group relative rounded-lg border overflow-hidden bg-slate-100 dark:bg-slate-800 transition-all aspect-square',
                img.is_primary
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-700'
              )}
            >
              <img
                src={img.url}
                alt={`Product photo ${idx + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />

              {/* Primary badge */}
              {img.is_primary && (
                <div className="absolute top-1.5 start-1.5 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-md shadow-xs">
                  الرئيسية
                </div>
              )}

              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-between items-center">
                  {!img.is_primary && (
                    <button
                      type="button"
                      onClick={() => setPrimary(idx)}
                      className="p-1 rounded bg-white/20 hover:bg-white text-white hover:text-amber-500 transition-colors"
                      title="تعيين كصورة رئيسية"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="p-1 rounded bg-white/20 hover:bg-red-600 text-white transition-colors ms-auto"
                    title="حذف الصورة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Reorder arrows */}
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveImage(idx, 'prev')}
                    className="p-1 rounded bg-white/20 hover:bg-white text-white hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="تحريك للخلف"
                  >
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                  <span className="text-[10px] text-white font-mono">{idx + 1}</span>
                  <button
                    type="button"
                    disabled={idx === images.length - 1}
                    onClick={() => moveImage(idx, 'next')}
                    className="p-1 rounded bg-white/20 hover:bg-white text-white hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="تحريك للأمام"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
