import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Check, X, Edit3, Loader2 } from 'lucide-react';
import useDiagnosticsStore, { UserLookupItem } from '../../../store/useDiagnosticsStore';

interface UserPickerInputProps {
  value: string;
  onChange: (val: string) => void;
  userMap?: Record<string, UserLookupItem>;
  placeholder?: string;
  disabled?: boolean;
}

export const UserPickerInput: React.FC<UserPickerInputProps> = ({
  value,
  onChange,
  userMap = {},
  placeholder = 'Select a user...',
  disabled = false,
}) => {
  const { lookupUsers } = useDiagnosticsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserLookupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [selectedUserObj, setSelectedUserObj] = useState<UserLookupItem | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync selected user from userMap or when value changes
  useEffect(() => {
    if (value && userMap[value]) {
      setSelectedUserObj(userMap[value]);
    } else if (value && !selectedUserObj) {
      // Try to fetch this specific user if not in userMap
      lookupUsers(value).then((results) => {
        const found = results.find((u) => u._id === value);
        if (found) setSelectedUserObj(found);
      });
    } else if (!value) {
      setSelectedUserObj(null);
    }
  }, [value, userMap]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search when user types
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      const results = await lookupUsers(searchTerm);
      setSearchResults(results);
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, isOpen]);

  const handleSelectUser = (user: UserLookupItem) => {
    setSelectedUserObj(user);
    onChange(user._id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    setSelectedUserObj(null);
    onChange('');
  };

  if (manualMode) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter 24-char ObjectId..."
          disabled={disabled}
          className="flex-1 font-mono text-xs px-3 py-2 bg-surface-secondary border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={() => setManualMode(false)}
          className="px-2.5 py-1.5 text-xs text-primary hover:bg-primary/10 rounded-lg border border-primary/20 transition-colors whitespace-nowrap"
        >
          Pick User
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Current Selected User Display */}
      {selectedUserObj ? (
        <div className="flex items-center justify-between p-2.5 bg-surface-secondary border border-separator rounded-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              {selectedUserObj.name ? selectedUserObj.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-label-primary truncate">
                  {selectedUserObj.name}
                </span>
                {selectedUserObj.role && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-primary/20 text-primary">
                    {selectedUserObj.role}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-label-tertiary font-mono">
                {selectedUserObj.rollNo && <span>{selectedUserObj.rollNo}</span>}
                {selectedUserObj.rollNo && selectedUserObj.email && <span>·</span>}
                {selectedUserObj.email && <span className="truncate">{selectedUserObj.email}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            {!disabled && (
              <>
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 text-label-tertiary hover:text-destructive rounded-lg hover:bg-surface transition-colors"
                  title="Clear user"
                >
                  <X size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full flex items-center justify-between px-3 py-2 bg-surface-secondary border border-separator rounded-xl text-xs text-label-tertiary hover:border-primary/50 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <User size={14} className="text-label-tertiary" />
            <span>{value ? `ID: ${value}` : placeholder}</span>
          </div>
          <span className="text-[11px] font-semibold text-primary">Select</span>
        </button>
      )}

      {/* Dropdown User Search Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-surface rounded-2xl border border-separator shadow-xl p-3 space-y-2.5 max-h-72 flex flex-col animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-2.5 text-label-tertiary" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, roll no, or email..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-secondary border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setManualMode(true);
              }}
              className="px-2 py-1.5 text-[10px] font-semibold text-label-secondary hover:text-label-primary rounded-lg border border-separator whitespace-nowrap"
              title="Type raw ObjectId"
            >
              Raw ID
            </button>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-separator/60 max-h-48">
            {loading ? (
              <div className="py-6 flex items-center justify-center text-xs text-label-tertiary gap-2">
                <Loader2 size={14} className="animate-spin text-primary" />
                <span>Searching users...</span>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-6 text-center text-xs text-label-tertiary">
                No users found. Try another search term.
              </div>
            ) : (
              searchResults.map((user) => {
                const isSelected = user._id === value;
                return (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className={`w-full flex items-center justify-between p-2 text-left hover:bg-surface-secondary transition-colors rounded-xl ${
                      isSelected ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-label-primary truncate">
                            {user.name}
                          </span>
                          {user.role && (
                            <span className="px-1 py-0.2 rounded text-[8px] font-semibold bg-primary/15 text-primary">
                              {user.role}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-label-tertiary font-mono">
                          {user.rollNo && <span>{user.rollNo}</span>}
                          {user.rollNo && user.email && <span>·</span>}
                          <span className="truncate">{user.email}</span>
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check size={14} className="text-primary shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPickerInput;
