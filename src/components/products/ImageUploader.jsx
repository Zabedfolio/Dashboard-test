'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Star, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function ImageUploader({ images = [], onChange }) {
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setIsUploading(true)
    const newImages = [...images]

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 12)}.${fileExt}`
        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        newImages.push(publicUrl)
      }

      onChange(newImages)
      toast.success(`${files.length} images uploaded`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload images')
    } finally {
      setIsUploading(false)
      // Reset input
      e.target.value = ''
    }
  }

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const setPrimary = (index) => {
    const newImages = [images[index], ...images.filter((_, i) => i !== index)]
    onChange(newImages)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((url, index) => (
          <div key={url} className="group relative aspect-square rounded-xl overflow-hidden border border-border/40 bg-muted">
            <Image src={url} alt="Product" fill className="object-cover" />
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button 
                type="button" 
                size="icon" 
                variant="secondary" 
                className="h-8 w-8 rounded-full"
                onClick={() => setPrimary(index)}
                title="Set as primary"
              >
                <Star className={`h-4 w-4 ${index === 0 ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              </Button>
              <Button 
                type="button" 
                size="icon" 
                variant="destructive" 
                className="h-8 w-8 rounded-full"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {index === 0 && (
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded">
                PRIMARY
              </div>
            )}
          </div>
        ))}
        
        <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-border/40 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all">
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground font-medium">Upload Image</span>
            </>
          )}
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={isUploading}
          />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        First image is the primary cover. Supports multiple JPG, PNG, WEBP.
      </p>
    </div>
  )
}
