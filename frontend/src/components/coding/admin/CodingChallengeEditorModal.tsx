import React, { useState, useEffect } from 'react';
import {
  X,
  Code2,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  Clock,
  Layers,
  Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/axios';

const AVAILABLE_LANGUAGES = [
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'javascript', label: 'JavaScript' },
];

const DEFAULT_STARTER_CODES: Record<string, string> = {
  python: `import sys

def solve():
    input_data = sys.stdin.read().strip()
    # Write solution here
    print("result")

if __name__ == '__main__':
    solve()
`,
  javascript: `const fs = require('fs');

function solve() {
  const input = fs.readFileSync(0, 'utf-8').trim();
  // Write solution here
  console.log("result");
}

solve();
`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Read input and solve
    return 0;
}
`,
  c: `#include <stdio.h>
#include <stdlib.h>

int main() {
    // Read input and solve
    return 0;
}
`,
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Read input and solve
    }
}
`,
};

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface CodingChallengeEditorModalProps {
  challengeId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CodingChallengeEditorModal: React.FC<CodingChallengeEditorModalProps> = ({
  challengeId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const isEditing = Boolean(challengeId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(45);
  const [allowedLanguages, setAllowedLanguages] = useState<string[]>([
    'python',
    'javascript',
    'cpp',
    'c',
    'java',
  ]);
  const [starterCode, setStarterCode] = useState<Record<string, string>>({
    ...DEFAULT_STARTER_CODES,
  });
  const [activeStarterLang, setActiveStarterLang] = useState<string>('python');

  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [constraints, setConstraints] = useState('');
  const [sampleInput, setSampleInput] = useState('');
  const [sampleOutput, setSampleOutput] = useState('');

  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: '', expectedOutput: '', isHidden: false },
    { input: '', expectedOutput: '', isHidden: true },
  ]);

  const [isPublished, setIsPublished] = useState(true);
  const [singleSubmissionOnly, setSingleSubmissionOnly] = useState(true);

  const [activeTab, setActiveTab] = useState<'general' | 'starter' | 'testcases'>('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (challengeId) {
      const fetchDetails = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/assessments/code/admin/challenges/${challengeId}`);
          const c = res.data.data;
          setTitle(c.title || '');
          setDescription(c.description || '');
          setDifficulty(c.difficulty || 'Medium');
          setTimeLimitMinutes(c.timeLimitMinutes || 45);
          setAllowedLanguages(c.allowedLanguages || ['python']);
          setInputFormat(c.inputFormat || '');
          setOutputFormat(c.outputFormat || '');
          setConstraints(c.constraints || '');
          setSampleInput(c.sampleInput || '');
          setSampleOutput(c.sampleOutput || '');
          setIsPublished(c.isPublished ?? true);
          setSingleSubmissionOnly(c.singleSubmissionOnly ?? true);

          if (c.starterCode) {
            setStarterCode({ ...DEFAULT_STARTER_CODES, ...c.starterCode });
          }

          if (c.testCases && Array.isArray(c.testCases)) {
            setTestCases(
              c.testCases.map((tc: any) => ({
                input: tc.input || '',
                expectedOutput: tc.expectedOutput || '',
                isHidden: Boolean(tc.isHidden),
              }))
            );
          }
        } catch (err: any) {
          console.error('Failed to load challenge details:', err);
          toast.error(err.response?.data?.error || 'Failed to load challenge');
        } finally {
          setLoading(false);
        }
      };

      fetchDetails();
    } else {
      // Reset to defaults
      setTitle('');
      setDescription('');
      setDifficulty('Medium');
      setTimeLimitMinutes(45);
      setAllowedLanguages(['python', 'javascript', 'cpp', 'c', 'java']);
      setStarterCode({ ...DEFAULT_STARTER_CODES });
      setInputFormat('');
      setOutputFormat('');
      setConstraints('');
      setSampleInput('');
      setSampleOutput('');
      setTestCases([
        { input: '', expectedOutput: '', isHidden: false },
        { input: '', expectedOutput: '', isHidden: true },
      ]);
      setIsPublished(true);
      setSingleSubmissionOnly(true);
      setActiveTab('general');
    }
  }, [isOpen, challengeId]);

  const toggleLanguage = (langId: string) => {
    if (allowedLanguages.includes(langId)) {
      if (allowedLanguages.length === 1) {
        toast.error('At least one language must be permitted');
        return;
      }
      setAllowedLanguages((prev) => prev.filter((l) => l !== langId));
    } else {
      setAllowedLanguages((prev) => [...prev, langId]);
    }
  };

  const handleAddTestCase = () => {
    setTestCases((prev) => [
      ...prev,
      { input: '', expectedOutput: '', isHidden: prev.length >= 2 },
    ]);
  };

  const handleRemoveTestCase = (index: number) => {
    if (testCases.length === 1) {
      toast.error('At least one test case is required');
      return;
    }
    setTestCases((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTestCase = (index: number, field: keyof TestCase, val: any) => {
    setTestCases((prev) =>
      prev.map((tc, i) => (i === index ? { ...tc, [field]: val } : tc))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    if (allowedLanguages.length === 0) {
      toast.error('Select at least one permitted programming language');
      return;
    }

    // Validate test cases
    const invalidTc = testCases.find((tc) => !tc.expectedOutput.trim());
    if (invalidTc) {
      toast.error('Each test case must include an expected output');
      return;
    }

    const payload = {
      title,
      description,
      difficulty,
      timeLimitMinutes,
      allowedLanguages,
      starterCode,
      inputFormat,
      outputFormat,
      constraints,
      sampleInput,
      sampleOutput,
      testCases,
      isPublished,
      singleSubmissionOnly,
    };

    try {
      setSaving(true);
      if (isEditing) {
        await api.put(`/assessments/code/admin/challenges/${challengeId}`, payload);
        toast.success('Coding challenge updated successfully');
      } else {
        await api.post('/assessments/code/admin/challenges', payload);
        toast.success('Coding challenge created successfully');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to save coding challenge:', err);
      toast.error(err.response?.data?.error || 'Failed to save coding challenge');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl my-auto bg-surface border border-separator rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center pb-5 border-b border-separator shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Code2 size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-label-primary tracking-tight">
                {isEditing ? 'Edit Coding Challenge' : 'Create Live Coding Challenge'}
              </h2>
              <p className="text-xs text-label-secondary">
                Configure problem statement, test cases, and multi-language starter templates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-label-secondary hover:text-label-primary hover:bg-surface-secondary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-separator shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'general'
                ? 'bg-accent text-white shadow-sm'
                : 'text-label-secondary hover:text-label-primary hover:bg-surface-secondary'
            }`}
          >
            General & Metadata
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('starter')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'starter'
                ? 'bg-accent text-white shadow-sm'
                : 'text-label-secondary hover:text-label-primary hover:bg-surface-secondary'
            }`}
          >
            Starter Boilerplates ({allowedLanguages.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('testcases')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'testcases'
                ? 'bg-accent text-white shadow-sm'
                : 'text-label-secondary hover:text-label-primary hover:bg-surface-secondary'
            }`}
          >
            Test Cases ({testCases.length})
          </button>
        </div>

        {/* Form Body */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-xs text-label-secondary">Loading challenge data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-5 space-y-5">
            {/* ── TAB 1: General & Metadata ───────────────────────────── */}
            {activeTab === 'general' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-label-secondary font-semibold mb-1">
                    Challenge Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Valid Anagram or Maximum Subarray"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-separator text-label-primary text-xs focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label-secondary font-semibold mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-separator text-label-primary text-xs focus:outline-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-label-secondary font-semibold mb-1">
                      Time Limit (Minutes)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={timeLimitMinutes}
                      onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-separator text-label-primary text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-label-secondary font-semibold mb-1">
                    Description & Problem Statement *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain the algorithmic problem, input constraints, and logic..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-separator text-label-primary text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label-secondary font-semibold mb-1">
                      Input Format (Optional)
                    </label>
                    <input
                      type="text"
                      value={inputFormat}
                      onChange={(e) => setInputFormat(e.target.value)}
                      placeholder="e.g. First line contains integer n"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-separator text-label-primary text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-label-secondary font-semibold mb-1">
                      Output Format (Optional)
                    </label>
                    <input
                      type="text"
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value)}
                      placeholder="e.g. Print single integer answer"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-separator text-label-primary text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-label-secondary font-semibold mb-1">
                    Constraints (Optional)
                  </label>
                  <input
                    type="text"
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    placeholder="e.g. 1 <= n <= 10^5, -10^9 <= nums[i] <= 10^9"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-separator text-label-primary text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label-secondary font-semibold mb-1">
                      Sample Input (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={sampleInput}
                      onChange={(e) => setSampleInput(e.target.value)}
                      placeholder="4\n1 2 3 4"
                      className="w-full px-3.5 py-2 rounded-xl bg-surface-secondary border border-separator text-label-primary font-mono text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-label-secondary font-semibold mb-1">
                      Sample Output (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={sampleOutput}
                      onChange={(e) => setSampleOutput(e.target.value)}
                      placeholder="10"
                      className="w-full px-3.5 py-2 rounded-xl bg-surface-secondary border border-separator text-label-primary font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* Permitted Languages */}
                <div>
                  <label className="block text-label-secondary font-semibold mb-2">
                    Permitted Languages *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_LANGUAGES.map((lang) => {
                      const isSelected = allowedLanguages.includes(lang.id);
                      return (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => toggleLanguage(lang.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                            isSelected
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                              : 'bg-surface-secondary text-label-secondary border-separator'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {lang.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Assessment Controls */}
                <div className="pt-2 border-t border-separator/80 flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="rounded accent-accent"
                    />
                    <span className="text-xs font-semibold text-label-primary">
                      Published (Visible to students)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={singleSubmissionOnly}
                      onChange={(e) => setSingleSubmissionOnly(e.target.checked)}
                      className="rounded accent-accent"
                    />
                    <span className="text-xs font-semibold text-label-primary">
                      Lock after submission (Prohibit resubmissions)
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* ── TAB 2: Starter Boilerplates ────────────────────────── */}
            {activeTab === 'starter' && (
              <div className="space-y-4 text-xs">
                <p className="text-label-secondary">
                  Configure default boilerplate template loaded for each permitted language.
                </p>

                {/* Sub-selector for active language */}
                <div className="flex items-center gap-1.5 p-1 bg-surface-secondary rounded-xl border border-separator">
                  {allowedLanguages.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setActiveStarterLang(lang)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${
                        activeStarterLang === lang
                          ? 'bg-accent text-white shadow-sm'
                          : 'text-label-secondary hover:text-label-primary'
                      }`}
                    >
                      {lang === 'cpp' ? 'C++' : lang}
                    </button>
                  ))}
                </div>

                <div>
                  <textarea
                    rows={12}
                    value={starterCode[activeStarterLang] || ''}
                    onChange={(e) =>
                      setStarterCode((prev) => ({
                        ...prev,
                        [activeStarterLang]: e.target.value,
                      }))
                    }
                    className="w-full p-4 rounded-2xl bg-black border border-separator text-neutral-200 font-mono text-xs leading-relaxed focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* ── TAB 3: Test Cases Builder ──────────────────────────── */}
            {activeTab === 'testcases' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <p className="text-label-secondary">
                    Visible test cases run during "Run Code". Hidden test cases are evaluated during final grading.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddTestCase}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition-colors shadow-sm"
                  >
                    <Plus size={14} />
                    <span>Add Test Case</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {testCases.map((tc, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-2xl bg-surface-secondary border border-separator space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-label-primary">
                            Test Case #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateTestCase(index, 'isHidden', !tc.isHidden)
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all ${
                              tc.isHidden
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                                : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25'
                            }`}
                          >
                            {tc.isHidden ? (
                              <>
                                <EyeOff size={11} />
                                <span>Hidden (Grading Only)</span>
                              </>
                            ) : (
                              <>
                                <Eye size={11} />
                                <span>Visible (Public Run)</span>
                              </>
                            )}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveTestCase(index)}
                          className="p-1 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete Test Case"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-label-secondary font-medium mb-1">
                            Stdin Input
                          </label>
                          <textarea
                            rows={3}
                            value={tc.input}
                            onChange={(e) =>
                              handleUpdateTestCase(index, 'input', e.target.value)
                            }
                            placeholder="Data sent via stdin..."
                            className="w-full p-2.5 rounded-xl bg-surface border border-separator text-label-primary font-mono text-xs focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-label-secondary font-medium mb-1">
                            Expected Stdout Output *
                          </label>
                          <textarea
                            rows={3}
                            required
                            value={tc.expectedOutput}
                            onChange={(e) =>
                              handleUpdateTestCase(index, 'expectedOutput', e.target.value)
                            }
                            placeholder="Expected console output..."
                            className="w-full p-2.5 rounded-xl bg-surface border border-separator text-label-primary font-mono text-xs focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-separator flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-semibold text-label-secondary hover:text-label-primary hover:bg-surface-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-6 py-2 rounded-full text-xs font-semibold bg-accent hover:bg-accent-hover text-white transition-all shadow-md shadow-accent/25 disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                <span>{isEditing ? 'Save Changes' : 'Create Challenge'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CodingChallengeEditorModal;
