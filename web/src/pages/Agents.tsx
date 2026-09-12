import React, { useState } from 'react';
import { Agent } from '../types';
import { Plus, QrCode, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AgentsProps {
  agents: Agent[];
  onOpenQRBadge: (agent: Agent) => void;
  onAddAgent: (newAgent: Agent) => void;
}

export const Agents: React.FC<AgentsProps> = ({ agents, onOpenQRBadge, onAddAgent }) => {
  const { t } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [territory, setTerritory] = useState('');

  const handleSaveAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !territory.trim()) return;

    const newCode = `AGENT-QND-${Math.floor(100 + Math.random() * 900)}`;
    const newAgent: Agent = {
      id: `agent_${Date.now()}`,
      code: newCode,
      name: name.trim(),
      phone: phone.trim(),
      territory: territory.trim(),
      ordersCount: 0,
      totalSales: 0,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAddAgent(newAgent);
    setShowAddModal(false);
    setName('');
    setPhone('+998 ');
    setTerritory('');
    // Open QR badge modal immediately for printing
    onOpenQRBadge(newAgent);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-black text-slate-900">{t('agents_title')}</h3>
          <p className="text-xs text-slate-500 font-medium">{t('agents_sub')}</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-md shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          {t('btn_add_agent')}
        </button>
      </div>

      {/* Agents Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 flex flex-col justify-between hover:border-slate-300 transition"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {agent.avatarUrl ? (
                      <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display text-base font-black text-blue-700">{agent.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900">{agent.name}</h4>
                    <span className="inline-block bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded mt-0.5">
                      {agent.code}
                    </span>
                  </div>
                </div>

                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" title={t('agent_status_active')} />
              </div>

              {/* Meta Details */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-700">{agent.territory}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-600">{agent.phone}</span>
                </div>
              </div>

              {/* Performance Mini Bar */}
              <div className="mt-3.5 grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded-md text-center border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    {t('agent_orders')}
                  </span>
                  <span className="font-display text-xs font-black text-slate-900 tabular-nums">{agent.ordersCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    {t('agent_sales')}
                  </span>
                  <span className="font-display text-xs font-black text-blue-700 tabular-nums">
                    {(agent.totalSales / 1000000).toFixed(1)} {t('mln')}
                  </span>
                </div>
              </div>
            </div>

            {/* Print QR Badge Button */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => onOpenQRBadge(agent)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-[#090d16] hover:bg-slate-800 text-white rounded-md text-xs font-bold transition"
              >
                <QrCode className="w-3.5 h-3.5 text-blue-400" />
                {t('btn_print_qr')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Agent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in duration-200">
            <h3 className="font-display text-base font-black text-slate-900 mb-1">{t('modal_add_agent_title')}</h3>
            <p className="text-xs text-slate-500 mb-5">{t('modal_add_agent_sub')}</p>

            <form onSubmit={handleSaveAgent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('field_agent_name')}
                </label>
                <input
                  type="text"
                  placeholder="Sardor Rahimov"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('field_agent_phone')}
                </label>
                <input
                  type="text"
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('field_agent_territory')}
                </label>
                <input
                  type="text"
                  placeholder="Olmazor & Shayxontohur"
                  value={territory}
                  onChange={(e) => setTerritory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-md transition"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-md shadow-xs transition"
                >
                  {t('btn_save_qr')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
