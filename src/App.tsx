import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { AuthModal } from './components/common/AuthModal';
import { CloudSyncModal } from './components/common/CloudSyncModal';
import { OverviewPage } from './pages/OverviewPage';
import { ReportsPage } from './pages/ReportsPage';
import { SensorMonitorPage } from './pages/SensorMonitorPage';
import { SessionsPage } from './pages/SessionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import { CognitionMemoryPage } from './pages/CognitionMemoryPage';
import { StarCatcherGame } from './components/games/StarCatcherGame';
import { AssessmentWizard } from './components/assessment/AssessmentWizard';
import { StorageService } from './services/storage';
import { authService } from './services/authService';
import { cloudSyncService } from './services/cloudSyncService';
import { RealHardwareSensorAdapter } from './services/sensorAdapter';
import { CognitionStorage } from './services/cognitionStorage';
import { 
  AssessmentReportData, 
  IMUDataPoint, 
  SensorStatus, 
  UserProfile, 
  CloudSyncState, 
  SubjectiveFatigueRecord,
  CognitionMemoryResult
} from './types';

const sensorService = new RealHardwareSensorAdapter();

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [subjectId, setSubjectId] = useState<string>('未设置');
  const [sessions, setSessions] = useState<AssessmentReportData[]>([]);
  const [activeReport, setActiveReport] = useState<AssessmentReportData | null>(null);
  const [subjectiveRecords, setSubjectiveRecords] = useState<SubjectiveFatigueRecord[]>([]);
  const [cognitionResults, setCognitionResults] = useState<CognitionMemoryResult[]>([]);
  const [activeCognitionResult, setActiveCognitionResult] = useState<CognitionMemoryResult | null>(null);

  // Auth & Cloud Sync state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authService.getCurrentUser());
  const [syncState, setSyncState] = useState<CloudSyncState>(() => cloudSyncService.getState());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

  // Sensor state
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [currentIMU, setCurrentIMU] = useState<IMUDataPoint | null>(null);
  const [sensorStatus, setSensorStatus] = useState<SensorStatus>(() => sensorService.getStatus());

  // Load sessions and subjective records from storage on mount
  useEffect(() => {
    const loadedSessions = StorageService.getSessions();
    setSessions(loadedSessions);
    if (loadedSessions.length > 0) {
      setActiveReport(loadedSessions[0]);
    }

    const loadedSubjective = StorageService.getSubjectiveFatigueRecords();
    setSubjectiveRecords(loadedSubjective);
    setCognitionResults(CognitionStorage.getResults());

    const savedSubject = localStorage.getItem('finefatigue_subject_id');
    if (savedSubject) {
      setSubjectId(savedSubject);
    }
  }, []);

  useEffect(() => {
    void authService.validateCurrentSession();
  }, []);

  // After a LAN account is restored or switched, merge the browser cache with
  // the account's central record and refresh the visible dashboard data.
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'participant') return;
    void cloudSyncService.syncNow().then(() => {
      setSessions(StorageService.getSessions());
      setSubjectiveRecords(StorageService.getSubjectiveFatigueRecords());
      setCognitionResults(CognitionStorage.getResults());
      setActiveReport(StorageService.getActiveReport());
    });
  }, [currentUser?.id]);

  // Listen to Auth changes
  useEffect(() => {
    const unsubAuth = authService.subscribe(user => {
      setCurrentUser(user);
      if (user) {
        setSubjectId(user.participantCode);
        localStorage.setItem('finefatigue_subject_id', user.participantCode);
      }
    });

    const unsubSync = cloudSyncService.subscribe(state => {
      setSyncState(state);
    });

    return () => {
      unsubAuth();
      unsubSync();
    };
  }, []);

  // Subscribe to physical browser DeviceMotion events only. No simulated IMU
  // data is generated or passed into experimental measurement components.
  useEffect(() => {
    const unsubscribe = sensorService.subscribe((data: IMUDataPoint) => {
      setCurrentIMU(data);
      setSensorStatus(sensorService.getStatus());
      setIsStreaming(true);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleRequestImuAccess = async (): Promise<boolean> => {
    try {
      const accessGranted = await sensorService.connect();
      setSensorStatus(sensorService.getStatus());
      setIsStreaming(accessGranted);
      return accessGranted;
    } catch {
      setSensorStatus(sensorService.getStatus());
      setIsStreaming(false);
      return false;
    }
  };

  const handleUpdateSubjectId = (newId: string) => {
    setSubjectId(newId);
    localStorage.setItem('finefatigue_subject_id', newId);
  };

  const handleResetData = () => {
    StorageService.resetToDefaults();
    const refreshed = StorageService.getSessions();
    setSessions(refreshed);
    setSubjectiveRecords(StorageService.getSubjectiveFatigueRecords());
    CognitionStorage.clearResults();
    setCognitionResults([]);
    if (refreshed.length > 0) {
      setActiveReport(refreshed[0]);
    }
  };

  const handleDeleteSession = (id: string) => {
    StorageService.deleteSession(id);
    const refreshed = StorageService.getSessions();
    setSessions(refreshed);
    if (activeReport?.id === id) {
      setActiveReport(refreshed[0] || null);
    }
  };

  const handleStartAssessment = () => {
    setCurrentTab('assessment');
  };

  const handleAssessmentComplete = async (report: AssessmentReportData) => {
    setActiveReport(report);
    setSessions(StorageService.getSessions());
    cloudSyncService.markPending();
    await cloudSyncService.syncNow();
    setSessions(StorageService.getSessions());
    setSubjectiveRecords(StorageService.getSubjectiveFatigueRecords());
    setCurrentTab('report');
  };

  const handleCognitionComplete = async (result: CognitionMemoryResult) => {
    CognitionStorage.addResult(result);
    setCognitionResults(CognitionStorage.getResults());
    cloudSyncService.markPending();
    await cloudSyncService.syncNow();
    setCognitionResults(CognitionStorage.getResults());
  };

  const handleOpenReport = (report: AssessmentReportData) => {
    setActiveReport(report);
    setCurrentTab('report');
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Navigation Sidebar (Desktop) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={tab => setCurrentTab(tab)}
        onStartAssessment={handleStartAssessment}
        currentUser={currentUser}
        isAdmin={currentUser?.role === 'researcher'}
        syncState={syncState}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenSync={() => setIsSyncModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <TopBar
          subjectId={subjectId}
          sensorStatus={sensorStatus}
          currentUser={currentUser}
          syncState={syncState}
          onStartAssessment={handleStartAssessment}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenSync={() => setIsSyncModalOpen(true)}
        />

        {/* Content View with bottom padding for mobile navigation bar */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          {currentTab === 'overview' && (
            <OverviewPage
              subjectId={subjectId}
              sensorStatus={sensorStatus}
              sessions={sessions}
              subjectiveRecords={subjectiveRecords}
              cognitionResults={cognitionResults}
              onStartAssessment={handleStartAssessment}
              onStartCognition={() => { setActiveCognitionResult(null); setCurrentTab('cognition'); }}
              onOpenReport={handleOpenReport}
              onNavigateToSessions={() => setCurrentTab('sessions')}
            />
          )}

          {currentTab === 'assessment' && (
            <AssessmentWizard
              subjectId={subjectId}
              sensorStatus={sensorStatus}
              currentData={currentIMU}
              onRequestImuAccess={handleRequestImuAccess}
              onComplete={handleAssessmentComplete}
              onCancel={() => setCurrentTab('overview')}
            />
          )}

          {currentTab === 'report' && (
            <ReportsPage
              report={activeReport}
              onBackToOverview={() => setCurrentTab('overview')}
              onStartNewAssessment={handleStartAssessment}
            />
          )}

          {currentTab === 'sensor_monitor' && (
            <SensorMonitorPage
              sensorStatus={sensorStatus}
              currentData={currentIMU}
              onRequestImuAccess={handleRequestImuAccess}
              isStreaming={isStreaming}
            />
          )}

          {currentTab === 'sessions' && (
            <SessionsPage
              sessions={sessions}
              subjectiveRecords={subjectiveRecords}
              cognitionResults={cognitionResults}
              onOpenReport={handleOpenReport}
              onDeleteSession={handleDeleteSession}
              onStartNewAssessment={handleStartAssessment}
              onOpenCognition={result => { setActiveCognitionResult(result || null); setCurrentTab('cognition'); }}
            />
          )}

          {currentTab === 'cognition' && (
            <CognitionMemoryPage
              results={cognitionResults}
              initialResult={activeCognitionResult}
              onSaveResult={result => { void handleCognitionComplete(result); }}
              onBack={() => setCurrentTab('overview')}
            />
          )}

          {currentTab === 'star_catcher' && (
            <StarCatcherGame />
          )}

          {currentTab === 'settings' && (
            <SettingsPage
              subjectId={subjectId}
              onUpdateSubjectId={handleUpdateSubjectId}
              onResetData={handleResetData}
            />
          )}

          {currentTab === 'admin' && currentUser?.role === 'researcher' && <AdminPage />}
        </main>

        {/* Mobile Thumb-Friendly Bottom Navigation Bar */}
        <MobileBottomNav
          currentTab={currentTab}
          onSelectTab={tab => setCurrentTab(tab)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenSync={() => setIsSyncModalOpen(true)}
          currentUser={currentUser}
          isAdmin={currentUser?.role === 'researcher'}
          syncState={syncState}
        />
      </div>

      {/* Auth / Account Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChanged={user => setCurrentUser(user)}
      />

      {/* Cloud Sync Modal */}
      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncState={syncState}
      />

    </div>
  );
}
