
"use client";

import { useState, ChangeEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { UserCircle, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

interface AvatarUploadProps {
    currentAvatarUrl: string | null;
    onAvatarChange: (file: File, previewUrl: string) => void;
    userId: string; // For unique IDs or alt text
}

export default function AvatarUpload({ currentAvatarUrl, onAvatarChange, userId }: AvatarUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentAvatarUrl);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit example
                toast.error("File is too large. Max 2MB allowed.");
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
                toast.error("Invalid file type. Only JPG, PNG, WEBP, GIF allowed.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
                onAvatarChange(file, reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted border border-border flex items-center justify-center">
                {preview ? (
                    <Image src={preview} alt={`${userId}'s avatar`} layout="fill" objectFit="cover" />
                ) : (
                    <UserCircle className="w-20 h-20 text-muted-foreground" />
                )}
            </div>
            <Button type="button" variant="outline" onClick={triggerFileInput}>
                <UploadCloud className="mr-2 h-4 w-4" /> Change Avatar
            </Button>
            <Input
                ref={fileInputRef}
                id="avatar-upload"
                name="avatar_file_input" // This input is just for selection, the actual file is passed via state
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={handleFileChange}
                className="hidden"
            />
            <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WEBP up to 2MB.</p>
        </div>
    );
}
