import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/Appcontext.jsx';
import GlassCard from '../GlassCard';
import { Check, User, Upload } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasmine',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Robot1',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Robot2',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Sarah',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Alex',
];

export default function ProfileSetup() {
    const { updateProfile, currentUser } = useApp();
    const navigate = useNavigate();

    const [selectedAvatar, setSelectedAvatar] = useState(null);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [bio, setBio] = useState(currentUser?.bio || '');

    const handleFinalSubmit = async () => {
        const formData = new FormData();
        if (selectedFile) {
            formData.append('photo', selectedFile);
        } else if (selectedAvatar) {
            formData.append('profilePicUrl', selectedAvatar);
        }

        const bioChanged = bio.trim() !== (currentUser?.bio || '');

        if (!selectedFile && !selectedAvatar && !bioChanged) {
            toast.error('Please make changes before saving.');
            return;
        }

        if (bioChanged) {
            formData.append('bio', bio.trim());
        }

        setIsUploading(true);
        const { success, error } = await updateProfile(formData);
        setIsUploading(false);

        if (success) {
            toast.success('Profile picture set successfully!');
            navigate('/');
        } else {
            toast.error(error || "Upload failed. Check your connection.");
        }
    };

    const handleSkipProfilePic = () => {
        navigate('/');
    };

    const handleAvatarClick = (avatar) => {
        setSelectedAvatar(avatar);
        setUploadedImage(null);
        setSelectedFile(null);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result);
                setSelectedAvatar(null);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className='min-h-screen flex text-center justify-center items-center py-8'>
            <div className="w-full max-w-md mx-auto">
                <GlassCard>
                    <div className="text-amber-50 flex flex-col gap-6 px-10 py-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold mb-2">Set up your profile</h2>
                            <p className="text-gray-300 text-sm">Choose an avatar or upload your own photo.</p>
                        </div>

                        {/* Default Avatars Section */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-200">Choose a default avatar</label>
                            <div className="grid grid-cols-4 gap-3">
                                {DEFAULT_AVATARS.map((avatar, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className={`relative w-full aspect-square rounded-full overflow-hidden border-2 transition-all ${selectedAvatar === avatar
                                            ? 'border-amber-500 scale-110'
                                            : 'border-transparent hover:border-gray-500 hover:scale-105'
                                            }`}
                                        onClick={() => handleAvatarClick(avatar)}
                                    >
                                        <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                                        {selectedAvatar === avatar && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                                <Check className="w-6 h-6 text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-600" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="px-2 bg-slate-900 text-gray-400 rounded-full border border-gray-800">Or</span>
                            </div>
                        </div>

                        {/* Upload Photo Section */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-200">Upload your own photo</label>
                            <div className="flex flex-col items-center space-y-4">
                                <input
                                    id="upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />

                                {uploadedImage ? (
                                    <div className="relative group">
                                        <img
                                            src={uploadedImage}
                                            alt="Uploaded"
                                            className="w-24 h-24 rounded-full object-cover border-2 border-amber-500"
                                        />
                                        <button
                                            type="button"
                                            className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center bg-red-500 text-white shadow hover:scale-110 transition-transform"
                                            onClick={() => {
                                                setUploadedImage(null);
                                                setSelectedFile(null);
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('upload')?.click()}
                                        className="w-24 h-24 rounded-full border-2 border-dashed border-gray-500 hover:border-amber-500 hover:text-amber-500 flex flex-col items-center justify-center text-gray-400 transition-colors group"
                                    >
                                        <Upload className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                                        <span className="text-xs font-semibold">Upload</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Bio Section */}
                        <div className="space-y-3 pb-2">
                            <label className="text-sm font-semibold text-gray-200 flex justify-between">
                                <span>Bio</span>
                                <span className={bio.length >= 150 ? 'text-red-400' : 'text-gray-400'}>
                                    {bio.length}/150
                                </span>
                            </label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value.slice(0, 150))}
                                placeholder="Tell us about yourself..."
                                className="w-full bg-slate-900 border border-gray-700 rounded-xl p-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none h-24"
                                maxLength={150}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3 pt-4 border-t border-gray-700/50">
                            <button
                                type="button"
                                className={`w-full py-2.5 rounded-xl font-bold transition-all duration-200 ${(!selectedAvatar && !uploadedImage && bio.trim() === (currentUser?.bio || '')) || isUploading
                                    ? 'bg-slate-700 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-500 hover:shadow-lg text-white'
                                    }`}
                                onClick={handleFinalSubmit}
                                disabled={(!selectedAvatar && !uploadedImage && bio.trim() === (currentUser?.bio || '')) || isUploading}
                            >
                                {isUploading ? 'Uploading...' : 'Finish Setup'}
                            </button>
                            <button
                                type="button"
                                className="w-full py-2.5 rounded-xl font-medium text-gray-300 hover:bg-slate-800 transition-colors duration-200 disabled:opacity-50"
                                onClick={handleSkipProfilePic}
                                disabled={isUploading}
                            >
                                Skip for now
                            </button>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
