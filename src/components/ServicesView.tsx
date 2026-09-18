import React, { useState, useEffect, useCallback } from 'react';
import {
  Stethoscope,
  Search,
  Plus,
  Edit,
  Trash2,
  Clock,
  Building2,
  DollarSign,
  CheckCircle2,
  XCircle,
  Filter,
  Loader2,
  RotateCw,
  X,
  AlertTriangle,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import { HospitalServiceItem } from '../types';
import { ApiClient } from '../services/apiClient';

export const ServicesView: React.FC = () => {
  const [services, setServices] = useState<HospitalServiceItem[]>([
    {
      id: 'srv-1',
      code: 'SRV-CARD-01',
      name: 'Comprehensive Cardiac Evaluation & ECG',
      category: 'Consultation',
      cost: 250.0,
      department: 'Cardiology',
      durationMinutes: 45,
      status: 'Active',
      description: 'Full non-invasive clinical exam of the cardiovascular system including 12-lead Electrocardiogram.',
    },
    {
      id: 'srv-2',
      code: 'SRV-RAD-02',
      name: 'Full Body High-Resolution CT Scan',
      category: 'Diagnostics & Labs',
      cost: 890.0,
      department: 'Radiology & Imaging',
      durationMinutes: 30,
      status: 'Active',
      description: 'Multi-slice computed tomography with iodine contrast option for organ structure visualization.',
    },
    {
      id: 'srv-3',
      code: 'SRV-SURG-03',
      name: 'Laparoscopic Appendectomy Procedure',
      category: 'Surgery & Procedures',
      cost: 4500.0,
      department: 'General Surgery',
      durationMinutes: 120,
      status: 'Active',
      description: 'Minimally invasive removal of inflamed appendix under general anesthesia.',
    },
    {
      id: 'srv-4',
      code: 'SRV-EMERG-04',
      name: 'Level 1 Trauma Triage & Resuscitation',
      category: 'Emergency',
      cost: 600.0,
      department: 'Emergency & Trauma',
      durationMinutes: 60,
      status: 'Active',
      description: 'Immediate stabilization, vital monitoring, and rapid diagnostic panel in ER bays.',
    },
    {
      id: 'srv-5',
      code: 'SRV-REHAB-05',
      name: 'Physical Therapy & Neuromuscular Rehab',
      category: 'Therapy & Rehab',
      cost: 150.0,
      department: 'Physical Therapy',
      durationMinutes: 60,
      status: 'Active',
      description: 'Targeted physical exercises and joint mobilization post-surgery or post-stroke.',
    },
    {
      id: 'srv-6',
      code: 'SRV-LAB-06',
      name: 'Complete Blood Count & Metabolic Panel',
      category: 'Diagnostics & Labs',
      cost: 110.0,
      department: 'Central Pathology',
      durationMinutes: 15,
      status: 'Active',
      description: 'Automated blood cell counts, electrolyte levels, lipid profile, and blood glucose tests.',
    },
    {
      id: 'srv-7',
      code: 'SRV-PEDS-07',
      name: 'Pediatric Immunization & Growth Check',
      category: 'Consultation',
      cost: 130.0,
      department: 'Pediatrics',
      durationMinutes: 30,
      status: 'Active',
      description: 'Child health evaluation, developmental milestone checks, and scheduled childhood vaccines.',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<HospitalServiceItem | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<HospitalServiceItem | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<HospitalServiceItem['category']>('Consultation');
  const [formCost, setFormCost] = useState('');
  const [formDept, setFormDept] = useState('Cardiology');
  const [formDuration, setFormDuration] = useState('30');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formDescription, setFormDescription] = useState('');

  // Fetch from API
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ApiClient.getServices();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setServices(res.data);
      }
    } catch (err) {
      console.warn('Using cached services state');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const openAddModal = () => {
    setEditingService(null);
    setFormName('');
    setFormCategory('Consultation');
    setFormCost('200');
    setFormDept('Cardiology');
    setFormDuration('30');
    setFormStatus('Active');
    setFormDescription('');
    setShowAddModal(true);
  };

  const openEditModal = (srv: HospitalServiceItem) => {
    setEditingService(srv);
    setFormName(srv.name);
    setFormCategory(srv.category);
    setFormCost(srv.cost.toString());
    setFormDept(srv.department);
    setFormDuration(srv.durationMinutes.toString());
    setFormStatus(srv.status);
    setFormDescription(srv.description);
    setShowAddModal(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCost) return;

    if (editingService) {
      const updated: HospitalServiceItem = {
        ...editingService,
        name: formName,
        category: formCategory,
        cost: parseFloat(formCost),
        department: formDept,
        durationMinutes: parseInt(formDuration) || 30,
        status: formStatus,
        description: formDescription,
      };

      setServices((prev) => prev.map((s) => (s.id === editingService.id ? updated : s)));

      try {
        await ApiClient.updateService(editingService.id, updated);
      } catch (err) {
        // Fallback
      }
    } else {
      const newSrv: HospitalServiceItem = {
        id: `srv-${Date.now()}`,
        code: `SRV-${formCategory.substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
        name: formName,
        category: formCategory,
        cost: parseFloat(formCost),
        department: formDept,
        durationMinutes: parseInt(formDuration) || 30,
        status: formStatus,
        description: formDescription,
      };

      setServices((prev) => [newSrv, ...prev]);

      try {
        await ApiClient.createService(newSrv);
      } catch (err) {
        // Fallback
      }
    }

    setShowAddModal(false);
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;

    setServices((prev) => prev.filter((s) => s.id !== serviceToDelete.id));

    try {
      await ApiClient.deleteService(serviceToDelete.id);
    } catch (err) {
      // Fallback
    }

    setServiceToDelete(null);
  };

  const toggleServiceStatus = async (srv: HospitalServiceItem) => {
    const newStatus = srv.status === 'Active' ? 'Inactive' : 'Active';
    setServices((prev) =>
      prev.map((s) => (s.id === srv.id ? { ...s, status: newStatus } : s))
    );
    try {
      await ApiClient.updateService(srv.id, { status: newStatus });
    } catch (err) {
      // Fallback
    }
  };

  const filteredServices = services.filter((srv) => {
    const matchesSearch =
      srv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || srv.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Hospital Services & Pricing Directory</span>
            {loading && <Loader2 className="w-5 h-5 text-teal-700 animate-spin" />}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Clinical procedures, diagnostic catalog, consultations, and department fee structures.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchServices}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl shadow-xs transition cursor-pointer"
            title="Refresh Services"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medical Service</span>
          </button>
        </div>
      </div>

      {/* Search & Category Tabs */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search service by name, code, or department..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-800/20"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            'All',
            'Consultation',
            'Diagnostics & Labs',
            'Surgery & Procedures',
            'Emergency',
            'Therapy & Rehab',
          ].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                categoryFilter === cat
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((srv) => (
          <div
            key={srv.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-teal-300 hover:shadow-md transition space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                    {srv.code}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight mt-0.5">{srv.name}</h3>
                </div>
                <button
                  onClick={() => toggleServiceStatus(srv)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 transition cursor-pointer ${
                    srv.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                  }`}
                  title="Click to toggle active status"
                >
                  {srv.status}
                </button>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{srv.description}</p>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> Department:
                  </span>
                  <span className="font-semibold text-slate-800">{srv.department}</span>
                </div>

                <div className="flex justify-between items-center text-slate-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Approx Duration:
                  </span>
                  <span className="font-semibold text-slate-800">{srv.durationMinutes} mins</span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500 font-medium">Standard Fee:</span>
                  <span className="text-base font-extrabold text-teal-900">${srv.cost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => openEditModal(srv)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setServiceToDelete(srv)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-800" />
                <span>{editingService ? 'Edit Service Details' : 'Add New Hospital Service'}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Service Title / Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  placeholder="e.g. Echocardiogram Diagnostics"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Diagnostics & Labs">Diagnostics & Labs</option>
                    <option value="Surgery & Procedures">Surgery & Procedures</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Therapy & Rehab">Therapy & Rehab</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    required
                    placeholder="Cardiology"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Standard Fee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    required
                    placeholder="180.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    required
                    placeholder="45"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Clinical Description</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Provide scope, required equipment or preparations..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-semibold rounded-xl transition"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900">Delete Service</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to remove <strong className="text-slate-900">{serviceToDelete.name}</strong> ({serviceToDelete.code})?
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteService}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition"
              >
                Delete Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
