import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  Lock,
  Code,
  FileText,
  Calendar,
  Hash,
  ToggleLeft,
  ToggleRight,
  User as UserIcon,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { UserPickerInput } from './UserPickerInput';
import { SchemaFieldMeta, UserLookupItem } from '../../../store/useDiagnosticsStore';

type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'user' | 'array' | 'json';

interface FormFieldDef {
  key: string;
  type: FieldType;
  required?: boolean;
}

interface RecordFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  collectionName: string;
  initialData?: any;
  schemaFields?: SchemaFieldMeta[];
  userMap?: Record<string, UserLookupItem>;
  onClose: () => void;
  onSave: (data: any) => Promise<boolean>;
}

export const RecordFormModal: React.FC<RecordFormModalProps> = ({
  isOpen,
  mode,
  collectionName,
  initialData = {},
  schemaFields = [],
  userMap = {},
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [fields, setFields] = useState<FormFieldDef[]>([]);
  const [rawJson, setRawJson] = useState('{}');
  const [saving, setSaving] = useState(false);

  // New Field addition state
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>('string');
  const [showAddField, setShowAddField] = useState(false);

  // Temporary tag input state for array fields
  const [arrayInputs, setArrayInputs] = useState<Record<string, string>>({});

  const userRefRegex = /(user|student|createdby|updatedby|author|instructor|unblockedby|member|mentor)/i;

  const detectFieldType = (key: string, val: any): FieldType => {
    // Check if matching schema says ObjectID
    const schemaMeta = schemaFields.find((s) => s.path === key);
    if (schemaMeta?.instance === 'ObjectID' || userRefRegex.test(key)) {
      return 'user';
    }
    if (typeof val === 'boolean' || schemaMeta?.instance === 'Boolean') return 'boolean';
    if (typeof val === 'number' || schemaMeta?.instance === 'Number') return 'number';
    if (
      schemaMeta?.instance === 'Date' ||
      key.endsWith('At') ||
      key.endsWith('Date') ||
      (typeof val === 'string' && !isNaN(Date.parse(val)) && /^\d{4}-\d{2}-\d{2}/.test(val))
    ) {
      return 'date';
    }
    if (Array.isArray(val) || schemaMeta?.instance === 'Array') return 'array';
    if (typeof val === 'object' && val !== null) return 'json';
    return 'string';
  };

  // Initialize form state
  useEffect(() => {
    if (!isOpen) return;

    let initialValues: Record<string, any> = {};
    let initialDefs: FormFieldDef[] = [];

    if (mode === 'edit' && initialData) {
      initialValues = { ...initialData };
      const keys = Object.keys(initialValues);
      initialDefs = keys.map((k) => ({
        key: k,
        type: detectFieldType(k, initialValues[k]),
        required: schemaFields.find((s) => s.path === k)?.required || false,
      }));
    } else {
      // Create mode
      if (schemaFields.length > 0) {
        schemaFields.forEach((sf) => {
          let defaultVal: any = '';
          if (sf.instance === 'Number') defaultVal = sf.defaultValue ?? 0;
          else if (sf.instance === 'Boolean') defaultVal = sf.defaultValue ?? false;
          else if (sf.instance === 'Date') defaultVal = new Date().toISOString();
          else if (sf.instance === 'Array') defaultVal = [];
          else if (sf.instance === 'ObjectID' || userRefRegex.test(sf.path)) defaultVal = '';
          else defaultVal = sf.defaultValue ?? '';

          initialValues[sf.path] = defaultVal;
          initialDefs.push({
            key: sf.path,
            type: detectFieldType(sf.path, defaultVal),
            required: sf.required,
          });
        });
      } else {
        // Fallback default starter fields
        if (collectionName === 'users') {
          initialValues = {
            name: '',
            email: '',
            rollNo: '',
            role: 'Student',
            department: '',
            password: 'Password123!',
            isBlocked: false,
          };
        } else {
          initialValues = {
            title: '',
            description: '',
            status: 'active',
          };
        }
        initialDefs = Object.keys(initialValues).map((k) => ({
          key: k,
          type: detectFieldType(k, initialValues[k]),
          required: false,
        }));
      }
    }

    setFormData(initialValues);
    setFields(initialDefs);
    setRawJson(JSON.stringify(initialValues, null, 2));
    setActiveTab('form');
  }, [isOpen, mode, initialData, schemaFields, collectionName]);

  const handleTabSwitch = (newTab: 'form' | 'json') => {
    if (newTab === 'json') {
      setRawJson(JSON.stringify(formData, null, 2));
      setActiveTab('json');
    } else {
      try {
        const parsed = JSON.parse(rawJson);
        setFormData(parsed);
        const keys = Object.keys(parsed);
        setFields(
          keys.map((k) => ({
            key: k,
            type: detectFieldType(k, parsed[k]),
            required: schemaFields.find((s) => s.path === k)?.required || false,
          }))
        );
        setActiveTab('form');
      } catch (err: any) {
        toast.error('Cannot switch to form: Invalid JSON: ' + err.message);
      }
    }
  };

  const handleUpdateFieldValue = (key: string, val: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: val };
      return updated;
    });
  };

  const handleDeleteField = (key: string) => {
    setFormData((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    setFields((prev) => prev.filter((f) => f.key !== key));
  };

  const handleAddField = () => {
    const trimmed = newFieldKey.trim();
    if (!trimmed) {
      toast.error('Field key name cannot be empty');
      return;
    }
    if (formData[trimmed] !== undefined) {
      toast.error(`Field "${trimmed}" already exists`);
      return;
    }

    let defaultVal: any = '';
    if (newFieldType === 'number') defaultVal = 0;
    else if (newFieldType === 'boolean') defaultVal = false;
    else if (newFieldType === 'date') defaultVal = new Date().toISOString();
    else if (newFieldType === 'array') defaultVal = [];
    else if (newFieldType === 'json') defaultVal = {};
    else defaultVal = '';

    setFormData((prev) => ({ ...prev, [trimmed]: defaultVal }));
    setFields((prev) => [...prev, { key: trimmed, type: newFieldType }]);
    setNewFieldKey('');
    setShowAddField(false);
  };

  // Helper for array tag pills
  const handleAddArrayItem = (key: string) => {
    const item = (arrayInputs[key] || '').trim();
    if (!item) return;
    const current = Array.isArray(formData[key]) ? formData[key] : [];
    handleUpdateFieldValue(key, [...current, item]);
    setArrayInputs((prev) => ({ ...prev, [key]: '' }));
  };

  const handleRemoveArrayItem = (key: string, index: number) => {
    const current = Array.isArray(formData[key]) ? formData[key] : [];
    handleUpdateFieldValue(key, current.filter((_: any, i: number) => i !== index));
  };

  const handleSubmit = async () => {
    setSaving(true);
    let payload = formData;

    if (activeTab === 'json') {
      try {
        payload = JSON.parse(rawJson);
      } catch (err: any) {
        toast.error('Invalid JSON format: ' + err.message);
        setSaving(false);
        return;
      }
    }

    const ok = await onSave(payload);
    setSaving(false);
    if (ok) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-surface rounded-2xl sm:rounded-3xl border border-separator max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-separator px-4 sm:px-6 py-3.5 sm:py-4 bg-surface-secondary/40 gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {mode === 'create' ? 'Create Record' : 'Edit Record'}
              </span>
              <span className="text-xs font-mono text-label-secondary truncate">
                Collection: <span className="font-bold text-label-primary">{collectionName}</span>
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-label-primary mt-1 truncate">
              {mode === 'create'
                ? `Insert Document into '${collectionName}'`
                : `Edit Document: ${initialData?._id || ''}`}
            </h2>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            {/* Form / Raw JSON Tab Toggle */}
            <div className="flex items-center p-1 bg-surface-secondary border border-separator rounded-xl">
              <button
                type="button"
                onClick={() => handleTabSwitch('form')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'form'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
              >
                <FileText size={13} />
                <span>Form</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabSwitch('json')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'json'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
              >
                <Code size={13} />
                <span>Raw JSON</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-surface-secondary rounded-xl text-label-tertiary hover:text-label-primary transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {activeTab === 'json' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-label-secondary">
                <span>Direct JSON BSON Payload</span>
                <span className="text-[11px] text-label-tertiary font-mono">
                  All fields will be synced to form upon return
                </span>
              </div>
              <textarea
                rows={16}
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
                className="w-full font-mono text-xs p-4 bg-surface-secondary dark:bg-zinc-950 border border-separator rounded-2xl text-label-primary dark:text-emerald-400 focus:outline-none focus:border-primary resize-none leading-relaxed"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Form Fields List */}
              <div className="space-y-3.5">
                {fields.map((field) => {
                  const val = formData[field.key];
                  const isId = field.key === '_id';
                  const isProtectedDate = field.key === 'createdAt' || field.key === 'updatedAt';

                  return (
                    <div
                      key={field.key}
                      className="p-3.5 bg-surface-secondary/50 rounded-2xl border border-separator/80 space-y-2 hover:border-separator transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-label-primary font-mono flex items-center gap-1.5">
                            {isId && <Lock size={12} className="text-amber-500" />}
                            <span>{field.key}</span>
                            {field.required && <span className="text-destructive">*</span>}
                          </label>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-surface border border-separator text-label-tertiary">
                            {field.type}
                          </span>
                        </div>

                        {!isId && !isProtectedDate && (
                          <button
                            type="button"
                            onClick={() => handleDeleteField(field.key)}
                            className="p-1 text-label-tertiary hover:text-destructive hover:bg-surface rounded-lg transition-colors"
                            title={`Remove field "${field.key}"`}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {/* Field Inputs by Type */}
                      {isId ? (
                        <div className="px-3 py-2 bg-surface border border-separator/60 rounded-xl text-xs font-mono text-label-secondary flex items-center justify-between">
                          <span>{String(val || 'Auto-generated ObjectId')}</span>
                          <span className="text-[10px] text-label-tertiary">Immutable</span>
                        </div>
                      ) : field.type === 'user' ? (
                        <UserPickerInput
                          value={typeof val === 'object' && val?._id ? val._id : String(val || '')}
                          onChange={(newId) => handleUpdateFieldValue(field.key, newId)}
                          userMap={userMap}
                          placeholder={`Select user for ${field.key}...`}
                        />
                      ) : field.type === 'boolean' ? (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleUpdateFieldValue(field.key, !Boolean(val))}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              val
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                : 'bg-surface border-separator text-label-secondary hover:text-label-primary'
                            }`}
                          >
                            {val ? (
                              <ToggleRight size={18} className="text-emerald-500" />
                            ) : (
                              <ToggleLeft size={18} className="text-label-tertiary" />
                            )}
                            <span>{val ? 'TRUE (Active / Enabled)' : 'FALSE (Inactive / Disabled)'}</span>
                          </button>
                        </div>
                      ) : field.type === 'number' ? (
                        <input
                          type="number"
                          value={val !== undefined && val !== null ? val : ''}
                          onChange={(e) =>
                            handleUpdateFieldValue(
                              field.key,
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 bg-surface border border-separator rounded-xl text-xs text-label-primary focus:outline-none focus:border-primary font-mono"
                          placeholder="0"
                        />
                      ) : field.type === 'date' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={val ? String(val) : ''}
                            onChange={(e) => handleUpdateFieldValue(field.key, e.target.value)}
                            className="flex-1 px-3 py-2 bg-surface border border-separator rounded-xl text-xs text-label-primary focus:outline-none focus:border-primary font-mono"
                            placeholder="YYYY-MM-DD or ISO 8601 string"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateFieldValue(field.key, new Date().toISOString())
                            }
                            className="px-2.5 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/10 rounded-lg border border-primary/20 whitespace-nowrap"
                          >
                            Now
                          </button>
                        </div>
                      ) : field.type === 'array' ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-surface border border-separator rounded-xl">
                            {Array.isArray(val) && val.length > 0 ? (
                              val.map((item: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-secondary border border-separator text-xs text-label-primary"
                                >
                                  <span>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveArrayItem(field.key, idx)}
                                    className="text-label-tertiary hover:text-destructive"
                                  >
                                    <X size={11} />
                                  </button>
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-label-tertiary italic p-1">
                                No items in array
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={arrayInputs[field.key] || ''}
                              onChange={(e) =>
                                setArrayInputs((prev) => ({
                                  ...prev,
                                  [field.key]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddArrayItem(field.key);
                                }
                              }}
                              placeholder="Add item and press Enter or click Add..."
                              className="flex-1 px-3 py-1.5 text-xs bg-surface border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddArrayItem(field.key)}
                              className="px-3 py-1.5 bg-surface-secondary hover:bg-surface border border-separator rounded-xl text-xs font-semibold text-label-primary transition-colors"
                            >
                              Add Tag
                            </button>
                          </div>
                        </div>
                      ) : field.type === 'json' ? (
                        <textarea
                          rows={4}
                          value={
                            typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val || '')
                          }
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              handleUpdateFieldValue(field.key, parsed);
                            } catch {
                              handleUpdateFieldValue(field.key, e.target.value);
                            }
                          }}
                          className="w-full font-mono text-xs p-3 bg-surface border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary resize-none"
                        />
                      ) : (
                        // Standard String
                        field.key === 'description' ||
                        field.key === 'bio' ||
                        field.key === 'code' ||
                        field.key === 'content' ||
                        String(val || '').length > 80 ? (
                          <textarea
                            rows={3}
                            value={val !== undefined && val !== null ? String(val) : ''}
                            onChange={(e) => handleUpdateFieldValue(field.key, e.target.value)}
                            className="w-full px-3 py-2 bg-surface border border-separator rounded-xl text-xs text-label-primary focus:outline-none focus:border-primary resize-none"
                            placeholder={`Enter ${field.key}...`}
                          />
                        ) : (
                          <input
                            type="text"
                            value={val !== undefined && val !== null ? String(val) : ''}
                            onChange={(e) => handleUpdateFieldValue(field.key, e.target.value)}
                            className="w-full px-3 py-2 bg-surface border border-separator rounded-xl text-xs text-label-primary focus:outline-none focus:border-primary"
                            placeholder={`Enter ${field.key}...`}
                          />
                        )
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Field Section */}
              {showAddField ? (
                <div className="p-4 bg-surface-secondary rounded-2xl border border-primary/30 space-y-3 animate-in fade-in duration-200">
                  <h4 className="text-xs font-bold text-label-primary flex items-center gap-1.5">
                    <Plus size={14} className="text-primary" />
                    <span>Add New Field to Record</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-label-secondary uppercase">
                        Field Name (Key)
                      </label>
                      <input
                        type="text"
                        autoFocus
                        value={newFieldKey}
                        onChange={(e) => setNewFieldKey(e.target.value)}
                        placeholder="e.g., customTag, reviewerId, score"
                        className="w-full mt-1 px-3 py-1.5 text-xs bg-surface border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-label-secondary uppercase">
                        Field Data Type
                      </label>
                      <select
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value as FieldType)}
                        className="w-full mt-1 px-3 py-1.5 text-xs bg-surface border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary"
                      >
                        <option value="string">String (Text)</option>
                        <option value="user">User Reference (User Picker)</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean (True/False)</option>
                        <option value="date">Date / Timestamp</option>
                        <option value="array">Array (Tags / List)</option>
                        <option value="json">JSON / Nested Object</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddField(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-label-secondary hover:text-label-primary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddField}
                      className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:brightness-110 transition-all"
                    >
                      Confirm Add Field
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddField(true)}
                  className="w-full py-2.5 px-4 rounded-2xl border border-dashed border-separator hover:border-primary/50 text-xs font-semibold text-label-secondary hover:text-primary transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={15} />
                  <span>Add Custom Field</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-separator px-4 sm:px-6 py-3.5 sm:py-4 bg-surface-secondary/40 gap-2.5">
          <span className="text-xs text-label-tertiary">
            {activeTab === 'form' ? `${fields.length} fields defined` : 'JSON mode'}
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-label-secondary hover:text-label-primary transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-center"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{mode === 'create' ? 'Insert Record' : 'Save Changes'}</span>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RecordFormModal;
