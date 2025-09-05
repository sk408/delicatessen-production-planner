import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  AppState,
  UploadedFile,
  ProcessedSalesData,
  Holiday,
  ItemConfig,
  GlobalSettings,
  DateRange,
  ProductionPlan,
  AppError,
  UIState,
  Notification
} from '@types/index';

interface AppStore extends AppState {
  // Actions
  setDataStatus: (status: AppState['dataStatus']) => void;
  addUploadedFile: (file: UploadedFile) => void;
  updateUploadedFile: (id: string, updates: Partial<UploadedFile>) => void;
  removeUploadedFile: (id: string) => void;
  setProcessedData: (data: ProcessedSalesData[]) => void;
  addProcessedData: (data: ProcessedSalesData[]) => void;
  
  // Configuration
  setHolidays: (holidays: Holiday[]) => void;
  addHoliday: (holiday: Holiday) => void;
  updateHoliday: (id: string, updates: Partial<Holiday>) => void;
  removeHoliday: (id: string) => void;
  
  setItemConfigs: (configs: Record<string, ItemConfig>) => void;
  updateItemConfig: (itemNumber: string, config: Partial<ItemConfig>) => void;
  
  setGlobalSettings: (settings: Partial<GlobalSettings>) => void;
  
  // Planning
  setSelectedDateRange: (range: DateRange) => void;
  setSelectedItems: (items: string[]) => void;
  addSelectedItem: (item: string) => void;
  removeSelectedItem: (item: string) => void;
  setCurrentPlan: (plan: ProductionPlan | null) => void;
  
  // UI State
  setActiveStep: (step: number) => void;
  setIsLoading: (loading: boolean) => void;
  addError: (error: AppError) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Reset functions
  resetUploadedFiles: () => void;
  resetProcessedData: () => void;
  resetPlanning: () => void;
  resetAll: () => void;
}

const defaultGlobalSettings: GlobalSettings = {
  fiscalYearStart: { month: 9, day: 2 },
  defaultProductivity: 5,
  defaultShelfLife: 3,
  defaultMinBatchSize: 10,
  defaultMaxDaysAhead: 3,
  defaultGrowthRate: 0.10,
  currency: 'USD',
  timezone: 'America/New_York',
  dateFormat: 'MM/dd/yyyy',
  theme: 'light'
};

const defaultUIState: UIState = {
  activeStep: 0,
  isLoading: false,
  sidebarOpen: true,
  modalOpen: null,
  selectedItems: new Set(),
  sortBy: 'itemDescription',
  sortDirection: 'asc',
  filters: {},
  view: 'table'
};

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        uploadedFiles: [],
        processedData: [],
        dataStatus: 'idle',
        holidays: [],
        itemConfigs: {},
        globalSettings: defaultGlobalSettings,
        selectedDateRange: {
          start: new Date(),
          end: new Date()
        },
        selectedItems: [],
        currentPlan: null,
        activeStep: 0,
        isLoading: false,
        errors: [],

        // Data management actions
        setDataStatus: (status) => set({ dataStatus: status }),

        addUploadedFile: (file) => set((state) => ({
          uploadedFiles: [...state.uploadedFiles, file]
        })),

        updateUploadedFile: (id, updates) => set((state) => ({
          uploadedFiles: state.uploadedFiles.map(file =>
            file.id === id ? { ...file, ...updates } : file
          )
        })),

        removeUploadedFile: (id) => set((state) => ({
          uploadedFiles: state.uploadedFiles.filter(file => file.id !== id)
        })),

        setProcessedData: (data) => set({ processedData: data }),

        addProcessedData: (data) => set((state) => ({
          processedData: [...state.processedData, ...data]
        })),

        // Holiday management
        setHolidays: (holidays) => set({ holidays }),

        addHoliday: (holiday) => set((state) => ({
          holidays: [...state.holidays, holiday]
        })),

        updateHoliday: (id, updates) => set((state) => ({
          holidays: state.holidays.map(holiday =>
            holiday.id === id ? { ...holiday, ...updates } : holiday
          )
        })),

        removeHoliday: (id) => set((state) => ({
          holidays: state.holidays.filter(holiday => holiday.id !== id)
        })),

        // Item configuration
        setItemConfigs: (configs) => set({ itemConfigs: configs }),

        updateItemConfig: (itemNumber, config) => set((state) => ({
          itemConfigs: {
            ...state.itemConfigs,
            [itemNumber]: {
              ...state.itemConfigs[itemNumber],
              ...config
            }
          }
        })),

        // Global settings
        setGlobalSettings: (settings) => set((state) => ({
          globalSettings: { ...state.globalSettings, ...settings }
        })),

        // Planning actions
        setSelectedDateRange: (range) => set({ selectedDateRange: range }),

        setSelectedItems: (items) => set({ selectedItems: items }),

        addSelectedItem: (item) => set((state) => ({
          selectedItems: [...state.selectedItems.filter(i => i !== item), item]
        })),

        removeSelectedItem: (item) => set((state) => ({
          selectedItems: state.selectedItems.filter(i => i !== item)
        })),

        setCurrentPlan: (plan) => set({ currentPlan: plan }),

        // UI state actions
        setActiveStep: (step) => set({ activeStep: step }),

        setIsLoading: (loading) => set({ isLoading: loading }),

        addError: (error) => set((state) => ({
          errors: [...state.errors, error]
        })),

        removeError: (id) => set((state) => ({
          errors: state.errors.filter(error => error.id !== id)
        })),

        clearErrors: () => set({ errors: [] }),

        // Notification actions
        addNotification: (notification) => set((state) => ({
          errors: [...state.errors, {
            ...notification,
            id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            read: false
          } as AppError] // Using errors array for notifications for simplicity
        })),

        markNotificationRead: (id) => set((state) => ({
          errors: state.errors.map(error =>
            error.id === id ? { ...error, read: true } : error
          )
        })),

        removeNotification: (id) => set((state) => ({
          errors: state.errors.filter(error => error.id !== id)
        })),

        clearNotifications: () => set({ errors: [] }),

        // Reset functions
        resetUploadedFiles: () => set({
          uploadedFiles: [],
          dataStatus: 'idle'
        }),

        resetProcessedData: () => set({
          processedData: [],
          dataStatus: 'idle'
        }),

        resetPlanning: () => set({
          selectedDateRange: {
            start: new Date(),
            end: new Date()
          },
          selectedItems: [],
          currentPlan: null
        }),

        resetAll: () => set({
          uploadedFiles: [],
          processedData: [],
          dataStatus: 'idle',
          holidays: [],
          itemConfigs: {},
          globalSettings: defaultGlobalSettings,
          selectedDateRange: {
            start: new Date(),
            end: new Date()
          },
          selectedItems: [],
          currentPlan: null,
          activeStep: 0,
          isLoading: false,
          errors: []
        })
      }),
      {
        name: 'deli-planner-storage',
        partialize: (state) => ({
          // Only persist certain parts of the state
          holidays: state.holidays,
          itemConfigs: state.itemConfigs,
          globalSettings: state.globalSettings,
          selectedItems: state.selectedItems
        })
      }
    ),
    {
      name: 'deli-planner-store'
    }
  )
);

