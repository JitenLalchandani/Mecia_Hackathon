import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/Axios';

export default function Onboarding() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    language: 'English',
    ageGroup: 'Adult',
    techLevel: 'Beginner',
    role: 'Student',
    accessibility: { largeFonts: false, highContrast: false }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/profile/onboarding', formData);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-10 p-6 bg-white rounded-xl shadow-md border">
      <h2 className="text-2xl font-bold mb-4">Welcome to CyberTwin Setup</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Preferred Language</label>
          <select 
            value={formData.language} 
            onChange={(e) => setFormData({...formData, language: e.target.value})}
            className="w-full p-2 border rounded mt-1"
          >
            <option>English</option>
            <option>Hindi</option>
            <option>Gujarati</option>
            <option>Marathi</option>
            <option>Tamil</option>
            <option>Telugu</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Technical Knowledge Level</label>
          <select 
            value={formData.techLevel} 
            onChange={(e) => setFormData({...formData, techLevel: e.target.value})}
            className="w-full p-2 border rounded mt-1"
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Profile Type</label>
          <select 
            value={formData.role} 
            onChange={(e) => setFormData({...formData, role: e.target.value})}
            className="w-full p-2 border rounded mt-1"
          >
            <option>Senior Citizen</option>
            <option>Student</option>
            <option>Professional</option>
          </select>
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700"
        >
          Save & Continue
        </button>
      </form>
    </div>
  );
}