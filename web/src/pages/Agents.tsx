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

  const totalAgentsSales = agents.reduce((sum, a) => sum + a.totalSales, 0);
  const totalAgentsOrders = agents.reduce((sum, a) => sum + a.ordersCount, 0);

  return (
    <div className="space-y-4">
      {/* 1. Top Summary Cards (New Layout Placement) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white px-4 py-3 rounded-lg border border-slate-200/70 hover:border-sky-300 transition flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-normal text-slate-500 block">Jami savdo agentlari</span>
            <span className="text-xl font-semibold text-slate-900 tabular-nums mt-0.5 block">{agents.length} nafar</span>
          </div>
          <div className="w-8 h-8 rounded-md bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
            <span className="text-xs font-semibold">AGT</span>
          </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-lg border border-slate-200/70 hover:border-sky-300 transition flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-normal text-slate-500 block">Agentlar qabul qilgan zakazlar</span>
            <span className="text-xl font-semibold text-slate-900 tabular-nums mt-0.5 block">{totalAgentsOrders} ta</span>
          </div>
          <div className="w-8 h-8 rounded-md bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
            <span className="text-xs font-semibold">ORD</span>
          </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-lg border border-slate-200/70 hover:border-sky-300 transition flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-normal text-slate-500 block">Jami tushum (savdo)</span>
            <span className="text-xl font-semibold text-slate-900 tabular-nums mt-0.5 block">
              {(totalAgentsSales / 1000000).toFixed(1)} mln <span className="text-xs font-normal text-slate-400">{t('som')}</span>
            </span>
          </div>
          <div className="w-8 h-8 rounded-md bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
            <span className="text-xs font-semibold">UZS</span>
          </div>
        </div>
      </div>

      {/* 2. Top Header & Add Button */}
      <div className="bg-white p-3 rounded-lg border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <h3 className="text-xs font-semibold text-slate-900">{t('agents_title')}</h3>
          <p className="text-[11px] text-slate-400 font-normal">{t('agents_sub')}</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-md transition self-start sm:self-auto shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[1.8]" />
          <span>{t('btn_add_agent')}</span>
        </button>
      </div>

      {/* Agents Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-white rounded-lg border border-slate-200/70 hover:border-sky-300 p-4 flex flex-col justify-between transition shadow-2xs"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-700 border border-sky-100 overflow-hidden flex items-center justify-center shrink-0">
                    {agent.avatarUrl ? (
                      <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-medium">{agent.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-slate-900">{agent.name}</h4>
                    <span className="text-[10px] font-mono text-sky-700 bg-sky-50/70 border border-sky-100 px-1 py-0.2 rounded font-normal inline-block mt-0.5">
                      {agent.code}
                    </span>
                  </div>
                </div>

                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" title={t('agent_status_active')} />
              </div>

              {/* Meta Details */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1 text-xs text-slate-500 font-normal">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 stroke-[1.6] shrink-0" />
                  <span>{agent.territory}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 stroke-[1.6] shrink-0" />
                  <span className="tabular-nums">{agent.phone}</span>
                </div>
              </div>

              {/* Performance Mini Bar */}
              <div className="mt-3 grid grid-cols-2 gap-2 p-2 bg-sky-50/40 rounded-md text-center border border-sky-100/70">
                <div>
                  <span className="text-[10px] text-slate-400 font-normal block">
                    {t('agent_orders')}
                  </span>
                  <span className="text-xs font-medium text-slate-800 tabular-nums">{agent.ordersCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-normal block">
                    {t('agent_sales')}
                  </span>
                  <span className="text-xs font-medium text-sky-800 tabular-nums">
                    {(agent.totalSales / 1000000).toFixed(1)} {t('mln')}
                  </span>
                </div>
              </div>
            </div>

            {/* Print QR Badge Button */}
            <div className="mt-3 pt-2.5 border-t border-slate-100">
              <button
                onClick={() => onOpenQRBadge(agent)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 hover:bg-sky-50 hover:text-sky-900 hover:border-sky-200 text-slate-700 rounded-md text-xs font-normal border border-slate-200/80 transition"
              >
                <QrCode className="w-3.5 h-3.5 text-sky-600 stroke-[1.6]" />
                <span>{t('btn_print_qr')}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Agent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200/80 shadow-lg max-w-md w-full p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-0.5">{t('modal_add_agent_title')}</h3>
            <p className="text-xs text-slate-400 font-normal mb-4">{t('modal_add_agent_sub')}</p>

            <form onSubmit={handleSaveAgent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-normal text-slate-600 mb-1">
                  {t('field_agent_name')}
                </label>
                <input
                  type="text"
                  placeholder="Sardor Rahimov"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200/80 rounded-md text-xs font-normal text-slate-900 outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-slate-600 mb-1">
                  {t('field_agent_phone')}
                </label>
                <input
                  type="text"
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200/80 rounded-md text-xs font-normal text-slate-900 outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-slate-600 mb-1">
                  {t('field_agent_territory')}
                </label>
                <input
                  type="text"
                  placeholder="Olmazor & Shayxontohur"
                  value={territory}
                  onChange={(e) => setTerritory(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200/80 rounded-md text-xs font-normal text-slate-900 outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs font-normal text-slate-500 hover:text-slate-800 rounded-md transition"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-md shadow-xs transition"
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