// Selectors for commonly used derived state
export const useUploadedFiles = () => useAppStore((state) => state.uploadedFiles);
export const useProcessedData = () => useAppStore((state) => state.processedData);
export const useDataStatus = () => useAppStore((state) => state.dataStatus);
export const useHolidays = () => useAppStore((state) => state.holidays);
export const useItemConfigs = () => useAppStore((state) => state.itemConfigs);
export const useGlobalSettings = () => useAppStore((state) => state.globalSettings);
export const useSelectedDateRange = () => useAppStore((state) => state.selectedDateRange);
export const useSelectedItems = () => useAppStore((state) => state.selectedItems);
export const useCurrentPlan = () => useAppStore((state) => state.currentPlan);
export const useActiveStep = () => useAppStore((state) => state.activeStep);
export const useIsLoading = () => useAppStore((state) => state.isLoading);
export const useErrors = () => useAppStore((state) => state.errors);

// Computed selectors
export const useAvailableItems = () => useAppStore((state) => {
  const itemNumbers = [...new Set(state.processedData.map(d => d.itemNumber))];
  return itemNumbers.map(itemNumber => {
    const itemData = state.processedData.filter(d => d.itemNumber === itemNumber);
    const totalUnits = itemData.reduce((sum, d) => sum + d.currentYearUnits, 0);
    const avgUnits = totalUnits / itemData.length || 0;
    
    return {
      itemNumber,
      itemDescription: itemData[0]?.itemDescription || '',
      totalUnits,
      avgUnits,
      recordCount: itemData.length,
      config: state.itemConfigs[itemNumber]
    };
  }).sort((a, b) => b.totalUnits - a.totalUnits);
});

export const useAvailableDateRange = () => useAppStore((state) => {
  if (state.processedData.length === 0) {
    return null;
  }
  
  const dates = state.processedData.map(d => d.calendarDate);
  return {
    start: new Date(Math.min(...dates.map(d => d.getTime()))),
    end: new Date(Math.max(...dates.map(d => d.getTime())))
  };
});

export const useCanProceedToPlanning = () => useAppStore((state) => {
  return (
    state.processedData.length > 0 &&
    state.selectedItems.length > 0 &&
    state.selectedDateRange.start &&
    state.selectedDateRange.end
  );
});

export const useDataSummary = () => useAppStore((state) => {
  const totalRecords = state.processedData.length;
  const uniqueItems = new Set(state.processedData.map(d => d.itemNumber)).size;
  const dateRange = state.processedData.length > 0 ? {
    start: new Date(Math.min(...state.processedData.map(d => d.calendarDate.getTime()))),
    end: new Date(Math.max(...state.processedData.map(d => d.calendarDate.getTime())))
  } : null;
  
  return {
    totalRecords,
    uniqueItems,
    dateRange,
    filesUploaded: state.uploadedFiles.length
  };
});
