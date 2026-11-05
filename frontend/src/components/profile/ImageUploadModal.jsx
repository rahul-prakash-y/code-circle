import React, { useState } from 'react';
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
          <label className="flex flex-col items-center justify-center w-full h-52 border-2 border-dashed border-separator rounded-2xl cursor-pointer hover:border-accent/50 hover:bg-surface-secondary/50 transition-all group p-4">
            <div className="flex flex-col items-center justify-center py-4">
              <div className="p-3.5 mb-3 bg-accent/10 text-accent rounded-2xl group-hover:scale-105 transition-transform">
                <Upload size={22} />
              </div>
              <p className="mb-1 text-xs sm:text-sm font-semibold text-label-primary">
                Click to upload <span className="text-label-tertiary font-normal">or drag and drop</span>
              </p>
              <p className="text-[11px] text-label-tertiary text-center">
                PNG, JPG or GIF (Max. 5MB)
              </p>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
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
          <button
            type="button"
            onClick={() => {
              handleClear();
              onClose();
            }}
            disabled={profileLoading}
            className="px-4 py-2 rounded-full text-xs font-medium border border-separator text-label-secondary hover:text-label-primary cursor-pointer transition-colors"
          >
            Cancel
          </button>

          {preview && (
            <button
              type="button"
              onClick={handleClear}
              disabled={profileLoading}
              className="px-4 py-2 rounded-full text-xs font-medium border border-separator text-label-secondary hover:text-destructive cursor-pointer transition-colors"
            >
              Choose Another
            </button>
          )}

          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || profileLoading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-accent text-white hover:bg-accent-hover disabled:opacity-40 transition cursor-pointer shadow"
          >
            {profileLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <span>Save Picture</span>
            )}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default ImageUploadModal;
