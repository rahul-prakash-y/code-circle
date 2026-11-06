import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import AuthLayout from '../layouts/AuthLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { EmilButton } from '../components/ui/emil-ui';
import { HeroInput, HeroTextarea, HeroTabs } from '../components/ui/HeroUIComponents';
import { Button } from '@heroui/react';
import { 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  Mail, 
  Copy, 
  ShieldCheck, 
  Send, 
  Eye, 
  EyeOff, 
  Search, 
  Clock, 
  Hash 
} from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const navigate = useNavigate();
  const { resetPasswordWithToken, requestPasswordReset, checkResetStatus } = useAuthStore();

  // Mode 1: Set New Password Form (when token in URL)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [isResetSuccess, setIsResetSuccess] = useState(false);

  // Mode 2: Request Reset Form (when no token in URL)
  const [activeTab, setActiveTab] = useState('request'); // 'request' | 'track'
  const [reqEmail, setReqEmail] = useState(emailParam || '');
  const [reqPassword, setReqPassword] = useState('');
  const [reqRollNo, setReqRollNo] = useState('');
  const [verifyMethod, setVerifyMethod] = useState('rollNo'); // 'password' | 'rollNo'
  const [showReqPassword, setShowReqPassword] = useState(false);
  const [reqReason, setReqReason] = useState('');
  const [reqLoading, setReqLoading] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);

  // Mode 3: Track Status Tab
  const [trackIdentifier, setTrackIdentifier] = useState(emailParam || '');
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackResult, setTrackResult] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const adminEmail = 'codecircle@bitsathy.ac.in';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(adminEmail);
    setCopiedEmail(true);
    toast.success('Admin email copied to clipboard!');
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  // Submission handler for setting new password using token
  const handleTokenReset = async (e) => {
    e.preventDefault();

    if (!token) {
      return toast.error('Missing password reset token');
    }

    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters in length');
    }

    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setTokenLoading(true);
    const result = await resetPasswordWithToken(token, newPassword);

    if (result.success) {
      setIsResetSuccess(true);
      toast.success(result.message || 'Password reset successfully!');
    } else {
      toast.error(result.error || 'Failed to reset password');
    }
    setTokenLoading(false);
  };

  // Submission handler for raising a verified reset request
  const handleCreateRequest = async (e) => {
    e.preventDefault();

    if (!reqEmail) {
      return toast.error('Please enter your registered email address');
    }

    if (verifyMethod === 'password' && !reqPassword) {
      return toast.error('Please enter your account password to verify your identity');
    }

    if (verifyMethod === 'rollNo' && !reqRollNo) {
      return toast.error('Please enter your student Roll Number to verify your identity');
    }

    setReqLoading(true);
    const result = await requestPasswordReset({
      email: reqEmail.trim(),
      password: verifyMethod === 'password' ? reqPassword : '',
      rollNo: verifyMethod === 'rollNo' ? reqRollNo.trim() : '',
      reason: reqReason.trim(),
    });

    if (result.success) {
      setSubmittedRequest({
        email: reqEmail.trim(),
        message: result.message,
        alreadyPending: result.alreadyPending,
        requestId: result.requestId,
        emailSent: result.emailSent,
      });
      toast.success(result.message || 'Password reset request registered!');
    } else {
      toast.error(result.error || 'Identity verification failed');
    }
    setReqLoading(false);
  };

  // Tracker submission handler
  const handleCheckStatus = async (e) => {
    e?.preventDefault();
    if (!trackIdentifier.trim()) {
      return toast.error('Please enter your email or roll number');
    }

    setTrackLoading(true);
    const res = await checkResetStatus(trackIdentifier.trim());
    if (res?.success) {
      setTrackResult(res);
      if (!res.hasRequest) {
        toast('No reset request on file for this account', { icon: 'ℹ️' });
      }
    } else {
      toast.error(res?.error || 'Failed to check status');
    }
    setTrackLoading(false);
  };

  // Case 1: Token was successfully used to update password
  if (isResetSuccess) {
    return (
      <AuthLayout
        title="Password Updated"
        subtitle="Your new credentials are now active."
      >
        <div className="text-center space-y-5 sm:space-y-6">
          <div className="w-16 h-16 bg-success/10 border border-success/20 rounded-2xl flex items-center justify-center mx-auto text-success shadow-lg shadow-success/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-text-primary">Credentials Configured</h3>
            <p className="text-xs sm:text-sm text-text-secondary font-medium leading-relaxed max-w-sm mx-auto">
              Your password has been successfully reset. All previous device sessions have been invalidated for security.
            </p>
          </div>
          <Button
            variant="primary"
            onPress={() => navigate('/login')}
            className="w-full py-3.5 min-h-[48px] font-semibold shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
          >
            <span>Sign In Now</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // Case 2: A token is present in the URL -> Render the Set New Password Form
  if (token) {
    return (
      <AuthLayout
        title="Set New Password"
        subtitle={emailParam ? `Configuring secure password for ${emailParam}` : 'Enter your new credentials below.'}
      >
        <motion.form
          onSubmit={handleTokenReset}
          className="space-y-4 sm:space-y-5"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1, delayChildren: 0.2 },
            },
          }}
        >
          <div className="p-3 sm:p-3.5 bg-accent/10 border border-accent/20 rounded-xl flex items-center gap-2.5 text-xs text-accent">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Authorized Reset Link: Enter a new password with at least 6 characters.</span>
          </div>

          <motion.div
            variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}
          >
            <HeroInput
              label="New Password"
              labelPlacement="inside"
              variant="flat"
              type={showNewPassword ? 'text' : 'password'}
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              isRequired
              startContent={<Lock className="w-4 h-4 text-text-muted" />}
              endContent={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  className="text-text-muted hover:text-text-primary min-w-[28px] min-h-[28px]"
                  aria-label="Toggle password visibility"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              }
            />
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}
            className="space-y-1"
          >
            <HeroInput
              label="Confirm New Password"
              labelPlacement="inside"
              variant="flat"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              isRequired
              startContent={<KeyRound className="w-4 h-4 text-text-muted" />}
              endContent={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-text-muted hover:text-text-primary min-w-[28px] min-h-[28px]"
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              }
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-400 mt-1 px-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Passwords do not match
              </p>
            )}
            {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
              <p className="text-xs text-green-400 mt-1 px-1 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Passwords match
              </p>
            )}
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
            className="pt-2"
          >
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isDisabled={tokenLoading || newPassword.length < 6 || newPassword !== confirmPassword}
              isLoading={tokenLoading}
              className="w-full py-3.5 min-h-[48px] text-sm sm:text-base font-semibold shadow-lg shadow-accent/15"
            >
              Update Password & Access Hub
            </Button>
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            className="text-center pt-2"
          >
            <Link
              to="/login"
              className="text-xs sm:text-sm font-semibold text-text-muted hover:text-text-primary transition-colors inline-block min-h-[36px] py-2"
            >
              Cancel and Return to Sign In
            </Link>
          </motion.div>
        </motion.form>
      </AuthLayout>
    );
  }

  // Case 3: Request was created successfully -> Show confirmation & tracker card
  if (submittedRequest) {
    return (
      <AuthLayout
        title="Reset Request Submitted"
        subtitle="Identity verified. Administrator approval queued."
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-5 sm:space-y-6"
        >
          <div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mx-auto text-accent shadow-lg shadow-accent/10">
            {submittedRequest.emailSent ? (
              <Mail className="w-8 h-8 text-emerald-400 animate-bounce" />
            ) : (
              <Clock className="w-8 h-8 text-amber-400" />
            )}
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-text-primary">
              {submittedRequest.emailSent ? 'Password Reset Email Sent' : 'Reset Request Registered'}
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              {submittedRequest.message ||
                'Your account has been verified. A reset link has been dispatched to your email address.'}
            </p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-surface border border-separator space-y-2.5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-separator gap-1">
              <span className="text-text-muted">Target Account:</span>
              <span className="font-mono font-semibold text-text-primary break-all">{submittedRequest.email}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-separator gap-1">
              <span className="text-text-muted">Email Delivery:</span>
              <span
                className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[11px] border w-fit ${
                  submittedRequest.emailSent
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {submittedRequest.emailSent ? 'Link Dispatched to Inbox' : 'Awaiting Delivery / Admin Review'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <span className="text-text-muted">Next Step:</span>
              <span className="text-text-secondary">
                {submittedRequest.emailSent ? 'Click link in email to set password' : 'Admin will review or resend link'}
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            <Button
              variant="outline"
              onPress={() => {
                setTrackIdentifier(submittedRequest.email);
                setActiveTab('track');
                setSubmittedRequest(null);
                handleCheckStatus();
              }}
              className="w-full py-3 min-h-[44px] flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold"
            >
              <Search className="w-4 h-4" /> Check Real-Time Approval Status
            </Button>

            <Link
              to="/login"
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 min-h-[44px] text-xs sm:text-sm font-semibold shadow-md shadow-accent/15"
            >
              Return to Sign In
            </Link>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  // Case 4: Default self-service Password Reseter Page (User enters credentials to verify identity)
  return (
    <AuthLayout
      title="Password Reset Portal"
      subtitle="Verify your credentials to request an administrator-approved reset link."
    >
      <div className="space-y-4 sm:space-y-5">
        {/* Navigation Tabs - Native HeroUI Tabs with Emil Kowalski sub-300ms motion */}
        <div className="flex justify-center">
          <HeroTabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key)}
            className="w-full grid grid-cols-2"
            items={[
              { id: 'request', label: 'Request Reset', icon: <KeyRound className="w-3.5 h-3.5" /> },
              { id: 'track', label: 'Track Status', icon: <Clock className="w-3.5 h-3.5" /> },
            ]}
          />
        </div>

        {/* Tab 1: Request Reset Link */}
        {activeTab === 'request' && (
          <motion.form
            onSubmit={handleCreateRequest}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3.5 sm:space-y-4"
          >
            {/* Explanatory Policy Badge */}
            <div className="p-3 sm:p-3.5 bg-accent/10 border border-accent/20 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-accent font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Verified Account Recovery</span>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Enter your account email and verify your identity using your current password or student roll number. Once verified, a reset request is queued for administrator approval.
              </p>
            </div>

            {/* Email Field */}
            <HeroInput
              label="Registered Email Address"
              labelPlacement="inside"
              variant="flat"
              type="email"
              placeholder="your.email@bitsathy.ac.in"
              value={reqEmail}
              onChange={(e) => setReqEmail(e.target.value)}
              isRequired
              startContent={<Mail className="w-4 h-4 text-text-muted" />}
            />

            {/* Verification Method Switch */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-semibold text-text-secondary">Identity Verification</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={verifyMethod === 'rollNo' ? 'primary' : 'outline'}
                    size="sm"
                    onPress={() => setVerifyMethod('rollNo')}
                    className="text-[11px] px-2.5 py-1 min-h-[32px] h-auto font-semibold"
                  >
                    Via Roll No
                  </Button>
                </div>
              </div>

              {verifyMethod === 'password' ? (
                <HeroInput
                  label="Current Password"
                  labelPlacement="inside"
                  variant="flat"
                  type={showReqPassword ? 'text' : 'password'}
                  placeholder="Enter current password to verify"
                  value={reqPassword}
                  onChange={(e) => setReqPassword(e.target.value)}
                  isRequired
                  startContent={<Lock className="w-4 h-4 text-text-muted" />}
                  endContent={
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      isIconOnly
                      onPress={() => setShowReqPassword(!showReqPassword)}
                      className="text-text-muted hover:text-text-primary min-w-[28px] min-h-[28px]"
                      aria-label="Toggle password visibility"
                    >
                      {showReqPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                  }
                />
              ) : (
                <HeroInput
                  label="University Roll Number"
                  labelPlacement="inside"
                  variant="flat"
                  type="text"
                  placeholder="e.g. 7376221CS101"
                  value={reqRollNo}
                  onChange={(e) => setReqRollNo(e.target.value.toUpperCase())}
                  isRequired
                  startContent={<Hash className="w-4 h-4 text-text-muted" />}
                />
              )}
              <p className="text-[10px] text-text-muted italic px-1">
                {verifyMethod === 'password'
                  ? 'Verifies you are the legitimate account holder before dispatching reset link.'
                  : 'Alternative verification if you cannot recall your existing password.'}
              </p>
            </div>

            {/* Optional Reason Field */}
            <HeroInput
              label="Reason / Notes (Optional)"
              labelPlacement="inside"
              variant="flat"
              type="text"
              placeholder="e.g. Routine update, forgotten password, device switch"
              value={reqReason}
              onChange={(e) => setReqReason(e.target.value)}
              maxLength={100}
            />

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isDisabled={reqLoading}
                isLoading={reqLoading}
                className="w-full py-3.5 min-h-[48px] text-xs sm:text-sm font-semibold shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Verify & Raise Reset Request</span>
              </Button>
            </div>

            {/* Return to login link */}
            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-xs sm:text-sm font-medium text-text-muted hover:text-text-primary transition-colors inline-block min-h-[36px] py-1.5"
              >
                Remember your credentials? <span className="text-accent underline font-semibold">Sign In</span>
              </Link>
            </div>
          </motion.form>
        )}

        {/* Tab 2: Track Request Status */}
        {activeTab === 'track' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3.5 sm:space-y-4"
          >
            <form onSubmit={handleCheckStatus} className="space-y-3">
              <HeroInput
                label="Email or Roll Number"
                labelPlacement="inside"
                variant="flat"
                type="text"
                placeholder="Enter email or roll number"
                value={trackIdentifier}
                onChange={(e) => setTrackIdentifier(e.target.value)}
                isRequired
                startContent={<Search className="w-4 h-4 text-text-muted" />}
              />

              <Button
                type="submit"
                variant="outline"
                isDisabled={trackLoading}
                isLoading={trackLoading}
                className="w-full py-2.5 min-h-[44px] flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold"
              >
                Check Status
              </Button>
            </form>

            {/* Track Result Display */}
            {trackResult && (
              <div className="space-y-3 pt-2">
                {trackResult.hasRequest ? (
                  <div className="p-3.5 sm:p-4 rounded-xl bg-surface border border-separator space-y-2.5 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-separator gap-1">
                      <span className="text-text-muted">Student:</span>
                      <span className="font-semibold text-text-primary">
                        {trackResult.request.name} ({trackResult.request.rollNo})
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-separator gap-1">
                      <span className="text-text-muted">Request Status:</span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] border w-fit ${
                          trackResult.request.status === 'approved'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : trackResult.request.status === 'rejected'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {trackResult.request.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-separator gap-1">
                      <span className="text-text-muted">Email Delivery:</span>
                      <span
                        className={`font-semibold ${
                          trackResult.request.emailSent ? 'text-green-400' : 'text-amber-400'
                        }`}
                      >
                        {trackResult.request.emailSent ? 'Link Dispatched via Email' : 'Awaiting Email Send'}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <span className="text-text-muted">Token Redeemed:</span>
                      <span className={trackResult.request.isUsed ? 'text-green-400 font-semibold' : 'text-text-muted'}>
                        {trackResult.request.isUsed ? 'Yes (Password Changed)' : 'No (Pending Use)'}
                      </span>
                    </div>

                    {trackResult.request.status === 'approved' && !trackResult.request.isUsed && (
                      <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-[11px] text-green-300">
                        Your request was approved. Check your registered inbox ({trackResult.request.email}) for your reset link.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-surface border border-separator text-center text-xs text-text-muted">
                    No active password reset requests found for this account.
                  </div>
                )}
              </div>
            )}

            {/* Administrator Direct Support Card */}
            <div className="p-3.5 rounded-xl bg-surface border border-separator space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-muted font-medium">Need immediate assistance?</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onPress={handleCopyEmail}
                  className="text-text-muted hover:text-accent flex items-center gap-1 text-[11px] min-h-[32px] px-1 h-auto"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedEmail ? 'Copied' : 'Copy Email'}</span>
                </Button>
              </div>
              <p className="font-mono text-accent text-[11px] break-all">{adminEmail}</p>
            </div>
          </motion.div>
        )}
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
