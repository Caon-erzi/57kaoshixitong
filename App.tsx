import React, { useState } from 'react';
import DataInput from './components/DataInput';
import ResultsTable from './components/ResultsTable';
import ExamSettings from './components/ExamSettings';
import { parseExamContent } from './services/gemini';
import { ExamQuestion, ProcessStatus, ExamConfig, WordHeaderConfig } from './types';
import { BrainCircuit, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<ExamQuestion[]>([]);
  const [status, setStatus] = useState<ProcessStatus>(ProcessStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [examConfig, setExamConfig] = useState<ExamConfig>({
    judgment: { score: 2, count: 0 },
    single: { score: 2, count: 0 },
    multi: { score: 6, count: 0 },
    short: { score: 10, count: 0 },
  });

  const [headerConfig, setHeaderConfig] = useState<WordHeaderConfig>({
    mainTitle: '部门级培训考核试题',
    subTitle: '1月份培训阶段考核',
    department: '57车间'
  });

  const handleAnalyze = async (text: string, files: File[], apiKey: string, baseUrl?: string) => {
    setStatus(ProcessStatus.PROCESSING);
    setErrorMsg(null);
    try {
      const results = await parseExamContent(text, files, apiKey, baseUrl);
      
      // Update data
      setData(prev => {
        const newData = [...results, ...prev];
        return newData;
      });

      // Update config counts based on new total data (Auto-detection)
      // This sets the default counts to the actual number of questions found.
      // The user can then manually reduce these numbers in the ExamSettings panel to limit the output.
      setData(currentData => {
         // Count types in the complete dataset
         const counts = {
           judgment: 0,
           single: 0,
           multi: 0,
           short: 0
         };

         currentData.forEach(q => {
            if (q.questionType.includes('判断')) counts.judgment++;
            else if (q.questionType.includes('单选')) counts.single++;
            else if (q.questionType.includes('多选')) counts.multi++;
            else if (q.questionType.includes('简答')) counts.short++;
         });

         setExamConfig(prevConfig => ({
           ...prevConfig,
           judgment: { ...prevConfig.judgment, count: counts.judgment },
           single: { ...prevConfig.single, count: counts.single },
           multi: { ...prevConfig.multi, count: counts.multi },
           short: { ...prevConfig.short, count: counts.short },
         }));
         
         return currentData;
      });

      setStatus(ProcessStatus.SUCCESS);
    } catch (error: any) {
      console.error(error);
      setStatus(ProcessStatus.ERROR);
      setErrorMsg(error.message || "解析失败，请检查 API Key 或网络连接。");
    } finally {
      // Allow trying again immediately if needed, but keep status visible for a moment
      setTimeout(() => {
        if (status !== ProcessStatus.ERROR) {
             setStatus(ProcessStatus.IDLE); 
        }
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-600 p-2 rounded-lg">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              智能试题提取系统
            </h1>
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-2">
             <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium">v1.0</span>
             <span>by 国际小胖纸</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {errorMsg && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="ml-auto text-sm underline">关闭</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
          {/* Left Panel: Input & Settings */}
          <div className="lg:col-span-4 h-full flex flex-col gap-6">
            <div className="flex-1 min-h-0">
               <DataInput onAnalyze={handleAnalyze} isProcessing={status === ProcessStatus.PROCESSING} />
            </div>
            <div className="flex-none">
              <ExamSettings 
                config={examConfig} 
                onChange={setExamConfig} 
                headerConfig={headerConfig}
                onHeaderChange={setHeaderConfig}
              />
            </div>
          </div>

          {/* Right Panel: Output */}
          <div className="lg:col-span-8 h-full">
            <ResultsTable data={data} config={examConfig} headerConfig={headerConfig} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;