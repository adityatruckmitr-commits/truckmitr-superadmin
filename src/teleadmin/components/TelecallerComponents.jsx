import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { 
  Users, Phone, Package, CheckCircle, XCircle, Clock, 
  Edit, Trash2, Eye, ArrowRightLeft, X, AlertCircle, TrendingUp
} from 'lucide-react-teleadmin';

// Telecaller Card Component
export const TelecallerCard = ({ telecaller, onViewLeads, onEdit, onDelete }) => {
  return (
    <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{telecaller.name}</h3>
              <p className="text-sm text-gray-600">{telecaller.email}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              telecaller.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {telecaller.status?.toUpperCase() || 'ACTIVE'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-600 font-semibold mb-1">Total Leads</p>
              <p className="text-2xl font-bold text-blue-700">{telecaller.total_leads}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-green-600 font-semibold mb-1">Total Calls</p>
              <p className="text-2xl font-bold text-green-700">{telecaller.total_calls}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-xs text-purple-600 font-semibold mb-1">Connected</p>
              <p className="text-2xl font-bold text-purple-700">{telecaller.connected_calls}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-xs text-orange-600 font-semibold mb-1">Conversion</p>
              <p className="text-2xl font-bold text-orange-700">{telecaller.conversion_rate}%</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              {telecaller.mobile}
            </span>
            <span className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              {telecaller.tc_for || 'welcome-call'}
            </span>
            {telecaller.last_call_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Last call: {new Date(telecaller.last_call_time).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onViewLeads}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
          >
            <Eye className="w-4 h-4" />
            View Leads
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
