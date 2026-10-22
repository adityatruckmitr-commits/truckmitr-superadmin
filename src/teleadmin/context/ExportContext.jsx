import { createContext, useContext, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import leadsApi from '../services/api/leadsApi';

const ExportContext = createContext(null);

export const ExportProvider = ({ children }) => {
  const [isExportingIvr, setIsExportingIvr] = useState(false);
  const [exportIvrProgress, setExportIvrProgress] = useState(0);

  const startIvrExport = async (startDate, endDate) => {
    if (isExportingIvr) return;
    
    let toastId = null;
    try {
      setIsExportingIvr(true);
      setExportIvrProgress(0);
      toastId = toast.loading('Starting IVR Export (0%)...');
      let page = 1;
      let lastPage = 1;
      let allData = [];
      let headers = [];

      do {
        const response = await leadsApi.exportCallHistoryIvr({
          start_date: startDate,
          end_date: endDate,
          page: page
        });

        if (response?.status) {
          if (page === 1) {
            headers = response.headings;
            lastPage = response.last_page;
          }
          allData = allData.concat(response.data);
          
          if (lastPage > 0) {
             const progress = Math.round((page / lastPage) * 100);
             setExportIvrProgress(progress);
             toast.loading(`Exporting IVR History (${progress}%)...`, { id: toastId });
          }
          page++;
        } else {
          throw new Error('Failed to fetch data');
        }
      } while (page <= lastPage);

      if (allData.length > 0 && headers.length > 0) {
        const csvContent = [
          headers.join(','),
          ...allData.map(row => 
            Object.values(row).map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')
          )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `IVR_Call_History_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('IVR Export completed!', { id: toastId });
      } else {
        toast.error('No IVR data found to export', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('IVR Export failed', { id: toastId });
    } finally {
      setIsExportingIvr(false);
      setExportIvrProgress(0);
    }
  };

  return (
    <ExportContext.Provider value={{ isExportingIvr, exportIvrProgress, startIvrExport }}>
      {children}
    </ExportContext.Provider>
  );
};

export const useExport = () => {
  const context = useContext(ExportContext);
  if (!context) {
    throw new Error('useExport must be used within an ExportProvider');
  }
  return context;
};
