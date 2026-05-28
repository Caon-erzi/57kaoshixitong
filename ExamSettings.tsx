import React, { useMemo } from 'react';
import { Settings, Calculator, FileType } from 'lucide-react';
import { ExamConfig, TypeSetting, WordHeaderConfig } from './types';

interface ExamSettingsProps {
  config: ExamConfig;
  onChange: (config: ExamConfig) => void;
  headerConfig: WordHeaderConfig;
  onHeaderChange: (config: WordHeaderConfig) => void;
}

const ExamSettings: React.FC<ExamSettingsProps> = ({ config, onChange, headerConfig, onHeaderChange }) => {
  const totalScore = useMemo(() => {
    return (
      config.single.score * config.single.count +
      config.multi.score * config.multi.count +
      config.judgment.score * config.judgment.count +
      config.short.score * config.short.count
    );
  }, [config]);

  const handleChange = (type: keyof ExamConfig, field: keyof TypeSetting, value: string) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    onChange({
      ...config,
      [type]: {
        ...config[type],
        [field]: numValue
      }
    });
  };
  
  const handleHeaderChange = (field: keyof WordHeaderConfig, value: string) => {
      onHeaderChange({
          ...headerConfig,
          [field]: value
      });
  };

  const renderInputRow = (label: string, type: keyof ExamConfig) => (
    <div className="grid grid-cols-12 gap-2 items-center text-sm">
      <div className="col-span-4 text-gray-700 font-medium">{label}</div>
      <div className="col-span-4">
        <div className="flex items-center bg-gray-50 border border-gray-300 rounded overflow-hidden focus-within:ring-1 focus-within:ring-brand-500">
          <span className="pl-2 text-gray-500 text-xs">分值</span>
          <input
            type="number"
            className="w-full p-1 bg-transparent border-none focus:ring-0 text-right text-gray-900"
            value={config[type].score}
            onChange={(e) => handleChange(type, 'score', e.target.value)}
          />
        </div>
      </div>
      <div className="col-span-4">
        <div className="flex items-center bg-gray-50 border border-gray-300 rounded overflow-hidden focus-within:ring-1 focus-within:ring-brand-500">
          <span className="pl-2 text-gray-500 text-xs">数量</span>
          <input
            type="number"
            className="w-full p-1 bg-transparent border-none focus:ring-0 text-right text-gray-900"
            value={config[type].count}
            onChange={(e) => handleChange(type, 'count', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-5">
      
      {/* Header Settings */}
      <div>
        <h2 className="text-md font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2 mb-3">
            <FileType className="w-4 h-4 text-brand-600" />
            Word 表头设置
        </h2>
        <div className="space-y-3">
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">主标题</label>
                <input 
                    type="text" 
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                    value={headerConfig.mainTitle}
                    onChange={(e) => handleHeaderChange('mainTitle', e.target.value)}
                />
            </div>
             <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">副标题 (考核名称)</label>
                <input 
                    type="text" 
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                    value={headerConfig.subTitle}
                    onChange={(e) => handleHeaderChange('subTitle', e.target.value)}
                />
            </div>
             <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">部门名称</label>
                <input 
                    type="text" 
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                    value={headerConfig.department}
                    onChange={(e) => handleHeaderChange('department', e.target.value)}
                />
            </div>
        </div>
      </div>

      {/* Question Settings */}
      <div>
        <h2 className="text-md font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2 mb-3">
            <Settings className="w-4 h-4 text-brand-600" />
            题型分值设置
        </h2>

        <div className="flex flex-col gap-3">
            {renderInputRow('判断题', 'judgment')}
            {renderInputRow('单选题', 'single')}
            {renderInputRow('多选题', 'multi')}
            {renderInputRow('简答题', 'short')}
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100 flex items-center justify-between bg-brand-50 p-3 rounded-lg">
        <div className="flex items-center gap-2 text-brand-700">
          <Calculator className="w-5 h-5" />
          <span className="font-semibold">试卷总分</span>
        </div>
        <div className="text-2xl font-bold text-brand-700">
          {totalScore} <span className="text-sm font-normal">分</span>
        </div>
      </div>
    </div>
  );
};

export default ExamSettings;
