import React, { useState } from 'react';
import { Button } from '@heroui/react';
import { HeroFileInput } from '../ui/hero/HeroFileInput';
import ResponsiveModal from '../ui/ResponsiveModal';
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import useProfileStore from '../../store/useProfileStore';
import toast from 'react-hot-toast';

export const ImageUploadModal = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const { uploadProfilePic, profileLoading } = useProfileStore();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const res = await uploadProfilePic(selectedFile);
    if (res.success) {
      toast.success('Profile picture updated!');
      setSelectedFile(null);
      setPreview(null);
      onClose();
    } else {
      toast.error(res.error || 'Failed to upload image');
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClear();
          onClose();
        }
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <Upload className="w-4 h-4" />
          </div>
          <span>Upload Profile Picture</span>
        </div>
      }
      description="Choose a high-resolution PNG, JPG, or GIF photo for your student profile."
      dialogClassName="sm:max-w-md p-6"
    >
      <div className="space-y-4 pt-2">
        {!preview ? (
          <HeroFileInput
            variant="dropzone"
            accept="image/*"
            maxSizeBytes={5 * 1024 * 1024}
            buttonText="Click to upload or drag and drop"
            description="PNG, JPG or GIF (Max. 5MB)"
            onFilesSelected={(files) => handleFileChange({ target: { files } })}
            showChips={false}
          />
        ) : (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="relative w-36 h-36 overflow-hidden rounded-full border-4 border-accent/20 shadow-lg">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <p className="text-xs text-label-secondary font-medium">
              {selectedFile?.name || 'Selected image'}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-separator flex items-center justify-end gap-3">
          <Button
            variant="bordered"
            onPress={() => {
              handleClear();
              onClose();
            }}
            isDisabled={profileLoading}
            className="rounded-full text-xs font-medium border-separator text-label-secondary hover:text-label-primary"
          >
            Cancel
          </Button>

          {preview && (
            <Button
              variant="bordered"
              onPress={handleClear}
              isDisabled={profileLoading}
              className="rounded-full text-xs font-medium border-separator text-label-secondary hover:text-destructive"
            >
              Choose Another
            </Button>
          )}

          <Button
            color="primary"
            variant="solid"
            onPress={handleUpload}
            isDisabled={!selectedFile || profileLoading}
            isLoading={profileLoading}
            className="rounded-full text-xs font-semibold shadow-sm"
          >
            Save Picture
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default ImageUploadModal;
