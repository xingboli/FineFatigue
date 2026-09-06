import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { AuthModal } from './components/common/AuthModal';
import { CloudSyncModal } from './components/common/CloudSyncModal';
import { SubjectiveFatigueBlockSlider } from './components/common/SubjectiveFatigueBlockSlider';
import { OverviewPage } from './pages/OverviewPage';
import { ReportsPage } from './pages/ReportsPage';
import { SensorMonitorPage } from './pages/SensorMonitorPage';
import { SessionsPage } from './pages/SessionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { StarCatcherGame } from './components/games/StarCatcherGame';
import { AssessmentWizard } from './components/assessment/AssessmentWizard';
import { StorageService } from './services/storage';
import { authService } from './services/authService';
import { cloudSyncService } from './services/cloudSyncService';
import { getSensorService } from './services/sensorSimulator';
import { 
  AssessmentReportData, 
  IMUDataPoint, 
  SensorStatus, 
  UserProfile, 
  CloudSyncState, 
  SubjectiveFatigueRecord 
} from './types';
import { X } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [subjectId, setSubjectId] = useState<string>('Subject 001');
  const [sessions, setSessions] = useState<AssessmentReportData[]>([]);
  const [activeReport, setActiveReport] = useState<AssessmentReportData | null>(null);
  const [subjectiveRecords, setSubjectiveRecords] = useState<SubjectiveFatigueRecord[]>([]);

  // Auth & Cloud Sync state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authService.getCurrentUser());
  const [syncState, setSyncState] = useState<CloudSyncState>(() => cloudSyncService.getState());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isFatigueSliderModalOpen, setIsFatigueSliderModalOpen] = useState<boolean>(false);

  // Sensor state
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [sensorMode, setSensorMode] = useState<'simulator' | 'real'>('simulator');
  const [currentIMU, setCurrentIMU] = useState<IMUDataPoint | null>(null);
  const [sensorStatus, setSensorStatus] = useState<SensorStatus>({
    connected: true,
    samplingRate: 50,
    packetsReceived: 0,
    latencyMs: 14,
    type: 'simulator'
  });

  // Load sessions and subjective records from storage on mount
  useEffect(() => {
    const loadedSessions = StorageService.getSessions();
    setSessions(loadedSessions);
    if (loadedSessions.length > 0) {
      setActiveReport(loadedSessions[0]);
    }

    const loadedSubjective = StorageService.getSubjectiveFatigueRecords();
    setSubjectiveRecords(loadedSubjective);

    const savedSubject = localStorage.getItem('finefatigue_subject_id');
    if (savedSubject) {
      setSubjectId(savedSubject);
    }
  }, []);

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

  // Sensor stream connection
  useEffect(() => {
    const sensorService = getSensorService();
    let packetCounter = 0;

    const unsubscribe = sensorService.subscribe((data: IMUDataPoint) => {
      packetCounter++;
      setCurrentIMU(data);

      if (packetCounter % 25 === 0) {
        setSensorStatus({
          connected: sensorService.isConnected(),
          samplingRate: sensorService.getSamplingRate(),
          packetsReceived: packetCounter,
          latencyMs: 12 + Math.floor(Math.random() * 6),
          type: sensorService.getSensorType()
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleToggleStreaming = (start: boolean) => {
    const sensorService = getSensorService();
    if (start) {
      sensorService.start();
      setIsStreaming(true);
    } else {
      sensorService.stop();
      setIsStreaming(false);
      setSensorStatus(prev => ({ ...prev, connected: false }));
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

  const handleAssessmentComplete = (report: AssessmentReportData) => {
    setActiveReport(report);
    setSessions(StorageService.getSessions());
    cloudSyncService.markPending();
    cloudSyncService.syncNow();
    setCurrentTab('report');
  };

  const handleOpenReport = (report: AssessmentReportData) => {
    setActiveReport(report);
    setCurrentTab('report');
  };

  const handleSubjectiveSaved = (record: SubjectiveFatigueRecord) => {
    setSubjectiveRecords(StorageService.getSubjectiveFatigueRecords());
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Navigation Sidebar (Desktop) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={tab => setCurrentTab(tab)}
        onStartAssessment={handleStartAssessment}
        currentUser={currentUser}
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
          onOpenFatigueSlider={() => setIsFatigueSliderModalOpen(true)}
        />

        {/* Content View with bottom padding for mobile navigation bar */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          {currentTab === 'overview' && (
            <OverviewPage
              subjectId={subjectId}
              sensorStatus={sensorStatus}
              sessions={sessions}
              subjectiveRecords={subjectiveRecords}
              onStartAssessment={handleStartAssessment}
              onOpenReport={handleOpenReport}
              onNavigateToSessions={() => setCurrentTab('sessions')}
              onOpenStarCatcher={() => setCurrentTab('star_catcher')}
            />
          )}

          {currentTab === 'assessment' && (
            <AssessmentWizard
              subjectId={subjectId}
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
              onToggleStreaming={handleToggleStreaming}
              isStreaming={isStreaming}
              onSwitchMode={mode => setSensorMode(mode)}
              mode={sensorMode}
            />
          )}

          {currentTab === 'sessions' && (
            <SessionsPage
              sessions={sessions}
              subjectiveRecords={subjectiveRecords}
              onOpenReport={handleOpenReport}
              onDeleteSession={handleDeleteSession}
              onStartNewAssessment={handleStartAssessment}
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
        </main>

        {/* Mobile Thumb-Friendly Bottom Navigation Bar */}
        <MobileBottomNav
          currentTab={currentTab}
          onSelectTab={tab => setCurrentTab(tab)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenSync={() => setIsSyncModalOpen(true)}
          onOpenFatigueSlider={() => setIsFatigueSliderModalOpen(true)}
          currentUser={currentUser}
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

      {/* Subjective Fatigue Slider Modal (Accessible from anywhere) */}
      {isFatigueSliderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-lg w-full relative">
            <button
              type="button"
              onClick={() => setIsFatigueSliderModalOpen(false)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center shadow-md"
            >
              <X className="w-4 h-4" />
            </button>
            <SubjectiveFatigueBlockSlider
              initialRating={subjectiveRecords[0]?.rating || 5}
              onSaved={rec => {
                handleSubjectiveSaved(rec);
                setIsFatigueSliderModalOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

