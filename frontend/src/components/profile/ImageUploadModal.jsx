import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Loader2 } from 'lucide-react';
import useProfileStore from '../../store/useProfileStore';
import toast from 'react-hot-toast';

const ImageUploadModal = ({ isOpen, onClose }) => {
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
      onClose();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md overflow-hidden bg-slate-900 border border-white/10 rounded-2xl shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-semibold text-white">Upload Profile Picture</h2>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8">
              {!preview ? (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="p-4 mb-4 bg-indigo-500/10 rounded-full text-indigo-500 group-hover:scale-110 transition-transform">
                      <Upload size={24} />
                    </div>
                    <p className="mb-2 text-sm text-slate-300">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-slate-500 text-center">
                      PNG, JPG or GIF (MAX. 5MB)
                    </p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  <div className="relative w-40 h-40 overflow-hidden rounded-full border-4 border-indigo-500/20 shadow-lg">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex gap-4 w-full">
                    <button 
                      onClick={() => { setSelectedFile(null); setPreview(null); }}
                      className="flex-1 py-2.5 text-sm font-medium text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      Remove
                    </button>
                    <button 
                      onClick={handleUpload}
                      disabled={profileLoading}
                      className="flex-2 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/20"
                    >
                      {profileLoading ? <Loader2 className="animate-spin" size={18} /> : 'Save Picture'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ImageUploadModal;
