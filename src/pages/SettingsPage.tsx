import React, { useState } from 'react';
import { Save, Building2, Cpu, Check } from 'lucide-react';
import { tabulaStore } from '../lib/store';
import { useToast } from '../components/common/Toast';

export const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [org, setOrg] = useState(tabulaStore.getOrganization());
  const [user, setUser] = useState(tabulaStore.getCurrentUser());

  const [orgName, setOrgName] = useState(org.name);
  const [slug, setSlug] = useState(org.slug);

  const [fullName, setFullName] = useState(user.fullName);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    tabulaStore.updateOrganization({
      name: orgName,
      slug,
    });

    tabulaStore.updateUser(user.id, { fullName });
    setSaved(true);
    toast.success('Organization & user profile updated successfully');
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-[#E5E4E8] rounded-md p-5">
        <h1 className="text-xl font-semibold text-[#33323A]">Organization & Platform Configuration</h1>
        <p className="text-xs text-[#74727C] mt-1">
          Manage institutional profile, default tournament settings, and system parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-[#E5E4E8] rounded-md p-6 space-y-6 text-xs">
        {/* Organization Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-[#E5E4E8] pb-3">
            <Building2 className="w-4 h-4 text-[#3F6FD9]" />
            <h2 className="text-sm font-semibold text-[#33323A]">Organization Profile</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#33323A] mb-1">Organization Name</label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full h-9 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#33323A] mb-1">Short Institutional Slug</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full h-9 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A]"
              />
            </div>
          </div>
        </div>

        {/* User Account Section */}
        <div className="space-y-4 pt-4 border-t border-[#E5E4E8]">
          <h2 className="text-sm font-semibold text-[#33323A]">User Profile Context</h2>

          <div>
            <label className="block font-medium text-[#33323A] mb-1">Full Display Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-9 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A]"
            />
          </div>
        </div>

        {/* Server AI Status */}
        <div className="p-4 bg-[#FAFAFB] border border-[#E5E4E8] rounded-md space-y-2">
          <div className="flex items-center space-x-2 text-[#36A269] font-semibold">
            <Cpu className="w-4 h-4 text-[#3F6FD9]" />
            <span className="text-[#33323A]">Gemini AI Server Proxy Service Status</span>
          </div>
          <p className="text-[#74727C]">
            Server-side AI routes (`/api/ai/*`) are active using `@google/genai` SDK on standard Cloud Run infrastructure.
          </p>
        </div>

        <div className="border-t border-[#E5E4E8] pt-4 flex items-center justify-between">
          {saved && (
            <span className="text-xs text-[#36A269] font-medium flex items-center space-x-1">
              <Check className="w-3.5 h-3.5" />
              <span>Settings saved successfully.</span>
            </span>
          )}

          <button
            type="submit"
            className="ml-auto px-4 py-2 bg-[#E51B4B] hover:bg-[#CC1641] text-white font-medium rounded-md flex items-center space-x-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
