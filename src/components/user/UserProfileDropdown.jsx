import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, Settings, LogOut, Mail, Shield, Camera, Save, X 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function UserProfileDropdown() {
  const [user, setUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    profile_picture: '',
    bio: ''
  });
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setProfileData({
          full_name: currentUser.full_name || '',
          profile_picture: currentUser.profile_picture || '',
          bio: currentUser.bio || ''
        });
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe(data);
    },
    onSuccess: async () => {
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
      setIsEditingProfile(false);
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfileData({ ...profileData, profile_picture: file_url });
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
    } catch (error) {
      console.error('Error logging out:', error);
      window.location.reload();
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse"></div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full">
            <Avatar className="w-9 h-9 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all">
              <AvatarImage src={user.profile_picture} alt={user.full_name} />
              <AvatarFallback className="bg-blue-600 text-white font-semibold">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold text-slate-900">{user.full_name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
              {user.role === 'admin' && (
                <Badge variant="outline" className="w-fit mt-1 border-blue-300 text-blue-700 text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsProfileOpen(true)} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>My Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/app/Settings" className="cursor-pointer flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Modal */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditingProfile ? 'Edit Profile' : 'My Profile'}
            </DialogTitle>
            <DialogDescription>
              {isEditingProfile 
                ? 'Update your profile information and picture'
                : 'View and manage your account details'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Profile Picture */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profileData.profile_picture} alt={user.full_name} />
                <AvatarFallback className="bg-blue-600 text-white text-2xl font-semibold">
                  {getInitials(profileData.full_name || user.full_name)}
                </AvatarFallback>
              </Avatar>
              {isEditingProfile && (
                <div className="relative">
                  <input
                    type="file"
                    id="profile-pic"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => document.getElementById('profile-pic')?.click()}
                    disabled={uploading}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Change Picture'}
                  </Button>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium text-slate-700">Full Name</Label>
                {isEditingProfile ? (
                  <Input
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    className="mt-1"
                    placeholder="Your full name"
                  />
                ) : (
                  <div className="mt-1 text-sm text-slate-900">{user.full_name}</div>
                )}
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-700">Email</Label>
                <div className="mt-1 text-sm text-slate-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {user.email}
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-700">Role</Label>
                <div className="mt-1">
                  <Badge variant="outline" className={user.role === 'admin' ? 'border-blue-300 text-blue-700' : ''}>
                    {user.role === 'admin' ? (
                      <>
                        <Shield className="w-3 h-3 mr-1" />
                        Administrator
                      </>
                    ) : (
                      'User'
                    )}
                  </Badge>
                </div>
              </div>

              {isEditingProfile && (
                <div>
                  <Label className="text-xs font-medium text-slate-700">Bio (optional)</Label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm resize-none"
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                </div>
              )}

              {!isEditingProfile && profileData.bio && (
                <div>
                  <Label className="text-xs font-medium text-slate-700">Bio</Label>
                  <div className="mt-1 text-sm text-slate-600">{profileData.bio}</div>
                </div>
              )}

              <div>
                <Label className="text-xs font-medium text-slate-700">Member Since</Label>
                <div className="mt-1 text-sm text-slate-600">
                  {user.created_date ? new Date(user.created_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            {isEditingProfile ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingProfile(false);
                    setProfileData({
                      full_name: user.full_name || '',
                      profile_picture: user.profile_picture || '',
                      bio: user.bio || ''
                    });
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateProfile}
                  disabled={updateProfileMutation.isPending || uploading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditingProfile(true)} className="bg-blue-600 hover:bg-blue-700">
                Edit Profile
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}